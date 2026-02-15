from rest_framework import serializers
from django.utils.timezone import timedelta, localdate
from .models import *
from django.contrib.auth import get_user_model
from django.db.models import F, ExpressionWrapper, DecimalField, Exists, OuterRef


class PartySerializer(serializers.ModelSerializer):

    due = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,

    )

    advance_balance = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,

    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')

        if request and not request.user.parent:
            user = get_user_model()
            self.fields['assigned_to'].queryset = user.objects.filter(
                parent=request.user)

    class Meta:
        model = Party
        fields = ['id',
                  'logo',
                  'first_name',
                  'last_name',
                  'number',
                  'email',
                  'address',
                  'assigned_to',
                  'due',
                  'advance_balance',

                  ]

        extra_kwargs = {
            'assigned_to': {'required': False, "allow_null": True}
        }

    def validate_assigned_to(self, value):
        request = self.context.get('request')
        if not request:
            return value
        user = request.user

        if user.parent and value is not None:
            raise serializers.ValidationError('Only Admin can assign party.')

        if value is not None and value.parent_id != user.id:
            raise serializers.ValidationError(
                'You can only assign your own employee.')

        return value


class Service_TypeSerializer(serializers.ModelSerializer):
    used = serializers.IntegerField(read_only=True)

    class Meta:
        model = Service_Type
        fields = ['id', 'type_of_work', 'used']


class Work_RateSerializer(serializers.ModelSerializer):
    rate = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0
    )

    party__first_name = serializers.CharField(
        source='party.first_name',
        read_only=True
    )

    party__last_name = serializers.CharField(
        source='party.last_name',
        read_only=True
    )

    party__logo = serializers.CharField(
        source='party.logo',
        read_only=True
    )

    party__address = serializers.CharField(
        source='party.address',
        read_only=True
    )

    class Meta:
        model = Work_Rate
        fields = ['id', 'party__first_name', 'party__last_name',
                  'party__logo', 'party__address', 'rate', 'party', 'service_type']


class BaseRecordSerializer(serializers.ModelSerializer):

    def validate(self, attrs):
        rate = attrs.get("rate")
        pcs = attrs.get("pcs")
        discount = attrs.get("discount")

        if discount is not None and rate is not None and pcs is not None:
            max_discount = rate * pcs
            if discount > max_discount:
                raise serializers.ValidationError({
                    "discount": f"Discount cannot exceed {max_discount}"
                })

        return attrs

    def create(self, validated_data):
        rate_mode = validated_data.pop('rate_mode')

        if rate_mode == 'system':
            work_rate = Work_Rate.objects.filter(
                party=validated_data['party'],
                service_type=validated_data['service_type']
            ).first()

            if not work_rate:
                raise serializers.ValidationError(
                    {'rate': "This party dose't have a rate taied to this service"}
                )

            if work_rate.rate > 0:
                validated_data['rate'] = work_rate.rate

        return super().create(validated_data)


class RecordSerializer(BaseRecordSerializer):
    amount = serializers.DecimalField(
        read_only=True,
        max_digits=10,
        decimal_places=2
    )

    party__first_name = serializers.CharField(
        source='party.first_name',
        read_only=True
    )

    party__last_name = serializers.CharField(
        source='party.last_name',
        read_only=True
    )

    party__logo = serializers.CharField(
        source='party.logo',
        read_only=True
    )

    party__address = serializers.CharField(
        source='party.address',
        read_only=True
    )

    service_type__type_of_work = serializers.CharField(
        source='service_type.type_of_work',
        read_only=True
    )

    class Meta:
        model = Record
        fields = ['id', 'party', 'party__logo', 'party__first_name', 'party__last_name', 'party__address',
                  'service_type', 'service_type__type_of_work', 'rate',
                  'pcs', 'record_date', 'discount', 'amount', 'paid_amount']
        read_only_fields = ['paid_amount']


