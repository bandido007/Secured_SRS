# srs_domain/views.py

from django.conf import settings
from ninja import Router, Query
from django.http import HttpRequest
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

import logging

from rsa import compute_hash

from srs_domain.models import *
from srs_domain.serializers import *
from srs_domain.services import AcademicRecordService
from srs_uaa.authorization.auth_permission import PermissionAuth
from srs_uaa.authentication.user_management import UserManagementService
from srs_utils.response import ResponseObject, get_paginated_and_non_paginated_data
from srs_domain.services.mocks.mock_blockchain import MockBlockchainService
from srs_domain.services.mocks.mock_crypto import MockCryptographyService

logger = logging.getLogger("srs_logger")

domain_router = Router()
blockchain = MockBlockchainService()

def _get_request_user_or_none(request: HttpRequest):
    user = getattr(request, "user", None)
    if user is None:
        return None
    if getattr(user, "is_authenticated", False):
        return user
    return None


# ================================================================
# STUDENT ENDPOINTS - CRUD Operations
# ================================================================

@domain_router.get(
    "/students",
    response=StudentPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_all_students"])],
    by_alias=True
)
def get_students(
    request: HttpRequest,
    filtering: Query[StudentFilteringSerializer] = None
):
    """
    Retrieve all students (paginated).

    Permissions: view_all_students
    """
    try:
        queryset = Student.objects.select_related('user').all()

        # Apply additional filters
        if filtering:
            if filtering.program:
                queryset = queryset.filter(program__icontains=filtering.program)
            if filtering.year_of_study:
                queryset = queryset.filter(year_of_study=filtering.year_of_study)
            if filtering.enrollment_status:
                queryset = queryset.filter(enrollment_status=filtering.enrollment_status)

        return get_paginated_and_non_paginated_data(
            queryset,
            filtering,
            StudentPagedResponseSerializer
        )
    except Exception as e:
        logger.error(f"Error fetching students: {e}")
        return StudentPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )


@domain_router.get(
    "/students/me",
    response=StudentNonPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_own_records"])],
    by_alias=True
)
def get_my_student_profile(request: HttpRequest):
    """
    Get the authenticated user's own student profile.

    Permissions: view_own_records
    """
    try:
        student = Student.objects.select_related('user').filter(
            user=request.user,
            is_active=True
        ).first()

        if not student:
            return StudentNonPagedResponseSerializer(
                response=ResponseObject.get_response(0, "No student profile found for this user")
            )

        data = {
            "id": student.id,
            "unique_id": student.unique_id,
            "created_date": student.created_date,
            "updated_date": student.updated_date,
            "is_active": student.is_active,
            "student_id": student.student_id,
            "user_id": student.user.id,
            "username": student.user.username,
            "email": student.user.email,
            "program": student.program,
            "year_of_study": student.year_of_study,
            "enrollment_date": student.enrollment_date,
            "enrollment_status": student.enrollment_status,
            "phone_number": student.phone_number,
            "date_of_birth": student.date_of_birth
        }

        return StudentNonPagedResponseSerializer(
            response=ResponseObject.get_response(1),
            data=data
        )
    except Exception as e:
        logger.error(f"Error fetching student profile: {e}")
        return StudentNonPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )


@domain_router.get(
    "/students/{student_id}",
    response=StudentNonPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_own_records", "view_all_students"])],
    by_alias=True
)
def get_student(request: HttpRequest, student_id: int):
    """
    Get a specific student by ID.

    Permissions: view_own_records OR view_all_students
    """
    try:
        student = get_object_or_404(Student, pk=student_id, is_active=True)

        # Check if user can access this student
        from srs_uaa.authorization.services import AuthorizationService
        authz_service = AuthorizationService()

        # Students can view their own records
        is_own_record = student.user.id == request.user.id
        has_admin_permission = authz_service.has_permission(request.user.id, "view_all_students")

        if not is_own_record and not has_admin_permission:
            return StudentNonPagedResponseSerializer(
                response=ResponseObject.get_response(0, "Permission denied")
            )

        data = {
            "id": student.id,
            "unique_id": student.unique_id,
            "created_date": student.created_date,
            "updated_date": student.updated_date,
            "is_active": student.is_active,
            "student_id": student.student_id,
            "user_id": student.user.id,
            "username": student.user.username,
            "email": student.user.email,
            "program": student.program,
            "year_of_study": student.year_of_study,
            "enrollment_date": student.enrollment_date,
            "enrollment_status": student.enrollment_status,
            "phone_number": student.phone_number,
            "date_of_birth": student.date_of_birth
        }

        return StudentNonPagedResponseSerializer(
            response=ResponseObject.get_response(1),
            data=data
        )
    except Exception as e:
        logger.error(f"Error fetching student: {e}")
        return StudentNonPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )


