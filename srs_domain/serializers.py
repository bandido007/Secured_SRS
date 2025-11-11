# srs_domain/serializers.py

from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import model_validator
from srs_utils.SharedSerializer import *


# ================================================================
# STUDENT SERIALIZERS
# ================================================================

class StudentTableSerializer(BaseSerializer):
    """Table display serializer for Student"""
    student_id: str
    user_id: int
    username: str
    email: str
    program: str
    year_of_study: int
    enrollment_date: date
    enrollment_status: str
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None

    @model_validator(mode='before')
    @classmethod
    def extract_user_fields(cls, data):
        if hasattr(data, 'user'):
            # Extract all model fields including pk
            obj_dict = {
                'id': data.pk,
                'unique_id': data.unique_id,
                'created_date': data.created_date,
                'updated_date': data.updated_date,
                'is_active': data.is_active,
                'student_id': data.student_id,
                'program': data.program,
                'year_of_study': data.year_of_study,
                'enrollment_date': data.enrollment_date,
                'enrollment_status': data.enrollment_status,
                'phone_number': data.phone_number,
                'date_of_birth': data.date_of_birth,
                'user_id': data.user.id,
                'username': data.user.username,
                'email': data.user.email
            }
            return obj_dict
        return data


class StudentInputSerializer(BaseInputSerializer):
    """Input serializer for creating/updating Student"""
    user_id: int
    student_id: str
    program: str
    year_of_study: int
    enrollment_date: date
    enrollment_status: str = 'ACTIVE'
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None


class StudentFilteringSerializer(BasePagedFilteringSerializer):
    """Filtering serializer for Student"""
    program: Optional[str] = None
    year_of_study: Optional[int] = None
    enrollment_status: Optional[str] = None 
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    pass


class StudentPagedResponseSerializer(BasePagedResponseList):
    """Paged response for Student list"""
    data: List[StudentTableSerializer] | None = None


class StudentNonPagedResponseSerializer(BaseNonPagedResponseData):
    """Single Student response"""
    data: StudentTableSerializer | None = None


# ================================================================
# LECTURER SERIALIZERS
# ================================================================

class LecturerTableSerializer(BaseSerializer):
    """Table display serializer for Lecturer"""
    lecturer_id: str
    user_id: int
    username: str
    email: str
    department: str
    specialization: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def extract_user_fields(cls, data):
        if hasattr(data, 'user'):
            return {
                'id': data.pk,
                'unique_id': data.unique_id,
                'created_date': data.created_date,
                'updated_date': data.updated_date,
                'is_active': data.is_active,
                'lecturer_id': data.lecturer_id,
                'department': data.department,
                'specialization': data.specialization,
                'user_id': data.user.id,
                'username': data.user.username,
                'email': data.user.email
            }
        return data


class LecturerInputSerializer(BaseInputSerializer):
    """Input serializer for creating/updating Lecturer"""
    user_id: int
    lecturer_id: str
    department: str
    specialization: Optional[str] = None


class LecturerFilteringSerializer(BasePagedFilteringSerializer):
    """Filtering serializer for Lecturer"""
    department: Optional[str] = None
    specialization: Optional[str] = None
    pass
    


class LecturerPagedResponseSerializer(BasePagedResponseList):
    """Paged response for Lecturer list"""
    data: List[LecturerTableSerializer] | None = None


class LecturerNonPagedResponseSerializer(BaseNonPagedResponseData):
    """Single Lecturer response"""
    data: LecturerTableSerializer | None = None


# ================================================================
# COURSE SERIALIZERS
# ================================================================

class CourseTableSerializer(BaseSerializer):
    """Table display serializer for Course"""
    course_code: str
    course_name: str
    credits: Decimal
    department: str
    assigned_lecturer_id: Optional[int] = None
    lecturer_name: Optional[str] = None
    description: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def extract_lecturer_fields(cls, data):
        if hasattr(data, 'assigned_lecturer'):
            return {
                'id': data.pk,
                'unique_id': data.unique_id,
                'created_date': data.created_date,
                'updated_date': data.updated_date,
                'is_active': data.is_active,
                'course_code': data.course_code,
                'course_name': data.course_name,
                'credits': data.credits,
                'department': data.department,
                'assigned_lecturer_id': data.assigned_lecturer_id,
                'lecturer_name': data.assigned_lecturer.user.username if data.assigned_lecturer else None,
                'description': data.description
            }
        return data


