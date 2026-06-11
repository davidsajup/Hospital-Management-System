from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from ..forms import PatientCreationForm

def register(request):
    if request.user.is_authenticated:
        return redirect('patient_dashboard')
        
    form = PatientCreationForm(request.POST or None, request.FILES or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, "Registration successful. Please login.")
        return redirect('login')
    
    return render(request, 'auth/register.html', {'form': form})

def user_login(request):
    if request.user.is_authenticated:
        if request.user.role == 'patient':
            return redirect('patient_dashboard')
        elif request.user.role == 'doctor':
            return redirect('doctor_dashboard')
        elif request.user.role == 'admin':
            return redirect('admin_dashboard')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if user.role == 'patient':
                return redirect('patient_dashboard')
            elif user.role == 'doctor':
                return redirect('doctor_dashboard')
            elif user.role == 'admin':
                return redirect('admin_dashboard')
        else:
            messages.error(request, 'Invalid Login Credentials!!!')
    
    return render(request, 'auth/login.html')

def logoutfn(request):
    logout(request)
    return redirect("login")
