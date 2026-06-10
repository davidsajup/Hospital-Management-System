from django.urls import path
from managementsystem.views.doctor_views import *

urlpatterns = [
    path('', doctor_dashboard, name='doctor_dashboard'),
    path('profile/', doctor_profile,name='doctor_profile'),
    path('appointments/', doctor_appointments,name='doctor_appointments'),
    path('appointments/update/<int:pk>/',update_appointment,name='update_appointment'),
]