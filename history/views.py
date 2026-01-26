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
from datetime import  timedelta

from .models import *
from .serializer import *
from .permissions import *
from .filters import *

# starting writing code from this point !!!


class PartyViewSet(ModelViewSet):
    serializer_class = PartySerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_class= PartyFilter

    def get_queryset(self):
        return Party.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        party = self.get_object()
        if Record.objects.filter(party=party).exists():
            return Response({'error': 'party can not be deleted because its accoiated with records'})

        return super().destroy(request, *args, **kwargs)


class Work_RateViewSet(ModelViewSet):
    serializer_class = Work_RateSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_class = WorkRateFilter

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
            filter= Q(
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
                party = party,
                direction = 'IN',
                remaining_amount__gt= 0
            ).order_by(
                'created_at')

            for entry in advanceledger_qs:
                if remaining_amount <= 0:
                    break

                used = min(remaining_amount, entry.remaining_amount)

                AdvanceLedger.objects.create(
                    party = party,
                    Payment = entry.payment,
                    record = record,
                    amount = used,
                    remaining_amount = 0,
                    direction = 'OUT'
                )

                entry.remaining_amount -= used
                entry.save(update_fields=['remining_amount'])

                record.paid_amount += used
                record.save(update_fields=['paid_amount'])

                remaining_amount -= used


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
                        Payment = ledger.payment,
                        party = party,
                        direction = "IN"
                    ).update(
                        remaining_amount = F('remaining_amount') + ledger.amount
                        )
                    ledger.delete()


            allocation_qs = list(Allocation.objects.filter(record=record))
            for row in allocation_qs:
                AdvanceLedger.objects.create(
                    party = party,
                    Payment = row.payment,
                    record = None,
                    amount = row.amount,
                    remaining_amount = row.amount,
                    direction = "IN"
                )
                row.delete()

            AuditLog.objects.create(
                user = request.user,
                model_name = 'Record',
                object_id = record_id,
                action = 'DELETE',
                before = before_state,
                after = None

            )
            record.delete()

            return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        record = self.get_object()
        record_id = record.id

        before_state = json.loads(
            json.dumps(
                RecordSerializer(record).data,
                cls=DjangoJSONEncoder
            )
        )

        serializer = self.get_serializer(
            record, 
            data=request.data, 
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        new_pcs  =serializer.validated_data.get('pcs')
        new_rate = serializer.validated_data.get('rate')
        new_amount = new_rate * new_pcs

        if new_amount is not None and new_amount < record.paid_amount:
            return Response(
                {
                'error' : "new amount can't be more than paid amount",
                'new amount' : f'{new_amount}',
                'paid amount' : f"{record.paid_amount}"
            },
            status= status.HTTP_400_BAD_REQUEST
        )
        

        with transaction.atomic():
            record = serializer.save()

            after_state = json.loads(
                json.dumps(
                    RecordSerializer(record).data,
                    cls=DjangoJSONEncoder
                )
            )

            AuditLog.objects.create(
                user=request.user,
                model_name='Record',
                object_id=record_id,
                action='UPDATE',
                before=before_state,
                after=after_state,
                reason=request.data.get('reason')
            )
        return Response(self.get_serializer(record).data, status=status.HTTP_202_ACCEPTED)


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
    filter_backends = [DjangoFilterBackend]
    filterset_class = PaymentFilter

    def get_queryset(self):
        return Payment.objects.filter(party__user=self.request.user)

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
                    remaining_amount = remaining_payment,
                    direction='IN'
                )


            return Response(self.get_serializer(payment).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        payment = self.get_object()

        before_state = json.loads(
            json.dumps(
                PaymentSerializer(payment).data, 
                cls= DjangoJSONEncoder
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
                    remaining_amount= remaining_payment,
                    direction='IN'
                )


            AuditLog.objects.create(
                user=request.user,
                model_name='Payment',
                object_id=payment_id,
                action='UPDATE',
                before=before_state,
                after=after_state,
                reason=request.data.get('reason')
            )

            return Response(self.get_serializer(payment).data, status=status.HTTP_200_OK)


class AllocationViewSet(ReadOnlyModelViewSet):
    serializer_class = AllocationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = AllocationFilter

    def get_queryset(self):
        return Allocation.objects.filter(payment__party__user=self.request.user)


class AdvanceLedgerViewSet(ReadOnlyModelViewSet):
    serializer_class = AdvanceLedgerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = AdvanceLedgerFilter
    def get_queryset(self):
        return AdvanceLedger.objects.filter(party__user=self.request.user)


class AuditLogViewSet(ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AuditLog.objects.filter(user=self.request.user)
    
