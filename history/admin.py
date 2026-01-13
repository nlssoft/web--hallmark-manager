from typing import Any
from django.db.models.aggregates import Count
from django.contrib import admin
from django.db.models import Q, F, Value, Func, ExpressionWrapper, DecimalField
from django.db.models.query import QuerySet
from django.http import HttpRequest
from django.urls import reverse
from django.utils.html import format_html
from django.utils.http import urlencode
from . import models


class Work_Rate_Inline(admin.TabularInline):
    model = models.Work_Rate
    extra = 5


@admin.register(models.Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'number', 'email', 'address']
    list_editable = ['number', 'address']
    list_per_page = 10
    search_fields = ['first_name__istartswith', 'last_name__istartswith']
    list_select_related = ['user']
    inlines = [Work_Rate_Inline]


@admin.register(models.Service_Type)
class Service_TypeAdmin(admin.ModelAdmin):
    list_display = ['type_of_work', 'used']
    list_per_page = 10

    def used(self, obj):

        url = (
            reverse('admin:history_record_changelist')
            + '?'
            + urlencode({
                'service_type__id': str(obj.id)
            }))

        return format_html('<a href={}> {}</a>', url, obj.used)

    def get_queryset(self, request: HttpRequest) -> QuerySet:
        return super().get_queryset(request).annotate(
            used=Count('record')

        )


@admin.register(models.Work_Rate)
class Work_RateAdmin(admin.ModelAdmin):
    actions = ['full_rate']
    autocomplete_fields = ['party']
    list_display = ['party', 'service_type', 'rate']
    list_editable = ['rate']
    list_per_page = 10
    list_select_related = ['party', 'service_type']
    search_fields = ['party__first_name',
                     'party__last_name']

    @admin.action(description='set defual rate')
    def full_rate(self, request, queryset):
        queryset.update(rate=1000)
        self.message_user(request, 'rate were sucsusfully updated')


class Record_filter(admin.SimpleListFilter):
    title = 'custom'
    parameter_name = 'custom'

    def lookups(self, request: Any, model_admin: Any):
        return [
            ('<300', 'lower then 300rs')
        ]

    def queryset(self, request: Any, queryset: QuerySet[Any]):
        if self.value() == '<300':
            return queryset.filter(amount__lt=300)


@admin.register(models.Record)
class RecordAdmin(admin.ModelAdmin):
    autocomplete_fields = ['party']
    list_display = ['party', 'service_type', 'rate',
                    'record_date', 'pcs', 'discount', 'amount']
    list_editable = ['rate', 'pcs', 'discount', 'record_date']
    list_filter = ['record_date', 'party', 'service_type', Record_filter]
    list_per_page = 10
    list_select_related = ['party', 'service_type']
    search_fields = ['party__first_name__istartswith',
                     'party__last_name__istartswith']

    @admin.display(ordering='amount')
    def amount(self, obj):
        return obj.amount

    def get_queryset(self, request: HttpRequest) -> QuerySet:
        return super().get_queryset(request).annotate(
            amount=ExpressionWrapper(
                (F('rate') * F('pcs')) - F('discount'), output_field=DecimalField())
        )


@admin.register(models.Payment)
class PaymentAdmin(admin.ModelAdmin):
    autocomplete_fields = ['party']
    list_display = ['party', 'amount', 'payment_date']
    list_editable = ['amount']
    list_per_page = 10
    list_select_related = ['party']
    search_fields = ['party__first_name__istartswith',
                     'party__last_name__istartswith']
