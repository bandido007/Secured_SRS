"""
Permissions for Secured Student Record System

Based on use cases:
- Students: Submit personal info, view own records, verify integrity, prove credentials
- Lecturers: Submit grades, verify grades, view submission history
- Administrators: Manage users, assign permissions, verify records, audit system

RBAC Structure:
- User → Role → Permissions
- Roles: ADMIN, STUDENT, LECTURER
- Each role has a predefined set of permissions
"""

# Define all available permissions grouped by functionality
permissions = [
    # ================================================================
    # STUDENT PERMISSIONS
    # ================================================================
    {
        "permission_group": "STUDENT RECORDS",
        "permissions": [
            "view_own_records",              # Student can view their own academic records
            "submit_personal_information",   # Student can submit/update their biographical data
            "verify_record_integrity",       # Student can verify their records haven't been tampered with
            "generate_credential_proof",     # Student can generate proof for third parties
            "view_record_history",           # Student can see change history of their records
        ],
    },

    # ================================================================
    # LECTURER PERMISSIONS
    # ================================================================
    {
        "permission_group": "GRADE MANAGEMENT",
        "permissions": [
            "submit_grades",                 # Lecturer can submit grades for their courses
            "view_own_grade_submissions",    # Lecturer can view grades they submitted
            "verify_grade_integrity",        # Lecturer can verify grades haven't been altered
            "view_grade_submission_history", # Lecturer can see when/who submitted grades
            "view_course_students",          # Lecturer can see students enrolled in their courses
        ],
    },

    # ================================================================
    # ADMINISTRATOR PERMISSIONS
    # ================================================================
    {
        "permission_group": "USER MANAGEMENT",
        "permissions": [
            "create_student_accounts",       # Admin can create student accounts
            "create_lecturer_accounts",      # Admin can create lecturer accounts
            "create_admin_accounts",         # Admin can create other admin accounts
            "assign_roles",                  # Admin can assign roles to users
            "manage_roles",                  # Admin can create/edit/delete roles
            "manage_permissions",            # Admin can manage permission assignments
            "deactivate_users",              # Admin can deactivate user accounts
            "view_all_users",                # Admin can see list of all users
            "view_all_students",             # Admin can see all student records
            "manage_student_records",        # Admin can create/update student profiles
            "view_lecturer_information",     # Admin can view lecturer details
            "manage_lecturer_accounts",      # Admin can manage lecturer profiles
        ],
    },

    {
        "permission_group": "RECORD VERIFICATION",
        "permissions": [
            "verify_any_record",             # Admin can verify authenticity of any record
            "view_all_records",              # Admin can view all academic records
            "view_blockchain_hashes",        # Admin can see cryptographic proofs
            "view_ipfs_references",          # Admin can see distributed storage references
            "view_all_grade_submissions",    # Admin can view grades submitted by anyone
            "view_grade_submissions",        # Admin can list all grade submissions
            "generate_transcripts",          # Admin can generate official transcripts
        ],
    },

    {
        "permission_group": "SYSTEM AUDIT",
        "permissions": [
            "view_audit_logs",               # Admin can view system audit trail
            "view_user_activity",            # Admin can see who did what and when
            "view_all_transcripts",
            "export_audit_reports",          # Admin can export audit data
            "view_system_statistics",        # Admin can see system usage statistics
            "view_audit_trail",              # Admin can view grade-level audit trails
        ],
    },

    # ================================================================
    # COURSE MANAGEMENT PERMISSIONS
    # ================================================================
    {
        "permission_group": "COURSE MANAGEMENT",
        "permissions": [
            "create_courses",                # Admin can create courses
            "assign_lecturers_to_courses",   # Admin can assign lecturers to courses
            "enroll_students_in_courses",    # Admin can enroll students in courses
            "view_all_courses",              # Admin can view all courses
            "manage_course_details",         # Admin can edit course information
            "view_course_catalog",           # Admin can view the published course catalog
            "manage_course_catalog",         # Admin can manage catalog entries
            "view_enrollment_records",       # Admin can view all enrollment records
            "manage_enrollment",             # Admin can manage enrollments
        ],
    },

    # ================================================================
    # THIRD-PARTY VERIFICATION (Future)
    # ================================================================
    {
        "permission_group": "CREDENTIAL VERIFICATION",
        "permissions": [
            "verify_credentials_public",     # Public API to verify credentials
            "check_record_authenticity",     # Verify record hasn't been tampered
            "view_public_verification",      # View publicly verifiable data only
        ],
    },
]


# ================================================================
# ROLE-PERMISSION MAPPINGS
# ================================================================
"""
Define which permissions each role should have by default.
This mapping is used during seed/migration to auto-assign permissions to roles.
"""

role_permission_mappings = {
    "STUDENT": [
        # Student Record Permissions
        "view_own_records",
        "submit_personal_information",
        "verify_record_integrity",
        "generate_credential_proof",
        "view_record_history",
        # Credential Verification (public)
        "verify_credentials_public",
        "check_record_authenticity",
        "view_public_verification",
        # Catalog visibility
        "view_course_catalog",
    ],

    "LECTURER": [
        # Grade Management Permissions
        "submit_grades",
        "view_own_grade_submissions",
        "verify_grade_integrity",
        "view_grade_submission_history",
        "view_course_students",
        # Some verification permissions
        "verify_credentials_public",
        "check_record_authenticity",
        "view_public_verification",
        # Course and enrollment visibility
        "view_course_catalog",
        "view_enrollment_records",
    ],

    "ADMIN": [
        # Admin gets ALL permissions - will be assigned automatically in seed script
        # This is handled in CreateUserAddSeedPermissions.py
        # Admin has full access to:
        # - All student record permissions
        # - All lecturer/grade management permissions
        # - All user management permissions
        # - All record verification permissions
        # - All system audit permissions
        # - All course management permissions
        # - All credential verification permissions
    ]
}
