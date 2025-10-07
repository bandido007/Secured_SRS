import re
from ninja import Router
from django.http import HttpRequest
from django.db.models import Q, Count, Sum, F
from django.conf import settings
import logging

from dotenv import dotenv_values

from srs_accounts.models import *
from srs_accounts.serializers import *
from srs_uaa.models import *
from srs_uaa.serializers import *
from srs_uaa.authorization import PermissionAuth
from srs_uaa.authentication.user_management import UserManagementService
from srs_utils.email import EmailNotifications
from srs_utils.tokens import get_forgot_password_token
from srs_utils.response import (
    ResponseObject,
    get_paginated_and_non_paginated_data,
)

from ninja import Query

config = dotenv_values(".env")

logger = logging.getLogger("srs_logger")

accounts_router = Router()


@accounts_router.get(
    "/user_profiles",
    response=UserAccountPagedResponseSerializer,
    auth=[PermissionAuth()],
)
def get_user_profiles(
    request: HttpRequest, filtering: Query[UserAccountsFilteringObject] = None
):

    try:

        return get_paginated_and_non_paginated_data(
            UserProfile, filtering, UserAccountPagedResponseSerializer
        )
    except Exception as e:
        logger.error(f"error occurred {e}")
        return UserAccountPagedResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e)),
        )


@accounts_router.api_operation(
    ["POST", "PUT"],
    "/create_update_user_profile",
    response=UserAccountResponseSerializer,
    # auth=[PermissionAuth()],
)
def create_user_profile(request: HttpRequest, input: UserAcountInputSerializer):
    try:

        if request.method == "PUT":
            if input.unique_id is None:
                return UserAccountResponseSerializer(
                    response=ResponseObject.get_response(3)
                )

            user_profile = UserProfile.objects.filter(unique_id=input.unique_id).first()

            if not user_profile:
                return UserAccountResponseSerializer(
                    response=ResponseObject.get_response(3, "user profile Not Found")
                )

            user = user_profile.profile_user

            user.first_name = input.first_name if input.first_name else user.first_name
            user.last_name = input.last_name if input.last_name else user.last_name
            user.save()

            user_profile.account_type = (
                input.account_type if input.account_type else user_profile.account_type
            )
            user_profile.photo = input.photo if input.photo else user_profile.photo
            user_profile.save()

            if input.role is not None:
                UsersWithRoles.objects.filter(user_with_role_user=user).delete()

                role = UserRoles.objects.filter(unique_id=input.role).first()

                if role is not None:
                    UsersWithRoles.objects.create(
                        user_with_role_user=user,
                        user_with_role_role=role,
                    )

        if request.method == "POST":

            email = input.email.replace(" ", "")

            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                return UserAccountResponseSerializer(
                    response=ResponseObject.get_response(
                        2,
                        message=f"a user with email {email} Account Exists",
                    ),
                )

            if (
                input.first_name
                or input.last_name
                or input.account_type
                or input.username
                or input.email is None
            ):
                return UserAccountResponseSerializer(
                    response=ResponseObject.get_response(
                        2,
                        message="Pass All required Arguments",
                    ),
                )

            user = User.objects.create(username=input.username, email=input.email)

            user_profile = UserProfile.objects.create(
                first_name=input.first_name,
                last_name=input.last_name,
                account_type=input.account_type,
            )

            activate_account = ActivateAccountTokenUser.objects.create(
                token_user=user, token_token=get_forgot_password_token()
            )

            # send mail
            url = (
                config["FRONTEND_DOMAIN"]
                + f"password-set/{activate_account.token_token}"
            )

            template = "email/verify_account.html"

            body = {
                "receiver_details": user.email,
                "user": user,
                "url": url,
                "subject": "Activate ",
            }

            EmailNotifications.send_email_notification(body, template, user=user)

        return UserAccountResponseSerializer(
            data=user_profile, response=ResponseObject.get_response(1)
        )
    except Exception as e:
        logger.error(f"error occurred {e}")
        return UserAccountResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e)),
        )


