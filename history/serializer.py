from rest_framework import serializers
from .models import Party, Service_type, Work_rate, Record, Note


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
        model = Service_type
        fields = ['id', 'type_of_work', 'used']


class Work_RateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Work_rate
        fields = ['id', 'rate', 'party', 'service_type']


class RecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Record
        fields = ['id', 'party', 'service_type', 'rate',
                  'pcs', 'record_date', 'discount', 'status']


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'name', 'description', 'created']

    def create(self, validated_data):
        record_id = self.context['record_id']
        return Note.objects.create(record_id=record_id, **validated_data)
