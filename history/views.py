# from django.core.exceptions import ObjectDoesNotExist
# from django.db.models.functions import Concat
# from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView

import json
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Q, F, Value, Func, ExpressionWrapper, DecimalField, aggregates, Sum
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import render, get_object_or_404
from django.db.models.aggregates import Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
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


class SummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def spine(self, qs, party, party_id, date_field, date_from, date_to):
        if party == "single":
            qs = qs.filter(party_id=party_id)

        if date_from:
            qs = qs.filter(**{f"{date_field}__gte": date_from})

        if date_to:
            qs = qs.filter(**{f"{date_field}__lte": date_to})

        return qs

    def get(self, request):
        user = request.user
        params = request.query_params

        party = params.get("party")              # all | single
        party_id = params.get("party_id")
        date_from = params.get("date_from")
        date_to = params.get("date_to")
        data_type = params.get("type", "").lower()

        page = int(params.get("page", 1))
        page_size = int(params.get("page_size", 20))
        offset = (page - 1) * page_size
        limit = offset + page_size

        if data_type == "record":
            qs = Record.objects.filter(party__user=user)
            qs = self.spine(qs, party, party_id,
                            "record_date", date_from, date_to)

            qs = qs.annotate(
                amount=ExpressionWrapper(
                    F("rate") * F("pcs") - F("discount"),
                    output_field=DecimalField()
                ),
                remaining_amount=ExpressionWrapper(
                    (F("rate") * F("pcs") - F("discount")) - F("paid_amount"),
                    output_field=DecimalField()
                )
            )

            status = params.get("status", "").lower()

            if status == "paid":
                qs = qs.filter(remaining_amount=0)
            elif status == "unpaid":
                qs = qs.filter(remaining_amount__gt=0)

            total_count = qs.count()

            summary = qs.aggregate(
                total_amount=Sum('amount'),
                unpaid_amount=Sum('remaining_amount'),
                total_pcs=Sum('pcs')
            )

            service_type_summary = qs.values('service_type__type_of_work').annotate(
                total_amount=Sum('amount'),
                unpaid_amount=Sum('remaining_amount'),
                total_pcs=Sum('pcs')
            )

            data = list(qs.order_by("record_date")[offset:limit].values(
                "id", "record_date", 'pcs', 'rate', "amount", 'discount', 'paid_amount', 'remaining_amount',
                first_name=F('party__first_name'),
                last_name=F('party__last_name'),
            ))

            return Response(
                {
                    "type": "Record",
                    "summary": {
                        "total_record": total_count,
                        'total_amount': summary['total_amount'] or 0,
                        "unpaid_amount": summary['unpaid_amount'] or 0,
                        'total_pcs': summary['total_pcs'] or 0,
                        'service_type_summary': list(service_type_summary)
                    },
                    "pagination": {
                        'page': page,
                        'page_size': page_size,
                        'total': total_count
                    }, "result": data,
                }
            )

            # ================= PAYMENT =================

        elif data_type == 'payment':
            qs = Payment.objects.filter(party__user=user)
            qs = self.spine(qs, party, party_id,
                            'payment_date', date_from, date_to)

            total_payments = qs.count()
            total_paid = qs.aggregate(total=Sum('amount'))['total'] or 0

            data = list(qs.order_by('payment_date')[offset:limit].values(
                "id", 'payment_date', 'amount',
                first_name=F('party__first_name'),
                last_name=F('party__last_name'),
            ))

            return Response({
                'type': 'payment',
                'summary': {
                    'total_payments': total_payments,
                    'total_paid': total_paid,
                },
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total': total_payments,
                },
                'result': data
            })

            # ================= ADVANCE =================

        elif data_type == 'advance_ledger':
            qs = AdvanceLedger.objects.filter(party__user=user)
            qs = self.spine(qs, party, party_id,
                            'created_at', date_from, date_to)

            direction = params.get('direction')

            total_in = qs.filter(direction="IN").aggregate(
                total=Sum('amount'))['total'] or 0
            total_out = qs.filter(direction='OUT').aggregate(
                total=Sum('amount'))['total'] or 0

            if direction in ['IN', 'OUT']:
                qs = qs.filter(direction=direction)

            total_ledger = qs.count()

            data = list(qs.order_by('created_at')[offset:limit].values(
                "id", "created_at", "direction", "amount", 'remaining_amount', 'payment_id', 'record_id',
                first_name=F('party__first_name'),
                last_name=F('party__last_name'),
                payment_date=F('payment__payment_date'),
                payment_amount=F('payment__amount'),
                record_date=F('record__record_date'),
                record_pcs=F('record__pcs'),
                record_type_of_work=F('record__service_type__type_of_work')
            ))

            return Response({
                "type": "advance_ledger",
                "summary": {
                    "total_in": total_in,
                    "total_out": total_out,
                    "net_balance": total_in - total_out,
                },
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total_ledger,
                },
                "results": data,
            })

            # ================= AUDIT =================

        elif data_type == "audit_log":
            qs = AuditLog.objects.filter(user=user)

            model = params.get("model")
            action = params.get("action")

            if model:
                qs = qs.filter(model_name__iexact=model)
            if action:
                qs = qs.filter(action__iexact=action)

            total_count = qs.count()

            data = list(qs.order_by("-created_at")[offset:limit].values(
                "id", 'object_id', "model_name", "action", "created_at", 'before', 'after',
                first_name=F('party__first_name'),
                last_name=F('party__last_name'),
            ))

            return Response({
                "type": "audit",
                "summary": {
                    "total_logs": total_count
                },
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total_count,
                },
                "results": data,
            })

        return Response({"error": "Invalid type"}, status=400)
