from rest_framework.test import APIClient
import pytest
from django.urls import reverse


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def get_summary(api_client):
    def _get_summary(params=None):
        return api_client.get(reverse('summary'), params or {})
    return _get_summary
