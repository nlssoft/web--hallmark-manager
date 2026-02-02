import pytest
from django.conf import settings
from history.models import *
from model_bakery import baker
from rest_framework import status
from django.urls import reverse


@pytest.mark.django_db
class TestAuthCheck:
    """Test authentication and authorization"""

    def test_if_anonymous_user_can_see_record_return_401(self, api_client):
        """Anonymous users should get 401"""
        response = api_client.get(reverse('record-list'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_if_user_owner_return_200(self, api_client):
        """Authenticated users should get 200"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)
        response = api_client.get(reverse('record-list'))
        assert response.status_code == status.HTTP_200_OK

    def test_if_user_a_cannot_see_user_b_record(self, api_client):
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

    def test_checking_if_anonymous_cannot_create_record(self, api_client):
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

    def test_checking_if_user_can_create_record(self, api_client):
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

    def test_user_can_delete_record(self, api_client):
        """Users can delete their own records"""
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service = baker.make(Service_Type, user=user)
        record = baker.make(Record, party=party, service_type=service, paid_amount = 0.00, discount= 0.00, rate = 23.8, pcs =34)

        api_client.force_authenticate(user=user)
        response = api_client.delete(
            reverse('record-detail', args=[record.id])
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_checking_if_user_a_cannot_delete_user_b_record(self, api_client):
        """User A cannot delete User B's record"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        service = baker.make(Service_Type, user=user_b)
        record = baker.make(Record, party=party, service_type=service, paid_amount = 0.00, discount= 0.00, rate = 23.8, pcs =34)

        api_client.force_authenticate(user=user_a)
        response = api_client.delete(reverse('record-detail', args=[record.id]))

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestUpdateRecord:
    """Test record updates"""

    def test_checking_if_update_works_with_record(self, api_client):
        """Users can update their own records"""
        user_b = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user_b)
        service = baker.make(Service_Type, user=user_b)
        record = baker.make(Record, party=party, service_type=service, paid_amount = 0.00, discount= 0.00, rate = 23.8, pcs =34)

        api_client.force_authenticate(user=user_b)
        response = api_client.patch(
            reverse('record-detail', args=[record.id]), {
                "rate": 59,
                "discount": 45,
                "pcs": 2,
                "reason": 'testing update'
            }
        )

        assert response.status_code == status.HTTP_200_OK

    def test_checking_if_user_a_cannot_update_user_b_record(self, api_client):
        """User A cannot update User B's record"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        service = baker.make(Service_Type, user=user_b)
        record = baker.make(Record, party=party, service_type=service, paid_amount = 0.00, discount= 0.00, rate = 23.8, pcs =34)

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

    def test_record_invalid_inputs(self, api_client):

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


    def test_createing_records_consume_advance(self, api_client):

        user = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user)

        party = baker.make(Party, user= user)
        service = baker.make(Service_Type, user = user)

        payment = baker.make(Payment, party=party, amount = 330)

        AdvanceLedger.objects.create(
            party = party,
            payment = payment,
            amount = payment.amount,
            remaining_amount = payment.amount,
            direction= "IN"
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
        assert AdvanceLedger.objects.filter(direction = "OUt", record = record).exists()
        assert AdvanceLedger.objects.filter(direction = "IN").first().remaining_amount == 330