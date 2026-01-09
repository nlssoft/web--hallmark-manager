from django_filters.rest_framework import FilterSet, filters
from .models import Record


class RecordFilter(FilterSet):
    amount = filters.NumberFilter(field_name='amount', lookup_expr='gte')
    amount_lt = filters.NumberFilter(field_name='amount', lookup_expr='lte')

    class Meta:
        model = Record
        fields = {
            'record_date': ['range']
        }
