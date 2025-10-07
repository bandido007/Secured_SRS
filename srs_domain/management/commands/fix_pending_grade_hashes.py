# srs_domain/management/commands/fix_pending_grade_hashes.py

from django.core.management.base import BaseCommand
from srs_domain.models import CourseResults
from srs_domain.services.mocks.mock_crypto import MockCryptographyService
from srs_domain.services.mocks.mock_blockchain import MockBlockchainService


class Command(BaseCommand):
    help = 'Regenerate blockchain hashes for all PENDING grades to fix verification issues'

    def handle(self, *args, **options):
        crypto = MockCryptographyService()
        blockchain = MockBlockchainService()

        pending_grades = CourseResults.objects.filter(status='PENDING', is_active=True)
        count = pending_grades.count()

        self.stdout.write(f'Found {count} PENDING grades to fix...\n')

        for grade in pending_grades:
            # Recompute hash with correct timestamp format
            grade_data = {
                "student_id": grade.enrollment.student.student_id,
                "course_code": grade.enrollment.course.course_code,
                "semester": grade.enrollment.semester,
                "academic_year": grade.enrollment.academic_year,
                "grade": str(grade.numeric_grade or grade.letter_grade),
                "submitted_at": str(grade.submitted_at)
            }

            new_hash = crypto.compute_hash(grade_data)
            old_hash = grade.blockchain_hash

            # Update the grade's hash
            grade.blockchain_hash = new_hash
            grade.save(update_fields=['blockchain_hash'])

            # Update blockchain transaction
            if grade.blockchain_transaction_id:
                blockchain.store_transaction(
                    record_hash=new_hash,
                    metadata={
                        "grade_id": grade.id,
                        "student": grade.enrollment.student.student_id,
                        "course": grade.enrollment.course.course_code
                    }
                )

            self.stdout.write(
                f'Fixed Grade {grade.pk}: '
                f'{grade.enrollment.student.student_id} - {grade.enrollment.course.course_code}\n'
                f'  Old hash: {old_hash[:16]}...\n'
                f'  New hash: {new_hash[:16]}...\n'
            )

        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully fixed {count} grades!'))
