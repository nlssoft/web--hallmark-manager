import pytest
from django.conf import settings
from history.models import *
from model_bakery import baker
from rest_framework import status
from django.urls import reverse


@pytest.mark.django_db
class TestAuthCheck:
    """Test authentication and authorization"""

    def test_anonymous_user_cannot_see_advance_ledger_return_401(self, api_client):
        """Anonymous users should get 401"""
        response = api_client.get(reverse('advance-ledger-list'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_if_user_is_owner_advance_ledger_return_200(self, api_client):
        """Authenticated users should get 200"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)
        response = api_client.get(reverse('advance-ledger-list'))
        assert response.status_code == status.HTTP_200_OK

    def test_user_a_cannot_see_user_b_advance_ledger(self, api_client):
        """User A should not see User B's records"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        payment = baker.make(Payment, party=party)

        api_client.force_authenticate(user=user_a)
        response = api_client.get(reverse('advance-ledger-list'))

        # Check for paginated response
        if 'results' in response.data:
            assert response.data["results"] == []
        else:
            assert response.data == []
