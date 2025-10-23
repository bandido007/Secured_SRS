# srs_domain/services/academic_record_service.py

from typing import Dict, Any, Optional
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import User
import logging

from srs_domain.models import (
    Student, Lecturer, Course, Enrollment, CourseResults,
    RecordTransaction, StorageReference, AcademicTranscript
)
from .interfaces import (
    CryptographyServiceInterface,
    BlockchainServiceInterface,
    StorageServiceInterface
)
from .mocks import (
    MockCryptographyService,
    MockBlockchainService,
    MockStorageService
)

logger = logging.getLogger("srs_logger")


class GradeSubmissionResult:
    """Result object for grade submission operations."""

    def __init__(self, success: bool, message: str, grade_id: Optional[int] = None):
        self.success = success
        self.message = message
        self.grade_id = grade_id


class GradeVerificationResult:
    """Result object for grade verification operations."""

    def __init__(self, success: bool, is_valid: bool, message: str):
        self.success = success
        self.is_valid = is_valid
        self.message = message


class TranscriptGenerationResult:
    """Result object for transcript generation operations."""

    def __init__(
        self,
        success: bool,
        message: str,
        transcript_id: Optional[int] = None,
        gpa: Optional[Decimal] = None
    ):
        self.success = success
        self.message = message
        self.transcript_id = transcript_id
        self.gpa = gpa


