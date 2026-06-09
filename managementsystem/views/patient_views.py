from django.shortcuts import render,redirect
from django.contrib.auth.decorators import login_required

from ..models import (Patient,Doctor,Appointment)

from ..forms import AppointmentForm


@login_required
def patient_dashboard(request):
    patient = Patient.objects.filter(user=request.user)
    appointments = Appointment.objects.filter(patient=request.user.patient)
    return render(request,'patientdashboard.html',{'patient':patient,'appointments':appointments})

#View Patient Profile
@login_required
def patient_profile(request):
    patient = Patient.objects.get(user=request.user)

    context = {
        'patient': patient,
    }
    return render(request, 'patient_profile.html', context)


def patient_doctor_list(request):
    doctors = Doctor.objects.all()
    return render(request,'patient_doctor_list.html',{'doctors':doctors})

@login_required
def book_appointment(request):
    form = AppointmentForm(request.POST)
    if request.method == "POST" and form.is_valid():
        appointment = form.save(commit=False)
        appointment.patient = request.user.patient
        appointment.save()
        return redirect("patient_profile")
    return render(request, "book_appointment.html", {"form": form})

#View patient appointments
@login_required
def patient_appointments(request):
    appointments = (
        Appointment.objects
        .filter(patient=request.user.patient)
        .select_related("doctor")
        .order_by("-appointment_date")
    )

    return render(
        request,
        "patient_appointments.html",
        {"appointments": appointments},
    )