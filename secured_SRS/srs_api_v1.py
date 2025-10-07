from ninja import NinjaAPI
from django.conf import settings
from scalar_django_ninja import ScalarViewer

from srs_accounts.views import accounts_router
from srs_uaa.views import auth_router
from srs_domain.views import domain_router


api_title = "Secured SRS API"
version = "1.0.0"
description="Student Record System with layered architecture",


api_v1 = NinjaAPI()
api_v1.docs_url="docs"
api_v1.docs=ScalarViewer()

api_v1.title=api_title
api_v1.version=version

api_v1.add_router("/accounts/", accounts_router)
api_v1.add_router("/auth/", auth_router)
api_v1.add_router("/domain/", domain_router)