@domain_router.post(
    "/students",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["manage_student_records"])]
)
def create_student(request: HttpRequest, input: StudentInputSerializer):
    """
    Create a new student record.

    Business rules:
    - Student ID must be unique
    - Creates associated User account
    - Assigns STUDENT role

    Permissions: manage_student_records
    """
    try:
        with transaction.atomic():
            creator = _get_request_user_or_none(request)
            # Check if student_id already exists
            if Student.objects.filter(student_id=input.student_id).exists():
                return BaseNonPagedResponseData(
                    response=ResponseObject.get_response(0, "Student ID already exists")
                )

            # Check if user already exists
            if User.objects.filter(id=input.user_id).exists():
                # Link to existing user
                user = User.objects.get(id=input.user_id)
            else:
                return BaseNonPagedResponseData(
                    response=ResponseObject.get_response(0, "User does not exist")
                )

            # Check if user is already a student
            if Student.objects.filter(user=user).exists():
                return BaseNonPagedResponseData(
                    response=ResponseObject.get_response(0, "User is already a student")
                )

            # Assign student role
            user_mgmt = UserManagementService()
            user_mgmt.assign_role_to_user(user, "STUDENT")

            # Create student profile
            student = Student.objects.create(
                user=user,
                student_id=input.student_id,
                enrollment_date=input.enrollment_date,
                program=input.program,
                year_of_study=input.year_of_study,
                enrollment_status=input.enrollment_status,
                phone_number=input.phone_number,
                date_of_birth=input.date_of_birth,
                created_by=creator
            )

            actor = creator.username if creator else "anonymous"

            # Create studentId on blockchain
            studentBackup = blockchain.create_student({
                "studentId": input.student_id,
                "program": input.program
            })
            print(studentBackup)

            logger.info(f"Student created: {student.student_id} by {actor}")

            return BaseNonPagedResponseData(
                response=ResponseObject.get_response(1, "Student created successfully")
            )

    except Exception as e:
        logger.error(f"Error creating student: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


@domain_router.put(
    "/students/{student_id}",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["manage_student_records"])]
)
def update_student(request: HttpRequest, student_id: int, input: StudentInputSerializer):
    """
    Update student information.

    Permissions: manage_student_records
    """
    try:
        student = get_object_or_404(Student, pk=student_id, is_active=True)

        # Update fields
        student.program = input.program
        student.year_of_study = input.year_of_study
        student.enrollment_status = input.enrollment_status
        student.phone_number = input.phone_number
        student.date_of_birth = input.date_of_birth
        student.enrollment_date = input.enrollment_date
        student.save()

        actor = getattr(request.user, "username", "anonymous")
        logger.info(f"Student updated: {student.student_id} by {actor}")

        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(1, "Student updated successfully")
        )
    except Exception as e:
        logger.error(f"Error updating student: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


@domain_router.delete(
    "/students/{student_id}",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["manage_student_records"])]
)
def deactivate_student(request: HttpRequest, student_id: int):
    """
    Deactivate a student (soft delete).

    Permissions: manage_student_records
    """
    try:
        student = get_object_or_404(Student, pk=student_id, is_active=True)
        student.is_active = False
        student.enrollment_status = 'WITHDRAWN'
        student.save()

        actor = getattr(request.user, "username", "anonymous")
        logger.info(f"Student deactivated: {student.student_id} by {actor}")

        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(1, "Student deactivated successfully")
        )
    except Exception as e:
        logger.error(f"Error deactivating student: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


# ================================================================
# LECTURER ENDPOINTS - CRUD Operations
# ================================================================

@domain_router.get(
    "/lecturers",
    response=LecturerPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_lecturer_information"])],
    by_alias=True
)
def get_lecturers(
    request: HttpRequest,
    filtering: Query[LecturerFilteringSerializer] = None
):
    """
    Retrieve all lecturers (paginated).

    Permissions: view_lecturer_information
    """
    try:
        queryset = Lecturer.objects.select_related('user').all()

        if filtering:
            if filtering.department:
                queryset = queryset.filter(department__icontains=filtering.department)
            if filtering.specialization:
                queryset = queryset.filter(specialization__icontains=filtering.specialization)

        return get_paginated_and_non_paginated_data(
            queryset,
            filtering,
            LecturerPagedResponseSerializer
        )
    except Exception as e:
        logger.error(f"Error fetching lecturers: {e}")
        return LecturerPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )


