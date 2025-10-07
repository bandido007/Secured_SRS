# srs_uaa/views.py

from django.conf import settings
from ninja import Router, Query
from django.http import HttpRequest

import logging

from srs_uaa.models import *
from srs_uaa.serializers import *
from srs_uaa.authorization.auth_permission import PermissionAuth
from srs_uaa.authentication.services import AuthenticationService
from srs_uaa.authorization.services import AuthorizationService

from srs_utils.response import ResponseObject, get_paginated_and_non_paginated_data

logger = logging.getLogger("srs_logger")

auth_router = Router()


# ============================================================
# LOGIN ENDPOINTS (No authentication required)
# ============================================================

@auth_router.post("/login", response=LoginResponseSerializer)
def login(request: HttpRequest, input: LoginInputSerializer):
    """
    Standard username/password login.

    Layer separation:
    1. Authentication layer verifies identity and returns tokens
    2. Authorization layer gets roles/permissions separately
    3. API layer combines them for the response
    """
    try:
        auth_service = AuthenticationService()
        authz_service = AuthorizationService()

        ip_address = request.META.get('REMOTE_ADDR', 'unknown')

        # Step 1: Authenticate (who are you?)
        auth_result = auth_service.authenticate_with_credentials(
            username=input.username,
            password=input.password,
            ip_address=ip_address
        )

        if not auth_result:
            return LoginResponseSerializer(detail="Invalid credentials")

        if "error" in auth_result:
            return LoginResponseSerializer(detail=auth_result.get("detail", "Authentication failed"))

        # Step 2: Get authorization data (what can you do?)
        user_id = int(auth_result["user"]["id"])
        roles_data = authz_service.get_user_roles(user_id)

        # Step 3: Combine for response
        auth_result["user"]["roles"] = roles_data

        return LoginResponseSerializer(**auth_result)

    except Exception as e:
        logger.error(f"Login endpoint error: {e}")
        return LoginResponseSerializer(detail="Login failed due to server error")


@auth_router.post("/login_with_google", response=LoginResponseSerializer)
def login_with_google(request: HttpRequest, input: LoginWithGoogleInputSerializer):
    """Login with Google OAuth"""
    try:
        auth_service = AuthenticationService()
        authz_service = AuthorizationService()

        # Step 1: Authenticate with Google
        auth_result = auth_service.authenticate_with_google(jwt_token=input.jwt_token)

        if not auth_result:
            return LoginResponseSerializer(detail="Google authentication failed")

        if "error" in auth_result:
            return LoginResponseSerializer(detail=auth_result.get("detail", "Google authentication failed"))

        # Step 2: Get authorization data
        user_id = int(auth_result["user"]["id"])
        roles_data = authz_service.get_user_roles(user_id)

        # Step 3: Combine for response
        auth_result["user"]["roles"] = roles_data

        return LoginResponseSerializer(**auth_result)

    except Exception as e:
        logger.error(f"Google login error: {e}")
        return LoginResponseSerializer(detail="Google login failed")


# ============================================================
# ROLE MANAGEMENT ENDPOINTS (Require authentication)
# ============================================================

@auth_router.get(
    "/roles",
    response=UserRolesPagedResponseSerializer,
    by_alias=True,
    # auth=[PermissionAuth(required_permissions=["VIEW_ROLES"])]
)
def get_roles(request: HttpRequest, filtering: Query[UserRolesFilteringSerializer] = None):
    """Get all roles (paginated)"""
    try:
        return get_paginated_and_non_paginated_data(
            UserRoles, filtering, UserRolesPagedResponseSerializer
        )
    except Exception as e:
        logger.error(f"Error fetching roles: {e}")
        return UserRolesPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e)),
        )


