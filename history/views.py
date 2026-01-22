# from django.core.exceptions import ObjectDoesNotExist
# from django.db.models.functions import Concat
# from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView

from django.db import models
from django.db.models import Q, F, Value, Func, ExpressionWrapper, DecimalField
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import render, get_object_or_404
from django.db.models.aggregates import Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from .models import *
from .serializer import *
from .permissions import *

# starting writing code from this point !!!


class PartyViewSet(ModelViewSet):
    serializer_class = PartySerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Party.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        party = self.get_object()
        if Record.objects.filter(party=party).exists():
            return Response({'error': 'party can not be deleted because its accoiated with records'})

        return super().destroy(request, *args, **kwargs)


class Work_RateViewSet(ModelViewSet):
    serializer_class = Work_RateSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Work_Rate.objects.filter(party__user=self.request.user)\
            .select_related('party', 'service_type')


class Service_TypeViewSet(ReadOnlyModelViewSet):
    serializer_class = Service_TypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Service_Type.objects.filter(user=self.request.user).annotate(
            used=Count('record')
        )


class RecordViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['party_id', 'service_type_id']
    permission_classes = [IsAuthenticated, IsOwner]

    def get_serializer(self, *args, **kwargs):
        if self.action in ['update', 'partial_update']:
            return RecordUpdateSerializer() 
        return RecordSerializer()
    

    def get_queryset(self):
        return Record.objects.filter(party__user=self.request.user)\
            .select_related('party', 'service_type')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exceptions=True)
        with transaction.atomic():
            record = serializer.save()
            party = record.party
            remaining_amount = record.remaining_amount

        if party.advance_balance > 0 and remaining_amount > 0:
            used = min(party.advance_balance, remaining_amount)

            AdvanceLedger.objects.create(
                party=party,
                record=record,
                amount=used,
                direction="OUT"
            )

            record.paid_amount += used
            record.save(update_fields=['paid_amount'])

            party.advance_balance -= used
            party.save(update_fields=['advance_balance'])

        return Response(status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        record = self.get_object()
        record_id = record.id
        before_state = RecordSerializer(record).data
        with transaction.atomic():
            party = record.party
            advanceledger_qs = list(AdvanceLedger.objects.filter(
                record=record, direction='OUT'))
            if advanceledger_qs:
                amount_to_return = sum(row.amount for row in advanceledger_qs)
                party.advance_balance += amount_to_return
                party.save(update_fields=['advance_balance'])

            for ledger in advanceledger_qs:
                ledger.delete()

                allocation_qs = list(Allocation.objects.filter(record=record))
                for row in allocation_qs:
                    row.delete()

            record.delete()
            AuditLog.objects.create(
                user=request.user,
                model_name='Record',
                object_id=record_id,
                action='DELETE',
                before=before_state,
                after=None,
                reason=request.data.get('reason')
            )
            return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        record = self.get_object()
        record_id = record.id
        before_state = RecordSerializer(record).data
        serializer = self.get_serializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            record = serializer.save()

            AuditLog.objects.create(
                user=request.user,
                model_name='Record',
                object_id=record_id,
                action='UPDATE',
                before=before_state,
                after=RecordSerializer(record).data,
                reason=request.data.get('reason')
            )
        return Response(self.get_serializer(record).data)


class NoteViewSet(ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Note.objects.filter(record__party__user=self.request.user,
                                   record_id=self.kwargs['record_pk'])

    def get_serializer_context(self):
        return {'record_id': self.kwargs['record_pk']}


class PaymentViewSet(ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsOwner, PaymentSaftyNet]

    def get_queryset(self):
        return Payment.objects.filter(party__user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            payment = serializer.save()
            remaining_payment = payment.amount
            unpaid_records = Record.objects.filter(party=payment.party,
                                                   paid_amount__lt=models.F('amount').order_by('record_date'))

            for r in unpaid_records:
                if remaining_payment <= 0:
                    break
                allocated = min(r.remaining_amount, remaining_payment)

                Allocation.objects.create(
                    payment=payment,
                    amount=allocated,
                    record=r
                )

                r.paid_amount += allocated
                r.save(update_fields=['paid_amount'])

                remaining_payment -= allocated

            if remaining_payment > 0:
                party = payment.party
                AdvanceLedger.objects.create(
                    party=party,
                    payment=payment,
                    amount=remaining_payment,
                    direction='IN'
                )
                party.advance_balance += remaining_payment
                party.save(update_fields=["advance_balance"])

        return Response(self.get_serializer(payment).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        payment = self.get_object()
        payment_id = payment.id
        with transaction.atomic():
            allocation_qs = list(Allocation.objects.select_related(
                'record').filter(payment=payment))
            for allocations in allocation_qs:
                allocations.record.paid_amount -= allocations.amount
                allocations.record.save(update_fields=['paid_amount'])
                allocations.delete()

            advanceledger_qs = list(AdvanceLedger.objects.filter(
                payment=payment, direction="IN"))
            if advanceledger_qs:
                party = payment.party
                total_advance = sum(
                    balance.amount for balance in advanceledger_qs)
                party.advance_balance -= total_advance
                party.save(update_fields=["advance_balance"])
            for ledger in advanceledger_qs:
                ledger.delete()

            before_state = PaymentSerializer(payment).date

            payment.delete()

            AuditLog.objects.create(
                user=request.user,
                model_name='Payment',
                object_id=payment_id,
                action='DELETE',
                before=before_state,
                after=None,
                reason=request.data.get('reason')
            )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        payment = self.get_object()
        payment_id = payment.id
        before_state = PaymentSerializer(payment).data
        serializer = self.get_serializer(payment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            allocation_qs = list(Allocation.objects.select_related(
                'record').filter(payment=payment))
            for allocation in allocation_qs:
                record = allocation.record
                record.paid_amount = max(
                    0,
                    record.paid_amount - allocation.amount
                )
                record.save(update_fields=['paid_amount'])
                allocation.delete()
                allocations.record.paid_amount -= allocations.amount
                allocations.record.save(update_fields=['paid_amount'])
                allocations.delete()

            advanceledger_qs = list(AdvanceLedger.objects.filter(
                payment=payment, direction="IN"))
            if advanceledger_qs:
                party = payment.party
                total_advance = sum(
                    balance.amount for balance in advanceledger_qs)
                party.advance_balance -= total_advance
                party.save(update_fields=["advance_balance"])
            for ledger in advanceledger_qs:
                ledger.delete()

            payment = serializer.save()
            remaining_payment = payment.amount
            unpaid_records = Record.objects.filter(party=payment.party,
                                                   paid_amount__lt=models.F('amount')).order_by('record_date')

            for r in unpaid_records:
                if remaining_payment <= 0:
                    break
                allocated = min(r.remaining_amount, remaining_payment)

                Allocation.objects.create(
                    payment=payment,
                    amount=allocated,
                    record=r
                )

                r.paid_amount += allocated
                r.save(update_fields=['paid_amount'])

                remaining_payment -= allocated

            if remaining_payment > 0:
                party = payment.party
                AdvanceLedger.objects.create(
                    party=party,
                    payment=payment,
                    amount=remaining_payment,
                    direction='IN'
                )
                party.advance_balance += remaining_payment
                party.save(update_fields=["advance_balance"])

            AuditLog.objects.create(
                user=request.user,
                model_name='Payment',
                object_id=payment_id,
                action='UPDATE',
                before=before_state,
                after=PaymentSerializer(payment).data,
                reason=request.data.get('reason')
            )

            return Response(self.get_serializer(payment).data, status=status.HTTP_200_OK)


class AllocationViewSet(ReadOnlyModelViewSet):
    serializer_class = AllocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Allocation.objects.filter(payment__party__user=self.request.user)


class AdvanceLedgerViewSet(ReadOnlyModelViewSet):
    serializer_class = AdvanceLedgerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AdvanceLedger.objects.filter(party__user=self.request.user)



class AuditLogViewSet(ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AuditLog.objects.filter(user= self.request.user)