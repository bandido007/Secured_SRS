import json
import logging
from django.conf import settings
from django.http import HttpRequest, JsonResponse
from srs_uaa.authentication.services import AuthenticationService

logger = logging.getLogger("srs_logger")

LOGIN_URL = getattr(settings, 'LOGIN_URL', '/token/access')
ADMIN_SITE_URL = getattr(settings, 'ADMIN_SITE_URL', '/admin/login/')


class LoginAttemptsMiddleware:
    """
    Middleware that enforces rate limiting on login attempts.

    This delegates the actual rate limiting logic to AuthenticationService
    rather than duplicating it. Single responsibility: intercept login
    requests and apply rate limiting.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.auth_service = AuthenticationService()

    def __call__(self, request: HttpRequest):
        # Only check rate limiting for login endpoints
        if str(request.path) in [LOGIN_URL, ADMIN_SITE_URL] and request.method == 'POST':
            logger.info(f"Login attempt for {request.path}")

            try:
                json_data = json.loads(request.body.decode('utf-8'))
                username = json_data.get('username', None)
            except:
                logger.error("Failed to decode JSON from request body")
                username = None

            if username:
                ip_address = request.META.get('REMOTE_ADDR', 'unknown')

                # Delegate to AuthenticationService for rate limiting check
                attempt_check = self.auth_service.check_login_attempts(username, ip_address)

                if not attempt_check["allowed"]:
                    logger.warning(f"Blocked login attempt for {username} from {ip_address}")
                    return JsonResponse({
                        "error": "user_blocked",
                        "code": 403,
                        "detail": attempt_check["message"]
                    }, status=403)

        response = self.get_response(request)
        return response