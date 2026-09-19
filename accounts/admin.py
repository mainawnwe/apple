from django.contrib import admin
from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_verified', 'verification_purpose', 'created_at')
    list_filter = ('email_verified', 'verification_purpose')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at',)