"""secured_SRS URL Configuration"""
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from srs_utils.CreateUserAddSeedPermissions import CreateRolesAddPermissions

from .srs_api_v1 import api_v1

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)


# set by_alias = True to enable camel case based endpoints
def set_all_by_alias(api: NinjaAPI):
    for _pth, router in api._routers:
        for view in router.path_operations.values():
            for op in view.operations:
                op.by_alias = True


set_all_by_alias(api_v1)

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),
    path("token/access", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    
    path("api/", api_v1.urls, name="api_v1"),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

CreateRolesAddPermissions() 

# Seed roles and permissions AFTER server starts (not during migrations)
# Run this manually: python manage.py seed_permissions