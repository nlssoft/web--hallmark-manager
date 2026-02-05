import pytest
from django.conf import settings
from history.models import *
from model_bakery import baker
from rest_framework import status
from django.urls import reverse


@pytest.mark.django_db
class TestAuthCheck:
    """Test authentication and authorization"""

    def test_anonymous_user_cannot_see_records_return_401(self, api_client):
        """Anonymous users should get 401"""
        response = api_client.get(reverse('record-list'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_if_user_is_owner_return_200(self, api_client):
        """Authenticated users should get 200"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)
        response = api_client.get(reverse('record-list'))
        assert response.status_code == status.HTTP_200_OK

    def test_user_a_cannot_see_user_b_records(self, api_client):
        """User A should not see User B's records"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        service = baker.make(Service_Type, user=user_b)
        baker.make(Record, party=party, service_type=service)

        api_client.force_authenticate(user=user_a)
        response = api_client.get(reverse('record-list'))

        # Check for paginated response
        if 'results' in response.data:
            assert response.data["results"] == []
        else:
            assert response.data == []


@pytest.mark.django_db
class TestCreateRecord:
    """Test record creation"""

    def test_anonymous_user_cannot_create_records(self, api_client):
        """Anonymous users cannot create records"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user_a)
        service = baker.make(Service_Type, user=user_a)

        response = api_client.post(
            reverse('record-list'), {
                'party': party.id,
                'service_type': service.id,
                'rate': 55,
                'pcs': 5,
                'rate_mode': 'manual'
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_can_create_records(self, api_client):
        """Authenticated users can create records"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)

        party = baker.make(Party, user=user_a)
        service = baker.make(Service_Type, user=user_a)

        response = api_client.post(
            reverse('record-list'), {
                'party': party.id,
                'service_type': service.id,
                'rate': 55,
                'pcs': 6,
                'rate_mode': 'manual'  # ✅ REQUIRED FIELD
            }
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['id'] > 0


@pytest.mark.django_db
class TestDeleteRecord:
    """Test record deletion"""

    def test_anonymous_user_cannot_delete_records(self, api_client):
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service = baker.make(Service_Type, user=user)
        record = baker.make(Record, party=party, service_type=service,
                            paid_amount=0.00, discount=0.00, rate=23.8, pcs=34)

        response = api_client.delete(
            reverse('record-detail', args=[record.id])
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_can_delete_record(self, api_client):
        """Users can delete their own records"""
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service = baker.make(Service_Type, user=user)
        record = baker.make(Record, party=party, service_type=service,
                            paid_amount=0.00, discount=0.00, rate=23.8, pcs=34)

        api_client.force_authenticate(user=user)
        response = api_client.delete(
            reverse('record-detail', args=[record.id])
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_user_a_cannot_delete_user_b_records(self, api_client):
        """User A cannot delete User B's record"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        service = baker.make(Service_Type, user=user_b)
        record = baker.make(Record, party=party, service_type=service,
                            paid_amount=0.00, discount=0.00, rate=23.8, pcs=34)

        api_client.force_authenticate(user=user_a)
        response = api_client.delete(
            reverse('record-detail', args=[record.id]))

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestUpdateRecord:
    """Test record updates"""

    def test_anonymous_user_cannot_update_records(self, api_client):
        user_b = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user_b)
        service = baker.make(Service_Type, user=user_b)
        record = baker.make(Record, party=party, service_type=service,
                            paid_amount=0.00, discount=0.00, rate=23.8, pcs=34)

        response = api_client.patch(
            reverse('record-detail', args=[record.id]), {
                "rate": 59,
                "discount": 45,
                "pcs": 2,
                "reason": 'testing update'
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_can_update_records(self, api_client):
        """Users can update their own records"""
        user_b = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user_b)
        service = baker.make(Service_Type, user=user_b)
        record = baker.make(Record, party=party, service_type=service,
                            paid_amount=0.00, discount=0.00, rate=25, pcs=10)
        record_id = record.id
        pay = baker.make(Payment, amount = 250)
        Allocation.objects.create(
            payment = pay,
            record = record,
            amount = 250
        )
        record2= baker.make(Record, party=party, service_type=service,
                            paid_amount=0.00, discount=0.00, rate=25, pcs=10)

        api_client.force_authenticate(user=user_b)
        response = api_client.patch(
            reverse('record-detail', args=[record.id]), {
                "discount": 100,
                "reason": 'testing update'
            }
        )
        advance = AdvanceLedger.objects.get(record = record, direction = "IN")

        log = AuditLog.objects.first

        assert response.status_code == status.HTTP_200_OK
        assert record.paid_amount <= Decimal("250")
        assert  advance.amount == Decimal("150")
        assert log.action == "UPDATE"
        assert log.model_name == 'Record'
        assert log.object_id == record_id


    def test_user_a_cannot_update_user_b_records(self, api_client):
        """User A cannot update User B's record"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        service = baker.make(Service_Type, user=user_b)
        record = baker.make(Record, party=party, service_type=service,
                            paid_amount=0.00, discount=0.00, rate=23.8, pcs=34)

        api_client.force_authenticate(user=user_a)
        response = api_client.patch(
            reverse('record-detail', args=[record.id]), {
                "rate": 59,
                "discount": 45,
                "pcs": 2,
                "reason": 'testing update'
            }
        )

        # ✅ FIXED: Should return 404, not 200
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestUinqueConditionsRecord:

    def test_creating_record_with_invalid_inputs(self, api_client):

        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)

        party = baker.make(Party, user=user_a)
        service = baker.make(Service_Type, user=user_a)

        response = api_client.post(
            reverse('record-list'), {
                'party': party.id,
                'service_type': service.id,
                'rate': -55.40,
                'pcs': -6,
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'rate' in response.data
        assert 'pcs' in response.data
        assert 'rate_mode' in response.data
        assert Record.objects.count() == 0

    def test_updating_record_with_invalid_inputs(self, api_client):
        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)

        party = baker.make(Party, user=user_a)
        service = baker.make(Service_Type, user=user_a)
        record = baker.make(Record, party=party, service_type=service,
                            discount=0.00, rate=23.8, pcs=34)

        response = api_client.patch(
            reverse('record-detail', args=[record.id]), {
                'rate': -55.40,
                'pcs': -6,
                'discount': -200

            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'rate' in response.data
        assert 'pcs' in response.data
        assert 'discount' in response.data

    def test_createing_record_consume_advance(self, api_client):

        user = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user)

        party = baker.make(Party, user=user)
        service = baker.make(Service_Type, user=user)

        payment = baker.make(Payment, party=party, amount=Decimal('330.00'))

        AdvanceLedger.objects.create(
            party=party,
            payment=payment,
            amount=payment.amount,
            remaining_amount=payment.amount,
            direction="IN"
        )

        response = api_client.post(reverse('record-list'), {
            'party': party.id,
            'service_type': service.id,
            'rate': 55,
            'pcs': 6,
            'rate_mode': 'manual'  # ✅ REQUIRED FIELD
        })

        assert response.status_code == status.HTTP_201_CREATED
        record = Record.objects.get()
        assert record.paid_amount == 330
        assert AdvanceLedger.objects.filter(
            direction="OUT", record=record).exists()
        assert AdvanceLedger.objects.filter(
            direction="IN").first().remaining_amount == Decimal('0.00')

    def test_deleting_record_returns_paid_amount_as_advance(self, api_client):
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service = baker.make(Service_Type, user=user)
        pay = baker.make(Payment, amount=100, party=party)
        record = baker.make(Record, party=party, service_type=service, rate=Decimal(
            '25'), discount=Decimal('0.00'), pcs=10)

        AdvanceLedger.objects.create(
            party=party,
            payment=pay,
            record=record,
            amount=100,
            remaining_amount=100,
            direction="IN"
        )
        payment = baker.make(Payment, party=party, amount=150)

        Allocation.objects.create(
            record=record,
            payment=payment,
            amount=payment.amount
        )

        record_id = record.id
        api_client.force_authenticate(user=user)
        api_client.delete(reverse('record-detail', args=[record.id]))
        log = AuditLog.objects.first()

        assert AdvanceLedger.objects.filter(
            payment=pay, direction="IN", remaining_amount=Decimal('100.00')).exists()
        assert AdvanceLedger.objects.filter(
            payment=payment.id, remaining_amount=Decimal(150)).exists()
        assert log.action == "DELETE"
        assert log.model_name == 'Record'
        assert log.object_id == record_id
