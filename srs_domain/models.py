"""
Domain Layer Models - Secured Student Record System

This layer captures the real-world understanding of how universities work:
- Students enroll in courses
- Lecturers teach and grade those courses
- Administrators oversee the process
- Academic records are permanent, verifiable facts

WHAT THIS LAYER KNOWS:
- Business entities (Student, Course, Grade, etc.)
- Business rules (valid grade ranges, enrollment requirements)
- Domain relationships (who can grade whom)

WHAT THIS LAYER DOESN'T KNOW:
- Technical implementation (PostgreSQL, MongoDB, etc.)
- Blockchain specifics (Hyperledger, consensus mechanisms)
- Encryption algorithms (AES, SHA-256)
- Storage mechanisms (IPFS, local files)

Those technical concerns live in lower infrastructure layers.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from srs_utils.BaseModel import BaseModel


# ================================================================
# CORE DOMAIN ENTITIES
# ================================================================

class Student(BaseModel):
    """
    Represents a student in the university system.

    Business Rules:
    - Must have unique student ID
    - Must be linked to a User account
    - Enrollment date cannot be in the future
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    student_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="University-assigned student ID"
    )
    enrollment_date = models.DateField(
        help_text="When the student first enrolled"
    )
    program = models.CharField(
        max_length=200,
        help_text="Degree program (e.g., 'BSc Computer Science')"
    )
    year_of_study = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Current year (1-10)"
    )
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)

    ENROLLMENT_STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('GRADUATED', 'Graduated'),
        ('SUSPENDED', 'Suspended'),
        ('WITHDRAWN', 'Withdrawn'),
    ]
    enrollment_status = models.CharField(
        max_length=20,
        choices=ENROLLMENT_STATUS_CHOICES,
        default='ACTIVE'
    )

    class Meta:
        db_table = "students"
        ordering = ['-enrollment_date']
        verbose_name_plural = "STUDENTS"

    def __str__(self):
        return f"{self.student_id} - {self.user.get_full_name()}"

    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.username


