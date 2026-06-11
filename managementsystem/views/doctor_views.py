from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from ..models import Doctor, Appointment
from ..forms import AppointmentUpdateForm, DoctorUpdateForm

@login_required
def doctor_dashboard(request):
    if not hasattr(request.user, 'doctor'):
        return redirect('login')
        
    doctor = request.user.doctor
    appointments = Appointment.objects.filter(doctor=doctor).select_related('patient').order_by('-appointment_date')
    return render(request, 'doctor/dashboard.html', {'doctor': doctor, 'appointments': appointments})

@login_required
def doctor_profile(request):
    if not hasattr(request.user, 'doctor'):
        return redirect('login')
    return render(request, 'doctor/profile.html', {'doctor': request.user.doctor})

@login_required
def doctor_appointments(request):
    if not hasattr(request.user, 'doctor'):
        return redirect('login')
        
    appointments = Appointment.objects.filter(doctor=request.user.doctor).select_related('patient').order_by('-appointment_date')
    return render(request, 'doctor/appointments.html', {'appointments': appointments})

@login_required
def doctor_view_appointment(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    
    # Ownership check
    if appointment.doctor.user != request.user:
        messages.error(request, "You are not authorized to view this appointment.")
        return redirect('doctor_appointments')
        
    return render(request, 'doctor/view_appointment.html', {'appointment': appointment})

@login_required
def doctor_update_appointment(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)

    if appointment.doctor.user != request.user:
        messages.error(request, "You are not authorized to edit this appointment.")
        return redirect('doctor_appointments')

    form = AppointmentUpdateForm(request.POST or None, instance=appointment)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, "Appointment updated successfully.")
        return redirect('doctor_appointments')

    return render(request, 'doctor/edit_appointment.html', {'form': form, 'appointment': appointment})

@login_required
def doctor_edit_profile(request, pk):
    doctor = get_object_or_404(Doctor, pk=pk)

    if doctor.user != request.user:
        messages.error(request, "You are not authorized to edit this profile.")
        return redirect('doctor_profile')

    form = DoctorUpdateForm(request.POST or None, request.FILES or None, instance=doctor)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Profile updated successfully.")
        return redirect('doctor_profile')

    return render(request, "doctor/edit_profile.html", {"form": form, "doctor": doctor})
