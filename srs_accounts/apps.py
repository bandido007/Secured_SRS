# srs_accounts/apps.py

from django.apps import AppConfig


class SrsAccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'srs_accounts'
    verbose_name = 'User Accounts'
