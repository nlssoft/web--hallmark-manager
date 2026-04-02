from rest_framework import serializers
from django.utils.timezone import timedelta, localdate
from .models import *
from django.contrib.auth import get_user_model
from django.db.models import F, ExpressionWrapper, DecimalField, Exists, OuterRef
from  core.serializers import UserMiniSerializer

class PartySerializer(serializers.ModelSerializer):

    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    

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

    assigned_to = UserMiniSerializer(read_only=True)

    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(),
        source = 'assigned_to',
        write_only = True,
        required = False,
        allow_null = True,
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')
        user_model = get_user_model()

        if request:
            user = request.user

            if user.parent:
                # sub-user → cannot assign anyone
                self.fields['assigned_to_id'].queryset = user_model.objects.none()
            else:
                # admin → only their employees
                self.fields['assigned_to_id'].queryset = user_model.objects.filter(
                    parent=user
                )

    class Meta:
        model = Party
        fields = ['id',
                  'logo',
                  'full_name',
                  'first_name',
                  'last_name',
                  'number',
                  'email',
                  'address',
                  'assigned_to',
                  'assigned_to_id',
                  'due',
                  'advance_balance',
                  ]


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



#custom serializers
class PartyMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    class Meta:
        model = Party
        fields = ['id', 'full_name', 'first_name', 'last_name', 'logo', 'address']

class Service_TypeMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model= Service_Type
        fields = ['id', 'type_of_work']

class Work_RateSerializer(serializers.ModelSerializer):
    
    party = PartyMiniSerializer(read_only=True)
    service_type = Service_TypeMiniSerializer(read_only=True)  # fixed casing

    party_id = serializers.PrimaryKeyRelatedField(
        queryset=Party.objects.all(),
        source='party',
        write_only=True,
    )
    service_type_id = serializers.PrimaryKeyRelatedField(
        queryset=Service_Type.objects.all(),
        source='service_type',
        write_only=True,
    )
    rate = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0
    )

    class Meta:
        model = Work_Rate
        fields = ['id', 'rate', 'party', 'party_id', 'service_type', 'service_type_id']  # added write fields
        validators = [] 
        
    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and request.user.is_authenticated and not request.user.parent:
            # Admin only sees their own party in the dropdown
            fields['party_id'].queryset = Party.objects.filter(user=request.user)
            fields['service_type_id'].queryset = Service_Type.objects.filter(user=request.user) 
                                                                            
        return fields
    
    def validate(self, data):
        party = data.get('party') or getattr(self.instance, 'party', None)
        service_type = data.get('service_type') or getattr(self.instance, 'service_type', None)

        qs = Work_Rate.objects.filter(
            party=party,
            service_type=service_type
        )

        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "This service already has a rate for this party."
            )

        return data

class BaseRecordSerializer(serializers.ModelSerializer):
    party = PartyMiniSerializer(read_only=True)
    service_type = Service_TypeMiniSerializer(read_only=True)  # fixed casing

    party_id = serializers.PrimaryKeyRelatedField(
        queryset=Party.objects.all(),
        source='party',
        write_only=True,
    )
    service_type_id = serializers.PrimaryKeyRelatedField(
        queryset=Service_Type.objects.all(),
        source='service_type',
        write_only=True,
    )


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
    amount = serializers.DecimalField(
        read_only=True,
        max_digits=10,
        decimal_places=2
    )
    
    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")

        if request and request.user.is_authenticated and not request.user.parent:
            fields['Party_id'].queryset = Party.objects.filter(user=request.user)
            fields['service_type_id'].queryset = Service_Type.objects.filter(user=request.user)
        
        return fields
    
    def validate(self, attrs):
        rate = attrs.get("rate", getattr(self.instance, 'rate', None))
        pcs = attrs.get("pcs", getattr(self.instance, "pcs", None))
        discount = attrs.get("discount", getattr(self.instance, "discount", None))


        if discount is not None and rate is not None and pcs is not None:
            max_discount = rate * pcs
            if discount > max_discount:
                raise serializers.ValidationError({
                    "discount": f"Discount cannot exceed {max_discount}"
                })
        rate_mode = attrs.get('rate_mode')
        if rate_mode == 'manual' and rate is None:
            raise serializers.ValidationError({
                'rate': 'Rate is required when rate mode is manual.'
            })

        return attrs

    def create(self, validated_data):
        rate_mode = validated_data.pop("rate_mode")

        if rate_mode == "system":
            work_rate = Work_Rate.objects.filter(
                party=validated_data["party"],
                service_type=validated_data["service_type"],
            ).first()

            if not work_rate:
                raise serializers.ValidationError({
                    "rate": "This party doesn't have a rate tied to this service."
                })

            validated_data["rate"] = work_rate.rate

        return super().create(validated_data)
    

