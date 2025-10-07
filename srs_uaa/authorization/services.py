# srs_uaa/authorization/services.py

import logging
from typing import List
from srs_uaa.models import UsersWithRoles, UserRoles

logger = logging.getLogger("srs_logger")


class AuthorizationService:
    """
    Single responsibility: Check what users can do.

    This layer knows about:
    - Roles (student, lecturer, administrator)
    - Permissions (submit_grade, view_record, etc)
    - Resource ownership rules

    This layer does NOT know about:
    - How operations are performed (blockchain, encryption, etc)
    - User identity verification (that's authentication)
    """

    def has_permission(self, user_id: int, permission_code: str) -> bool:
        """Check if user has specific permission."""
        try:
            user_roles = UsersWithRoles.objects.filter(
                user_with_role_user_id=user_id,
                user_with_role_role__is_active=True,
                is_active=True
            ).select_related('user_with_role_role')

            for user_role in user_roles:
                permissions = user_role.user_with_role_role.get_serializable_permissions()
                if permission_code in permissions:
                    return True

            return False

        except Exception as e:
            logger.error(f"Permission check failed: {e}")
            return False

    def has_all_permissions(self, user_id: int, permission_codes: List[str]) -> bool:
        """Check if user has ALL listed permissions."""
        for permission_code in permission_codes:
            if  self.has_permission(user_id, permission_code):
                return True
        return False

    def get_user_permissions(self, user_id: int) -> List[str]:
        """Get all permission codes for a user."""
        try:
            user_roles = UsersWithRoles.objects.filter(
                user_with_role_user_id=user_id,
                is_active=True
            ).select_related('user_with_role_role')

            permissions = set()
            for user_role in user_roles:
                permissions.update(user_role.user_with_role_role.get_serializable_permissions())

            return list(permissions)

        except Exception as e:
            logger.error(f"Failed to get permissions: {e}")
            return []

    def get_user_roles(self, user_id: int) -> List[dict]:
        """
        Get user's roles and their permissions.

        This is useful for API responses that need to show
        what the authenticated user can do.
        """
        try:
            user_roles = UsersWithRoles.objects.filter(
                user_with_role_user_id=user_id,
                is_active=True
            ).select_related('user_with_role_role')

            roles_data = []
            for user_role in user_roles:
                roles_data.append({
                    "roleName": user_role.user_with_role_role.name,
                    "permissions": user_role.user_with_role_role.get_serializable_permissions()
                })

            return roles_data

        except Exception as e:
            logger.error(f"Failed to get user roles: {e}")
            return []

    def can_access_resource(
        self,
        user_id: int,
        permission_code: str,
        resource_owner_id: int = None
    ) -> bool:
        """
        Check if user can access a specific resource.

        This handles resource ownership rules like:
        - Students can view their own records but not others
        - Lecturers can edit grades they submitted
        - Admins can access everything

        Args:
            user_id: The user making the request
            permission_code: The permission required (e.g., "view_record")
            resource_owner_id: The user who owns the resource (if applicable)

        Returns:
            True if access is allowed, False otherwise
        """
        try:
            # First check if user has the base permission
            if not self.has_permission(user_id, permission_code):
                return False

            # If no resource owner specified, base permission is enough
            if resource_owner_id is None:
                return True

            # Check if user is accessing their own resource
            if user_id == resource_owner_id:
                return True

            # Check if user has admin-level access (can access any resource)
            # This could be based on specific admin permissions
            admin_permissions = [
                "admin_full_access",
                "view_all_records",
                "edit_all_records"
            ]

            for admin_perm in admin_permissions:
                if self.has_permission(user_id, admin_perm):
                    return True

            # User has permission but not for this specific resource
            return False

        except Exception as e:
            logger.error(f"Resource access check failed: {e}")
            return False