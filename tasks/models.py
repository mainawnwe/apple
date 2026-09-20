from django.db import models
from django.contrib.auth.models import User


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='tasks'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default='medium'
    )

    due_date = models.DateTimeField(null=True, blank=True)
    reminder_datetime = models.DateTimeField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)

    tags = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['completed', '-priority', 'due_date', '-created_at']

    def __str__(self):
        return self.title