@auth_router.api_operation(
    ["POST", "PUT"],
    "/create_role",
    response=UserRolesNonPagedResponseSerializer,
    auth=[PermissionAuth(required_permissions=["MANAGE_ROLES"])]
)
def create_or_update_roles(request: HttpRequest, input: UserRolesInputSerializer):
    """Create or update a role"""
    try:
        if request.method == "PUT":
            if input.unique_id is None:
                return UserRolesNonPagedResponseSerializer(
                    response=ResponseObject.get_response(0, "unique_id is required for PUT request")
                )

            user_role, _ = UserRoles.objects.update_or_create(
                unique_id=input.unique_id,
                defaults={"name": input.name, "description": input.description},
            )

            if input.permissions:
                # Remove old permissions
                UserRolesWithPermissions.objects.filter(
                    role_with_permission_role=user_role
                ).delete()

                # Add new permissions
                for permission_id in input.permissions:
                    permission = UserPermissions.objects.filter(unique_id=permission_id).first()
                    if permission:
                        UserRolesWithPermissions.objects.create(
                            role_with_permission_role=user_role,
                            role_with_permission_permission=permission,
                        )

        elif request.method == "POST":
            user_role, _ = UserRoles.objects.get_or_create(
                name=input.name,
                defaults={"description": input.description}
            )

        return UserRolesNonPagedResponseSerializer(
            response=ResponseObject.get_response(1),
            data=user_role
        )

    except Exception as e:
        logger.error(f"Error creating/updating role: {e}")
        return UserRolesNonPagedResponseSerializer(
            response=ResponseObject.get_response(0, message=str(e))
        )


@auth_router.delete(
    "/delete_role",
    response=ResponseSerializer,
    auth=[PermissionAuth(required_permissions=["MANAGE_ROLES"])]
)
def delete_role(request: HttpRequest, input: BaseInputSerializer):
    """Soft delete a role"""
    try:
        if not input.unique_id:
            return ResponseObject.get_response(0, "unique_id is required")

        role = UserRoles.objects.filter(unique_id=input.unique_id).first()

        if not role:
            return ResponseObject.get_response(0, "Role not found")

        if role.is_seeded:
            return ResponseObject.get_response(0, "Cannot delete seeded roles")

        role.is_active = False
        role.save()

        return ResponseObject.get_response(1, "Role deleted successfully")

    except Exception as e:
        logger.error(f"Error deleting role: {e}")
        return ResponseObject.get_response(0, message=str(e))


@auth_router.get(
    "/grouped_permissions",
    response=GroupedPermissionsResponseSerializer,
    auth=[PermissionAuth(required_permissions=["VIEW_PERMISSIONS"])]
)
def get_grouped_permissions(
    request: HttpRequest,
    filtering: Query[GroupedPermissionFilteringSerializer] = None
):
    """Get all permissions grouped by category"""
    try:
        return get_paginated_and_non_paginated_data(
            UserPermissionsGroup,
            filtering,
            GroupedPermissionsResponseSerializer,
            is_paged=False,
        )
    except Exception as e:
        logger.error(f"Error fetching permissions: {e}")
        return GroupedPermissionsResponseSerializer(
            response=ResponseObject.get_response(0, message=str(e))
        )


# # ============================================================
# # TEST ENDPOINT - Demonstrates layer separation
# # ============================================================

# @auth_router.get(
#     "/me",
#     auth=[PermissionAuth()]
# )
# def get_current_user(request: HttpRequest):
#     """
#     Get current authenticated user's information.

#     This endpoint demonstrates the layer separation:
#     - Authentication layer: validates token (done by PermissionAuth)
#     - Authorization layer: gets user's roles and permissions
#     - API layer: combines and returns the data
#     """
#     try:
#         authz_service = AuthorizationService()

#         # User is already authenticated by PermissionAuth
#         user = request.user

#         # Get authorization data from authorization layer
#         roles_data = authz_service.get_user_roles(user.id)
#         permissions = authz_service.get_user_permissions(user.id)

#         return {
#             "user": {
#                 "id": str(user.id),
#                 "userName": user.username,
#                 "email": user.email,
#                 "firstName": user.first_name,
#                 "lastName": user.last_name,
#             },
#             "roles": roles_data,
#             "permissions": permissions,
#         }

#     except Exception as e:
#         logger.error(f"Error fetching current user: {e}")
#         return {"error": str(e)}