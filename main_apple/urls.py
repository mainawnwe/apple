from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from django.views.generic import TemplateView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apple_app.urls')),
    path('api/', include('notes.urls')),
    path('', TemplateView.as_view(template_name='index.html')),

    # Serve user uploads.
    # In production on PythonAnywhere, a "static files mapping" for /media/
    # intercepts these requests BEFORE they reach Django, so this route is
    # only actually used during local development.
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]