class RecordSerializer(BaseRecordSerializer):
    
    class Meta:
        model = Record
        fields = ['id', 'party', 'service_type', 'rate',
                  'pcs', 'record_date', 'discount', 'amount', 'paid_amount']
        read_only_fields = ['paid_amount']


class RecordCreateSerializer(BaseRecordSerializer):
    rate_mode = serializers.ChoiceField(
        choices=['system', 'manual'],
        write_only=True
    )

    class Meta:
        model = Record
        fields = [
            "id",
            "party",
            "party_id",
            "service_type",
            "service_type_id",
            "pcs",
            "discount",
            "rate",
            "rate_mode",
            "record_date",
        ]

class RecordUpdateSerializer(BaseRecordSerializer):

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

            pending_qs = Payment_Request.objects.filter(
                record=record, status='P')

            if self.instance:
                pending_qs = pending_qs.exclude(pk=self.instance.pk)

            if pending_qs.exists():
                raise serializers.ValidationError(
                    "Record is already requested.")

        return attrs


class PaymentRequestSerializer(BasePaymentRequestSerilizer):

    class Meta:
        model = Payment_Request
        fields = ['id', 'created_by', 'record',
                  'requested_amount', 'created_at', 'status']
        read_only_fields = fields


class PaymentRequestCreateSerializer(BasePaymentRequestSerilizer):

    class Meta:
        model = Payment_Request
        fields = ['record']

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

        owner = user.parent if user.parent else user

        pending_ids = Payment_Request.objects.filter(
            status='P',
            party__user=owner
        ).values_list('record__id', flat=True)

        filtered_qs = base_qs.exclude(
            id__in=pending_ids
        ).distinct()

        self.fields['record'].child_relation.queryset = filtered_qs


class PaymentRequestUpdateSerializer(BasePaymentRequestSerilizer):

    class Meta:
        model = Payment_Request
        fields = ['id', 'created_by', 'record',
                  'requested_amount', 'created_at', 'status']
        read_only_fields = ['id', 'created_by', 'requested_amount',
                            'created_at', 'status']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance and hasattr(self.fields['record'], 'child_relation'):
            self.fields['record'].child_relation.queryset = self.instance.record.all()

    def validate(self, attrs):
        attrs = super().validate(attrs)

        if self.instance is not None and 'record' in attrs:
            current_ids = set(
                self.instance.record.values_list('id', flat=True))
            incoming_ids = {r.id for r in attrs['record']}

            if not incoming_ids.issubset(current_ids):
                raise serializers.ValidationError({
                    "record": "You can only remove records from this request, not add new ones."
                })

        return attrs

    def update(self, instance, validated_data):
        record = validated_data.pop('record', None)
        instance = super().update(instance, validated_data)

        if record is not None:
            instance.record.set(record)
            instance.requested_amount = sum(r.remaining_amount for r in record)
            instance.save(update_fields=['requested_amount'])

        return instance


class PaymentRequestRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(
        required=False, allow_blank=True, max_length=500)


class PaymentRequestApproveSerializer(serializers.Serializer):
    pass
