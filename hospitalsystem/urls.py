from django.urls import path, include

urlpatterns = [
    path('', include('managementsystem.urls.auth_urls')),
    path('admin_panel/', include('managementsystem.urls.admin_urls')),
    path('doctor/', include('managementsystem.urls.doctor_urls')),
    path('patient/', include('managementsystem.urls.patient_urls')),
]