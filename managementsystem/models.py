from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):

    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES,default='patient')
    

    def __str__(self):
        return self.username

class Doctor(models.Model):
    user = models.OneToOneField(CustomUser,on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=100)
    education = models.TextField(default='MBBS')
    photo = models.ImageField(upload_to='doctors',default='default/default.png')

    def __str__(self):
        return self.user.username

class Patient(models.Model):
    user = models.OneToOneField(CustomUser,on_delete=models.CASCADE)
    gender_choices = (('male','Male'),('female','Female'),('other','Other'))
    gender = models.CharField(max_length=10,choices=gender_choices,default='male')
    age = models.IntegerField()
    phone = models.CharField(max_length=15)
    blood_group_choices = (('A+', 'A+'),('A-', 'A-'),('B+', 'B+'),('B-', 'B-'),('AB+', 'AB+'),('AB-', 'AB-'),('O+', 'O+'),('O-', 'O-'),)
    blood_group = models.CharField(max_length=3,choices=blood_group_choices)
    photo = models.ImageField(upload_to='patients',default='default/default.png')

    def __str__(self):
        return self.user.username

from django.utils import timezone

class Appointment(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    appointment_date = models.DateField(default=timezone.now)
    appointment_time = models.TimeField(null=True,blank=True)
    reason = models.TextField(blank=True)
    STATUS_CHOICES = [('Pending', 'Pending'),('Completed', 'Completed'),]
    status = models.CharField(max_length=20,choices=STATUS_CHOICES,default='Pending')
    notes = models.TextField(blank=True)


