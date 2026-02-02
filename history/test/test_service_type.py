import pytest
from django.contrib.auth import get_user_model
from history.models import Service_Type
from rest_framework import status
from django.urls import reverse



@pytest.mark.django_db
class TestGetingDetails:

    def test_if_user_anonymous_return_401(self, api_client):
        response = api_client.get(reverse('service-type-list'))

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
        response = api_client.get(reverse('service-type-list'))

        assert response.status_code == status.HTTP_200_OK

    def test_if_user_a_can_see_user_b_service_type(self, api_client):

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

        Service_Type.objects.create(
            user=user_b,
            type_of_work = 'lasjf'
        )

        api_client.force_authenticate(user=user_a)

        response = api_client.get(reverse('service-type-list'))

        assert response.data == []


