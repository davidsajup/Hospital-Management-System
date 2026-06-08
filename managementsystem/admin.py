from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser,Patient,Doctor,Appointment


class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (('Role Information', {'fields': ('role',)}),)
    add_fieldsets = UserAdmin.add_fieldsets + (('Role Information', {'fields': ('role',)}),)
    list_display = ('username', 'email', 'role')

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(Appointment)
