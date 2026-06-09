from django.urls import path
from managementsystem.views.auth_views import *

urlpatterns = [
    path('', user_login, name='login'),
    path('register/', register, name='register'),
    path('logout/', logoutfn,name='logout'),
]