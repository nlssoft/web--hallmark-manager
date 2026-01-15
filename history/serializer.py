from rest_framework import serializers
from .models import Party, Service_Type, Work_Rate, Record, Note, Payment, Allocation, AdvanceLedger


class PartySerializer(serializers.ModelSerializer):
    full = serializers.SerializerMethodField(method_name='p')

    def p(self, party):
        return f'{party.first_name} {party.last_name}'

    class Meta:
        model = Party
        fields = ['id', 'first_name', 'last_name', 'number', 'full']


class Service_TypeSerializer(serializers.ModelSerializer):
    used = serializers.IntegerField(read_only=True)

    class Meta:
        model = Service_Type
        fields = ['id', 'type_of_work', 'used']


class Work_RateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Work_Rate
        fields = ['id', 'rate', 'party', 'service_type']


class RecordSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()

    def get_amount(self, record):
        return record.rate * record.pcs

    class Meta:
        model = Record
        fields = ['id', 'party', 'service_type', 'rate',
                  'pcs', 'record_date', 'discount', 'status', 'amount', 'paid_amount']


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'name', 'description', 'created']

    def create(self, validated_data):
        record_id = self.context['record_id']
        return Note.objects.create(record_id=record_id, **validated_data)


class PaymentSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Payment
        fields = ['party', 'amount', 'payment_date']


class AllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Allocation
        fields = ['party', 'amount', 'record']

class AdvanceLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvanceLedger
        fields = ['party', 'payment', 'record', 'amount', 'direction' , 'created_at']