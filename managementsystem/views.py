from django.shortcuts import render,redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from .models import CustomUser,Doctor,Patient,Appointment
from django.contrib.auth.decorators import login_required
from .forms import AppointmentForm,DoctorCreationForm,PatientCreationForm,AdminAppointmentForm

@login_required
def patient_dashboard(request):
    patient = Patient.objects.filter(user=request.user)
    appointments = Appointment.objects.filter(patient=request.user.patient)
    return render(request,'patientdashboard.html',{'patient':patient,'appointments':appointments})

@login_required
def doctor_dashboard(request):
    doctor = Doctor.objects.filter(user=request.user)
    appointments = Appointment.objects.filter(doctor=request.user.doctor).order_by('-appointment_date')
    return render(request,'doctordashboard.html',{'doctor':doctor,"appointments":appointments})

@login_required
def admin_dashboard(request):
    context = {'appointments':Appointment.objects.all(),
               'appointment_count':Appointment.objects.count(),
               'patient_count':Patient.objects.count(),
               'doctor_count':Doctor.objects.count()}
    return render(request,'admindashboard.html',context)

def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        fname = request.POST.get('fname')
        lname = request.POST.get('lname')
        email = request.POST.get('email')
        password = request.POST.get('psw1')
        confirm_password = request.POST.get('psw2')

        if password == confirm_password:
            if CustomUser.objects.filter(username=username).exists():
                return render(request,'register.html',{'er':'Username already exists!!!'})
            elif CustomUser.objects.filter(email=email).exists():
                return render(request,'register.html',{'er':'Email already exists!!!'})
            else:
                CustomUser.objects.create_user(username=username,first_name = fname,last_name = lname,email=email,password=password)
                return redirect('login')
        else:
            return render(request,'register.html',{'er':'Make sure passwords match!!!'})
    
    return render(request,'register.html')


def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request,username=username,password=password)
        if user is not None:
            login(request, user)
            if user.role == 'patient':
                return redirect('patient_dashboard')
            elif user.role == 'doctor':
                return redirect('doctor_dashboard')
            elif user.role == 'admin':
                return redirect('admin_dashboard')
        else:
           return render(request,'login.html',{'er':'Invalid Login Credentials!!!'})
    

    return render(request,'login.html')

def logoutfn(request):
    logout(request)
    return redirect("login")



def doctor_list(request):
    doctors = Doctor.objects.all()
    context = {'doctors': doctors}
    return render(request, 'admin_doctor_list.html', context)

def patient_list(request):
    patients = Patient.objects.all()
    context = {'patients': patients}
    return render(request, 'admin_patient_list.html', context)

@login_required
def admin_view_doctor(request, pk):
    doctor = get_object_or_404(Doctor, pk=pk)
    return render(request, 'admin_view_doctor.html', {'doctor': doctor})

@login_required
def admin_view_patient(request, pk):
    patient = get_object_or_404(Patient, pk=pk)
    appointments = Appointment.objects.filter(patient=patient).order_by('-appointment_date')
    return render(request, 'admin_view_patient.html', {'patient': patient, 'appointments': appointments})


@login_required
def patient_profile(request):
    patient = Patient.objects.get(user=request.user)

    context = {
        'patient': patient,
    }
    return render(request, 'patient_profile.html', context)



@login_required
def doctor_profile(request):
    doctor = Doctor.objects.get(user=request.user)

    context = {
        'doctor': doctor,
    }
    return render(request, 'doctor_profile.html', context)


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


@login_required
def add_doctor(request):
    form = DoctorCreationForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        form.save()
        return redirect("admin_dashboard")
    return render(request, "add_doctor.html", {"form": form})


@login_required
def add_patient(request):
    form = PatientCreationForm(request.POST,request.FILES)
    if request.method == "POST" and form.is_valid():
        form.save()
        return redirect("admin_dashboard")
    return render(request, "add_patient.html", {"form": form})


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
        'admin_book.html',
        context
    )

from django.shortcuts import render, redirect, get_object_or_404

from .forms import DoctorUpdateForm

def edit_doctor(request, pk):
    doctor = get_object_or_404(Doctor, pk=pk)

    if request.method == "POST":
        form = DoctorUpdateForm(
            request.POST,
            request.FILES,
            instance=doctor
        )

        if form.is_valid():
            form.save()
            return redirect('/doctors')
    else:
        form = DoctorUpdateForm(instance=doctor)

    return render(
        request,
        "edit_doctor.html",
        {"form": form, "doctor": doctor}
    )

from .forms import PatientUpdateForm

def edit_patient(request, pk):
    patient = get_object_or_404(Patient, pk=pk)

    if request.method == "POST":
        form = PatientUpdateForm(
            request.POST,
            request.FILES,
            instance=patient
        )

        if form.is_valid():
            form.save()
            return redirect("/patients")
    else:
        form = PatientUpdateForm(instance=patient)

    return render(
        request,
        "edit_patient.html",
        {"form": form, "patient": patient}
    )


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

@login_required
def admin_appointment_list(request):
    appointments = (
        Appointment.objects
        .select_related('patient', 'doctor')
        .order_by('-appointment_date')
    )

    context = {
        'appointments': appointments
    }

    return render(request, 'admin_appointments.html', context)


from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def doctor_appointments(request):
    appointments = (
        Appointment.objects
        .filter(doctor=request.user.doctor)
        .select_related('patient')
        .order_by('-appointment_date')
    )

    context = {
        'appointments': appointments
    }

    return render(
        request,
        'doctor_appointments.html',
        context
    )

from .forms import AppointmentUpdateForm

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

    context = {
        'form': form,
        'appointment': appointment
    }

    return render(
        request,
        'doctor_editappointment.html',
        context
    )

def view_appointment(request,id):
    appointment = get_object_or_404(Appointment,id=id)
    context = {'appointment':appointment}
    return render(request,'view_appointment.html',context)


def admin_update_appointment(request,id):
    appointment = get_object_or_404(Appointment, id=id)
     
    if request.method == 'POST':
        form = AdminAppointmentForm(
            request.POST,
            instance=appointment
        )

        if form.is_valid():
            form.save()
            return redirect('admin_appointment_list')
    else:
        form = AdminAppointmentForm(instance=appointment)

    context = {
        'form': form,
        'appointment': appointment
    }

    return render(
        request,
        'admin_editappointment.html',
        context
    )

from django.http import HttpResponse

@login_required
def delete_appointment(request,id):
    appointment = get_object_or_404(Appointment,id=id)
    if request.user.role == 'admin':
        appointment.delete()
        return redirect('admin_appointment_list')
    elif appointment.patient.user == request.user:
        appointment.delete()
        return redirect('patient_appointment_list')
    else:
        return HttpResponse('You are not allowed to delete this.')
    
@login_required
def delete_doctor(request,id):
    doctor = get_object_or_404(Doctor,id=id)
    if request.user.role == 'admin':
        doctor.delete()
        return redirect('/doctors/')
    
@login_required  
def delete_patient(request,id):
    patient = get_object_or_404(Patient,id=id)
    if request.user.role == 'admin':
        patient.delete()
        return redirect('/patients/')
    
    


