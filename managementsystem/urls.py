from django.urls import path
from .views import *

urlpatterns = [
    path('patient/',patient_dashboard,name='patient_dashboard'),
    path('patient/doctors/',patient_doctor_list),
    path('doctor/',doctor_dashboard,name='doctor_dashboard'),
    path('doctors/',doctor_list),
    path('patients/',patient_list),
    path('view_doctor/<int:pk>/', admin_view_doctor, name='admin_view_doctor'),
    path('view_patient/<int:pk>/', admin_view_patient, name='admin_view_patient'),
    path('create_doctor/',add_doctor),
    path('create_patient/',add_patient),
    path('admin_dashboard/',admin_dashboard,name='admin_dashboard'),
    path('',user_login,name='login'),
    path('register/',register,name='register'),
    path('logout/',logoutfn),
    path('patient/profile/',patient_profile,name='patient_profile'),
    path('doctor_profile/',doctor_profile),
    path('book/',book_appointment,name='book_appointment'),
    path('admin_book/',admin_create_appointment),
    path('edit_patient/<int:pk>/',edit_patient),
    path('edit_doctor/<int:pk>/',edit_doctor),
    path('patient_appointments/',patient_appointments,name='patient_appointments'),
    path('admin_appointments/',admin_appointment_list,name='admin_appointment_list'),
    path('admin_appointments/update/<int:id>/' ,admin_update_appointment,name='admin_update_appointment'),
    path('doctor/appointments/',doctor_appointments,name='doctor_appointments'),
    path('appointment/update/<int:pk>/',update_appointment,name='update_appointment'),
    path('view_appointment/<int:id>/',view_appointment,name='view_appointment'),
    path('delete_appointment/<int:id>',delete_appointment,name='delete_appointment'),
    path('delete_doctor/<int:id>',delete_doctor,name='delete_doctor'),
    path('delete_patient/<int:id>',delete_patient,name='delete_patient')

]