from django.shortcuts import render,redirect
from django.contrib.auth import login,authenticate,logout
from ..models import CustomUser
from ..forms import PatientCreationForm

def register(request):
    if request.method == 'POST':
        form = PatientCreationForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = PatientCreationForm()
    
    return render(request, 'auth/register.html', {'form': form})


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
           return render(request,'auth/login.html',{'er':'Invalid Login Credentials!!!'})
    

    return render(request,'auth/login.html')

def logoutfn(request):
    logout(request)
    return redirect("login")