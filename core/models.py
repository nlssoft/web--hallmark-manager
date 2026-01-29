from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    number = models.CharField(max_length=255)
    joined_at = models.DateField(auto_now_add=True)
    address = models.CharField(max_length=255)
