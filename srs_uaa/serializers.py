# srs_uaa/serializers.py

from typing import List, Any, Optional
from srs_utils.SharedSerializer import *


class UserPermissionSerializer(BaseSerializer):
    name: str
    code: str


class UserRolesSerializer(BaseSerializer):
    name: str
    description: str
    permissions: List[UserPermissionSerializer] | None = []


class UserRolesInputSerializer(BaseInputSerializer):
    name: str
    description: str = ""
    permissions: List[str] | None = None  # Changed from = None to | None = None for clarity


class UserRolesFilteringSerializer(BasePagedFilteringSerializer):
    pass


class UserRolesPagedResponseSerializer(BasePagedResponseList):
    data: List[UserRolesSerializer] | None = None


class UserRolesNonPagedResponseSerializer(BaseNonPagedResponseData):  # Renamed to avoid duplicate
    data: UserRolesSerializer | None = None


class GroupedPermissionsSerializer(BaseSerializer):
    name: str
    is_global: bool
    permissions: List[UserPermissionSerializer] | None = None


class GroupedPermissionsResponseSerializer(BaseNonPagedResponseData):
    data: List[GroupedPermissionsSerializer] | None = None


class GroupedPermissionFilteringSerializer(BaseNonPagedFilteringSerializer):
    is_global: bool | None = None


# Login/Auth related serializers
class UserRoleInfoSerializer(BaseSchema):
    """Information about a single role with its permissions"""
    role_name: str
    permissions: List[str] | None = None


class UserLoginResponseSerializer(BaseSchema):
    """User information returned after successful login"""
    id: str
    userName: str
    email: str
    roles: List[UserRoleInfoSerializer] | None = None


class LoginResponseSerializer(BaseSchema):
    """Response for login endpoints"""
    refresh: str | None = None
    access: str | None = None
    expires: int | None = None
    user: UserLoginResponseSerializer | None = None
    detail: str | None = None  # For error messages


class LoginInputSerializer(BaseSchema):
    """Input for standard username/password login"""
    username: str
    password: str


class LoginWithGoogleInputSerializer(BaseSchema):
    """Input for Google OAuth login"""
    jwt_token: str