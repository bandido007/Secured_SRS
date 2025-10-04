from django.conf import settings
from django.contrib.auth.models import User

from srs_accounts.models import UserProfile
from srs_uaa.models import *

from .permissions import permissions
import logging

logger = logging.getLogger("gateway_logger")

DEFAULT_SUPER_ADMIN_ROLE_NAME = settings.DEFAULT_SUPER_ADMIN_ROLE_NAME
DEFAULT_NORMAL_USER_ROLE = settings.DEFAULT_NORMAL_USER_ROLE

# add All Permissions From Other Modules Here
all_permissions_added = permissions
# Append Other Default Roles If Any
all_default_roles_added = [DEFAULT_SUPER_ADMIN_ROLE_NAME, DEFAULT_NORMAL_USER_ROLE]


class CreateRolesAddPermissions:
    all_permissions = all_permissions_added
    all_default_roles = all_default_roles_added

    def __init__(self) -> None:
        logger.info("seeding Roles And Permissions")
        try:
            self.seed_permissions()
        except Exception as e:
            logger.error(f"EXCEPTION {e}")

    def get_admin_role(self):
        return UserRoles.objects.filter(name=DEFAULT_SUPER_ADMIN_ROLE_NAME).first()

    def get_admin_user(self):
        return User.objects.filter(username=settings.DEFAULT_SUPER_USERNAME).first()

    def check_if_all_permissions_are_seeded(self):
        all_permissions_seeded = UserPermissions.objects.filter(
            permission_is_seeded=True
        )

        all_permissions_to_be_seeded = []
        for permissions in self.all_permissions:
            all_permissions_to_be_seeded = (
                all_permissions_to_be_seeded + permissions["permissions"]
            )

        logger.info("CHECKING IF THERE ARE ANY PERMISSIONS TO DELETE")

        permissions_to_delete = all_permissions_seeded.exclude(
            code__in=all_permissions_to_be_seeded
        )

        if len(permissions_to_delete) > 0:
            logger.info("FOUND PERMISSIONS TO DELETE")
            permissions_to_delete.delete()
            logger.info("FINISHED DELETING ALL REMOVED PERMISSIONS")

        return all_permissions_seeded.count() == len(all_permissions_to_be_seeded)

    def create_update_permissions_group(self, group_name: str, admin_user):
        created_group, _ = UserPermissionsGroup.objects.update_or_create(
            name=group_name,
            description=group_name,
            created_by=admin_user,
            defaults={"is_active": True},
        )

        return created_group

    def seed_permissions(self):

        # CREATE ALL ROLES
        self.create_default_roles()

        admin_role = self.get_admin_role()

        admin_user = self.get_admin_user()

        if self.check_if_all_permissions_are_seeded():
            logger.info("ALL PERMISSIONS ARE SEEDED SKIPPING SEEDING PERMISSIONS")
            return

        for permissions in self.all_permissions:
            permissions_group = permissions["permission_group"]
            logger.info(f"Creating Or Updating Permissions  Group {permissions_group}")

            permission_group_object = self.create_update_permissions_group(
                group_name=permissions_group, admin_user=admin_user
            )

            logger.info(f"SEEDING PERMISSIONS {permissions_group}")
            for permission in permissions["permissions"]:
                permission, _ = UserPermissions.objects.update_or_create(
                    name=permission.replace("_", " "),
                    code=permission,
                    group=permission_group_object,
                    created_by=admin_user,
                    defaults={"is_active": True, "permission_is_seeded": True},
                )

        all_user_permissions = UserPermissions.objects.all()

        logger.info("PROVIDING ALL PERMISSIONS TO ADMIN")
        for permission in all_user_permissions:
            UserRolesWithPermissions.objects.update_or_create(
                role_with_permission_role=admin_role,
                role_with_permission_permission=permission,
            )

    def create_default_roles(self):

        for role in self.all_default_roles:
            logger.info(f"seeding Roles {role}")
            created_role, _ = UserRoles.objects.update_or_create(
                name=role, description=role
            )

            if created_role.name == DEFAULT_SUPER_ADMIN_ROLE_NAME:
                user, _ = User.objects.update_or_create(
                    username=settings.DEFAULT_SUPER_USERNAME,
                    defaults={
                        "email": settings.DEFAULT_SUPER_EMAIL,
                        "first_name": "admin",
                        "last_name": "admin",
                        "is_staff": True,
                        "is_superuser": True,
                    },
                )

                if not user:
                    raise Exception("Failed To Create User Stopping")

                UserProfile.objects.update_or_create(
                    profile_user=user,
                    defaults={
                        "is_active": True,
                        "account_type": "ADMIN",
                        "has_been_verified": True,
                    },
                )

                user.set_password(settings.DEFAULT_SUPER_PASS)
                user.save()

                UsersWithRoles.objects.update_or_create(
                    user_with_role_role=created_role,
                    user_with_role_user=user,
                )

        logger.info("Finished seeding All Roles")
