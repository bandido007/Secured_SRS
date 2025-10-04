# srs_uaa/authorization/__init__.py

"""
Authorization Layer

This layer determines what authenticated users are allowed to do.
It knows about roles, permissions, and resource ownership rules.
It does NOT know about how to verify identity (that's authentication).
"""

from .auth_permission import PermissionAuth
from .services import AuthorizationService

__all__ = [
    'PermissionAuth',
    'AuthorizationService',
]
