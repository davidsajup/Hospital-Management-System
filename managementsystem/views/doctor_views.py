from django.shortcuts import render,redirect,get_object_or_404
from django.contrib.auth.decorators import login_required
from ..models import Doctor,Appointment
from ..forms import AppointmentUpdateForm


@login_required
def doctor_dashboard(request):
    doctor = Doctor.objects.filter(user=request.user)
    appointments = Appointment.objects.filter(doctor=request.user.doctor).order_by('-appointment_date')
    return render(request,'doctordashboard.html',{'doctor':doctor,"appointments":appointments})

@login_required
def doctor_profile(request):
    doctor = Doctor.objects.get(user=request.user)

    context = {
        'doctor': doctor,
    }
    return render(request, 'doctor_profile.html', context)

@login_required
def doctor_appointments(request):
    appointments = (Appointment.objects.filter(doctor=request.user.doctor).select_related('patient').order_by('-appointment_date'))

    context = {'appointments': appointments}

    return render(request,'doctor_appointments.html',context)

@login_required
def update_appointment(request, pk):
    appointment = get_object_or_404(Appointment, id=pk)

    if appointment.doctor.user != request.user:
        return redirect('doctor_appointments')

    if request.method == 'POST':
        form = AppointmentUpdateForm(
            request.POST,
            instance=appointment
        )

        if form.is_valid():
            form.save()
            return redirect('doctor_appointments')
    else:
        form = AppointmentUpdateForm(instance=appointment)

    context = {'form': form,'appointment': appointment}

    return render(request,'doctor_editappointment.html',context)