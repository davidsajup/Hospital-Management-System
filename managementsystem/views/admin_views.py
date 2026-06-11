from django.shortcuts import render,redirect,get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse
from ..models import *
from ..forms import *
from ..decorators import admin_required

@admin_required
def admin_dashboard(request):
    context = {'appointments':Appointment.objects.all(),
               'appointment_count':Appointment.objects.count(),
               'patient_count':Patient.objects.count(),
               'doctor_count':Doctor.objects.count()}
    return render(request,'admin/dashboard.html',context)

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
        return redirect("doctor_list")
    return render(request, "admin/add_doctor.html", {"form": form})


@admin_required
def add_patient(request):
    form = PatientCreationForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        form.save()
        return redirect("patient_list")
    return render(request, "admin/add_patient.html", {"form": form})

@admin_required
def admin_create_appointment(request):
    if request.method == "POST":
        form = AdminAppointmentForm(request.POST)

        if form.is_valid():
            appointment = form.save(commit=False)
            appointment.save()
            messages.success(
                request,
                "Appointment created successfully."
            )

            return redirect('admin_dashboard')

    else:
        form = AdminAppointmentForm()

    context = {
        'form': form
    }

    return render(
        request,
        'admin/book.html',
        context
    )

@admin_required
def edit_doctor(request, pk):
    if request.user.role != 'admin':
        return redirect('login')
        
    doctor = get_object_or_404(Doctor, pk=pk)

    if request.method == "POST":
        form = DoctorUpdateForm(
            request.POST,
            request.FILES,
            instance=doctor
        )

        if form.is_valid():
            form.save()
            return redirect('doctor_list')
    else:
        form = DoctorUpdateForm(instance=doctor)

    return render(
        request,
        "admin/edit_doctor.html",
        {"form": form, "doctor": doctor}
    )


@admin_required
def edit_patient(request, pk):
    if request.user.role != 'admin':
        return redirect('login')

    patient = get_object_or_404(Patient, pk=pk)

    if request.method == "POST":
        form = PatientUpdateForm(
            request.POST,
            request.FILES,
            instance=patient
        )

        if form.is_valid():
            form.save()
            return redirect("patient_list")
    else:
        form = PatientUpdateForm(instance=patient)

    return render(
        request,
        "admin/edit_patient.html",
        {"form": form, "patient": patient}
    )


@admin_required
def admin_appointment_list(request):
    appointments = (Appointment.objects.select_related('patient', 'doctor').order_by('-appointment_date'))

    context = {'appointments': appointments}

    return render(request, 'admin/appointments.html', context)

@admin_required
def admin_view_appointment(request,id):
    appointment = get_object_or_404(Appointment,id=id)
    context = {'appointment':appointment}
    return render(request,'admin/view_appointment.html',context)

@admin_required
def admin_update_appointment(request,id):
    appointment = get_object_or_404(Appointment, id=id)
     
    if request.method == 'POST':
        form = AdminAppointmentForm(
            request.POST,
            instance=appointment
        )

        if form.is_valid():
            form.save()
            return redirect('admin_appointments')
    else:
        form = AdminAppointmentForm(instance=appointment)

    context = {'form': form,'appointment': appointment}

    return render(
        request,
        'admin/edit_appointment.html',
        context
    )


@admin_required
def admin_delete_appointment(request,id):
    appointment = get_object_or_404(Appointment,id=id)
    if request.user.role == 'admin':
        appointment.delete()
        return redirect('admin_appointments')
    else:
        return HttpResponse('You are not allowed to delete this.')
    
@admin_required
def delete_doctor(request,id):
    doctor = get_object_or_404(Doctor,id=id)
    if request.user.role == 'admin':
        doctor.delete()
        return redirect('doctor_list')
    
@admin_required  
def delete_patient(request,id):
    patient = get_object_or_404(Patient,id=id)
    if request.user.role == 'admin':
        patient.delete()
        return redirect('patient_list')