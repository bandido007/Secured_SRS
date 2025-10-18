from typing import Any, List, Literal, Optional
from srs_uaa.serializers import UserRolesSerializer
from srs_utils.SharedSerializer import *
from datetime import date
from pydantic import BaseModel


class UserAcountInputSerializer(BaseInputSerializer):
    first_name: str | None = None
    last_name: str | None = None
    username: str = None
    email: str = None
    password: str = None
    confirm_password: str = None
    account_type: str
    photo: str | None = None
    role: str | None = None


class UserAcountSerializer(BaseSerializer):
    first_name: str | None
    last_name: str | None
    username: str
    email: str
    account_type: str
    photo: str
    has_been_verified: bool
    role: UserRolesSerializer | None = None
    has_analysis: bool


class UserAccountsFilteringObject(BasePagedFilteringSerializer):
    has_been_verified: bool | None = None


class UserAccountPagedResponseSerializer(BasePagedResponseList):
    data: List[UserAcountSerializer] | None = None


class UserAccountResponseSerializer(BaseNonPagedResponseData):
    data: UserAcountSerializer | None = None


class ForgotPasswordSerializer(BaseSchema):
    email: str


class ForgotPasswordChangeSerializer(BaseSchema):
    token: str
    new_password: str
    confirm_new_password: str


class RegisterSerializer(BaseSchema):
    username: str
    email: str
    password: str
    confirm_password: str


class VerifyAccountSerializer(BaseSchema):
    token: str

class ChangePasswordSerializer(BaseSchema):
    old_password: str
    new_password: str
    confirm_new_password: str


class AdminProvisionStudentInput(BaseSchema):
    student_id: str
    program: str
    year_of_study: int
    enrollment_date: date
    enrollment_status: str = "ACTIVE"
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None


class AdminProvisionLecturerInput(BaseSchema):
    lecturer_id: str
    department: str
    specialization: Optional[str] = None


class AdminProvisionUserInput(BaseSchema):
    username: str
    email: str
    password: str
    role: Literal["ADMIN", "STUDENT", "LECTURER"]
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    student_profile: Optional[AdminProvisionStudentInput] = None
    lecturer_profile: Optional[AdminProvisionLecturerInput] = None


class ProvisionedUserResponseSerializer(BaseNonPagedResponseData):
    data: Optional[Any] = None


class TokenStatus(BaseModel):
    valid: bool
    status: str
    error_details: Optional[str] = None
    features: Optional[List[str]] = None
    plan_alias: Optional[str] = None
    trial: Optional[bool] = None
    valid_thru: Optional[str] = None
    max_users: Optional[int] = None
    company: Optional[str] = None