class CourseInputSerializer(BaseInputSerializer):
    """Input serializer for creating/updating Course"""
    course_code: str
    course_name: str
    credits: Decimal
    department: str
    assigned_lecturer_id: Optional[int] = None
    description: Optional[str] = None


class CourseFilteringSerializer(BasePagedFilteringSerializer):
    """Filtering serializer for Course"""
    department: Optional[str] = None
    assigned_lecturer_id: Optional[int] = None
    min_credits: Optional[Decimal] = None
    max_credits: Optional[Decimal] = None
    description: Optional[str] = None


class CoursePagedResponseSerializer(BasePagedResponseList):
    """Paged response for Course list"""
    data: List[CourseTableSerializer] | None = None


class CourseNonPagedResponseSerializer(BaseNonPagedResponseData):
    """Single Course response"""
    data: CourseTableSerializer | None = None


# ================================================================
# ENROLLMENT SERIALIZERS
# ================================================================

class EnrollmentTableSerializer(BaseSerializer):
    """Table display serializer for Enrollment"""
    student_id: int
    student_name: str
    student_number: str
    course_id: int
    course_code: str
    course_name: str
    semester: str
    academic_year: str
    lecturer_id: Optional[int] = None
    lecturer_name: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def extract_fields(cls, data):
        if hasattr(data, 'student'):
            lecturer_obj = getattr(data, 'lecturer', None) or getattr(data.course, 'assigned_lecturer', None)
            return {
                'id': data.pk,
                'unique_id': data.unique_id,
                'created_date': data.created_date,
                'updated_date': data.updated_date,
                'is_active': data.is_active,
                'student_id': data.student.id,
                'student_name': data.student.user.username,
                'student_number': data.student.student_id,
                'course_id': data.course.id,
                'course_code': data.course.course_code,
                'course_name': data.course.course_name,
                'semester': data.semester,
                'academic_year': data.academic_year,
                'lecturer_id': data.lecturer_id or (lecturer_obj.id if lecturer_obj else None),
                'lecturer_name': lecturer_obj.user.username if lecturer_obj else None
            }
        return data


class EnrollmentInputSerializer(BaseInputSerializer):
    """Input serializer for creating/updating Enrollment"""
    student_id: int
    course_id: int
    semester: str
    academic_year: str
    lecturer_id: Optional[int] = None


class EnrollmentFilteringSerializer(BasePagedFilteringSerializer):
    """Filtering serializer for Enrollment"""
    student_id: Optional[int] = None
    course_id: Optional[int] = None
    semester: Optional[str] = None
    academic_year: Optional[str] = None
    lecturer_id: Optional[int] = None
    pass


class EnrollmentPagedResponseSerializer(BasePagedResponseList):
    """Paged response for Enrollment list"""
    data: List[EnrollmentTableSerializer] | None = None


class EnrollmentNonPagedResponseSerializer(BaseNonPagedResponseData):
    """Single Enrollment response"""
    data: EnrollmentTableSerializer | None = None


# ================================================================
# COURSE RESULTS (GRADE) SERIALIZERS
# ================================================================

