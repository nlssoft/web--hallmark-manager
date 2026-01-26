from django_filters.rest_framework import FilterSet, filters
from .models import *

class PartyFilter(FilterSet):
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
            'last_name'
        ]


class WorkRateFilter(FilterSet):
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
        fields = [
            'party__first_name',
            'party__last_name'
        ]


class RecordFilter(FilterSet):

    party__first_name = filters.CharFilter(
        field_name='party__first_name',
        lookup_expr='icontains'
        )

    party__last_name = filters.CharFilter(
        field_name='party__last_name',
        lookup_expr='icontains'
        )
    
    service_type__type_of_work = filters.CharFilter(
        field_name= 'service_type__type_of_work',
        lookup_expr= 'icontains'
    )

    date = filters.DateFilter(
        field_name= 'record_date'
    )

    date_range = filters.DateFromToRangeFilter(
        field_name= 'record_date'
    )

    discount = filters.NumberFilter(
        field_name= 'discount',
        lookup_expr= 'gte'
    )

    paid_amount_gt = filters.RangeFilter(
        field_name='paid_amount',
        lookup_expr='gte')
    

    paid_amount_lt = filters.NumberFilter(
        field_name='paid_amount',
        lookup_expr='lte'
    )


    class Meta:
        model = Record
        fields = [
            'party__first_name',
            'party__last_name',
            'service_type__type_of_work',
            'date',
            'date_range',
            'discount',
            'paid_amount_gt',
            'paid_amount_lt'

        ]


class PaymentFilter(FilterSet):
    
    party__first_name = filters.CharFilter(
        field_name='party__first_name',
        lookup_expr='icontains'
        )

    party__last_name = filters.CharFilter(
        field_name='party__last_name',
        lookup_expr='icontains'
        )
    
    date = filters.DateFilter(
        field_name= 'payment_date'
    )

    date_range = filters.DateFromToRangeFilter(
        field_name= 'payment_date'
    )


    class Meta:
        model= Payment
        fields = [
            'party__first_name',
            'party__last_name',
            'date',
            'date_range',
        ]


class AllocationFilter(FilterSet):
    payment__party__first_name = filters.CharFilter(
        field_name='payment__party__first_name',
        lookup_expr='icontains'
        )

    payment__party__last_name = filters.CharFilter(
        field_name='payment__party__last_name',
        lookup_expr='icontains'
        )
    
    payment = filters.NumberFilter(
        field_name= 'payment__id'
    )

    record = filters.NumberFilter(
        field_name= 'record__id'
    )

    payment__payment_date = filters.DateFilter(
        field_name= 'payment__payment_date'
    )

    payment__payment_date_range = filters.DateFromToRangeFilter(
        field_name= 'payment__payment_date'
    )



    class Meta:
        model= Allocation
        fields = [
            'payment__party__first_name',
            'payment__party__last_name',
            'payment',
            'record',
            'payment__payment_date',
            'payment__payment_date_range'
        ]



class AdvanceLedgerFilter(FilterSet):
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
        lookup_expr= 'icontains'
    )


    payment = filters.NumberFilter(
        field_name= 'payment__id'
    )

    record = filters.NumberFilter(
        field_name= 'record__id'
    )

    
    created_at = filters.DateFilter(
        field_name= 'created_at'
    )

    created_at_range = filters.DateFromToRangeFilter(
        field_name= 'created_at'
    )

    payment_out = filters.NumberFilter(
        method= 'filter_payment_out'
    )

    class Meta:
        model = AdvanceLedger
        fields = [
            'party__first_name',
            'party__last_name',
            'direction',
            'payment',
            'record',
            'created_at',
            'created_at_range',
        ]

    def filter_payment_out(self, queryset, name, value):
        return queryset.filter(
            payment_id = value,
            direction = 'OUT'
        )