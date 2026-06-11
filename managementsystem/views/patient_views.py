from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse
from ..models import Patient, Doctor, Appointment
from ..forms import AppointmentForm, PatientUpdateForm

@login_required
def patient_dashboard(request):
    if not hasattr(request.user, 'patient'):
        return redirect('login')
        
    patient = request.user.patient
    appointments = (
        Appointment.objects
        .filter(patient=patient)
        .select_related("doctor")
        .order_by("-appointment_date")
    )
    
    context = {
        'appointments': appointments[:5],
        'total_appointments': appointments.count(),
        'pending_appointments': appointments.filter(status='Pending').count(),
        'completed_appointments': appointments.filter(status='Completed').count(),
    }
    return render(request, 'patient/dashboard.html', context)

@login_required
def patient_profile(request):
    if not hasattr(request.user, 'patient'):
        return redirect('login')
    return render(request, 'patient/profile.html', {'patient': request.user.patient})

@login_required
def patient_edit_profile(request, pk):
    patient = get_object_or_404(Patient, pk=pk)

    if patient.user != request.user:
        messages.error(request, "You are not authorized to edit this profile.")
        return redirect('patient_profile')

    form = PatientUpdateForm(request.POST or None, request.FILES or None, instance=patient)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Profile updated successfully.")
        return redirect("patient_profile")

    return render(request, "patient/edit_profile.html", {"form": form, "patient": patient})

@login_required
def patient_doctor_list(request):
    doctors = Doctor.objects.all()
    return render(request, 'patient/doctor_list.html', {'doctors': doctors})

@login_required
def book_appointment(request):
    if not hasattr(request.user, 'patient'):
        return redirect('login')
        
    form = AppointmentForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        appointment = form.save(commit=False)
        appointment.patient = request.user.patient
        appointment.save()
        messages.success(request, "Appointment booked successfully.")
        return redirect("patient_appointments")
    return render(request, "patient/book_appointment.html", {"form": form})

@login_required
def patient_appointments(request):
    if not hasattr(request.user, 'patient'):
        return redirect('login')
        
    appointments = (
        Appointment.objects
        .filter(patient=request.user.patient)
        .select_related("doctor")
        .order_by("-appointment_date")
    )
    return render(request, "patient/appointments.html", {"appointments": appointments})

@login_required
def patient_view_appointment(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    
    if appointment.patient.user != request.user:
        messages.error(request, "You are not authorized to view this appointment.")
        return redirect('patient_appointments')
        
    return render(request, 'patient/view_appointment.html', {'appointment': appointment})

@login_required
def delete_appointment(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    
    if appointment.patient.user == request.user:
        appointment.delete()
        messages.success(request, "Appointment deleted successfully.")
        return redirect('patient_appointments')
    else:
        messages.error(request, "You are not authorized to delete this appointment.")
        return redirect('patient_appointments')
