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
from .service import *

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
            record = serializer.save()
            RecordService.apply_advance(record)
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
            RecordService.rollback(record)

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

        with transaction.atomic():
            RecordService.adjust_after_update(
                record, serializer.validated_data)
            record = serializer.save()

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
            payment = PaymentService.create_payment(serializer)
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
            PaymentService.rollback_payment(payment)

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
            payment = PaymentService.update_payment(serializer)

            after_state = json.loads(
                json.dumps(
                    PaymentSerializer(payment).data,
                    cls=DjangoJSONEncoder
                )
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