@domain_router.get(
    "/lecturers/me",
    response=LecturerNonPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_own_grade_submissions"])],
    by_alias=True
)
def get_my_lecturer_profile(request: HttpRequest):
    """
    Get the authenticated user's own lecturer profile.

    Permissions: view_own_grade_submissions (lecturers always have this)
    """
    try:
        lecturer = Lecturer.objects.select_related('user').filter(
            user=request.user,
            is_active=True
        ).first()

        if not lecturer:
            return LecturerNonPagedResponseSerializer(
                response=ResponseObject.get_response(0, "No lecturer profile found for this user")
            )

        data = {
            "id": lecturer.id,
            "unique_id": lecturer.unique_id,
            "created_date": lecturer.created_date,
            "updated_date": lecturer.updated_date,
            "is_active": lecturer.is_active,
            "lecturer_id": lecturer.lecturer_id,
            "user_id": lecturer.user.id,
            "username": lecturer.user.username,
            "email": lecturer.user.email,
            "department": lecturer.department,
            "specialization": lecturer.specialization
        }

        return LecturerNonPagedResponseSerializer(
            response=ResponseObject.get_response(1),
            data=data
        )
    except Exception as e:
        logger.error(f"Error fetching lecturer profile: {e}")
        return LecturerNonPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )


@domain_router.post(
    "/lecturers",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["manage_lecturer_accounts"])]
)
def create_lecturer(request: HttpRequest, input: LecturerInputSerializer):
    """
    Create a new lecturer record.

    Permissions: manage_lecturer_accounts
    """
    try:
        with transaction.atomic():
            creator = _get_request_user_or_none(request)
            if Lecturer.objects.filter(lecturer_id=input.lecturer_id).exists():
                return BaseNonPagedResponseData(
                    response=ResponseObject.get_response(0, "Lecturer ID already exists")
                )

            # Get or validate user
            user = get_object_or_404(User, id=input.user_id)

            if Lecturer.objects.filter(user=user).exists():
                return BaseNonPagedResponseData(
                    response=ResponseObject.get_response(0, "User is already a lecturer")
                )

            # Assign lecturer role
            user_mgmt = UserManagementService()
            user_mgmt.assign_role_to_user(user, "LECTURER")

            # Create lecturer profile
            lecturer = Lecturer.objects.create(
                user=user,
                lecturer_id=input.lecturer_id,
                department=input.department,
                specialization=input.specialization,
                created_by=creator
            )

            actor = creator.username if creator else "anonymous"


            # Create lecturerId on blockchain
            lecturerBackup = blockchain.create_lecturer({
                "lecturerId": input.lecturer_id,
                "department": input.department,
                "specialization": input.specialization,
            })

            print(lecturerBackup)

            logger.info(f"Lecturer created: {lecturer.lecturer_id} by {actor}")

            return BaseNonPagedResponseData(
                response=ResponseObject.get_response(1, "Lecturer created successfully")
            )

    except Exception as e:
        logger.error(f"Error creating lecturer: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


@domain_router.put(
    "/lecturers/{lecturer_id}",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["manage_lecturer_accounts"])]
)
def update_lecturer(request: HttpRequest, lecturer_id: int, input: LecturerInputSerializer):
    """Update lecturer information."""
    try:
        lecturer = get_object_or_404(Lecturer, pk=lecturer_id, is_active=True)

        lecturer.department = input.department
        lecturer.specialization = input.specialization
        lecturer.save()

        actor = getattr(request.user, "username", "anonymous")
        logger.info(f"Lecturer updated: {lecturer.lecturer_id} by {actor}")

        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(1, "Lecturer updated successfully")
        )
    except Exception as e:
        logger.error(f"Error updating lecturer: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


@domain_router.delete(
    "/lecturers/{lecturer_id}",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["manage_lecturer_accounts"])]
)
def deactivate_lecturer(request: HttpRequest, lecturer_id: int):
    """Deactivate a lecturer (soft delete)."""
    try:
        lecturer = get_object_or_404(Lecturer, pk=lecturer_id, is_active=True)
        lecturer.is_active = False
        lecturer.save()

        actor = getattr(request.user, "username", "anonymous")
        logger.info(f"Lecturer deactivated: {lecturer.lecturer_id} by {actor}")

        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(1, "Lecturer deactivated successfully")
        )
    except Exception as e:
        logger.error(f"Error deactivating lecturer: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


# ================================================================
# COURSE ENDPOINTS - CRUD Operations
# ================================================================

@domain_router.get(
    "/courses",
    response=CoursePagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_course_catalog"])],
    by_alias=True
)
def get_courses(
    request: HttpRequest,
    filtering: Query[CourseFilteringSerializer] = None
):
    """Retrieve all courses (paginated)."""
    try:
        queryset = Course.objects.select_related('assigned_lecturer').all()

        if filtering:
            if filtering.department:
                queryset = queryset.filter(department__icontains=filtering.department)
            if filtering.assigned_lecturer_id:
                queryset = queryset.filter(assigned_lecturer_id=filtering.assigned_lecturer_id)
            if filtering.min_credits:
                queryset = queryset.filter(credits__gte=filtering.min_credits)
            if filtering.max_credits:
                queryset = queryset.filter(credits__lte=filtering.max_credits)

        return get_paginated_and_non_paginated_data(
            queryset,
            filtering,
            CoursePagedResponseSerializer
        )
    except Exception as e:
        logger.error(f"Error fetching courses: {e}")
        return CoursePagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )


