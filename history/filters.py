from django_filters.rest_framework import FilterSet, filters
from .models import *


class PartyFilter(FilterSet):
    logo = filters.CharFilter(
        field_name='logo',
        lookup_expr='icontains'
    )

    first_name = filters.CharFilter(
        field_name='first_name',
        lookup_expr='icontains'
    )

    last_name = filters.CharFilter(
        field_name='last_name',
        lookup_expr='icontains'
    )

    class Meta:
        model = Party
        fields = [
            'first_name',
            'last_name',
            'logo'
        ]


class WorkRateFilter(FilterSet):
    party__logo = filters.CharFilter(
        field_name='party__logo',
        lookup_expr='icontains'
    )

    party__first_name = filters.CharFilter(
        field_name='party__first_name',
        lookup_expr='icontains'
    )

    party__last_name = filters.CharFilter(
        field_name='party__last_name',
        lookup_expr='icontains'
    )

    class Meta:
        model = Work_Rate
        fields = []


class RecordFilter(FilterSet):

    party__logo = filters.CharFilter(
        field_name='party__logo',
        lookup_expr='icontains'
    )

    party__first_name = filters.CharFilter(
        field_name='party__first_name',
        lookup_expr='icontains'
    )

    party__last_name = filters.CharFilter(
        field_name='party__last_name',
        lookup_expr='icontains'
    )

    service_type__type_of_work = filters.CharFilter(
        field_name='service_type__type_of_work',
        lookup_expr='icontains'
    )

    date_range = filters.DateFromToRangeFilter(
        field_name='record_date'
    )

    discount = filters.NumberFilter(
        field_name='discount',
        lookup_expr='gte'
    )

    paid_amount = filters.RangeFilter(
        field_name='paid_amount'
    )

    class Meta:
        model = Record
        fields = [
            'date_range',
            'discount',
            'paid_amount',
        ]


class PaymentFilter(FilterSet):

    party__logo = filters.CharFilter(
        field_name='party__logo',
        lookup_expr='icontains'
    )

    party__first_name = filters.CharFilter(
        field_name='party__first_name',
        lookup_expr='icontains'
    )

    party__last_name = filters.CharFilter(
        field_name='party__last_name',
        lookup_expr='icontains'
    )

    date_range = filters.DateFromToRangeFilter(
        field_name='payment_date'
    )

    class Meta:
        model = Payment
        fields = [
            'date_range',
        ]


class AllocationFilter(FilterSet):

    payment__party__logo = filters.CharFilter(
        field_name='payment__party__logo',
        lookup_expr='icontains'
    )

    payment__party__first_name = filters.CharFilter(
        field_name='payment__party__first_name',
        lookup_expr='icontains'
    )

    payment__party__last_name = filters.CharFilter(
        field_name='payment__party__last_name',
        lookup_expr='icontains'
    )

    payment = filters.NumberFilter(
        field_name='payment__id'
    )

    record = filters.NumberFilter(
        field_name='record__id'
    )

    payment__payment_date_range = filters.DateFromToRangeFilter(
        field_name='payment__payment_date'
    )

    class Meta:
        model = Allocation
        fields = [
            'payment',
            'record'
        ]


class AdvanceLedgerFilter(FilterSet):

    party__logo = filters.CharFilter(
        field_name='party__logo',
        lookup_expr='icontains'
    )

    party__first_name = filters.CharFilter(
        field_name='party__first_name',
        lookup_expr='icontains'
    )

    party__last_name = filters.CharFilter(
        field_name='party__last_name',
        lookup_expr='icontains'
    )

    direction = filters.CharFilter(
        field_name='direction',
        lookup_expr='icontains'
    )

    payment = filters.NumberFilter(
        field_name='payment__id'
    )

    record = filters.NumberFilter(
        field_name='record__id'
    )

    created_at_range = filters.DateFromToRangeFilter(
        field_name='created_at'
    )

    payment_out = filters.NumberFilter(
        method='filter_payment_out'
    )

    class Meta:
        model = AdvanceLedger
        fields = [
            'direction',
            'payment',
            'record',
            'created_at_range',
        ]

    def filter_payment_out(self, queryset, name, value):
        return queryset.filter(
            payment_id=value,
            direction='OUT'
        )


class AuditLogFilter(FilterSet):
    party__logo = filters.CharFilter(
        field_name='party__logo',
        lookup_expr='icontains'
    )

    model_name = filters.CharFilter(
        field_name='model_name',
        lookup_expr='icontains'
    )

    action = filters.CharFilter(
        field_name='action',
        lookup_expr='icontains'
    )

    party__first_name = filters.CharFilter(
        field_name='party__first_name',
        lookup_expr='icontains'
    )

    party__last_name = filters.CharFilter(
        field_name='party__last_name',
        lookup_expr='icontains'
    )

    created_at_range = filters.DateFromToRangeFilter(
        field_name='created_at'
    )

    object_id = filters.NumberFilter(
        field_name='object_id'
    )

    class Meta:
        model = AuditLog
        fields = [
            'action',
            'object_id',
            'created_at_range',
            'model_name'
        ]
