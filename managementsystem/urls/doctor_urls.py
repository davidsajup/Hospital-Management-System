from django.urls import path
from managementsystem.views.doctor_views import *

urlpatterns = [
    path('', doctor_dashboard, name='doctor_dashboard'),
    path('profile/', doctor_profile,name='doctor_profile'),
    path('profile/edit/<int:pk>/',doctor_edit_profile,name='doctor_edit_profile'),
    path('appointments/', doctor_appointments,name='doctor_appointments'),
    path('appointments/<int:pk>/',doctor_view_appointment,name='doctor_view_appointment'),
    path('appointments/update/<int:pk>/',doctor_update_appointment,name='doctor_update_appointment'),
]