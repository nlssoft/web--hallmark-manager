from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.db import transaction
from .models import Record, AuditLog, Payment
from .serializer import PaymentSerializer, RecordSerializer


@receiver(post_delete, sender=Record)
def log_record_delete(sender, instance, **kwargs):
    before_state = RecordSerializer(instance).data

    def _log():
        AuditLog.objects.create(
            user=instance.party.user,
            model_name='Record',
            object_id=instance.id,
            action='DELETE',
            before=before_state,
            after=None,
        )

    transaction.on_commit(_log)


@receiver(post_delete, sender=Payment)
def log_payment_delete(sender, instance, **kwargs):
    before_state = PaymentSerializer(instance).data

    def _log():
        AuditLog.objects.create(
            user=instance.party.user,
            model_name='Payment',
            object_id=instance.id,
            action='DELETE',
            before=before_state,
            after=None,
        )

    transaction.on_commit(_log)
