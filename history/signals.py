from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.db import transaction
from .models import Record, AuditLog, Payment
from .serializer import PaymentSerializer, RecordSerializer




