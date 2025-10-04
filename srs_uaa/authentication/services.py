# srs_uaa/authentication/services.py

import jwt
import logging
from typing import Optional, Dict, Any
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from srs_utils.encryption import AESCipher
from srs_uaa.models import LoginAttempt
from srs_uaa.authentication.google_auth import GoogleAuth
from srs_uaa.authentication.user_management import UserManagementService

logger = logging.getLogger("srs_logger")
encryption = AESCipher(key=settings.SECRET_KEY)


class AuthenticationService:
    """
    Single responsibility: Verify user identity and manage tokens.
    """
    
    def validate_token(self, token: str) -> Optional[int]:
        """
        Verify JWT token and return user_id if valid.
        This is the PRIMARY method - everyone else uses this.
        """
        try:
            decrypted_token = encryption.decrypt(token)
            
            user_data = jwt.decode(
                decrypted_token,
                options={"verify_signature": True, "verify_exp": True},
                algorithms=settings.SIMPLE_JWT["ALGORITHM"],
                key=settings.SIMPLE_JWT["SIGNING_KEY"],
            )
            
            if user_data.get("token_type") != "access":
                return None
            
            return user_data.get("user_id")
            
        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            return None
    
    def get_user_from_token(self, token: str) -> Optional[User]:
        """Convenience method: validate token and return User object."""
        user_id = self.validate_token(token)
        if not user_id:
            return None
        
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    def check_login_attempts(self, username: str, ip_address: str) -> Dict[str, Any]:
        """
        Check if user is blocked due to too many failed attempts.
        Returns: {"allowed": bool, "seconds_remaining": int, "message": str}
        """
        try:
            login_attempt = LoginAttempt.objects.filter(
                username=username,
                ip_address=ip_address
            ).first()
            
            if not login_attempt:
                return {"allowed": True, "seconds_remaining": 0, "message": ""}
            
            max_attempts = getattr(settings, 'MAX_ATTEMPTS_FAILURE', 30)
            max_time_blocked = getattr(settings, 'MAX_TIME_BLOCKED', 30)
            
            if login_attempt.attempts >= max_attempts:
                from django.utils import timezone
                unblock_time = login_attempt.first_attempt_time + timezone.timedelta(seconds=max_time_blocked)
                
                if timezone.now() >= unblock_time:
                    # Reset attempts
                    login_attempt.attempts = 0
                    login_attempt.save()
                    return {"allowed": True, "seconds_remaining": 0, "message": ""}
                else:
                    seconds_remaining = (unblock_time - timezone.now()).seconds
                    return {
                        "allowed": False,
                        "seconds_remaining": seconds_remaining,
                        "message": f"User is blocked. Try again in {seconds_remaining} seconds"
                    }
            
            return {"allowed": True, "seconds_remaining": 0, "message": ""}
            
        except Exception as e:
            logger.error(f"Error checking login attempts: {e}")
            return {"allowed": True, "seconds_remaining": 0, "message": ""}
    
    def authenticate_with_credentials(self, username: str, password: str, ip_address: str = None) -> Optional[Dict[str, Any]]:
        """
        Authenticate user with username/password.
        Returns token data if successful, None if failed.

        NOTE: This layer ONLY handles identity verification.
        It does NOT return roles/permissions - that's authorization layer's job.
        """
        try:
            # Check if user is blocked
            if ip_address:
                attempt_check = self.check_login_attempts(username, ip_address)
                if not attempt_check["allowed"]:
                    return {
                        "error": "user_blocked",
                        "detail": attempt_check["message"]
                    }

            # Try to find user by username or email
            user = User.objects.filter(username=username).first()
            if not user:
                user = User.objects.filter(email=username).first()

            if not user or not user.check_password(password):
                return None

            # Generate tokens
            refresh = RefreshToken.for_user(user)

            # Return ONLY authentication data - no roles/permissions
            return {
                "refresh": encryption.encrypt(str(refresh)),
                "access": encryption.encrypt(str(refresh.access_token)),
                "expires": getattr(settings, 'ACCESS_TOKEN_LIFETIME_SECONDS', 3600),
                "user": {
                    "id": str(user.id),
                    "userName": user.username,
                    "email": user.email
                }
            }

        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return None
    
    def authenticate_with_google(self, jwt_token: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user with Google OAuth token.

        This orchestrates three separate concerns:
        1. Verify Google token (GoogleAuth)
        2. Create/update user account if needed (UserManagementService)
        3. Generate our own authentication tokens (this service)
        """
        try:
            # Step 1: Verify the Google token
            google_auth = GoogleAuth(
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
            )

            user_info = google_auth.verify_and_get_user_info(jwt_token=jwt_token)
            if not user_info:
                logger.error("Google token verification failed")
                return None

            # Step 2: Create or update the user account
            user_mgmt = UserManagementService()
            user = user_mgmt.create_or_update_user_from_google(
                email=user_info["email"],
                given_name=user_info.get("given_name", ""),
                family_name=user_info.get("family_name", "")
            )

            if not user:
                logger.error("Failed to create/update user account")
                return None

            # Step 3: Generate our authentication tokens
            refresh = RefreshToken.for_user(user)

            return {
                "refresh": encryption.encrypt(str(refresh)),
                "access": encryption.encrypt(str(refresh.access_token)),
                "expires": getattr(settings, 'ACCESS_TOKEN_LIFETIME_SECONDS', 3600),
                "user": {
                    "id": str(user.id),
                    "userName": user.username,
                    "email": user.email
                }
            }

        except Exception as e:
            logger.error(f"Google authentication failed: {e}")
            return None