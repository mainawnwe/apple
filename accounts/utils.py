import random
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone


def generate_code():
    """Return a 6-digit zero-padded string."""
    return f"{random.randint(0, 999999):06d}"


def issue_code(profile, purpose, ttl_minutes=10):
    """Set a new code on the profile; return the code."""
    code = generate_code()
    profile.verification_code = code
    profile.verification_purpose = purpose
    profile.verification_code_expires = timezone.now() + timedelta(minutes=ttl_minutes)
    profile.save(update_fields=[
        'verification_code',
        'verification_purpose',
        'verification_code_expires',
    ])
    return code


def send_verification_email(user, code, purpose):
    subject_map = {
        'signup': 'Verify your email address',
        'password_reset': 'Reset your password',
    }
    subject = subject_map.get(purpose, 'Your verification code')

    html = render_to_string('emails/verification.html', {
        'username': user.username,
        'code': code,
        'purpose': purpose,
        'ttl_minutes': 10,
    })

    send_mail(
        subject=subject,
        message=f'Your verification code is {code}. It expires in 10 minutes.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html,
        fail_silently=False,
    )