# from django.core.exceptions import ObjectDoesNotExist
# from django.db.models.functions import Concat
# from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView

import json
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Q, F, Value, Func, ExpressionWrapper, DecimalField
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import render, get_object_or_404
from django.db.models.aggregates import Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from django.utils.timezone import now
from datetime import timedelta

from .models import *
from .serializer import *
from .permissions import *
from .filters import *
from .pagination import *

# starting writing code from this point !!!


class PartyViewSet(ModelViewSet):
    serializer_class = PartySerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_class = PartyFilter
    pagination_class = NormalPagination

    def get_queryset(self):
        return Party.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        party = self.get_object()
        if (
            Record.objects.filter(party=party).exists()
            or
            Payment.objects.filter(party=party).exists()
        ):
            return Response({'error': 'party can not be deleted because its accoiated with records'},
                            status=status.HTTP_400_BAD_REQUEST)

        return super().destroy(request, *args, **kwargs)


class Work_RateViewSet(ModelViewSet):
    serializer_class = Work_RateSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_class = WorkRateFilter
    pagination_class = NormalPagination

    def get_queryset(self):
        return Work_Rate.objects.filter(party__user=self.request.user)\
            .select_related('party', 'service_type')


class Service_TypeViewSet(ReadOnlyModelViewSet):
    serializer_class = Service_TypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        today = now().date()
        month_start = today.replace(day=1)

        return Service_Type.objects.filter(user=self.request.user).annotate(
            used=Count('record',
                       filter=Q(
                           record__record_date__gte=month_start,
                           record__record_date__lte=today
                       ),
                       distinct=True
                       )
        )


class RecordViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_class = RecordFilter
    pagination_class = NormalPagination

    def get_serializer_class(self, *args, **kwargs):
        if self.action in ['list', 'retrieve']:
            return RecordSerializer
        elif self.action in ['update', 'partial_update']:
            return RecordUpdateSerializer
        elif self.action == 'create':
            return RecordCreateSerializer

        return RecordSerializer

    def get_queryset(self):
        return Record.objects.filter(
            party__user=self.request.user
        ).select_related(
            'party',
            'service_type'
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            self.perform_create(serializer)
            record = serializer.instance
            party = record.party

            remaining_amount = record.remaining_amount

            advanceledger_qs = AdvanceLedger.objects.filter(
                party=party,
                direction='IN',
                remaining_amount__gt=0
            ).order_by(
                'created_at')

            for entry in advanceledger_qs:
                if remaining_amount <= 0:
                    break

                used = min(remaining_amount, entry.remaining_amount)

                AdvanceLedger.objects.create(
                    party=party,
                    payment=entry.payment,
                    record=record,
                    amount=used,
                    remaining_amount=0,
                    direction='OUT'
                )

                entry.remaining_amount -= used
                entry.save(update_fields=['remaining_amount'])

                record.paid_amount += used
                remaining_amount -= used

            record.save(update_fields=['paid_amount'])

            return Response(self.get_serializer(record).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        record = self.get_object()
        record_id = record.id

        before_state = json.loads(
            json.dumps(
                RecordSerializer(record).data,
                cls=DjangoJSONEncoder
            )
        )

        with transaction.atomic():
            party = record.party
            advanceledger_qs = list(AdvanceLedger.objects.filter(
                record=record, direction='OUT'))

            for ledger in advanceledger_qs:
                AdvanceLedger.objects.filter(
                    payment=ledger.payment,
                    party=party,
                    direction="IN"
                ).update(
                    remaining_amount=F('remaining_amount') + ledger.amount
                )
                ledger.delete()

            allocation_qs = list(Allocation.objects.filter(record=record))
            for row in allocation_qs:
                AdvanceLedger.objects.create(
                    party=party,
                    payment=row.payment,
                    record=None,
                    amount=row.amount,
                    remaining_amount=row.amount,
                    direction="IN"
                )
                row.delete()

            AuditLog.objects.create(
                user=request.user,
                model_name='Record',
                object_id=record_id,
                action='DELETE',
                before=before_state,
                after=None,
                party=record.party

            )
            record.delete()

            return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        record = self.get_object()
        record_id = record.id

        before_state = json.loads(
            json.dumps(RecordSerializer(record).data, cls=DjangoJSONEncoder)
        )

        serializer = self.get_serializer(
            record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Calculating new total -
        new_pcs = serializer.validated_data.get('pcs', record.pcs)
        new_rate = serializer.validated_data.get('rate', record.rate)
        new_discount = serializer.validated_data.get(
            'discount', record.discount)
        new_amount = (new_rate * new_pcs) - new_discount

        with transaction.atomic():
            # If the new amount is less than what was already paid, we have a surplus
            if new_amount < record.paid_amount:
                surplus = record.paid_amount - new_amount

                # 1. Handle excess from AdvanceLedger (OUT entries)
                # We reverse the 'OUT' entries and add back to the 'IN' remaining_amount
                ledger_out_entries = AdvanceLedger.objects.filter(
                    record=record,
                    direction='OUT'
                ).order_by('-created_at')

                for out_entry in ledger_out_entries:
                    if surplus <= 0:
                        break

                    refund_from_this = min(surplus, out_entry.amount)

                    # Find the original 'IN' entry to put money back
                    AdvanceLedger.objects.filter(
                        payment=out_entry.payment,
                        direction='IN'
                    ).update(remaining_amount=F('remaining_amount') + refund_from_this)

                    # Reduce the OUT entry amount or delete if fully reversed
                    if refund_from_this == out_entry.amount:
                        out_entry.delete()
                    else:
                        out_entry.amount -= refund_from_this
                        out_entry.save(update_fields=['amount'])

                    surplus -= refund_from_this

                # 2. Handle excess from direct Allocations
                # If surplus still exists, it means direct payments need to become Advance 'IN'
                if surplus > 0:
                    allocations = Allocation.objects.filter(
                        record=record).order_by('-id')
                    for alloc in allocations:
                        if surplus <= 0:
                            break

                        refund_alloc = min(surplus, alloc.amount)

                        # Convert this allocation into a new AdvanceLedger 'IN' entry
                        AdvanceLedger.objects.create(
                            party=record.party,
                            payment=alloc.payment,
                            amount=refund_alloc,
                            remaining_amount=refund_alloc,
                            direction='IN'
                        )

                        # Adjust or delete the allocation
                        if refund_alloc == alloc.amount:
                            alloc.delete()
                        else:
                            alloc.amount -= refund_alloc
                            alloc.save(update_fields=['amount'])

                        surplus -= refund_alloc

                # Update the record's paid_amount to match the new max possible
                record.paid_amount = new_amount

            # Save the actual model changes
            record = serializer.save()

            # Audit Logging
            after_state = json.loads(
                json.dumps(RecordSerializer(record).data,
                           cls=DjangoJSONEncoder)
            )
            AuditLog.objects.create(
                user=request.user,
                model_name='Record',
                object_id=record_id,
                action='UPDATE',
                before=before_state,
                after=after_state,
                reason=request.data.get('reason'),
                party=record.party
            )

        return Response(self.get_serializer(record).data, status=status.HTTP_200_OK)


class PaymentViewSet(ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsOwner, PaymentSaftyNet]
    filter_backends = [DjangoFilterBackend]
    filterset_class = PaymentFilter
    pagination_class = NormalPagination

    def get_queryset(self):
        return Payment.objects.filter(party__user=self.request.user)\
            .select_related('party')

    def get_serializer_class(self):

        if self.action in ['list', 'retrieve', 'create']:
            return PaymentSerializer

        elif self.action in ['update', 'partial_update']:
            return PaymentUpdateSerializer

        return PaymentSerializer

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():

            payment = serializer.save()

            remaining_payment = payment.amount

            unpaid_records = Record.objects.filter(party=payment.party,
                                                   paid_amount__lt=ExpressionWrapper(
                                                       F('pcs') * F('rate'),
                                                       output_field=DecimalField()
                                                   )
                                                   ).order_by('record_date')

            for record in unpaid_records:
                if remaining_payment <= 0:
                    break
                allocated = min(record.remaining_amount, remaining_payment)

                Allocation.objects.create(
                    payment=payment,
                    amount=allocated,
                    record=record
                )

                record.paid_amount += allocated
                record.save(update_fields=['paid_amount'])

                remaining_payment -= allocated

            if remaining_payment > 0:
                party = payment.party

                AdvanceLedger.objects.create(
                    party=party,
                    payment=payment,
                    amount=remaining_payment,
                    remaining_amount=remaining_payment,
                    direction='IN'
                )

            return Response(self.get_serializer(payment).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        payment = self.get_object()

        before_state = json.loads(
            json.dumps(
                PaymentSerializer(payment).data,
                cls=DjangoJSONEncoder
            )
        )

        with transaction.atomic():

            allocation_qs = list(Allocation.objects.select_related(
                'record').filter(payment=payment))

            for allocations in allocation_qs:
                record = allocations.record
                record.paid_amount = max(
                    0,
                    record.paid_amount - allocations.amount
                )

                record.save(update_fields=['paid_amount'])
                allocations.delete()

            advanceledger_qs = list(AdvanceLedger.objects.filter(
                payment=payment, direction="IN"))

            if advanceledger_qs:

                for ledger in advanceledger_qs:
                    ledger.delete()

            AuditLog.objects.create(
                user=request.user,
                model_name='Payment',
                object_id=payment.id,
                action='DELETE',
                before=before_state,
                after=None,
                party=payment.party
            )

            payment.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        payment = self.get_object()

        payment_id = payment.id

        before_state = json.loads(
            json.dumps(
                PaymentSerializer(payment).data,
                cls=DjangoJSONEncoder
            )
        )

        serializer = self.get_serializer(
            payment,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        with transaction.atomic():

            allocation_qs = list(
                Allocation.objects.select_related('record').filter(payment=payment))

            for allocation in allocation_qs:
                record = allocation.record
                record.paid_amount = max(
                    0,
                    record.paid_amount - allocation.amount
                )

                record.save(update_fields=['paid_amount'])
                allocation.delete()

            advanceledger_qs = list(
                AdvanceLedger.objects.filter(
                    payment=payment,
                    direction="IN"
                )
            )

            if advanceledger_qs:

                for ledger in advanceledger_qs:
                    ledger.delete()

            payment = serializer.save()

            after_state = json.loads(
                json.dumps(
                    PaymentSerializer(payment).data,
                    cls=DjangoJSONEncoder
                )
            )

            remaining_payment = payment.amount

            unpaid_records = Record.objects.filter(party=payment.party,
                                                   paid_amount__lt=ExpressionWrapper(
                                                       F('pcs') * F('rate'),
                                                       output_field=DecimalField()
                                                   )
                                                   ).order_by('record_date')

            for record in unpaid_records:
                if remaining_payment <= 0:
                    break
                allocated = min(record.remaining_amount, remaining_payment)

                Allocation.objects.create(
                    payment=payment,
                    amount=allocated,
                    record=record
                )

                record.paid_amount += allocated
                record.save(update_fields=['paid_amount'])

                remaining_payment -= allocated

            if remaining_payment > 0:
                party = payment.party

                AdvanceLedger.objects.create(
                    party=party,
                    payment=payment,
                    amount=remaining_payment,
                    remaining_amount=remaining_payment,
                    direction='IN'
                )

            AuditLog.objects.create(
                user=request.user,
                model_name='Payment',
                object_id=payment_id,
                action='UPDATE',
                before=before_state,
                after=after_state,
                reason=request.data.get('reason'),
                party=payment.party
            )

            return Response(self.get_serializer(payment).data, status=status.HTTP_200_OK)


class AllocationViewSet(ReadOnlyModelViewSet):
    serializer_class = AllocationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = AllocationFilter
    pagination_class = NormalPagination

    def get_queryset(self):
        return Allocation.objects.filter(payment__party__user=self.request.user)


class AdvanceLedgerViewSet(ReadOnlyModelViewSet):
    serializer_class = AdvanceLedgerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = AdvanceLedgerFilter
    pagination_class = NormalPagination

    def get_queryset(self):
        return AdvanceLedger.objects.filter(party__user=self.request.user)


class AuditLogViewSet(ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = AuditLogFilter
    pagination_class = NormalPagination

    def get_queryset(self):
        return AuditLog.objects.filter(user=self.request.user)\
            .select_related('party').order_by('-created_at', '-pk')
