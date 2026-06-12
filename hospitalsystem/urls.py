from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('', include('managementsystem.urls.auth_urls')),
    path('admin_panel/', include('managementsystem.urls.admin_urls')),
    path('doctor/', include('managementsystem.urls.doctor_urls')),
    path('patient/', include('managementsystem.urls.patient_urls')),
]+static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)