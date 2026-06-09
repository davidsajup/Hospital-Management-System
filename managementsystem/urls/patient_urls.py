from django.urls import path
from managementsystem.views.patient_views import *

urlpatterns = [
    path('', patient_dashboard, name='patient_dashboard'),
    path('profile/', patient_profile, name='patient_profile'),
    path('doctors/', patient_doctor_list,name='patient_doctor_list'),
    path('appointments/', patient_appointments,name='patient_appointments'),
    path('appointments/book/', book_appointment,name='book_appointment'),
    path('appointments/view/<int:id>/',view_appointment,name='view_appointment'),
    path('appointments/delete/<int:id>/',delete_appointment,name='delete_appointment'),
]