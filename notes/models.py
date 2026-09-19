from django.db import models


class Note(models.Model):
    NOTE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    title = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True)
    note_type = models.CharField(max_length=10, choices=NOTE_TYPES, default='text')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')

    # Reminder (Phase 3 will use this)
    reminder_datetime = models.DateTimeField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)

    # Tags as a comma-separated string for simplicity now; upgrade later
    tags = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title or f"Note #{self.pk}"


class Attachment(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/')
    original_name = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_name or self.file.name