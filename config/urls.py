from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from django.views.generic import TemplateView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('apple_app.urls')),
    path('api/', include('notes.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),

    # React Router catch-all — API/admin/media မဟုတ်တဲ့ route အားလုံးကို
    # index.html ကို serve လုပ်ပြီး React Router က client-side handle လုပ်မယ်
    re_path(r'^(?!api/|admin/|media/|static/).*$',
            TemplateView.as_view(template_name='index.html')),
]