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