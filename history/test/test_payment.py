import pytest
from django.conf import settings
from history.models import *
from model_bakery import baker
from rest_framework import status
from django.urls import reverse
from history.service import PaymentService
from django.utils.timezone import localdate, timedelta


@pytest.mark.django_db
class TestAuthCheck:

    def test_anonymous_user_cannot_see_payments_return_401(self, api_client):
        """Anonymous users should get 401"""
        response = api_client.get(reverse('payment-list'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_if_user_is_owner_return_200(self, api_client):
        """Authenticated users should get 200"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)
        response = api_client.get(reverse('payment-list'))
        assert response.status_code == status.HTTP_200_OK

    def test_user_a_cannot_see_user_b_payments(self, api_client):
        """User A should not see User B's records"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        payment = baker.make(Payment, party=party)
        api_client.force_authenticate(user=user_a)
        response = api_client.get(reverse('payment-list'))

        # Check for paginated response
        if 'results' in response.data:
            assert response.data["results"] == []
        else:
            assert response.data == []


@pytest.mark.django_db
class TestCreatePayment:

    def test_anonymous_user_cannot_create_payments(self, api_client):
        """Anonymous users cannot create records"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user_a)
        payment = baker.make(Payment, party=party)

        response = api_client.post(
            reverse('payment-list'), {
                'party': party.id,
                "amount": 500
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_can_create_payments_and_it_increasess_paid_amount_and_advance_ledger(self, api_client):
        """Authenticated users can create records"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)
        party = baker.make(Party, user=user_a)
        service = baker.make(Service_Type, user=user_a)
        record = baker.make(Record, party=party, service_type=service,
                            discount=0.00, rate=25, pcs=4)

        response = api_client.post(
            reverse('payment-list'), {
                'party': party.id,
                "amount": 200
            }
        )

        record.refresh_from_db()

        assert response.status_code == status.HTTP_201_CREATED
        assert record.paid_amount == 100
        assert AdvanceLedger.objects.first().amount == 100
        assert response.data['id'] > 0


@pytest.mark.django_db
class TestDeletePayment:

    def test_anonymous_user_cannot_delete_payments(self, api_client):
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        payment = baker.make(Payment, party=party)

        response = api_client.delete(
            reverse('payment-detail', args=[payment.id])
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_can_delete_payments_and_its_take_back_paid_amount_and_advance_ledger(self, api_client):
        """Users can delete their own records"""
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service = baker.make(Service_Type, user=user)
        record = baker.make(Record, party=party, service_type=service,
                            paid_amount=0.00, discount=0.00, rate=20, pcs=10)

        payment = baker.make(Payment, party=party, amount=300)
        payment_id = payment.id
        PaymentService.allocate_payment(payment)

        api_client.force_authenticate(user=user)
        response = api_client.delete(
            reverse('payment-detail', args=[payment.id])
        )

        log = AuditLog.objects.first()

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert record.paid_amount == 0
        assert AdvanceLedger.objects.count() == 0
        assert log.action == "DELETE"
        assert log.model_name == 'Payment'
        assert log.object_id == payment_id

    def test_user_a_cannot_delete_user_b_payments(self, api_client):
        """User A cannot delete User B's record"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        payment = baker.make(Payment, party=party)

        api_client.force_authenticate(user=user_a)
        response = api_client.delete(
            reverse('payment-detail', args=[payment.id]))

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestUpdatePayment:
    """Test payment updates"""

    def test_anonymous_user_cannot_update_payments(self, api_client):
        user_b = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user_b)
        payment = baker.make(Payment, party=party, amount=200)

        response = api_client.patch(
            reverse('payment-detail', args=[payment.id]), {
                "amount": 600
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_can_update_payments_and_depending_on_amount_its_get_realocated(self, api_client):
        """Users can update their own payments"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user_a)
        service = baker.make(Service_Type, user=user_a)

        record1 = baker.make(Record, party=party, service_type=service,
                             paid_amount=0.00, discount=0.00, rate=10, pcs=5)
        record2 = baker.make(Record, party=party, service_type=service,
                             paid_amount=0.00, discount=0.00, rate=10, pcs=10)

        payment1 = baker.make(Payment, party=party, amount=50)
        PaymentService.allocate_payment(payment1)
        payment1_id = payment1.id

        payment2 = baker.make(Payment, party=party, amount=100)
        PaymentService.allocate_payment(payment2)
        payment2_id = payment2.id

        api_client.force_authenticate(user=user_a)

        response2 = api_client.patch(
            reverse('payment-detail', args=[payment2.id]), {
                "amount": 90
            }
        )

        response1 = api_client.patch(
            reverse('payment-detail', args=[payment1.id]), {
                "amount": 100
            }
        )

        record1.refresh_from_db()
        record2.refresh_from_db()

        log1 = AuditLog.objects.get(object_id=payment1_id)
        log2 = AuditLog.objects.get(object_id=payment2_id)

        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code == status.HTTP_200_OK
        assert record1.paid_amount == 50
        assert record2.paid_amount == 100
        assert log1.action == "UPDATE"
        assert log1.model_name == 'Payment'
        assert log2.action == "UPDATE"
        assert log2.model_name == 'Payment'
        assert AdvanceLedger.objects.first().amount == 40

    def test_user_a_cannot_update_user_b_payments(self, api_client):
        """User A cannot update User B's record"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        payment = baker.make(Payment, party=party, amount=200)

        api_client.force_authenticate(user=user_a)
        response = api_client.patch(
            reverse('payment-detail', args=[payment.id]), {
                "amount": 500
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestUinqueConditionsRecord:

    def test_creating_payment_with_invalid_inputs(self, api_client):

        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)

        party = baker.make(Party, user=user_a)

        response = api_client.post(
            reverse('payment-list'), {
                'party': party.id,
                "amount": -250
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'amount' in response.data
        assert Payment.objects.count() == 0

    def test_updating_payment_with_invalid_inputs(self, api_client):
        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)

        party = baker.make(Party, user=user_a)
        payment = baker.make(Payment, party=party)
        response = api_client.patch(
            reverse('payment-detail', args=[payment.id]), {
                "amount": -260
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'amount' in response.data

    def test_creating_deleting_updating_payment_with_gap_of_7_days_from_current_date_fails(self, api_client):
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)

        # Make a payment that is already too old for update/delete
        old_payment = baker.make(
            Payment,
            party=party,
            amount=100,
            payment_date=localdate() - timedelta(days=8)
        )

        past_date = localdate() - timedelta(days=8)
        future_date = localdate() + timedelta(days=8)

        api_client.force_authenticate(user)

        response_past_date = api_client.post(
            reverse('payment-list'),
            {
                'party': party.id,
                'amount': 500,
                'payment_date': past_date.isoformat(),
            },
            format='json'
        )

        response_future_date = api_client.post(
            reverse('payment-list'),
            {
                'party': party.id,
                'amount': 500,
                'payment_date': future_date.isoformat(),
            },
            format='json'
        )

        response_update = api_client.patch(
            reverse('payment-detail', args=[old_payment.id]),
            {
                'amount': 500,
                'payment_date': past_date.isoformat(),
            },
            format='json'
        )

        response_delete = api_client.delete(
            reverse('payment-detail', args=[old_payment.id])
        )

        assert response_past_date.status_code == status.HTTP_400_BAD_REQUEST
        assert response_future_date.status_code == status.HTTP_400_BAD_REQUEST
        assert response_update.status_code == status.HTTP_403_FORBIDDEN
        assert response_delete.status_code == status.HTTP_403_FORBIDDEN
        assert "payment_date" in response_past_date.data
        assert "payment_date" in response_future_date.data


