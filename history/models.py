from django.db import models
from django.utils.timezone import now
from decimal import Decimal
from django.conf import settings
from django.utils.timezone import localdate
from django.db.models import Sum, F, DecimalField, ExpressionWrapper
from decimal import Decimal


class Party(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    number = models.CharField(max_length=255, null=True,  blank=True)
    email = models.EmailField(
        max_length=255, blank=True, null=True)
    address = models.TextField(null=True, blank=True)
    logo = models.CharField(max_length=10, null=True, blank=True)

    @property
    def owner(self):
        return self.user

    def __str__(self) -> str:
        return f'{self.first_name} {self.last_name}'

    @property
    def due(self):
        total_work = self.record_set.aggregate(
            total=Sum(ExpressionWrapper(
                F('rate') * F('pcs'),
                output_field=DecimalField()
            )
            )
        )['total'] or Decimal('0.00')

        total_paid = (self.payment_set.aggregate(
            paid=Sum('amount'))
        )['paid'] or Decimal('0.00')
        current = total_work - total_paid
        if current < 0:
            return Decimal('0.00')
        return current

    @property
    def advance_balance(self):
        result = self.advanceledger_set.filter(
            direction="IN"
        ).aggregate(
            total=Sum('remaining_amount')
        )

        return result['total'] or Decimal('0.00')

    class Meta:
        ordering = ['first_name', 'last_name']


class Service_Type(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    type_of_work = models.CharField(max_length=50)

    def __str__(self) -> str:
        return self.type_of_work

    class Meta:
        ordering = ['type_of_work']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'type_of_work'], name='unique_user_type_of_work')
        ]


class Work_Rate(models.Model):
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    party = models.ForeignKey(Party, on_delete=models.CASCADE)
    service_type = models.ForeignKey(Service_Type, on_delete=models.CASCADE)

    @property
    def owner(self):
        return self.party.user

    class Meta:
        ordering = ['rate']
        constraints = [
            models.UniqueConstraint(fields=['party', 'service_type'],
                                    name='unique_party_service_type_rate')]


class Record(models.Model):
    party = models.ForeignKey(Party, on_delete=models.PROTECT)
    service_type = models.ForeignKey(Service_Type, on_delete=models.PROTECT)
    pcs = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    record_date = models.DateField(default=localdate)
    discount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"))
    paid_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'))

    def __str__(self):
        return f'{self.party} | {self.service_type} | {self.record_date}'

    def get_amount(self, record):
        return record.rate * record.pcs

    @property
    def remaining_amount(self):
        return (self.pcs*self.rate - self.discount) - self.paid_amount

    @property
    def owner(self):
        return self.party.user

    @property
    def amount(self):
        return (self.rate * self.pcs) - self.discount

    class Meta:
        ordering = ['-record_date', '-pk']
        permissions = [
            ('cancel_record', 'can cancel record')
        ]


class Payment(models.Model):
    party = models.ForeignKey(Party, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(default=localdate)

    def __str__(self):
        return f'{self.party} | {self.amount} | {self.payment_date}'

    @property
    def owner(self):
        return self.party.user

    class Meta:
        ordering = ['-payment_date', '-pk']


class Allocation(models.Model):
    record = models.ForeignKey(Record, on_delete=models.PROTECT)
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.record} | {self.amount} | {self.payment}'


class AdvanceLedger(models.Model):
    party = models.ForeignKey(
        Party,
        on_delete=models.CASCADE
    )

    payment = models.ForeignKey(
        Payment,
        blank=True,
        null=True,
        on_delete=models.SET_NULL
    )

    record = models.ForeignKey(
        Record,
        blank=True,
        null=True,
        on_delete=models.SET_NULL
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    remaining_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    direction = models.CharField(
        max_length=3,
        choices=[("IN", "IN"), ("OUT", "OUT")]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-pk']


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.SET_NULL, blank=True, null=True)
    object_id = models.PositiveIntegerField()
    model_name = models.CharField(max_length=50)
    action = models.CharField(
        max_length=10,
        choices=[
            ('DELETE', 'DELETE'),
            ('UPDATE', 'UPDATE')
        ]
    )
    before = models.JSONField(null=True, blank=True)
    after = models.JSONField(null=True, blank=True)
    reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    party = models.ForeignKey(
        Party, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-pk']
