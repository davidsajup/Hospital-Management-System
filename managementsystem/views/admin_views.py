from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import HttpResponse
from ..models import Appointment, Patient, Doctor
from ..forms import (
    DoctorCreationForm, 
    PatientCreationForm, 
    AdminAppointmentForm, 
    DoctorUpdateForm, 
    PatientUpdateForm
)
from ..decorators import admin_required

@admin_required
def admin_dashboard(request):
    context = {
        'appointments': Appointment.objects.all(),
        'appointment_count': Appointment.objects.count(),
        'patient_count': Patient.objects.count(),
        'doctor_count': Doctor.objects.count()
    }
    return render(request, 'admin/dashboard.html', context)

@admin_required
def doctor_list(request):
    doctors = Doctor.objects.all()
    context = {'doctors': doctors}
    return render(request, 'admin/doctor_list.html', context)

@admin_required
def patient_list(request):
    patients = Patient.objects.all()
    context = {'patients': patients}
    return render(request, 'admin/patient_list.html', context)

@admin_required
def admin_view_doctor(request, pk):
    doctor = get_object_or_404(Doctor, pk=pk)
    return render(request, 'admin/view_doctor.html', {'doctor': doctor})

@admin_required
def admin_view_patient(request, pk):
    patient = get_object_or_404(Patient, pk=pk)
    appointments = Appointment.objects.filter(patient=patient).order_by('-appointment_date')
    return render(request, 'admin/view_patient.html', {'patient': patient, 'appointments': appointments})

@admin_required
def add_doctor(request):
    form = DoctorCreationForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Doctor added successfully.")
        return redirect("doctor_list")
    return render(request, "admin/add_doctor.html", {"form": form})

@admin_required
def add_patient(request):
    form = PatientCreationForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Patient added successfully.")
        return redirect("patient_list")
    return render(request, "admin/add_patient.html", {"form": form})

@admin_required
def admin_create_appointment(request):
    form = AdminAppointmentForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Appointment created successfully.")
        return redirect('admin_dashboard')
    
    return render(request, 'admin/book.html', {'form': form})

@admin_required
def edit_doctor(request, pk):
    doctor = get_object_or_404(Doctor, pk=pk)
    form = DoctorUpdateForm(request.POST or None, request.FILES or None, instance=doctor)
    
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Doctor updated successfully.")
        return redirect('doctor_list')

    return render(request, "admin/edit_doctor.html", {"form": form, "doctor": doctor})

@admin_required
def edit_patient(request, pk):
    patient = get_object_or_404(Patient, pk=pk)
    form = PatientUpdateForm(request.POST or None, request.FILES or None, instance=patient)
    
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Patient updated successfully.")
        return redirect("patient_list")

    return render(request, "admin/edit_patient.html", {"form": form, "patient": patient})

@admin_required
def admin_appointment_list(request):
    appointments = Appointment.objects.select_related('patient', 'doctor').order_by('-appointment_date')
    return render(request, 'admin/appointments.html', {'appointments': appointments})

@admin_required
def admin_view_appointment(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    return render(request, 'admin/view_appointment.html', {'appointment': appointment})

@admin_required
def admin_update_appointment(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    form = AdminAppointmentForm(request.POST or None, instance=appointment)
    
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, "Appointment updated successfully.")
        return redirect('admin_appointment_list')

    return render(request, 'admin/edit_appointment.html', {'form': form, 'appointment': appointment})

@admin_required
def admin_delete_appointment(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    appointment.delete()
    messages.success(request, "Appointment deleted successfully.")
    return redirect('admin_appointment_list')

@admin_required
def delete_doctor(request, pk):
    doctor = get_object_or_404(Doctor, pk=pk)
    doctor.delete()
    messages.success(request, "Doctor deleted successfully.")
    return redirect('doctor_list')

@admin_required
def delete_patient(request, pk):
    patient = get_object_or_404(Patient, pk=pk)
    patient.delete()
    messages.success(request, "Patient deleted successfully.")
    return redirect('patient_list')