@domain_router.post(
    "/courses",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["manage_course_catalog"])]
)
def create_course(request: HttpRequest, input: CourseInputSerializer):
    """
    Create a new course.

    Business rules:
    - Course code must be unique
    - Credits must be between 0.5 and 20
    """
    try:
        creator = _get_request_user_or_none(request)
        if Course.objects.filter(course_code=input.course_code).exists():
            return BaseNonPagedResponseData(
                response=ResponseObject.get_response(0, "Course code already exists")
            )

        course = Course.objects.create(
            course_code=input.course_code,
            course_name=input.course_name,
            credits=input.credits,
            department=input.department,
            assigned_lecturer_id=input.assigned_lecturer_id,
            description=input.description,
            created_by=creator
        )

        actor = creator.username if creator else "anonymous"

        # Create lecturerId on blockchain
        courseBackup = blockchain.add_course({
            "course_code": input.course_code,
            "course_name": input.course_name,
            "credits": input.credits,
            "department": input.department,
            "assigned_lecturer_id": input.assigned_lecturer_id,
        })

        print(courseBackup)
        
        logger.info(f"Course created: {course.course_code} by {actor}")

        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(1, "Course created successfully")
        )

    except Exception as e:
        logger.error(f"Error creating course: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


@domain_router.put(
    "/courses/{course_id}",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["manage_course_catalog"])]
)
def update_course(request: HttpRequest, course_id: int, input: CourseInputSerializer):
    """Update course information."""
    try:
        course = get_object_or_404(Course, pk=course_id, is_active=True)

        course.course_name = input.course_name
        course.credits = input.credits
        course.department = input.department
        course.assigned_lecturer_id = input.assigned_lecturer_id
        course.description = input.description
        course.save()

        actor = getattr(request.user, "username", "anonymous")
        logger.info(f"Course updated: {course.course_code} by {actor}")

        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(1, "Course updated successfully")
        )
    except Exception as e:
        logger.error(f"Error updating course: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


@domain_router.delete(
    "/courses/{course_id}",
    response=BaseNonPagedResponseData,
    # auth=[PermissionAuth(required_permissions=["manage_course_catalog"])]
)
def deactivate_course(request: HttpRequest, course_id: int):
    """Deactivate a course (soft delete)."""
    try:
        course = get_object_or_404(Course, pk=course_id, is_active=True)
        course.is_active = False
        course.save()

        actor = getattr(request.user, "username", "anonymous")
        logger.info(f"Course deactivated: {course.course_code} by {actor}")

        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(1, "Course deactivated successfully")
        )
    except Exception as e:
        logger.error(f"Error deactivating course: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


# ================================================================
# ENROLLMENT ENDPOINTS - CRUD Operations
# ================================================================

@domain_router.get(
    "/enrollments",
    response=EnrollmentPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_enrollment_records", "view_own_records"])],
    by_alias=True
)
def get_enrollments(
    request: HttpRequest,
    filtering: Query[EnrollmentFilteringSerializer] = None
):
    """
    Retrieve enrollments (paginated).

    Students can view their own enrollments.
    Lecturers/Admins can view all enrollments.
    """
    try:
        from srs_uaa.authorization.services import AuthorizationService
        authz_service = AuthorizationService()

        # Check if user has admin/lecturer permission to view all
        can_view_all = authz_service.has_permission(request.user.id, "view_enrollment_records")

        queryset = Enrollment.objects.select_related('student', 'course', 'lecturer').all()

        # If not admin/lecturer, filter to only user's own enrollments
        if not can_view_all:
            queryset = queryset.filter(student__user=request.user)

        if filtering:
            if filtering.student_id:
                queryset = queryset.filter(student_id=filtering.student_id)
            if filtering.course_id:
                queryset = queryset.filter(course_id=filtering.course_id)
            if filtering.semester:
                queryset = queryset.filter(semester=filtering.semester)
            if filtering.academic_year:
                queryset = queryset.filter(academic_year=filtering.academic_year)
            if filtering.lecturer_id:
                queryset = queryset.filter(
                    Q(lecturer_id=filtering.lecturer_id)
                    | Q(course__assigned_lecturer_id=filtering.lecturer_id)
                )

        return get_paginated_and_non_paginated_data(
            queryset,
            filtering,
            EnrollmentPagedResponseSerializer
        )
    except Exception as e:
        logger.error(f"Error fetching enrollments: {e}")
        return EnrollmentPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )


