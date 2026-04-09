import pytest
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def disable_secure_redirects(settings):
    settings.SECURE_SSL_REDIRECT = False
    settings.SESSION_COOKIE_SECURE = False
    settings.CSRF_COOKIE_SECURE = False


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def get_summary(api_client):
    def _get_summary(params=None):
        return api_client.get(reverse("summary"), params or {})

    return _get_summary