class Lecturer(BaseModel):
    """
    Represents a lecturer/professor in the university system.

    Business Rules:
    - Must have unique lecturer ID
    - Must be linked to a User account
    - Can teach multiple courses
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='lecturer_profile'
    )
    lecturer_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="University-assigned lecturer ID"
    )
    department = models.CharField(
        max_length=200,
        help_text="Academic department (e.g., 'Computer Science')"
    )
    specialization = models.CharField(
        max_length=200,
        blank=True,
        help_text="Area of expertise"
    )

    class Meta:
        db_table = "lecturers"
        ordering = ['department']
        verbose_name_plural = "LECTURERS"

    def __str__(self):
        return f"{self.lecturer_id} - {self.user.get_full_name()}"

    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.username


class Course(BaseModel):
    """
    Represents an academic course.

    Business Rules:
    - Must have unique course code
    - Credits must be positive
    - Must have an assigned lecturer
    """
    course_code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Course code (e.g., 'CS101')"
    )
    course_name = models.CharField(
        max_length=200,
        help_text="Full course name"
    )
    credits = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(0.5), MaxValueValidator(20.0)],
        help_text="Credit hours for this course (e.g., 7.5, 9.0, 9.5, 10.0)"
    )
    department = models.CharField(
        max_length=200,
        help_text="Academic department"
    )
    assigned_lecturer = models.ForeignKey(
        Lecturer,
        on_delete=models.SET_NULL,
        null=True,
        related_name='courses_taught',
        help_text="Primary lecturer for this course"
    )
    description = models.TextField(
        blank=True,
        help_text="Course description"
    )

    class Meta:
        db_table = "courses"
        ordering = ['course_code']
        verbose_name_plural = "COURSES"

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"


class Enrollment(BaseModel):
    """
    Links students to courses they're enrolled in.

    Business Rules:
    - A student cannot enroll in the same course twice in the same semester/year
    - Enrollment must exist before a grade can be submitted
    """

    class SemesterChoices(models.TextChoices):
        FALL = 'FALL', 'Fall Semester'
        SPRING = 'SPRING', 'Spring Semester'
        SUMMER = 'SUMMER', 'Summer Semester'

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrolled_students'
    )
    semester = models.CharField(
        max_length=10,
        choices=SemesterChoices.choices
    )
    academic_year = models.CharField(
        max_length=9,
        help_text="Academic year (e.g., '2024-2025')"
    )
    enrollment_date = models.DateField(
        auto_now_add=True
    )
    lecturer = models.ForeignKey(
        Lecturer,
        on_delete=models.SET_NULL,
        null=True,
        related_name='teaching_enrollments',
        help_text="Lecturer teaching this course for this enrollment"
    )
    class Meta:
        db_table = "enrollments"
        ordering = ['-academic_year', 'semester']
        verbose_name_plural = "ENROLLMENTS"
        unique_together = ['student', 'course', 'semester', 'academic_year']

    def __str__(self):
        return f"{self.student.student_id} in {self.course.course_code} ({self.semester} {self.academic_year})"


# ================================================================
# ACADEMIC RECORD - THE CORE BUSINESS ENTITY
# ================================================================

class CourseResults(BaseModel):
    """
    Represents a single grade/academic achievement.

    This is THE CENTRAL ENTITY - a permanent, verifiable fact:
    "Student X completed Course Y and received Grade Z during Semester W"

    Business Rules:
    - Student must be enrolled in the course
    - Lecturer must be authorized to grade this course
    - Grade value must be valid (0-100 or letter grade)
    - Once submitted and verified, becomes IMMUTABLE
    - Must have cryptographic proof of integrity
    """

    class GradeStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Verification'
        OFFICIAL = 'OFFICIAL', 'Official (Immutable)'
        DISPUTED = 'DISPUTED', 'Under Dispute'

    class GradeType(models.TextChoices):
        NUMERIC = 'NUMERIC', 'Numeric (0-100)'
        LETTER = 'LETTER', 'Letter Grade (A-F)'

    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='grades',
        help_text="Links to student enrollment in course"
    )
    grade_type = models.CharField(
        max_length=10,
        choices=GradeType.choices,
        default=GradeType.NUMERIC
    )
    numeric_grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Numeric grade (0-100)"
    )
    letter_grade = models.CharField(
        max_length=2,
        null=True,
        blank=True,
        help_text="Letter grade (A, B+, C, etc.)"
    )
    course_work_grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Course work/assignment grade (0-100)"
    )
    exam_grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Final exam grade (0-100)"
    )
    remarks = models.TextField(
        blank=True,
        help_text="Remarks (Pass, Fail, Carry Over, etc.)"
    )
    status = models.CharField(
        max_length=10,
        choices=GradeStatus.choices,
        default=GradeStatus.PENDING
    )
    submitted_by = models.ForeignKey(
        Lecturer,
        on_delete=models.PROTECT,
        related_name='grades_submitted',
        help_text="Lecturer who submitted this grade"
    )
    submitted_at = models.DateTimeField(
        auto_now_add=True
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the grade became official"
    )
    comments = models.TextField(
        blank=True,
        help_text="Optional comments from lecturer"
    )

    # ============================================================
    # CRYPTOGRAPHIC INTEGRITY FIELDS
    # These bridge domain concepts to technical infrastructure
    # ============================================================
    blockchain_hash = models.CharField(
        max_length=256,
        blank=True,
        help_text="SHA-256 hash stored on blockchain"
    )
    blockchain_transaction_id = models.CharField(
        max_length=256,
        blank=True,
        help_text="Blockchain transaction ID for verification"
    )
    ipfs_cid = models.CharField(
        max_length=256,
        blank=True,
        help_text="IPFS Content Identifier for encrypted record"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Has cryptographic integrity been verified?"
    )
    last_verified_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        db_table = "grades"
        ordering = ['-submitted_at']
        verbose_name_plural = "GRADES"
        indexes = [
            models.Index(fields=['blockchain_transaction_id']),
            models.Index(fields=['ipfs_cid']),
        ]

    def __str__(self):
        grade_display = self.numeric_grade if self.grade_type == 'NUMERIC' else self.letter_grade
        return f"{self.enrollment.student.student_id} - {self.enrollment.course.course_code}: {grade_display} ({self.status})"

    @property
    def student(self):
        return self.enrollment.student

    @property
    def course(self):
        return self.enrollment.course

    def can_be_modified(self):
        """
        Business Rule: Grades can only be modified if still PENDING.
        Once OFFICIAL, they become immutable.
        """
        return self.status == self.GradeStatus.PENDING

    def make_official(self):
        """
        Business Rule: Making a grade official is a one-way operation.
        This should only be called after blockchain verification succeeds.
        """
        if self.status == self.GradeStatus.PENDING:
            self.status = self.GradeStatus.OFFICIAL
            from django.utils import timezone
            self.verified_at = timezone.now()
            self.save()


# ================================================================
# AUDIT TRAIL - ACCOUNTABILITY
# ================================================================

class RecordTransaction(BaseModel):
    """
    Tracks every blockchain transaction for an academic record.

    Business Rule: Every action affecting a record must be tracked.
    This provides the immutable audit trail.
    """

    class TransactionType(models.TextChoices):
        CREATE = 'CREATE', 'Record Created'
        VERIFY = 'VERIFY', 'Record Verified'
        ACCESS = 'ACCESS', 'Record Accessed'

    grade = models.ForeignKey(
        CourseResults,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    transaction_type = models.CharField(
        max_length=10,
        choices=TransactionType.choices
    )
    performed_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='record_transactions_performed'
    )
    transaction_id = models.CharField(
        max_length=256,
        help_text="Blockchain transaction ID"
    )
    transaction_hash = models.CharField(
        max_length=256,
        help_text="Hash value stored on blockchain"
    )
    timestamp = models.DateTimeField(
        auto_now_add=True
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional transaction details"
    )

    class Meta:
        db_table = "record_transactions"
        ordering = ['-timestamp']
        verbose_name_plural = "RECORD TRANSACTIONS"

    def __str__(self):
        return f"{self.transaction_type} - {self.grade} at {self.timestamp}"


class StorageReference(BaseModel):
    """
    Tracks where encrypted record data is stored.

    This bridges domain concepts (academic records) to
    infrastructure concerns (distributed storage).
    """

    class StorageType(models.TextChoices):
        IPFS = 'IPFS', 'IPFS Distributed Storage'
        LOCAL = 'LOCAL', 'Local File Storage'
     

    grade = models.ForeignKey(
        CourseResults,
        on_delete=models.CASCADE,
        related_name='storage_references'
    )
    storage_type = models.CharField(
        max_length=10,
        choices=StorageType.choices,
        default=StorageType.IPFS
    )
    content_identifier = models.CharField(
        max_length=256,
        help_text="CID for IPFS or file path for local"
    )
    encrypted = models.BooleanField(
        default=True,
        help_text="Is the stored data encrypted?"
    )
    encryption_algorithm = models.CharField(
        max_length=50,
        blank=True,
        help_text="Encryption algorithm used (e.g., 'AES-256-CBC')"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "storage_references"
        ordering = ['-created_at']
        verbose_name_plural = "STORAGE REFERENCES"

    def __str__(self):
        return f"{self.storage_type}: {self.content_identifier[:20]}..."


# ================================================================
# AGGREGATED VIEW - ACADEMIC TRANSCRIPT
# ================================================================

class AcademicTranscript(BaseModel):
    """
    Represents a complete academic transcript for a student.

    This is an aggregated view of all a student's grades,
    with its own blockchain proof for the complete record.
    """
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='transcripts'
    )
    academic_year = models.CharField(
        max_length=9,
        help_text="Year this transcript covers"
    )
    semester = models.CharField(  # Added field
        max_length=10,
        null=True,
        blank=True,
        choices=Enrollment.SemesterChoices.choices,
        help_text="Semester this transcript covers (if specified)"
    )
    gpa = models.DecimalField(  # Added field
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Calculated GPA"
    )
    total_credits = models.DecimalField(  # Added field
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Total credits earned"
    )
    blockchain_root_hash = models.CharField(
        max_length=256,
        help_text="Merkle root of all grades in transcript"
    )
    ipfs_cid = models.CharField(
        max_length=256,
        help_text="IPFS CID for complete transcript document"
    )
    generated_at = models.DateTimeField(
        auto_now_add=True
    )
    is_official = models.BooleanField(  # Added field
        default=False,
        help_text="Whether this is an official transcript"
    )
    generated_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='transcripts_generated'
    )

    class Meta:
        db_table = "academic_transcripts"
        ordering = ['-generated_at']
        verbose_name_plural = "ACADEMIC TRANSCRIPTS"

    def __str__(self):
        return f"Transcript for {self.student.student_id} - {self.academic_year}"