@domain_router.post(
    "/enrollments",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["manage_enrollment"])]
)
def create_enrollment(request: HttpRequest, input: EnrollmentInputSerializer):
    """
    Enroll a student in a course.

    Business rules:
    - Student must be active
    - Course must be active
    - No duplicate enrollments (unique: student + course + semester + year)
    """
    try:
        with transaction.atomic():
            creator = _get_request_user_or_none(request)
            # Validate student
            student = get_object_or_404(Student, pk=input.student_id, is_active=True)
            if student.enrollment_status != 'ACTIVE':
                return BaseNonPagedResponseData(
                    response=ResponseObject.get_response(0, "Student is not active")
                )

            # Validate course
            course = get_object_or_404(Course, pk=input.course_id, is_active=True)

            # Determine lecturer to associate with enrollment
            assigned_lecturer = None
            if input.lecturer_id:
                assigned_lecturer = get_object_or_404(Lecturer, pk=input.lecturer_id, is_active=True)
            elif course.assigned_lecturer and course.assigned_lecturer.is_active:
                assigned_lecturer = course.assigned_lecturer

            # Check for duplicate enrollment
            if Enrollment.objects.filter(
                student=student,
                course=course,
                semester=input.semester,
                academic_year=input.academic_year
            ).exists():
                return BaseNonPagedResponseData(
                    response=ResponseObject.get_response(
                        0,
                        f"Student already enrolled in {course.course_code} for {input.semester} {input.academic_year}"
                    )
                )

            # Create enrollment
            enrollment = Enrollment.objects.create(
                student=student,
                course=course,
                semester=input.semester,
                academic_year=input.academic_year,
                lecturer=assigned_lecturer,
                created_by=creator
            )

            actor = creator.username if creator else "anonymous"
            logger.info(
                f"Enrollment created: {student.student_id} in {course.course_code} "
                f"for {input.semester} {input.academic_year} by {actor}"
                f" (lecturer: {(assigned_lecturer.lecturer_id if assigned_lecturer else 'unassigned')})"
            )

            return BaseNonPagedResponseData(
                response=ResponseObject.get_response(1, "Enrollment created successfully")
            )

    except Exception as e:
        logger.error(f"Error creating enrollment: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


@domain_router.delete(
    "/enrollments/{enrollment_id}",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["manage_enrollment"])]
)
def deactivate_enrollment(request: HttpRequest, enrollment_id: int):
    """Drop/withdraw from a course (soft delete)."""
    try:
        enrollment = get_object_or_404(Enrollment, pk=enrollment_id, is_active=True)
        enrollment.is_active = False
        enrollment.save()

        actor = getattr(request.user, "username", "anonymous")
        logger.info(
            f"Enrollment deactivated: {enrollment.student.student_id} "
            f"from {enrollment.course.course_code} by {actor}"
        )

        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(1, "Enrollment withdrawn successfully")
        )
    except Exception as e:
        logger.error(f"Error deactivating enrollment: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


# ================================================================
# COURSE RESULTS (GRADES) ENDPOINTS - THE CORE BUSINESS LOGIC
# ================================================================

import logging
import json
import hashlib

logger = logging.getLogger(__name__)

@domain_router.get(
    "/course-results",
    response=CourseResultsPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_grade_submissions", "view_own_grade_submissions"])],
    by_alias=True
)
def get_course_results(
    request: HttpRequest,
    filtering: Query[CourseResultsFilteringSerializer] = None
):
    """
    Retrieve course results/grades (paginated).
    Also compares regenerated hash with blockchainHash to show verification status.
    """
    try:
        from srs_uaa.authorization.services import AuthorizationService
        authz_service = AuthorizationService()

        can_view_all = authz_service.has_permission(request.user.id, "view_grade_submissions")

        queryset = CourseResults.objects.select_related(
            'enrollment__student',
            'enrollment__course',
            'submitted_by'
        ).all()

        # If not admin, show only own submissions
        if not can_view_all:
            lecturer = Lecturer.objects.filter(user=request.user, is_active=True).first()
            if lecturer:
                queryset = queryset.filter(submitted_by=lecturer)
            else:
                queryset = queryset.none()

        # Apply filtering
        if filtering:
            if filtering.enrollment_id:
                queryset = queryset.filter(enrollment_id=filtering.enrollment_id)
            if filtering.student_id:
                queryset = queryset.filter(enrollment__student_id=filtering.student_id)
            if filtering.course_id:
                queryset = queryset.filter(enrollment__course_id=filtering.course_id)
            if filtering.semester:
                queryset = queryset.filter(enrollment__semester=filtering.semester)
            if filtering.academic_year:
                queryset = queryset.filter(enrollment__academic_year=filtering.academic_year)
            if filtering.status:
                queryset = queryset.filter(status=filtering.status)
            if filtering.submitted_by_id:
                lecturer = Lecturer.objects.filter(user_id=filtering.submitted_by_id, is_active=True).first()
                if lecturer:
                    queryset = queryset.filter(submitted_by=lecturer)
                else:
                    queryset = queryset.filter(submitted_by_id=filtering.submitted_by_id)
            if filtering.is_verified is not None:
                queryset = queryset.filter(is_verified=filtering.is_verified)
            if filtering.grade_type:
                queryset = queryset.filter(grade_type=filtering.grade_type)

        # Use pagination helper
        paginated_response = get_paginated_and_non_paginated_data(
            queryset,
            filtering,
            CourseResultsPagedResponseSerializer
        )

        # Safely mutate serialized data (dicts)
        if hasattr(paginated_response, "data") and paginated_response.data:
            new_data = []

            for serialized in paginated_response.data:
                db_record = serialized.dict(by_alias=True) if hasattr(serialized, "dict") else serialized
                blockchain_record = blockchain.get_course_result(db_record.get("id")) or {}

                # Prepare data for hashing
                db_data_for_hash = {
                    "studentNumber": db_record.get("studentNumber"),
                    "courseCode": db_record.get("courseCode"),
                    "academicYear": db_record.get("academicYear"),
                    "semester": db_record.get("semester"),
                    "gradeType": db_record.get("gradeType"),
                    "courseWorkGrade": str(db_record.get("courseWorkGrade") or ""),
                    "examGrade": str(db_record.get("examGrade") or ""),
                    "remarks": db_record.get("remarks") or ""
                }

                blockchain_data_for_hash = {
                    "studentNumber": blockchain_record.get("studentNumber"),
                    "courseCode": blockchain_record.get("courseCode"),
                    "academicYear": blockchain_record.get("academicYear"),
                    "semester": blockchain_record.get("semester"),
                    "gradeType": blockchain_record.get("gradeType"),
                    "courseWorkGrade": str(blockchain_record.get("courseWorkGrade") or ""),
                    "examGrade": str(blockchain_record.get("examGrade") or ""),
                    "remarks": blockchain_record.get("remarks") or ""
                }

                crypto = MockCryptographyService()
                regenerated_db_hash = crypto.compute_hash(db_data_for_hash)
                regenerated_blockchain_hash = crypto.compute_hash(blockchain_data_for_hash)

                db_record["status"] = (
                    "VALID" if regenerated_db_hash == regenerated_blockchain_hash else "INVALID"
                )
                db_record["blockchainData"] = blockchain_data_for_hash

                new_data.append(db_record)

            # ✅ After loop, set updated data safely
            if isinstance(paginated_response.data, list):
                paginated_response.data = new_data
            elif isinstance(paginated_response.data, dict) and "results" in paginated_response.data:
                paginated_response.data["results"] = new_data

            return paginated_response

    except Exception as e:
        logger.error(f"Error fetching course results: {e}")
        return CourseResultsPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )

