from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUA
from .models import User

@admin.register(User)
class UserAdmin(BaseUA):
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "email", "password1", 
                           "password2", 'first_name', 'last_name'),
            },
        ),
    )

