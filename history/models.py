from django.db import models
from django.utils.timezone import now
from decimal import Decimal
from django.conf import settings


class Party(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True)
    number = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, blank=True, unique=True)
    address = models.TextField(blank=True)
    advance_balance = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self) -> str:
        return f'{self.first_name} {self.last_name}'

    class Meta:
        ordering = ['first_name', 'last_name']


class Service_Type(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    type_of_work = models.CharField(max_length=50, unique=True)

    def __str__(self) -> str:
        return self.type_of_work


class Work_Rate(models.Model):
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    party = models.ForeignKey(Party, on_delete=models.CASCADE)
    service_type = models.ForeignKey(Service_Type, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['party', 'service_type'],
                                    name='unique_party_service_type_rate')]


class Record(models.Model):
    party = models.ForeignKey(Party, on_delete=models.PROTECT)
    service_type = models.ForeignKey(Service_Type, on_delete=models.PROTECT)
    pcs = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    record_date = models.DateField(default=now)
    discount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"))
    paid_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'))

    def __str__(self):
        return f'{self.party} | {self.service_type} | {self.record_date}'

    @property
    def remaining_amount(self):
        return (self.pcs*self.rate - self.discount) - self.paid_amount


class Payment(models.Model):
    party = models.ForeignKey(Party, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(default=now)

    def __str__(self):
        return f'{self.party} | {self.amount} | {self.payment_date}'


class Allocation(models.Model):
    record = models.ForeignKey(Record, on_delete=models.PROTECT)
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.record} | {self.amount} | {self.payment}'


class Note(models.Model):
    record = models.ForeignKey(Record, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField()
    created = models.DateField(auto_now_add=True)


class AdvanceLedger(models.Model):
    party = models.ForeignKey(Party, on_delete=models.CASCADE)
    payment = models.ForeignKey(Payment, blank= True, null= True , on_delete=models.SET_NULL)
    record = models.ForeignKey(Record, blank= True, null= True , on_delete=models.SET_NULL)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    direction = models.CharField(
        max_length=3,
        choices=[("IN", "IN"), ("OUT", "OUT")]
    )
    created_at = models.DateTimeField(auto_now_add=True)