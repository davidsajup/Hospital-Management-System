from django.shortcuts import render,redirect
from django.contrib.auth import login,authenticate,logout
from ..models import CustomUser

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