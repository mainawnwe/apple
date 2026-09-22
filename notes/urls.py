from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoteViewSet, global_search, stats

router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename='note')

urlpatterns = [
    path('search/', global_search, name='global_search'),
    path('stats/', stats, name='stats'),                    # ← NEW
    path('', include(router.urls)),
]