from django.contrib import admin
from .models import Note, Attachment


class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 0
    readonly_fields = ('size', 'content_type', 'uploaded_at')


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'note_type', 'priority', 'reminder_datetime', 'updated_at')
    list_filter = ('note_type', 'priority', 'reminder_sent')
    search_fields = ('title', 'content', 'tags')
    inlines = [AttachmentInline]