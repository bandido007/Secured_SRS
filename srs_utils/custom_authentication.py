from typing import Any, Dict, Optional
import jwt
from rest_framework_simplejwt.serializers import (
    TokenRefreshSerializer,
    TokenVerifySerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.contrib.auth.models import update_last_login, User

from rest_framework import serializers
import logging

from srs_accounts.models import UserProfile
from srs_uaa.models import UsersWithRoles
from srs_utils.encryption import AESCipher
from rest_framework_simplejwt.tokens import Token
from django.contrib.auth import authenticate, get_user_model
from rest_framework import exceptions


encryption = AESCipher(key=settings.SECRET_KEY)

logger = logging.getLogger("srs_logger")


class PasswordField(serializers.CharField):
    def __init__(self, *args, **kwargs) -> None:
        kwargs.setdefault("style", {})

        kwargs["style"]["input_type"] = "password"
        kwargs["write_only"] = True

        super().__init__(*args, **kwargs)


class CustomTokenObtainPairSerializer(serializers.Serializer):

    password = PasswordField()
    username = serializers.CharField(write_only=True)

    token_class: Optional[type[Token]] = RefreshToken

    default_error_messages = {
        "no_active_account": ("No active account found with the given credentials")
    }

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.user = None
        self.username = serializers.CharField(write_only=True)
        self.password = PasswordField()

    @classmethod
    def get_token(cls, user):
        token = cls.token_class.for_user(user)

        user_profile = UserProfile.objects.filter(profile_user=user).first()

        # Add custom claims
        token["userId"] = str(user_profile.id if user_profile else None)
        token["username"] = str(
            user_profile.profile_user.username if user_profile else None
        )

        return token

    def validate(self, attrs: dict[str, Any]) -> dict[Any, Any]:

        if not self.username:
            raise exceptions.AuthenticationFailed(
                "email or username is required",
                403,
            )

        if attrs.get("username", None) is not None:

            username_user = User.objects.filter(
                username=attrs.get("username", " ")
            ).first()
            email_user = User.objects.filter(email=attrs.get("username", " ")).first()

            if not username_user and not email_user:
                raise exceptions.AuthenticationFailed(
                    "No active account found with the given username or email",
                    403,
                )

            self.user = username_user if username_user else email_user

        if not self.user.check_password(attrs["password"]):
            raise exceptions.AuthenticationFailed(
                "No active account found with the given credentials",
                403,
            )

        data = {}

        refresh = self.get_token(self.user)

        user_profile = UserProfile.objects.filter(profile_user=self.user).first()

        if not user_profile.has_been_verified:
            raise exceptions.AuthenticationFailed(
                "Account not verified Please verify First",
                403,
            )

        self.username = user_profile.profile_user.username

        user_roles = UsersWithRoles.objects.filter(user_with_role_user=self.user)

        user_role_with_permission_list = []

        for user_role in user_roles:
            user_role_with_permission_list.append(
                {
                    "roleName": user_role.user_with_role_role.name,
                    "permissions": user_role.user_with_role_role.get_serializable_permissions(),
                }
            )

        refresh_token = encryption.encrypt(str(refresh))
        access_token = encryption.encrypt(str(refresh.access_token))

        data["refresh"] = refresh_token
        data["expires"] = settings.ACCESS_TOKEN_LIFETIME_SECONDS
        data["access"] = access_token
        data["user"] = (
            {
                "id": str(user_profile.id),
                "userName": self.user.username,
                "email": self.user.email,
                "roles": user_role_with_permission_list,
            }
            if user_profile
            else None
        )

        if settings.SIMPLE_JWT["UPDATE_LAST_LOGIN"]:
            update_last_login(None, self.user)

        return data


class CustomRefreshTokenSerializer(TokenRefreshSerializer):
    refresh = serializers.CharField()
    access = serializers.CharField(read_only=True)
    token_class = RefreshToken

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, str]:
        try:
            decrypted_token = encryption.decrypt(attrs["refresh"])

            jwt.decode(
                decrypted_token,
                options={"verify_signature": True, "verify_exp": True},
                algorithms=settings.SIMPLE_JWT["ALGORITHM"],
                key=settings.SIMPLE_JWT["SIGNING_KEY"],
            )

        except Exception as e:
            logger.error(f"{e} Failed To Decrypt The Refresh Token")
            decrypted_token = " "

        refresh = self.token_class(decrypted_token)

        data = {"access": encryption.encrypt(str(refresh.access_token))}

        refresh.set_jti()
        refresh.set_exp()
        refresh.set_iat()

        data["refresh"] = encryption.encrypt(str(refresh))
        data["expires"] = settings.ACCESS_TOKEN_LIFETIME_SECONDS

        return data


class CustomVerifyTokenSerializer(TokenVerifySerializer):
    token = serializers.CharField(write_only=True)

    def validate(self, attrs: Dict[str, None]) -> Dict[Any, Any]:
        try:

            jwt.decode(
                str(encryption.decrypt(str(attrs["token"]))),
                options={"verify_signature": True, "verify_exp": True},
                algorithms=settings.SIMPLE_JWT["ALGORITHM"],
                key=settings.SIMPLE_JWT["SIGNING_KEY"],
            )

            return {"success": True, "detail": "token Is valid"}

        except Exception as e:
            logger.error(f"{e} Failed To Verify Token ")
            return {"success": False, "detail": "token Is valid Invalid"}