class RecordCreateSerializer(BaseRecordSerializer):
    rate_mode = serializers.ChoiceField(
        choices=['system', 'manual'],
        write_only=True
    )

    party__address = serializers.CharField(
        source='party.address',
        read_only=True
    )

    rate = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,   # 👈 key line
        min_value=0
    )

    discount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        required=False,
    )

    class Meta:
        model = Record
        fields = [
            'id',
            'party',
            'service_type',
            'pcs',
            'discount',
            'rate',
            'rate_mode',
            'record_date',
            'party__address'
        ]


class RecordUpdateSerializer(BaseRecordSerializer):
    rate = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        required=False
    )
    discount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        required=False
    )
    pcs = serializers.IntegerField(
        min_value=1,
        required=False
    )

    reason = serializers.CharField(
        max_length=255,
        required=False,
        write_only=True)

    class Meta:
        model = Record
        fields = ['rate', 'pcs', 'discount', 'reason']


class BasePaymentSerializer(serializers.ModelSerializer):
    def validate_payment_date(self, value):
        delta = localdate() - value

        if delta < timedelta(days=0):
            raise serializers.ValidationError(
                "Payment date cannot be in the future."
            )
        if delta > timedelta(days=7):
            raise serializers.ValidationError(
                "Cannot create payments older than 7 days."
            )
        return value


class PaymentSerializer(BasePaymentSerializer):
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=1)

    party__first_name = serializers.CharField(
        source='party.first_name',
        read_only=True
    )

    party__last_name = serializers.CharField(
        source='party.last_name',
        read_only=True
    )

    party__logo = serializers.CharField(
        source='party.logo',
        read_only=True
    )

    party__address = serializers.CharField(
        source='party.address',
        read_only=True
    )

    class Meta:
        model = Payment
        fields = ['id', 'party', 'party__logo', 'party__first_name',
                  'party__last_name', 'party__address', 'amount', 'payment_date']


class PaymentUpdateSerializer(BasePaymentSerializer):
    reason = serializers.CharField(
        max_length=255,
        required=False,
        write_only=True
    )

    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=1
    )

    payment_date = serializers.DateField(required=False)

    class Meta:
        model = Payment
        fields = ['id', 'amount', 'payment_date', 'reason']


class AdvanceLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvanceLedger
        fields = ['id', 'party__logo', 'party__first_name', 'party__last_name', 'payment__payment_date',
                  'payment__amount', 'record__record_date', 'record__pcs', 'record__service_type__type__of_work',
                  'amount', 'direction', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['object_id', 'model_name', 'action',
                  'before', 'after', 'reason', 'created_at', 'party__first_name', 'party__last_name']


class BasePaymentRequestSerilizer(serializers.ModelSerializer):

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user
        records = attrs.get('record', [])

        for record in records:
            if record.party.assigned_to != user:
                raise serializers.ValidationError("Invalid record.")

            if record.remaining_amount <= 0:
                raise serializers.ValidationError("Record is already paid.")

            if Payment_Request.objects.filter(record=record, status='P').exists():
                raise serializers.ValidationError(
                    "Record is already requested."
                )

            if Payment_Request.objects.filter(record=record, status='A').exists():
                raise serializers.ValidationError(
                    "Record is already paid."
                )

        return attrs

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._apply_record_filter()

    def _apply_record_filter(self):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return

        user = request.user

        if user.parent:
            base_qs = Record.objects.filter(party__assigned_to=user)
        else:
            base_qs = Record.objects.filter(party__user=user)

        base_qs = base_qs.annotate(
            not_paid=ExpressionWrapper((F('rate') * F('pcs')) -
                                       F('discount') - F('paid_amount'),
                                       output_field=DecimalField())
        ).filter(not_paid__gt=0)

        filtered_qs = base_qs.exclude(
            payment_request__status__in=["A", "P"]
        ).distinct()

        self.fields['record'].queryset = filtered_qs


class PaymentRequestSerializer(BasePaymentRequestSerilizer):

    class Meta:
        model = Payment_Request
        fields = ['id', 'created_by', 'record',
                  'requested_amount', 'created_at', 'status']
        read_only_fields = ['created_by',
                            'created_at', 'status', 'requested_amount', 'id']


class PaymentRequestCreateSerializer(BasePaymentRequestSerilizer):

    class Meta:
        model = Payment_Request
        fields = ['record']
