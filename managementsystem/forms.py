from django import forms
from .models import Appointment,Patient,Doctor,CustomUser
from django.contrib.auth.forms import UserCreationForm

class AppointmentForm(forms.ModelForm):
    class Meta:
        model  = Appointment
        fields = ["doctor", "appointment_date", "appointment_time", "reason"]
        widgets = {
            "appointment_date": forms.DateInput(attrs={"type": "date"}),
            "appointment_time": forms.TimeInput(attrs={"type": "time"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["doctor"].label_from_instance = (
            lambda obj: f"Dr. {obj.user.get_full_name() or obj.user.username}"
        )

    def clean_appointment_date(self):
        from django.utils import timezone
        date = self.cleaned_data["appointment_date"]
        if date < timezone.now().date():
            raise forms.ValidationError("Cannot book a past date.")
        return date
    
class AdminAppointmentForm(forms.ModelForm):
    class Meta:
        model = Appointment
        fields = [
            'patient',
            'doctor',
            'appointment_date',
            'appointment_time',
            'reason'
        ]
        widgets = {
            "appointment_date": forms.DateInput(attrs={"type": "date"}),
            "appointment_time": forms.TimeInput(attrs={"type": "time"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["patient"].label_from_instance = (
            lambda obj: obj.user.get_full_name() or obj.user.username
        )
        self.fields["doctor"].label_from_instance = (
            lambda obj: f"Dr. {obj.user.get_full_name() or obj.user.username}"
        )

class AppointmentUpdateForm(forms.ModelForm):
    class Meta:
        model = Appointment
        fields = ['status', 'notes']

        widgets = {
            'status': forms.Select(
                attrs={'class': 'form-select'}
            ),
            'notes': forms.Textarea(
                attrs={
                    'class': 'form-control',
                    'rows': 6,
                    'placeholder': 'Enter prescription or notes...'
                }
            ),
        }
    

class DoctorCreationForm(UserCreationForm):
    phone      = forms.CharField(max_length=15, required=False)
    department = forms.CharField(max_length=100)
    education  = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}))
    photo      = forms.ImageField(required=False)

    class Meta:
        model  = CustomUser
        fields = ["username", "first_name", "last_name", "email", "password1", "password2"]

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = "doctor"
        if commit:
            user.save()
            Doctor.objects.create(
                user       = user,
                phone      = self.cleaned_data.get("phone"),
                department = self.cleaned_data["department"],
                education  = self.cleaned_data["education"],
                photo      = self.cleaned_data.get("photo") or "default/default.png",
            )
        return user


class PatientCreationForm(UserCreationForm):
    gender_choices = (("male", "Male"), ("female", "Female"), ("other", "Other"))
    gender      = forms.ChoiceField(choices=gender_choices)
    age         = forms.IntegerField(min_value=0)
    phone       = forms.CharField(max_length=15)
    blood_group = forms.CharField(max_length=5)
    photo       = forms.ImageField(required=False)

    class Meta:
        model  = CustomUser
        fields = ["username", "first_name", "last_name", "email", "password1", "password2"]

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = "patient"
        if commit:
            user.save()
            Patient.objects.create(
                user        = user,
                gender      = self.cleaned_data["gender"],
                age         = self.cleaned_data["age"],
                phone       = self.cleaned_data["phone"],
                blood_group = self.cleaned_data["blood_group"],
                photo       = self.cleaned_data.get("photo") or "default/default.png",
            )
        return user
    



class DoctorUpdateForm(forms.ModelForm):
    first_name = forms.CharField()
    last_name = forms.CharField()
    email = forms.EmailField()

    class Meta:
        model = Doctor
        fields = ["phone", "department", "education", "photo"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.user:
            self.fields["first_name"].initial = self.instance.user.first_name
            self.fields["last_name"].initial = self.instance.user.last_name
            self.fields["email"].initial = self.instance.user.email

    def save(self, commit=True):
        doctor = super().save(commit=False)

        user = doctor.user
        user.first_name = self.cleaned_data["first_name"]
        user.last_name = self.cleaned_data["last_name"]
        user.email = self.cleaned_data["email"]

        if commit:
            user.save()
            doctor.save()

        return doctor
    


class PatientUpdateForm(forms.ModelForm):
    first_name = forms.CharField()
    last_name = forms.CharField()
    email = forms.EmailField()

    class Meta:
        model = Patient
        fields = [
            "gender",
            "age",
            "phone",
            "blood_group",
            "photo",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.user:
            self.fields["first_name"].initial = self.instance.user.first_name
            self.fields["last_name"].initial = self.instance.user.last_name
            self.fields["email"].initial = self.instance.user.email

    def save(self, commit=True):
        patient = super().save(commit=False)

        user = patient.user
        user.first_name = self.cleaned_data["first_name"]
        user.last_name = self.cleaned_data["last_name"]
        user.email = self.cleaned_data["email"]

        if commit:
            user.save()
            patient.save()

        return patient
