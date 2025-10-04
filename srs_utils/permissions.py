"""
Permissions for Secured Student Record System

Based on use cases:
- Students: Submit personal info, view own records, verify integrity, prove credentials
- Lecturers: Submit grades, verify grades, view submission history
- Administrators: Manage users, assign permissions, verify records, audit system
"""

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
        ],
    },

    {
        "permission_group": "RECORD VERIFICATION",
        "permissions": [
            "verify_any_record",             # Admin can verify authenticity of any record
            "view_all_records",              # Admin can view all academic records
            "view_blockchain_hashes",        # Admin can see cryptographic proofs
            "view_ipfs_references",          # Admin can see distributed storage references
        ],
    },

    {
        "permission_group": "SYSTEM AUDIT",
        "permissions": [
            "view_audit_logs",               # Admin can view system audit trail
            "view_user_activity",            # Admin can see who did what and when
            "export_audit_reports",          # Admin can export audit data
            "view_system_statistics",        # Admin can see system usage statistics
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
