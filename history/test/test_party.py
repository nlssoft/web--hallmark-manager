import pytest
from decimal import Decimal
from django.conf import settings
from django.db import connection
from django.test.utils import CaptureQueriesContext
from history.models import AdvanceLedger, Party, Record, Service_Type, Payment
from model_bakery import baker
from rest_framework import status
from django.urls import reverse


@pytest.fixture
def create_party(api_client):
    def party_create(data):
        return api_client.post(reverse('party-list'), data, format="json")
    return party_create


@pytest.mark.django_db
class TestGetingDetails:

    def test_if_user_anonymous_return_401(self, api_client):
        response = api_client.get(reverse('party-list'))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_if_user_owner_return_200(self, api_client):

        user_a = baker.make(settings.AUTH_USER_MODEL) 

        api_client.force_authenticate(user=user_a)
        response = api_client.get(reverse('party-list'))

        assert response.status_code == status.HTTP_200_OK

    def test_if_user_a_can_see_user_b_partys(self, api_client):

        user_a = baker.make(settings.AUTH_USER_MODEL)

        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user = user_b)

        api_client.force_authenticate(user=user_a)

        response = api_client.get(reverse('party-list'))

        assert response.data["results"] == []

    def test_party_list_uses_precomputed_balances(self, api_client):
        user = baker.make(settings.AUTH_USER_MODEL)
        employee = baker.make(settings.AUTH_USER_MODEL, parent=user)
        party = baker.make(
            Party,
            user=user,
            assigned_to=employee,
            first_name="A",
            last_name="Party",
        )
        service = baker.make(Service_Type, user=user)
        baker.make(
            Record,
            party=party,
            service_type=service,
            rate=Decimal("10.00"),
            pcs=5,
            discount=Decimal("5.00"),
            paid_amount=Decimal("10.00"),
        )
        baker.make(
            Record,
            party=party,
            service_type=service,
            rate=Decimal("20.00"),
            pcs=2,
            discount=Decimal("0.00"),
            paid_amount=Decimal("5.00"),
        )
        baker.make(
            AdvanceLedger,
            party=party,
            amount=Decimal("30.00"),
            remaining_amount=Decimal("30.00"),
            direction="IN",
        )
        baker.make(
            AdvanceLedger,
            party=party,
            amount=Decimal("20.00"),
            remaining_amount=Decimal("20.00"),
            direction="IN",
        )
        baker.make(
            AdvanceLedger,
            party=party,
            amount=Decimal("7.00"),
            remaining_amount=Decimal("7.00"),
            direction="OUT",
        )

        api_client.force_authenticate(user=user)
        with CaptureQueriesContext(connection) as queries:
            response = api_client.get(reverse('party-list'))

        assert response.status_code == status.HTTP_200_OK
        assert len(queries) <= 4
        assert Decimal(response.data["results"][0]["due"]) == Decimal("70.00")
        assert Decimal(
            response.data["results"][0]["advance_balance"]
        ) == Decimal("50.00")
        assert response.data["results"][0]["assigned_to"]["id"] == employee.id


@pytest.mark.django_db
class TestCreateAndDelete:

    def test_cheking_if_anonymous_can_create_party(self, create_party):

        response = create_party({
            "user": "aljfaslj",
            "first_name": 'alsdfjlsa'
        })

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cheking_if_user_can_create_party(self, api_client, create_party):

        user_a = baker.make(settings.AUTH_USER_MODEL)

        api_client.force_authenticate(user=user_a)

        response = create_party({
            'user' : 'user_a',
            'first_name': 'aslfjasl'
        })

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['id'] > 0

    def test_cheking_if_user_a_can_delete_user_b_party(self, api_client):

        user_a = baker.make(settings.AUTH_USER_MODEL)

        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user = user_b)

        api_client.force_authenticate(user=user_a)

        response = api_client.delete(reverse('party-detail', args=[party.id]))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_user_can_delete_party_without_records_and_payments(self, api_client):
        
        user = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user)

        api_client.force_authenticate(user=user)

        response = api_client.delete(
            reverse("party-detail", args=[party.id])
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT


    def test_cheking_if_user_can_delete_a_record_that_has_payment_or_record(self, api_client):

        user_a = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user = user_a)

        service = baker.make(
            Service_Type,
            user = user_a,
        )

        record = baker.make(
            Record,
            party = party,
            service_type = service,
        )

        payment = baker.make(
            Payment,
            party = party
        )

        api_client.force_authenticate(user=user_a)

        response = api_client.delete(reverse('party-detail', args=[party.id]))

        assert response.status_code == status.HTTP_400_BAD_REQUEST
