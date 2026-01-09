# from django.db import transaction
# from django.db.models.functions import Concat
# from django.core.exceptions import ObjectDoesNotExist

# from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
# from django.shortcuts import render, get_object_or_404

from django_filters.rest_framework import DjangoFilterBackend
from django.db.models.aggregates import Count
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, F, Value, Func, ExpressionWrapper, DecimalField
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from .models import Party, Service_type, Work_rate, Payment, Record, Allocation, Note
from .serializer import PartySerializer, Service_TypeSerializer, Work_RateSerializer, RecordSerializer, NoteSerializer
from .filters import RecordFilter


# starting writing code in views.py


class PartyViewSet(ModelViewSet):
    queryset = Party.objects.all()
    serializer_class = PartySerializer

    def destroy(self, request, *args, **kwargs):
        if Record.objects.filter(party_id=kwargs['pk']).count() > 0:
            return Response({'error': 'party can not be deleted because its accoiated with records'})

        return super().destroy(request, *args, **kwargs)


class Work_RateViewSet(ModelViewSet):
    queryset = Work_rate.objects.select_related(
        'party', 'service_type').all()
    serializer_class = Work_RateSerializer


class Service_TypeViewSet(ModelViewSet):
    queryset = Service_type.objects.annotate(
        used=Count('record')
    )
    serializer_class = Service_TypeSerializer


class RecordViewSet(ModelViewSet):
    queryset = Record.objects.annotate(
        amount=ExpressionWrapper(F('pcs') * F('rate'),
                                 output_field=DecimalField())
    ).select_related('party', 'service_type')

    serializer_class = RecordSerializer
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    filterset_class = RecordFilter
    search_fields = ['party__firstname']
    ordering_fields = ['record_date']


class NoteViewSet(ModelViewSet):
    serializer_class = NoteSerializer

    def get_queryset(self):
        return Note.objects.filter(record_id=self.kwargs['record_pk'])

    def get_serializer_context(self):
        return {'record_id': self.kwargs['record_pk']}
