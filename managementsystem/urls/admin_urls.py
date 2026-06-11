from django.urls import path
from managementsystem.views.admin_views import *

urlpatterns = [
    path('dashboard/', admin_dashboard, name='admin_dashboard'),
    path('doctors/', doctor_list,name='doctor_list'),
    path('patients/', patient_list,name='patient_list'),
    path('doctor/<int:pk>/', admin_view_doctor, name='admin_view_doctor'),
    path('patient/<int:pk>/', admin_view_patient, name='admin_view_patient'),
    path('doctor/create/', add_doctor,name='add_doctor'),
    path('patient/create/', add_patient,name='add_patient'),
    path('doctor/edit/<int:pk>/', edit_doctor,name='edit_doctor'),
    path('patient/edit/<int:pk>/', edit_patient,name='edit_patient'),
    path('doctor/delete/<int:pk>/', delete_doctor,name='delete_doctor'),
    path('patient/delete/<int:pk>/', delete_patient,name='delete_patient'),
    path('appointments/', admin_appointment_list,name='admin_appointments'),
    path('appointments/<int:pk>/',admin_view_appointment,name='admin_view_appointment'),
    path('appointments/book/', admin_create_appointment,name='admin_create_appointment'),
    path('appointments/update/<int:pk>/',admin_update_appointment,name='admin_update_appointment'),
    path('appointments/delete/<int:pk>/',admin_delete_appointment,name='admin_delete_appointment')
]