class AcademicRecordService:
    """
    Domain service for academic record operations.

    This orchestrates business logic without knowing about HTTP.
    It can be called from views, management commands, background jobs, etc.
    """

    def __init__(
        self,
        crypto_service: Optional[CryptographyServiceInterface] = None,
        blockchain_service: Optional[BlockchainServiceInterface] = None,
        storage_service: Optional[StorageServiceInterface] = None
    ):
        """
        Initialize with service dependencies.

        If not provided, uses mock implementations.
        This allows easy swapping to real services later.
        """
        self.crypto = crypto_service or MockCryptographyService()
        self.blockchain = blockchain_service or MockBlockchainService()
        self.storage = storage_service or MockStorageService()

    def submit_grade(
        self,
        enrollment_id: int,
        grade_type: str,
        numeric_grade: Optional[Decimal],
        letter_grade: Optional[str],
        course_work_grade: Optional[Decimal],
        exam_grade: Optional[Decimal],
        remarks: Optional[str],
        comments: Optional[str],
        submitted_by_user: User
    ) -> GradeSubmissionResult:
        """
        Submit a grade for a student.

        Business Logic:
        1. Validate lecturer authorization
        2. Validate enrollment exists
        3. Check for duplicate grades
        4. Validate grade values
        5. Create grade record
        6. Compute cryptographic hash
        7. Store on blockchain
        8. Store in distributed storage
        9. Create audit trail

        Args:
            All the grade data fields
            submitted_by_user: The user submitting the grade

        Returns:
            GradeSubmissionResult with success/failure and message
        """
        try:
            with transaction.atomic():
                # Step 1: Validate lecturer
                try:
                    lecturer = Lecturer.objects.get(user=submitted_by_user, is_active=True)
                except Lecturer.DoesNotExist:
                    return GradeSubmissionResult(
                        success=False,
                        message="Only lecturers can submit grades"
                    )

                # Step 2: Validate enrollment
                try:
                    enrollment_obj = Enrollment.objects.get(pk=enrollment_id, is_active=True)
                except Enrollment.DoesNotExist:
                    return GradeSubmissionResult(
                        success=False,
                        message="Enrollment not found"
                    )

                # Step 3: Check for duplicates
                if CourseResults.objects.filter(enrollment=enrollment_obj).exists():
                    return GradeSubmissionResult(
                        success=False,
                        message="Grade already exists for this enrollment"
                    )

                # Step 4: Validate grade values
                if grade_type == 'NUMERIC' and numeric_grade is None:
                    return GradeSubmissionResult(
                        success=False,
                        message="Numeric grade is required for NUMERIC grade type"
                    )
                    
                    
                if grade_type == 'LETTER' and not letter_grade:
                    return GradeSubmissionResult(
                        success=False,
                        message="Letter grade is required for LETTER grade type"
                    )
                    
                    
                    

                # Step 5: Create grade record
                grade = CourseResults.objects.create(
                    enrollment=enrollment_obj,
                    grade_type=grade_type,
                    numeric_grade=numeric_grade,
                    letter_grade=letter_grade,
                    course_work_grade=course_work_grade,
                    exam_grade=exam_grade,
                    remarks=remarks or "",
                    comments=comments or "",
                    submitted_by=lecturer,
                    status='PENDING',
                    created_by=submitted_by_user
                )

                # Refresh to get the exact submitted_at timestamp from DB
                grade.refresh_from_db()

                # Step 6: Compute cryptographic hash
                grade_data = {
                    "student_id": enrollment_obj.student.student_id,
                    "course_code": enrollment_obj.course.course_code,
                    "semester": enrollment_obj.semester,
                    "academic_year": enrollment_obj.academic_year,
                    "grade": str(numeric_grade or letter_grade),
                    "submitted_at": str(grade.submitted_at)
                }
                blockchain_hash = self.crypto.compute_hash(grade_data)
                
                logger.info(f"Blockchain response: {grade.grade_type}")

                def convert_decimal(value):
                    """Convert Decimal to float, return 0 if None"""
                    if value is None:
                        return 0
                    from decimal import Decimal
                    if isinstance(value, Decimal):
                        return float(value)
                    return value

                # Step 7: Store on blockchain
                # Upload to blockchain asynchronously
                chaincode_response = self.blockchain.upload_results(
                    results={
                        "resultId": grade.id,
                        "enrollmentId": grade.enrollment.id,
                        "gradeType": grade.grade_type,
                        "numericGrade": convert_decimal(grade.numeric_grade),
                        "letterGrade": grade.letter_grade or "",
                        "courseWorkGrade": convert_decimal(grade.course_work_grade),
                        "examGrade": convert_decimal(grade.exam_grade),
                        "remarks": grade.remarks,
                        "comments": grade.comments,
                        "submittedAt": str(grade.submitted_at)
                    }
                )
                logger.info(f"Blockchain response: {chaincode_response}")

                # Step 8: Store in distributed storage
                content_id = self.storage.store_content(
                    content_data=grade_data,
                    metadata={"grade_id": grade.id}
                )

                # Step 9: Update grade with blockchain references
                grade.blockchain_hash = blockchain_hash
                # grade.blockchain_transaction_id = transaction_id
                grade.ipfs_cid = content_id
                grade.save()

                # Step 10: Create audit trail
                RecordTransaction.objects.create(
                    grade=grade,
                    transaction_type='CREATE',
                    performed_by=submitted_by_user,
                    # transaction_id=transaction_id,
                    transaction_hash=blockchain_hash,
                    created_by=submitted_by_user
                )

                # Step 11: Create storage reference
                StorageReference.objects.create(
                    grade=grade,
                    storage_type='IPFS',
                    content_identifier=content_id,
                    created_by=submitted_by_user
                )

                logger.info(
                    f"Grade submitted: {enrollment_obj.student.student_id} - "
                    f"{enrollment_obj.course.course_code} - {numeric_grade or letter_grade} "
                    f"by {lecturer.lecturer_id}"
                )

                return GradeSubmissionResult(
                    success=True,
                    message="Grade submitted successfully",
                    grade_id=grade.id
                )

        except Exception as e:
            logger.error(f"Error submitting grade: {e}")
            return GradeSubmissionResult(
                success=False,
                message=f"Failed to submit grade: {str(e)}"
            )

    def verify_grade(self, grade_id: int, verified_by_user: User) -> GradeVerificationResult:
        """
        Verify a grade's blockchain integrity and make it official.

        Business Logic:
        1. Retrieve grade
        2. Verify it's in PENDING status
        3. Retrieve blockchain transaction
        4. Recompute hash
        5. Compare hashes
        6. If valid, make OFFICIAL
        7. Create verification audit trail

        Args:
            grade_id: The grade to verify
            verified_by_user: The user performing verification

        Returns:
            GradeVerificationResult with success/validity status
        """
        try:
            # Step 1: Get the grade
            try:
                grade = CourseResults.objects.get(pk=grade_id, is_active=True)
            except CourseResults.DoesNotExist:
                return GradeVerificationResult(
                    success=False,
                    is_valid=False,
                    message="Grade not found"
                )

            # Step 2: Check status
            if grade.status != 'PENDING':
                return GradeVerificationResult(
                    success=False,
                    is_valid=False,
                    message=f"Cannot verify grade with status {grade.status}"
                )

            # Step 3: Recompute hash
            grade_data = {
                "student_id": grade.enrollment.student.student_id,
                "course_code": grade.enrollment.course.course_code,
                "semester": grade.enrollment.semester,
                "academic_year": grade.enrollment.academic_year,
                "grade": str(grade.numeric_grade or grade.letter_grade),
                "submitted_at": str(grade.submitted_at)
            }

            blockchain_grade = self.blockchain.upload_results()

            blockchain_grade_data = {
                "student_id": grade.enrollment.student.student_id,
                "course_code": grade.enrollment.course.course_code,
                "semester": grade.enrollment.semester,
                "academic_year": grade.enrollment.academic_year,
                "grade": str(grade.numeric_grade or grade.letter_grade),
                "submitted_at": str(grade.submitted_at)
            }

            blockchain_hash = self.crypto.compute_hash(blockchain_grade_data)

            # Step 4: Verify hash using crypto service
            is_valid = self.crypto.verify_hash(grade_data, grade.blockchain_hash)

            if not is_valid:
                return GradeVerificationResult(
                    success=True,
                    is_valid=False,
                    message="Grade integrity check failed - hash mismatch"
                )

            # Step 5: Make official (immutable)
            grade.status = 'OFFICIAL'
            grade.is_verified = True
            grade.verified_at = timezone.now()
            grade.save()

            # Step 6: Create verification audit trail
            RecordTransaction.objects.create(
                grade=grade,
                transaction_type='VERIFY',
                performed_by=verified_by_user,
                transaction_id=f"VERIFY-{grade.id}-{timezone.now().timestamp()}",
                created_by=verified_by_user
            )

            logger.info(f"Grade verified and made official: ID {grade.id} by {verified_by_user.username}")

            return GradeVerificationResult(
                success=True,
                is_valid=True,
                message="Grade verified and made official"
            )

        except Exception as e:
            logger.error(f"Error verifying grade: {e}")
            return GradeVerificationResult(
                success=False,
                is_valid=False,
                message=f"Verification failed: {str(e)}"
            )

    def generate_transcript(
        self,
        student_id: int,
        academic_year: Optional[str],
        semester: Optional[str],
        is_official: bool,
        generated_by_user: User
    ) -> TranscriptGenerationResult:
        """
        Generate an academic transcript for a student.

        Business Logic:
        1. Get all OFFICIAL grades for student
        2. Filter by academic year/semester if specified
        3. Calculate GPA and total credits
        4. Create Merkle root hash of all grades
        5. Store transcript data in distributed storage
        6. Create transcript record

        Args:
            student_id: The student
            academic_year: Optional year filter
            semester: Optional semester filter
            is_official: Whether this is an official transcript
            generated_by_user: The user generating the transcript

        Returns:
            TranscriptGenerationResult with success status and GPA
        """
        try:
            with transaction.atomic():
                # Step 1: Get student
                try:
                    student = Student.objects.get(pk=student_id, is_active=True)
                except Student.DoesNotExist:
                    return TranscriptGenerationResult(
                        success=False,
                        message="Student not found"
                    )

                # Step 2: Get all OFFICIAL grades
                grades = CourseResults.objects.filter(
                    enrollment__student=student,
                    status='OFFICIAL',
                    is_active=True
                ).select_related('enrollment__course')

                if semester:
                    grades = grades.filter(enrollment__semester=semester)
                if academic_year:
                    grades = grades.filter(enrollment__academic_year=academic_year)

                if not grades.exists():
                    return TranscriptGenerationResult(
                        success=False,
                        message="No official grades found for this student"
                    )

                # Step 3: Calculate GPA and total credits
                total_points = Decimal('0.0')
                total_credits = Decimal('0.0')

                for grade in grades:
                    if grade.numeric_grade:
                        # Convert 0-100 to 4.0 scale
                        grade_point = grade.numeric_grade / Decimal('25.0')
                        total_points += grade_point * grade.enrollment.course.credits
                        total_credits += grade.enrollment.course.credits

                gpa = total_points / total_credits if total_credits > 0 else Decimal('0.0')

                # Step 4: Create Merkle root hash
                grade_hashes = [g.blockchain_hash for g in grades]
                combined_data = {
                    "student_id": student.student_id,
                    "grades": sorted(grade_hashes),
                    "total_credits": str(total_credits),
                    "gpa": str(gpa)
                }
                merkle_root = self.crypto.compute_hash(combined_data)

                # Step 5: Store in distributed storage
                transcript_data = {
                    **combined_data,
                    "generated_at": str(timezone.now())
                }
                ipfs_cid = self.storage.store_content(
                    content_data=transcript_data,
                    metadata={"student_id": student.id}
                )

                # Step 6: Create transcript record
                transcript = AcademicTranscript.objects.create(
                    student=student,
                    academic_year=academic_year,
                    semester=semester,
                    gpa=gpa.quantize(Decimal('0.01')),
                    total_credits=total_credits,
                    blockchain_root_hash=merkle_root,
                    ipfs_cid=ipfs_cid,
                    generated_at=timezone.now(),
                    is_official=is_official,
                    generated_by=generated_by_user,
                    created_by=generated_by_user
                )

                logger.info(
                    f"Transcript generated: {student.student_id} - "
                    f"GPA: {gpa:.2f}, Credits: {total_credits} by {generated_by_user.username}"
                )

                return TranscriptGenerationResult(
                    success=True,
                    message="Transcript generated successfully",
                    transcript_id=transcript.id,
                    gpa=gpa
                )

        except Exception as e:
            logger.error(f"Error generating transcript: {e}")
            return TranscriptGenerationResult(
                success=False,
                message=f"Failed to generate transcript: {str(e)}"
            )
