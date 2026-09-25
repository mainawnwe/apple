from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from notes.models import Note
from tasks.models import Task


class Command(BaseCommand):
    help = 'Send email reminders for due Notes and Tasks'

    def add_arguments(self, parser):
        parser.add_argument(
            '--window-minutes',
            type=int,
            default=10,
            help='Send reminders due within the last N minutes (default: 10)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print what would be sent, but do not send or update DB',
        )
        parser.add_argument(
            '--loop',
            action='store_true',
            help='Run continuously, checking every N seconds',
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=60,
            help='Seconds between checks in --loop mode (default: 60)',
        )

    # ---------- Entry point ----------
    def handle(self, *args, **options):
        if options.get('loop'):
            import time
            interval = options['interval']
            self.stdout.write(self.style.SUCCESS(
                f'Loop mode: checking every {interval}s. Ctrl+C to stop.'
            ))
            try:
                while True:
                    self._run_once(options)
                    time.sleep(interval)
            except KeyboardInterrupt:
                self.stdout.write('\nStopped.')
            return

        self._run_once(options)

    # ---------- The actual work ----------
    def _run_once(self, options):
        window = options['window_minutes']
        dry_run = options['dry_run']

        now = timezone.now()
        cutoff = now - timedelta(minutes=window)

        due_notes = Note.objects.filter(
            reminder_datetime__isnull=False,
            reminder_datetime__lte=now,
            reminder_datetime__gte=cutoff,
            reminder_sent=False,
            user__isnull=False,
        ).select_related('user')

        due_tasks = Task.objects.filter(
            reminder_datetime__isnull=False,
            reminder_datetime__lte=now,
            reminder_datetime__gte=cutoff,
            reminder_sent=False,
            completed=False,
            user__isnull=False,
        ).select_related('user')

        sent_count = 0

        for note in due_notes:
            if self._send_note_reminder(note, dry_run):
                sent_count += 1
                if not dry_run:
                    note.reminder_sent = True
                    note.save(update_fields=['reminder_sent'])

        for task in due_tasks:
            if self._send_task_reminder(task, dry_run):
                sent_count += 1
                if not dry_run:
                    task.reminder_sent = True
                    task.save(update_fields=['reminder_sent'])

        prefix = '[DRY RUN] ' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(
            f'{prefix}Processed {sent_count} reminder(s). '
            f'Notes: {due_notes.count()}, Tasks: {due_tasks.count()}.'
        ))

    # ---------- Common email headers (avoid spam) ----------
    def _spam_safe_headers(self, item_type, item_id):
        return {
            'X-Entity-Ref-ID': f'{item_type}-{item_id}-{timezone.now().timestamp()}',
            'List-Unsubscribe': f'<mailto:{settings.DEFAULT_FROM_EMAIL}?subject=unsubscribe>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'Precedence': 'bulk',
            'Auto-Submitted': 'auto-generated',
        }

    # ---------- Email helpers ----------
    def _send_note_reminder(self, note, dry_run):
        if not note.user.email:
            self.stdout.write(self.style.WARNING(
                f'Note {note.id}: user has no email — skipped.'
            ))
            return False

        subject = f'⏰ Reminder: {note.title or "Your note"}'
        html = render_to_string('emails/reminder.html', {
            'item_type': 'note',
            'title': note.title or 'Untitled note',
            'content': note.content,
            'priority': note.priority,
            'tags': note.tags,
            'reminder_datetime': note.reminder_datetime,
            'username': note.user.username,
        })

        text_body = (
            f'Hi {note.user.username},\n\n'
            f'You have a reminder:\n\n'
            f'{note.title or "Untitled"}\n'
            f'{note.content or ""}\n\n'
            f'View: https://konaingkyaw.pythonanywhere.com'
        )

        if dry_run:
            self.stdout.write(f'[DRY RUN] Would email {note.user.email}: {subject}')
            return True

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[note.user.email],
                headers=self._spam_safe_headers('note', note.id),
            )
            msg.attach_alternative(html, 'text/html')
            msg.send(fail_silently=False)
            self.stdout.write(self.style.SUCCESS(
                f'✓ Note reminder sent to {note.user.email}: {note.title}'
            ))
            return True
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'✗ Note {note.id} failed: {e}'
            ))
            return False

    def _send_task_reminder(self, task, dry_run):
        if not task.user.email:
            self.stdout.write(self.style.WARNING(
                f'Task {task.id}: user has no email — skipped.'
            ))
            return False

        subject = f'⏰ Task due: {task.title}'
        html = render_to_string('emails/reminder.html', {
            'item_type': 'task',
            'title': task.title,
            'content': task.description,
            'priority': task.priority,
            'tags': task.tags,
            'due_date': task.due_date,
            'reminder_datetime': task.reminder_datetime,
            'username': task.user.username,
        })

        text_body = (
            f'Hi {task.user.username},\n\n'
            f'Task due:\n\n'
            f'{task.title}\n'
            f'{task.description or ""}\n\n'
            f'View: https://konaingkyaw.pythonanywhere.com/tasks'
        )

        if dry_run:
            self.stdout.write(f'[DRY RUN] Would email {task.user.email}: {subject}')
            return True

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[task.user.email],
                headers=self._spam_safe_headers('task', task.id),
            )
            msg.attach_alternative(html, 'text/html')
            msg.send(fail_silently=False)
            self.stdout.write(self.style.SUCCESS(
                f'✓ Task reminder sent to {task.user.email}: {task.title}'
            ))
            return True
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'✗ Task {task.id} failed: {e}'
            ))
            return False