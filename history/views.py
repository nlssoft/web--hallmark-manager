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
from .models import Party, Service_Type, Work_Rate, Payment, Record, Allocation, Note
from .serializer import PartySerializer, Service_TypeSerializer, Work_RateSerializer, \
    RecordSerializer, NoteSerializer, PaymentSerializer, Allocation

# starting writing code from this point !!!


class PartyViewSet(ModelViewSet):
    serializer_class = PartySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Party.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        party = self.get_object()
        if Record.objects.filter(party=party).exists():
            return Response({'error': 'party can not be deleted because its accoiated with records'})

        return super().destroy(request, *args, **kwargs)


class Work_RateViewSet(ModelViewSet):
    serializer_class = Work_RateSerializer
    permission_classes = [IsAuthenticated]

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
    serializer_class = RecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['party_id', 'service_type_id']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Record.objects.filter(party__user=self.request.user)\
            .select_related('party', 'service_type')


class NoteViewSet(ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(record__party__user=self.request.user,
                                   record_id=self.kwargs['record_pk'])

    def get_serializer_context(self):
        return {'record_id': self.kwargs['record_pk']}


class PaymentViewSet(ModelViewSet):
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(party__user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
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

            return Response(self.get_serializer(payment).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        payment = self.get_object()
        with transaction.atomic():
            allocation_qs = Allocation.objects.filter(payment=payment)
            for allocations in allocation_qs:
                allocations.record.paid_amount -= allocations.amount
                allocations.record.save(update_fields=['paid_amount'])
                allocations.delete()
            payment.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        payment = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            allocation_qs = Allocation.objects.filter(payment=payment)
            for allocations in allocation_qs:
                allocations.record.paid_amount -= allocations.amount
                allocations.record.save(update_fields=['paid_amount'])
                allocations.delete()

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

            return Response(self.get_serializer(payment).data, status=status.HTTP_200_OK)
