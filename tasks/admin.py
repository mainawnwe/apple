from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'priority', 'completed', 'due_date', 'reminder_datetime')
    list_filter = ('completed', 'priority')
    search_fields = ('title', 'description', 'tags')
    raw_id_fields = ('user',)