@domain_router.post(
    "/course-results",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["submit_grades"])]
)
def submit_course_result(request: HttpRequest, input: CourseResultsInputSerializer):
    """
    Submit a grade for a student.

    THE CORE BUSINESS OPERATION - This is where academic records are created.

    Uses AcademicRecordService to handle all business logic including:
    - Lecturer authorization validation
    - Enrollment validation
    - Grade validation
    - Cryptographic hash computation
    - Blockchain transaction storage
    - IPFS content storage
    - Audit trail creation

    Permissions: submit_grades
    """
    if not getattr(request.user, "is_authenticated", False):
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, "Authentication required to submit grades")
        )

    try:
        # Initialize service with mock implementations (can be swapped later)
        service = AcademicRecordService()

        # Call domain service to handle all business logic
        result = service.submit_grade(
            enrollment_id=input.enrollment_id,
            grade_type=input.grade_type,
            numeric_grade=input.numeric_grade,
            letter_grade=input.letter_grade,
            course_work_grade=input.course_work_grade,
            exam_grade=input.exam_grade,
            remarks=input.remarks,
            comments=input.comments,
            submitted_by_user=request.user
        )

        # Map service result to HTTP response
        if result.success:
            actor = getattr(request.user, "username", "anonymous")
            logger.info(f"Grade submitted successfully: ID {result.grade_id} by {actor}")
            return BaseNonPagedResponseData(
                response=ResponseObject.get_response(1, result.message)
            )
        else:
            logger.warning(f"Grade submission failed: {result.message}")
            return BaseNonPagedResponseData(
                response=ResponseObject.get_response(0, result.message)
            )

    except Exception as e:
        logger.error(f"Error submitting grade: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


@domain_router.post(
    "/course-results/{grade_id}/verify",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["verify_grade_integrity"])]
)
def verify_grade(request: HttpRequest, grade_id: int):
    """
    Verify a grade's blockchain integrity and make it official.

    Uses AcademicRecordService to handle:
    - Grade status validation (must be PENDING)
    - Cryptographic hash recomputation
    - Hash comparison for integrity
    - Status update to OFFICIAL
    - Verification audit trail

    Once verified, the grade becomes immutable.

    Permissions: verify_grade_integrity
    """
    if not getattr(request.user, "is_authenticated", False):
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, "Authentication required to verify grades")
        )

    try:
        # Initialize service
        service = AcademicRecordService()

        # Call domain service to verify grade
        result = service.verify_grade(
            grade_id=grade_id,
            verified_by_user=request.user
        )

        # Map service result to HTTP response
        if result.success:
            if result.is_valid:
                actor = getattr(request.user, "username", "anonymous")
                logger.info(f"Grade verified successfully: ID {grade_id} by {actor}")
                return BaseNonPagedResponseData(
                    response=ResponseObject.get_response(1, result.message)
                )
            else:
                logger.warning(f"Grade verification failed - integrity check: ID {grade_id}")
                return BaseNonPagedResponseData(
                    response=ResponseObject.get_response(0, result.message)
                )
        else:
            logger.warning(f"Grade verification failed: {result.message}")
            return BaseNonPagedResponseData(
                response=ResponseObject.get_response(0, result.message)
            )

    except Exception as e:
        logger.error(f"Error verifying grade: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


@domain_router.get(
    "/students/{student_id}/grades",
    response=CourseResultsPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_own_records"])],
    by_alias=True
)
def get_student_grades(
    request: HttpRequest,
    student_id: int,
    filtering: Query[CourseResultsFilteringSerializer] = None
):
    """
    Get all grades for a specific student.

    Business rules:
    - Students can view their own grades (requires view_own_records)
    - Lecturers/Admins can view any student's grades (requires view_all_grade_submissions)
    """
    try:
        student = get_object_or_404(Student, pk=student_id, is_active=True)

        # Permission check
        from srs_uaa.authorization.services import AuthorizationService
        authz_service = AuthorizationService()

        is_own_record = student.user.id == request.user.id
        has_view_own = authz_service.has_permission(request.user.id, "view_own_records")
        has_admin_permission = authz_service.has_permission(
            request.user.id,
            "view_all_grade_submissions"
        )

        # Allow if viewing own record with view_own_records OR has admin permission
        if not ((is_own_record and has_view_own) or has_admin_permission):
            return CourseResultsPagedResponseSerializer(
                response=ResponseObject.get_response(0, "Permission denied")
            )

        queryset = CourseResults.objects.filter(
            enrollment__student=student,
            is_active=True
        ).select_related('enrollment__course', 'submitted_by')

        # Apply additional filters
        if filtering and filtering.semester:
            queryset = queryset.filter(enrollment__semester=filtering.semester)
        if filtering and filtering.academic_year:
            queryset = queryset.filter(enrollment__academic_year=filtering.academic_year)

        return get_paginated_and_non_paginated_data(
            queryset,
            filtering,
            CourseResultsPagedResponseSerializer
        )

    except Exception as e:
        logger.error(f"Error fetching student grades: {e}")
        return CourseResultsPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )


