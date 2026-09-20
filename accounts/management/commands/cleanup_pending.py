from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import PendingSignup


class Command(BaseCommand):
    help = 'Delete pending signups older than the given threshold'

    def add_arguments(self, parser):
        parser.add_argument(
            '--minutes',
            type=int,
            default=60,
            help='Delete pending signups older than this many minutes (default: 60).',
        )

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(minutes=options['minutes'])
        stale = PendingSignup.objects.filter(created_at__lt=cutoff)
        count = stale.count()
        if count:
            stale.delete()
        self.stdout.write(
            self.style.SUCCESS(f'Deleted {count} stale pending signup(s).')
        )