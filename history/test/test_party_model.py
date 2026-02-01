import pytest
from django.contrib.auth import get_user_model
from history.models import Party
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
        user = get_user_model()
        user_a = user.objects.create_user(
            username='lsfjalgt',
            email='sgh@gmail.com',
            number='56567465',
            address='tgeryhreytwy'
        )

        api_client.force_authenticate(user=user_a)
        response = api_client.get(reverse('party-list'))

        assert response.status_code == status.HTTP_200_OK

    def test_if_user_a_can_check_user_b_record(self, api_client):
        user = get_user_model()
        user_a = user.objects.create_user(
            username='lsfjalgt',
            email='sgh@gmail.com',
            number='56567465',
            address='tgeryhreytwy'
        )

        user_b = user.objects.create_user(
            username='lsfasdfjalgt',
            email='sgasdfh@gmail.com',
            number='56567623465',
            address='tgerysdfghreytwy'
        )

        Party.objects.create(
            user=user_b,
            first_name='asfalh'
        )

        api_client.force_authenticate(user=user_a)

        response = api_client.get(reverse('party-list'))

        assert response.data["results"] == []


@pytest.mark.django_db
class TestCreations:

    def test_cheking_if_anonymous_can_create_party(self, create_party):

        response = create_party({
            "user": "aljfaslj",
            "first_name": 'alsdfjlsa'
        })

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cheking_if_user_can_create_party(self, create_party, api_client):

        user = get_user_model()

        user_a = user.objects.create_user(
            username='lsfjalgt',
            email='sgh@gmail.com',
            number='56567465',
            address='tgeryhreytwy'
        )
        api_client.force_authenticate(user=user_a)

        response = create_party({
            "user": "user_a",
            "first_name": 'alsdfjlsa'
        })

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['id'] > 0

    def test_cheking_if_user_a_can_delete_user_b_party(self, api_client):

        user = get_user_model()

        user_a = user.objects.create_user(
            username='lsfjalgt',
            email='sgh@gmail.com',
            number='56567465',
            address='tgeryhreytwy'
        )

        user_b = user.objects.create_user(
            username='lsfasdfjalgt',
            email='sgasdfh@gmail.com',
            number='56567623465',
            address='tgerysdfghreytwy'
        )

        party = Party.objects.create(
            user=user_b,
            first_name='asfalh'
        )

        api_client.force_authenticate(user=user_a)

        response = api_client.delete(reverse('party-detail', args=[party.id]))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_cheking_if_user_can_delete_a_record_that_has_payment_or_record(self, api_client):

        user = get_user_model()

        user_a = user.objects.create_user(
            username='lsfjalgt',
            email='sgh@gmail.com',
            number='56567465',
            address='tgeryhreytwy'
        )

        party = Party.objects.create(
            user="user_a",
            first_name='asfalh'
        )

        api_client.force_authenticate(user=user_a)

        response = api_client.delete(reverse('party-detail', args=[party.id]))

        assert response.status_code == status.HTTP_404_NOT_FOUND