@accounts_router.post(
    "/update_my_profile",
    response=UserAccountResponseSerializer,
    auth=[PermissionAuth()],
)
def update_my_profile(request: HttpRequest, input: UserAcountInputSerializer):

    try:

        user_profile = UserProfile.objects.filter(unique_id=input.unique_id).first()

        if not user_profile:
            return UserAccountResponseSerializer(
                response=ResponseObject.get_response(3, "user profile Not Found")
            )

        user = user_profile.profile_user

        user.first_name = input.first_name if input.first_name else user.first_name
        user.last_name = input.last_name if input.last_name else user.last_name
        user.save()

        user_profile.account_type = (
            input.account_type if input.account_type else user_profile.account_type
        )
        user_profile.photo = input.photo if input.photo else user_profile.photo
        user_profile.save()

        return UserAccountResponseSerializer(
            data=user_profile, response=ResponseObject.get_response(1)
        )

    except Exception as e:
        logger.error(f"error occurred {e}")
        return UserAccountResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e)),
        )


@accounts_router.get(
    "/get_my_profile", response=UserAccountResponseSerializer, auth=[PermissionAuth()]
)
def get_my_profile(request: HttpRequest):

    try:

        user_profile = UserProfile.objects.filter(profile_user=request.user).first()

        return UserAccountResponseSerializer(
            data=user_profile, response=ResponseObject.get_response(1)
        )

    except Exception as e:
        logger.error(f"error occurred {e}")
        return UserAccountResponseSerializer(
            response=ResponseObject.get_response(2, message=str(e)),
        )


@accounts_router.post("/forgot_pass_token", response=ResponseSerializer)
def request_forgot_pass_token(request: HttpRequest, input: ForgotPasswordSerializer):

    try:

        user = User.objects.filter(email=input.email).first()

        if not user:
            return ResponseObject.get_response(
                1, "if this account is valid An Email will Be Sent To you"
            )

        password_token = ForgotPasswordRequestUser.objects.create(
            request_user=user, request_token=get_forgot_password_token()
        )

        template = "email/forgot_password.html"

        url = config["FRONTEND_DOMAIN"] + f"password-set/{password_token.request_token}"

        body = {
            "receiver_details": user.email,
            "user": user,
            "url": url,
            "subject": "Activate ",
        }

        EmailNotifications.send_email_notification(body, template, user=user)

        return ResponseObject.get_response(
            1, "if this account is valid An Email will Be Sent To you"
        )

    except Exception as e:
        logger.error(f"error occurred {e}")
        return ResponseObject.get_response(2, message=str(e))


@accounts_router.post("/forgot_pass", response=ResponseSerializer)
def forgot_pass(
    request: HttpRequest,
    input: ForgotPasswordChangeSerializer,
):
    try:

        password_token = ForgotPasswordRequestUser.objects.filter(
            request_token=input.token
        ).first()

        if not password_token:
            return ResponseObject.get_response(2, "invalid Token")

        if password_token.request_is_used:
            return ResponseObject.get_response(
                2, "Token Expired Request Another Token Or has Been Used"
            )

        user = password_token.request_user

        # TODO make sure the password is strong

        user.set_password(input.new_password)
        user.save()

        password_token.request_is_used = True
        password_token.save()

        return ResponseObject.get_response(1)

    except Exception as e:
        logger.error(f"error occurred {e}")
        return ResponseObject.get_response(2, message=str(e))


@accounts_router.post("/register", response=ResponseSerializer)
def register_account(request: HttpRequest, input: RegisterSerializer):

    try:

        # check if user exist

        existing_user_name = User.objects.filter(
            username=input.username.replace(" ", "")
        ).first()
        if existing_user_name:
            return ResponseObject.get_response(
                2, "A user with this Username Already Exits"
            )

        existing_email = User.objects.filter(email=input.email.replace(" ", "")).first()
        if existing_email:
            return ResponseObject.get_response(
                2, "A user with this Email Already Exits"
            )

        # check the password:
        if input.password != input.confirm_password:
            return ResponseObject.get_response(2, "Passwords Dont Match")

        # validate email and user name
        username_pattern = re.compile("[a-z][a-z0-9_]+$")
        email_pattern = re.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$")
        USERNAME_INVALID_MESSAGE = """ 
                Usernames must be between 2 and 30 characters in length
                and may only consist of lowercase letters, numbers, 
                and underscores, where the first character must be a letter.
            """
        EMAIL_INVALID_MESSAGE = " invalid Email "

        if not username_pattern.match(input.username):
            return ResponseObject.get_response(2, USERNAME_INVALID_MESSAGE)

        if not email_pattern.match(input.email):
            return ResponseObject.get_response(2, EMAIL_INVALID_MESSAGE)

        # TODO check for strong pass

        # Use UserManagementService for proper separation of concerns
        user_mgmt = UserManagementService()
        user = user_mgmt.create_user(
            username=input.username,
            email=input.email,
            password=input.password,
            first_name="",
            last_name=""
        )

        if not user:
            return ResponseObject.get_response(2, "Failed to create user account")

        activate_account = ActivateAccountTokenUser.objects.create(
            token_user=user, token_token=get_forgot_password_token()
        )

        # send mail
        url = (
            config["FRONTEND_DOMAIN"]
            + f"auth/verify-account?token={activate_account.token_token}"
        )

        template = "email/verify_account.html"

        body = {
            "receiver_details": user.email,
            "user": user,
            "url": url,
            "subject": "Activate ",
        }

        EmailNotifications.send_email_notification(body, template, user=user)

        return ResponseObject.get_response(1, "Registration Was Successfully")

    except Exception as e:
        logger.error(f"error occurred {e}")
        return ResponseObject.get_response(2, message=str(e))


