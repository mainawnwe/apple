from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class Profile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile'
    )
    email_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True)
    verification_code_expires = models.DateTimeField(null=True, blank=True)
    verification_purpose = models.CharField(max_length=20, blank=True)
    # 'signup' | 'password_reset'

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile<{self.user.username}>"

    def is_code_valid(self, code):
        return (
            bool(self.verification_code)
            and self.verification_code == code
            and self.verification_code_expires is not None
            and self.verification_code_expires > timezone.now()
        )

    def clear_code(self):
        self.verification_code = ''
        self.verification_code_expires = None
        self.verification_purpose = ''
        self.save(update_fields=[
            'verification_code',
            'verification_code_expires',
            'verification_purpose',
        ])


@receiver(post_save, sender=User)
def create_profile_for_new_user(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

class PendingSignup(models.Model):
    """Temporary storage for unverified signups.
    Promoted to a real User only after the verification code is confirmed.

    Username is NOT unique here — Twitter-style. Multiple users can
    temporarily share a username; the real conflict is caught at the
    final User creation step.
    """
    username = models.CharField(max_length=150)      # ← unique ဖျက်
    email = models.EmailField(unique=True)            # ← email ပဲ unique
    password_hash = models.CharField(max_length=128)
    code = models.CharField(max_length=6)
    code_expires = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Pending<{self.username} | {self.email}>"

    def is_code_valid(self, code):
        return self.code == code and self.code_expires > timezone.now()