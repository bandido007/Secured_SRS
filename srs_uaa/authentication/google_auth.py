import logging
from django.http import HttpRequest
import jwt
from django.conf import settings
from django.contrib.auth.models import User
from google.oauth2 import id_token
from google.auth.transport import requests
import google.auth

logger = logging.getLogger("srs_logger")


class GoogleAuth:
    """
    Single responsibility: Verify Google OAuth tokens.

    This class ONLY handles Google JWT verification.
    It does NOT create users or assign roles - that's UserManagementService's job.
    """

    def __init__(self, client_id, client_secret, algorithm: str = "RS256"):
        self.client_id = client_id
        self.client_secret = client_secret
        self.algorithm = algorithm

    def verify_and_get_user_info(self, jwt_token: str = None) -> dict:
        """
        Verify Google JWT and return user information.

        Returns dict with user info if valid, None if invalid.
        Does NOT create or modify user accounts.
        """
        try:
            logger.info("Verifying Google OAuth token")

            if jwt_token is None:
                logger.error("Google JWT token is None")
                return None

            # SECURITY: Verify the JWT token properly
            id_info = self.verify_google_jwt(jwt_token)

            if id_info is None:
                logger.error("Google JWT token verification failed")
                return None

            # Return verified user data from Google
            return {
                "email": id_info.get("email"),
                "given_name": id_info.get("given_name", ""),
                "family_name": id_info.get("family_name", ""),
                "verified_email": id_info.get("email_verified", False)
            }

        except Exception as e:
            logger.error(f"Failed to verify Google token: {e}")
            return None

    def verify_google_jwt(self, token: str):
        """
        Verifies a Google JWT ID token.

        Args:
            token: The JWT ID token string.
            client_id: The client ID of your application.

        Returns:
            The decoded token payload if verification is successful, None otherwise.
        """
        try:
            request = requests.Request()
            id_info = id_token.verify_oauth2_token(token, request, self.client_id)

            if id_info["iss"] not in [
                "accounts.google.com",
                "https://accounts.google.com",
            ]:
                return None
            
            return id_info
        except ValueError as e:
            logger.info(f"Error verifying token: {e}")
            return None