@accounts_router.post("/verify_account", response=ResponseSerializer)
def verify_account(request: HttpRequest, input: VerifyAccountSerializer):

    try:

        if not input:
            return ResponseObject.get_response(2, message="input is Required")

        if not input.token:
            return ResponseObject.get_response(2, message="token Not Found")

        activate_token = ActivateAccountTokenUser.objects.filter(
            token_token=input.token
        ).first()

        if not activate_token:
            return ResponseObject.get_response(2, message="Invalid Token")

        user_profile = UserProfile.objects.filter(
            profile_user=activate_token.token_user
        ).first()

        if user_profile.has_been_verified:
            return ResponseObject.get_response(1, message="Account Already Verified")

        user_profile.has_been_verified = True
        user_profile.save()

        return ResponseObject.get_response(
            1, message="Account verified Successfully You can now Login "
        )

    except Exception as e:
        logger.error(f"error occurred {e}")
        return ResponseObject.get_response(2, message=str(e))


@accounts_router.post(
    "/change_password", response=ResponseSerializer, auth=[PermissionAuth()]
)
def change_password(request: HttpRequest, input: ChangePasswordSerializer):
    try:
        user = request.user

        if not user.check_password(input.old_password):
            return ResponseObject.get_response(2, "Old Password is Incorrect")

        if input.new_password != input.confirm_new_password:
            return ResponseObject.get_response(2, "Passwords Dont Match")

        user.set_password(input.new_password)
        user.save()

        return ResponseObject.get_response(1)

    except Exception as e:
        logger.error(f"error occurred {e}")
        return ResponseObject.get_response(2, message=str(e))


# @accounts_router.get("/tokes_status")
# def get_tokenfeature(request: HttpRequest):
#     try:

#         logger.info("successfully fetched token features")

#         return {
#             "valid": True,
#             "status": "active",
#             "error-details": None,
#             "features": [
#                 "advanced-config",
#                 "advanced-permissions",
#                 "audit-app",
#                 "cache-granular-controls",
#                 "collection-cleanup",
#                 "config-text-file",
#                 "content-management",
#                 "content-verification",
#                 "dashboard-subscription-filters",
#                 "database-auth-providers",
#                 "disable-password-login",
#                 "email-allow-list",
#                 "email-restrict-recipients",
#                 "embedding-sdk",
#                 "embedding",
#                 "hosting",
#                 "metabase-store-managed",
#                 "metabot-v3",
#                 "no-upsell",
#                 "official-collections",
#                 "query-reference-validation",
#                 "question-error-logs",
#                 "sandboxes",
#                 "scim",
#                 "serialization",
#                 "session-timeout-config",
#                 "snippet-collections",
#                 "sso-google",
#                 "sso-jwt",
#                 "sso-ldap",
#                 "sso-saml",
#                 "sso",
#                 "upload-management",
#                 "whitelabel",
#             ],
#             "plan-alias": "pro-self-hosted",
#             "trial": False,
#             "valid-thru": "2099-12-31T12:00:00",
#             "max-users": 100,
#             "company": "ega",
#         }

#     except Exception as e:
#         logger.error(f"error occurred {e}")
#         return {
#             "valid": False,
#             "status": "error",
#             "error-details": str(e),
#             "features": None,
#             "plan-alias": None,
#             "trial": None,
#             "valid-thru": None,
#             "max-users": None,
#             "company": None,
#         }
