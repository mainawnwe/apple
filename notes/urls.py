from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoteViewSet, global_search, stats, cron_send_reminders

router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename='note')

urlpatterns = [
    path('search/', global_search, name='global_search'),
    path('stats/', stats, name='stats'),
    path('cron/send-reminders/', cron_send_reminders, name='cron_send_reminders'),
    path('', include(router.urls)),
]