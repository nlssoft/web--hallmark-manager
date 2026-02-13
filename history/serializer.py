from rest_framework import serializers
from django.utils.timezone import timedelta, localdate
from .models import *


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

    class Meta:
        model = Party
        fields = ['id',
                  'logo',
                  'first_name',
                  'last_name',
                  'number',
                  'email',
                  'address',
                  'due',
                  'advance_balance'
                  ]


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


class RecordUpdateSerializer(serializers.ModelSerializer):
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


class RecordSerializer(serializers.ModelSerializer):
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


class RecordCreateSerializer(serializers.ModelSerializer):
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


class PaymentSerializer(serializers.ModelSerializer):
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


class PaymentUpdateSerializer(serializers.ModelSerializer):
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

    def validate_payment_date(self, value):
        delta = localdate() - value

        if delta < timedelta(days=0):
            raise serializers.ValidationError(
                "Payment date cannot be in the future."
            )
        if delta > timedelta(days=7):
            raise serializers.ValidationError(
                "Cannot update payments older than 7 days."
            )
        return value


class AdvanceLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvanceLedger
        fields = ['id', 'party__logo', 'party__first_name', 'party__last_name', 'payment__payment_date',
                  'payment__amount', 'record__record_date', 'record__pcs', 'record__service_type__type__of_work'
                  'amount', 'direction', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['object_id', 'model_name', 'action',
                  'before', 'after', 'reason', 'created_at', 'party__first_name', 'party__last_name']


class PaymentRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = Payment_Request
        fields = ['id', 'created_by', 'record',
                  'requested_amount', 'created_at', 'status']
        read_only_fields = ['created_by',
                            'created_at', 'status', 'requested_amount', 'id']

    def validate(self, data):
        user = self.context['request'].user
        records = data['record']

        if user.parent:
            raise serializers.ValidationError(
                "Only employees can create requests.")

        partys = set()
        for record in records:

            if record.party.assigned_to != user:
                raise serializers.ValidationError("Invalid record.")

            if record.remaining_amount == 0:
                raise serializers.ValidationError('Record is already paid.')

            if Payment_Request.objects.filter(record=record, status='p').exists():
                raise serializers.ValidationError(
                    'Record is already requested.')

            partys.add(record.party.id)
            
        return data
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._apply_record_filter()

    def _apply_record_filter(self):
        request = self.context.get('request')

        if not request or not hasattr(request, 'user'):
            return

        user = request.user

        if user.parent:
            record_filter = {'party__assigned_to': user}

        else:
            record_filter = {'party__user': user}

        self.fields['record'].queryset = Record.objects.filter(
            **record_filter)

