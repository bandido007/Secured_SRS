# srs_uaa/authentication/user_management.py

import logging
from typing import Optional
from django.conf import settings
from django.contrib.auth.models import User
from srs_uaa.models import UsersWithRoles, UserRoles
from srs_accounts.models import UserProfile

logger = logging.getLogger("srs_logger")


class UserManagementService:
    """
    Single responsibility: Create and manage user accounts.

    This is SEPARATE from authentication (identity verification) and
    authorization (permission checking). This service handles the
    lifecycle of user accounts themselves.
    """

    def create_or_update_user_from_google(
        self,
        email: str,
        given_name: str = "",
        family_name: str = ""
    ) -> Optional[User]:
        """
        Create or update a user account from Google OAuth data.

        This is NOT authentication - it's user account provisioning.
        Authentication happens separately when tokens are validated.
        """
        try:
            user, created = User.objects.update_or_create(
                username=email,
                email=email,
                defaults={
                    "first_name": given_name,
                    "last_name": family_name,
                }
            )

            # Set default password for Google users
            user.set_password(settings.DEFAULT_USER_PASSWORD)
            user.save()

            # Initialize user profile
            UserProfile.objects.update_or_create(
                profile_user=user,
                defaults={"has_been_verified": True}
            )

            # Assign default role if this is a new user
            if created:
                self.assign_default_role(user)

            logger.info(f"User {'created' if created else 'updated'}: {email}")
            return user

        except Exception as e:
            logger.error(f"Failed to create/update user: {e}")
            return None

    def assign_default_role(self, user: User) -> bool:
        """Assign the default role to a new user."""
        try:
            default_role = UserRoles.objects.filter(
                name=settings.DEFAULT_NORMAL_USER_ROLE
            ).first()

            if not default_role:
                logger.error(f"Default role not found: {settings.DEFAULT_NORMAL_USER_ROLE}")
                return False

            UsersWithRoles.objects.get_or_create(
                user_with_role_role=default_role,
                user_with_role_user=user
            )

            logger.info(f"Assigned default role to user: {user.username}")
            return True

        except Exception as e:
            logger.error(f"Failed to assign default role: {e}")
            return False

    def create_user(
        self,
        username: str,
        email: str,
        password: str,
        first_name: str = "",
        last_name: str = ""
    ) -> Optional[User]:
        """Create a new user with standard credentials."""
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )

            # Initialize user profile
            UserProfile.objects.create(
                profile_user=user,
                has_been_verified=False
            )

            # Assign default role
            self.assign_default_role(user)

            logger.info(f"User created: {username}")
            return user

        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            return None
    def assign_role_to_user(self, user: User, role_name: str) -> bool:
        """
        Assign a specific role (by name) to a user.
        Valid roles: ADMIN, STUDENT, LECTURER
        """
        try:
            # Validate role name
            valid_roles = [settings.DEFAULT_SUPER_ADMIN_ROLE_NAME,
                          settings.STUDENT_ROLE_NAME,
                          settings.LECTURER_ROLE_NAME]

            if role_name not in valid_roles:
                logger.error(f"Invalid role name: {role_name}. Valid roles: {valid_roles}")
                return False

            role = UserRoles.objects.filter(name=role_name).first()
            if not role:
                logger.error(f"Role not found in database: {role_name}")
                return False

            # Remove existing roles for this user (single role per user)
            UsersWithRoles.objects.filter(user_with_role_user=user).delete()

            # Assign new role
            UsersWithRoles.objects.create(
                user_with_role_user=user,
                user_with_role_role=role
            )

            # Update profile account_type to match role
            profile = UserProfile.objects.filter(profile_user=user).first()
            if profile:
                profile.account_type = role_name
                profile.save()

            logger.info(f"Assigned role '{role_name}' to user: {user.username}")
            return True
        except Exception as e:
            logger.error(f"Failed to assign role '{role_name}' to user {user.username}: {e}")
            return False

    def get_user_role(self, user: User) -> str:
        """
        Get the role name for a user.
        Returns the role name (ADMIN, STUDENT, LECTURER) or None if no role assigned.
        """
        try:
            user_role = UsersWithRoles.objects.filter(user_with_role_user=user).first()
            if user_role:
                return user_role.user_with_role_role.name
            return None
        except Exception as e:
            logger.error(f"Failed to get role for user {user.username}: {e}")
            return None