class CourseResultsTableSerializer(BaseSerializer):
    class Config:
        extra = "allow"
        
    """Table display serializer for CourseResults"""
    enrollment_id: int
    student_name: str
    student_number: str
    course_code: str
    course_name: str
    semester: str
    academic_year: str
    grade_type: str
    numeric_grade: Optional[Decimal] = None
    letter_grade: Optional[str] = None
    course_work_grade: Optional[Decimal] = None
    exam_grade: Optional[Decimal] = None
    remarks: Optional[str] = None
    status: str
    submitted_by_id: int
    lecturer_name: str
    submitted_at: datetime
    verified_at: Optional[datetime] = None
    is_verified: bool
    blockchain_hash: Optional[str] = None
    blockchain_transaction_id: Optional[str] = None
    ipfs_cid: Optional[str] = None
    blockchainData: Optional[dict] = None
    

    @model_validator(mode='before')
    @classmethod
    def extract_fields(cls, data):
        if hasattr(data, 'enrollment'):
            return {
                'id': data.pk,
                'unique_id': data.unique_id,
                'created_date': data.created_date,
                'updated_date': data.updated_date,
                'is_active': data.is_active,
                'enrollment_id': data.enrollment.id,
                'student_name': data.enrollment.student.user.username,
                'student_number': data.enrollment.student.student_id,
                'course_code': data.enrollment.course.course_code,
                'course_name': data.enrollment.course.course_name,
                'semester': data.enrollment.semester,
                'academic_year': data.enrollment.academic_year,
                'grade_type': data.grade_type,
                'numeric_grade': data.numeric_grade,
                'letter_grade': data.letter_grade,
                'course_work_grade': data.course_work_grade,
                'exam_grade': data.exam_grade,
                'remarks': data.remarks,
                'status': data.status,
                'submitted_by_id': data.submitted_by.id,
                'lecturer_name': data.submitted_by.user.username,
                'submitted_at': data.submitted_at,
                'verified_at': data.verified_at,
                'is_verified': data.is_verified,
                'blockchain_hash': data.blockchain_hash,
                'blockchain_transaction_id': data.blockchain_transaction_id,
                'ipfs_cid': data.ipfs_cid,
               
            }
        return data


class CourseResultsInputSerializer(BaseInputSerializer):
    """Input serializer for creating/updating CourseResults

    Note: submitted_by_id is NOT included - the service automatically
    extracts the lecturer from the logged-in user (request.user)
    """
    enrollment_id: int
    grade_type: str = 'NUMERIC'
    numeric_grade: Optional[Decimal] = None
    letter_grade: Optional[str] = None
    course_work_grade: Optional[Decimal] = None
    exam_grade: Optional[Decimal] = None
    remarks: Optional[str] = None
    comments: Optional[str] = None


class CourseResultsFilteringSerializer(BasePagedFilteringSerializer):
    """Filtering serializer for CourseResults"""
    enrollment_id: Optional[int] = None
    student_id: Optional[int] = None
    course_id: Optional[int] = None
    semester: Optional[str] = None
    academic_year: Optional[str] = None
    status: Optional[str] = None
    submitted_by_id: Optional[int] = None
    is_verified: Optional[bool] = None
    grade_type: Optional[str] = None


class CourseResultsPagedResponseSerializer(BasePagedResponseList):
    """Paged response for CourseResults list"""
    data: List[CourseResultsTableSerializer] | None = None


class CourseResultsNonPagedResponseSerializer(BaseNonPagedResponseData):
    """Single CourseResults response"""
    data: CourseResultsTableSerializer | None = None


# ================================================================
# RECORD TRANSACTION SERIALIZERS (Audit Trail)
# ================================================================

class RecordTransactionTableSerializer(BaseSerializer):
    """Table display serializer for RecordTransaction"""
    grade_id: int
    student_name: str
    course_code: str
    transaction_type: str
    performed_by_id: int
    performer_name: str
    transaction_id: str
    transaction_hash: Optional[str] = None
    previous_hash: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def extract_fields(cls, data):
        if hasattr(data, 'grade'):
            return {
                'id': data.pk,
                'unique_id': data.unique_id,
                'created_date': data.created_date,
                'updated_date': data.updated_date,
                'is_active': data.is_active,
                'grade_id': data.grade.id if data.grade else None,
                'student_name': data.grade.enrollment.student.user.username if data.grade else None,
                'course_code': data.grade.enrollment.course.course_code if data.grade else None,
                'transaction_type': data.transaction_type,
                'performed_by_id': data.performed_by.id,
                'performer_name': data.performed_by.username,
                'transaction_id': data.transaction_id,
                'transaction_hash': data.transaction_hash,
                'previous_hash': data.previous_hash
            }
        return data


class RecordTransactionFilteringSerializer(BasePagedFilteringSerializer):
    """Filtering serializer for RecordTransaction"""
    grade_id: Optional[int] = None
    transaction_type: Optional[str] = None
    performed_by_id: Optional[int] = None
    performer_name: Optional[str] = None
    transaction_id: Optional[str] = None
    transaction_hash: Optional[str] = None
    previous_hash: Optional[str] = None
    pass