# ================================================================
# AUDIT TRAIL ENDPOINTS
# ================================================================

@domain_router.get(
    "/course-results/{grade_id}/audit-trail",
    response=RecordTransactionPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_audit_trail"])],
    by_alias=True
)
def get_grade_audit_trail(
    request: HttpRequest,
    grade_id: int,
    filtering: Query[RecordTransactionFilteringSerializer] = None
):
    """Get complete audit trail for a grade."""
    try:
        grade = get_object_or_404(CourseResults, pk=grade_id, is_active=True)

        queryset = RecordTransaction.objects.filter(
            grade=grade
        ).select_related('performed_by').order_by('-created_date')

        return get_paginated_and_non_paginated_data(
            queryset,
            filtering,
            RecordTransactionPagedResponseSerializer
        )

    except Exception as e:
        logger.error(f"Error fetching audit trail: {e}")
        return RecordTransactionPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )


# ================================================================
# ACADEMIC TRANSCRIPT ENDPOINTS
# ================================================================

@domain_router.post(
    "/transcripts/generate",
    response=BaseNonPagedResponseData,
    auth=[PermissionAuth(required_permissions=["generate_transcripts"])]
)
def generate_transcript(request: HttpRequest, input: AcademicTranscriptInputSerializer):
    """
    Generate an academic transcript for a student.

    Uses AcademicRecordService to handle:
    - Fetching all OFFICIAL grades for student
    - GPA calculation (100-point to 4.0 scale conversion)
    - Total credits computation
    - Merkle root hash creation from all grade hashes
    - IPFS storage (mock)
    - Transcript record creation

    Permissions: generate_transcripts
    """
    try:
        # Initialize service
        service = AcademicRecordService()

        # Call domain service to generate transcript
        result = service.generate_transcript(
            student_id=input.student_id,
            academic_year=input.academic_year,
            semester=input.semester,
            is_official=input.is_official,
            generated_by_user=request.user
        )

        # Map service result to HTTP response
        if result.success:
            actor = getattr(request.user, "username", "anonymous")
            logger.info(
                f"Transcript generated: ID {result.transcript_id}, "
                f"GPA: {result.gpa:.2f} by {actor}"
            )
            return BaseNonPagedResponseData(
                response=ResponseObject.get_response(1, result.message)
            )
        else:
            logger.warning(f"Transcript generation failed: {result.message}")
            return BaseNonPagedResponseData(
                response=ResponseObject.get_response(0, result.message)
            )

    except Exception as e:
        logger.error(f"Error generating transcript: {e}")
        return BaseNonPagedResponseData(
            response=ResponseObject.get_response(0, message=str(e))
        )


