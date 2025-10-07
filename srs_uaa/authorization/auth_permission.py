# srs_uaa/authorization/decorators.py

import logging
from typing import List, Optional
from ninja.security import HttpBearer
from django.http import HttpRequest
from django.contrib.auth.models import User

from srs_uaa.authentication.services import AuthenticationService
from srs_uaa.authorization.services import AuthorizationService

logger = logging.getLogger("srs_logger")


class PermissionAuth(HttpBearer):
    """Django Ninja auth handler - clean and self-contained."""
    
    def __init__(self, required_permissions: List[str] = None):
        super().__init__()
        self.required_permissions = required_permissions or []
        self.auth_service = AuthenticationService()
        self.authz_service = AuthorizationService()
    
    def authenticate(self, request: HttpRequest, token: str) -> Optional[User]:
        """Validate token and check permissions."""
        try:
            # Step 1: Who are you?
            
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            user_id = self.auth_service.validate_token(token)
            if not user_id:
                return None
            
            # Step 2: What can you do?
            if self.required_permissions:
                if not self.authz_service.has_all_permissions(user_id, self.required_permissions):
                    logger.warning(f"User {user_id} lacks permissions: {self.required_permissions}")
                    return None
            
            # Step 3: Attach user to request
            user = User.objects.get(id=user_id)
            request.user = user
            return user
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return None