class RecordTransactionPagedResponseSerializer(BasePagedResponseList):
    """Paged response for RecordTransaction list"""
    data: List[RecordTransactionTableSerializer] | None = None


# ================================================================
# STORAGE REFERENCE SERIALIZERS
# ================================================================

class StorageReferenceTableSerializer(BaseSerializer):
    """Table display serializer for StorageReference"""
    grade_id: int
    student_name: str
    course_code: str
    storage_type: str
    content_identifier: str
    encryption_key_id: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def extract_fields(cls, data):
        if hasattr(data, 'grade'):
            return {
                'id': data.pk,
                'unique_id': data.unique_id,
                'created_date': data.created_date,
                'updated_date': data.updated_date,
                'is_active': data.is_active,
                'grade_id': data.grade.id if data.grade else None,
                'student_name': data.grade.enrollment.student.user.username if data.grade else None,
                'course_code': data.grade.enrollment.course.course_code if data.grade else None,
                'storage_type': data.storage_type,
                'content_identifier': data.content_identifier,
                'encryption_key_id': data.encryption_key_id,
                'file_size': data.file_size,
                'mime_type': data.mime_type
            }
        return data


class StorageReferenceFilteringSerializer(BasePagedFilteringSerializer):
    """Filtering serializer for StorageReference"""
    pass

class StorageReferencePagedResponseSerializer(BasePagedResponseList):
    """Paged response for StorageReference list"""
    data: List[StorageReferenceTableSerializer] | None = None


# ================================================================
# ACADEMIC TRANSCRIPT SERIALIZERS
# ================================================================

class AcademicTranscriptTableSerializer(BaseSerializer):
    """Table display serializer for AcademicTranscript"""
    student_id: int
    student_name: str
    student_number: str
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    gpa: Optional[Decimal] = None
    total_credits: Optional[Decimal] = None
    blockchain_root_hash: str
    ipfs_cid: str
    generated_at: Optional[datetime] = None
    is_official: bool

    @model_validator(mode='before')
    @classmethod
    def extract_fields(cls, data):
        if hasattr(data, 'student'):
            return {
                'id': data.pk,
                'unique_id': data.unique_id,
                'created_date': data.created_date,
                'updated_date': data.updated_date,
                'is_active': data.is_active,
                'student_id': data.student.id,
                'student_name': data.student.user.username,
                'student_number': data.student.student_id,
                'academic_year': data.academic_year,
                'semester': data.semester,
                'gpa': data.gpa,
                'total_credits': data.total_credits,
                'blockchain_root_hash': data.blockchain_root_hash,
                'ipfs_cid': data.ipfs_cid,
                'generated_at': data.generated_at,
                'is_official': data.is_official
            }
        return data


class AcademicTranscriptInputSerializer(BaseInputSerializer):
    """Input serializer for generating AcademicTranscript

    Note: GPA, credits, blockchain hash, IPFS CID, and timestamp are
    auto-calculated by AcademicRecordService.generate_transcript()
    """
    student_id: int
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    is_official: bool = False


class AcademicTranscriptFilteringSerializer(BasePagedFilteringSerializer):
    """Filtering serializer for AcademicTranscript"""
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    is_official: Optional[bool] = None
    student_id: Optional[int] = None
    pass

class AcademicTranscriptPagedResponseSerializer(BasePagedResponseList):
    """Paged response for AcademicTranscript list"""
    data: List[AcademicTranscriptTableSerializer] | None = None


class AcademicTranscriptNonPagedResponseSerializer(BaseNonPagedResponseData):
    """Single AcademicTranscript response"""
    data: AcademicTranscriptTableSerializer | None = None


# ================================================================
# BLOCKCHAIN VERIFICATION SERIALIZERS
# ================================================================

class BlockchainVerificationRequestSerializer(BaseSchema):
    """Request to verify a grade's blockchain integrity"""
    grade_id: int


class BlockchainVerificationResponseSerializer(BaseSchema):
    """Response from blockchain verification"""
    grade_id: int
    is_valid: bool
    blockchain_hash: str
    blockchain_transaction_id: str
    ipfs_cid: str
    verification_timestamp: datetime
    message: str
