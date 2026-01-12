from django.conf import settings
from django.db import models
from django.utils.timezone import now
from decimal import Decimal
from django.contrib import admin

class Party(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete= models.CASCADE)
    number = models.CharField(max_length=255)
    address = models.TextField(blank=True)


    def __str__(self) -> str:
        return f'{self.user.first_name} {self.user.last_name}'

    @admin.display(ordering= 'user__first_name')
    def first_name(self):
        return self.user.first_name
    
    @admin.display(ordering= 'user__last_name')
    def last_name(self):
        return self.user.last_name
    
    @admin.display(ordering= 'user__email')   
    def email(self):
        return self .user.email

    class Meta:
        ordering = ['user__first_name', 'user__last_name']


class Service_type(models.Model):
    code = models.CharField(max_length=3, unique=True)
    type_of_work = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return self.type_of_work


class Work_rate(models.Model):
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    party = models.ForeignKey(Party, on_delete=models.CASCADE)
    service_type = models.ForeignKey(Service_type, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['party', 'service_type'],
                                    name='unique_party_service_type_rate')]


class Record(models.Model):
    paid = 'p'
    due = 'd'
    partial = 'par'

    pay_status = [
        (paid, 'Paid'),
        (due, 'Due'),
        (partial, 'Partial'),
    ]

    party = models.ForeignKey(Party, on_delete=models.PROTECT)
    service_type = models.ForeignKey(Service_type, on_delete=models.PROTECT)
    pcs = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    record_date = models.DateField(default=now)
    discount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"))
    status = models.CharField(max_length=3, choices=pay_status, default=due)

    def __str__(self):
        return f'{self.party} | {self.service_type} | {self.record_date}'

    class Meta:
        permissions = [
            ('cancel_record', 'can cancel a record' )
        ]

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
