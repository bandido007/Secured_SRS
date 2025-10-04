# srs_utils/management/commands/seed_permissions.py

from django.core.management.base import BaseCommand
from srs_utils.CreateUserAddSeedPermissions import CreateRolesAddPermissions


class Command(BaseCommand):
    help = 'Seeds roles, permissions, and creates admin user'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting seeding process...'))

        try:
            CreateRolesAddPermissions()
            self.stdout.write(self.style.SUCCESS('✅ Successfully seeded roles and permissions!'))
            self.stdout.write(self.style.SUCCESS('   Admin user created: admin / admin123'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Seeding failed: {e}'))
            raise