@domain_router.get(
    "/students/{student_id}/transcripts",
    response=AcademicTranscriptPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["view_own_records"])],
    by_alias=True
)
def get_student_transcripts(
    request: HttpRequest,
    student_id: int,
    filtering: Query[AcademicTranscriptFilteringSerializer] = None
):
    """
    Get all transcripts for a student.

    Business rules:
    - Students can view their own transcripts (requires view_own_records)
    - Admins can view any student's transcripts (requires view_all_transcripts)
    """
    try:
        student = get_object_or_404(Student, pk=student_id, is_active=True)

        # Permission check
        from srs_uaa.authorization.services import AuthorizationService
        authz_service = AuthorizationService()

        is_own_record = student.user.id == request.user.id
        has_view_own = authz_service.has_permission(request.user.id, "view_own_records")
        has_admin_permission = authz_service.has_permission(
            request.user.id,
            "view_all_transcripts"
        )

        # Allow if viewing own record with view_own_records OR has admin permission
        if not ((is_own_record and has_view_own) or has_admin_permission):
            return AcademicTranscriptPagedResponseSerializer(
                response=ResponseObject.get_response(0, "Permission denied")
            )

        queryset = AcademicTranscript.objects.filter(
            student=student,
            is_active=True
        ).order_by('-generated_at')

        if filtering:
            if filtering.academic_year:
                queryset = queryset.filter(academic_year=filtering.academic_year)
            if filtering.semester:
                queryset = queryset.filter(semester=filtering.semester)
            if filtering.is_official is not None:
                queryset = queryset.filter(is_official=filtering.is_official)

        return get_paginated_and_non_paginated_data(
            queryset,
            filtering,
            AcademicTranscriptPagedResponseSerializer
        )

    except Exception as e:
        logger.error(f"Error fetching transcripts: {e}")
        return AcademicTranscriptPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e))
        )
