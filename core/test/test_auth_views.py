import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from model_bakery import baker
from rest_framework import exceptions, status
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from core.authentication import CookieJwtAuthentication


LOGIN_URL = "/auth/login/"
REFRESH_URL = "/auth/refresh/"
LOGOUT_URL = "/auth/logout/"
CSRF_URL = "/auth/csrf/"
User = get_user_model()


@pytest.mark.django_db
class TestUserProfile:
    def test_user_can_see_current_profile(self, api_client):
        user = baker.make(settings.AUTH_USER_MODEL, username="main-user")

        api_client.force_authenticate(user=user)
        response = api_client.get(reverse("profile-me"))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == user.id
        assert response.data["username"] == user.username

    def test_main_user_can_update_profile(self, api_client):
        user = baker.make(
            settings.AUTH_USER_MODEL,
            first_name="Old",
            address="Old Address",
        )

        api_client.force_authenticate(user=user)
        response = api_client.patch(
            reverse("profile-update-profile"),
            {
                "first_name": "Updated",
                "address": "New Address",
            },
            format="json",
        )

        user.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "Updated"
        assert user.address == "New Address"

    def test_employee_cannot_update_profile(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        employee = baker.make(settings.AUTH_USER_MODEL, parent=main)

        api_client.force_authenticate(user=employee)
        response = api_client.patch(
            reverse("profile-update-profile"),
            {"first_name": "Blocked"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestEmployeeViewSet:
    def test_main_user_can_list_only_own_employees(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        other_main = baker.make(settings.AUTH_USER_MODEL)
        employee = baker.make(settings.AUTH_USER_MODEL, parent=main)
        baker.make(settings.AUTH_USER_MODEL, parent=other_main)

        api_client.force_authenticate(user=main)
        response = api_client.get(reverse("employee-list"))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == employee.id

    def test_employee_cannot_list_employees(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        employee = baker.make(settings.AUTH_USER_MODEL, parent=main)

        api_client.force_authenticate(user=employee)
        response = api_client.get(reverse("employee-list"))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_main_user_can_create_employee(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)

        api_client.force_authenticate(user=main)
        response = api_client.post(
            reverse("employee-list"),
            {
                "username": "employee-user",
                "first_name": "Emp",
                "last_name": "Loyee",
                "email": "employee@example.com",
                "number": "1234567890",
                "address": "Employee Address",
                "password": "strong-pass-123",
            },
            format="json",
        )

        employee = User.objects.get(username="employee-user")

        assert response.status_code == status.HTTP_201_CREATED
        assert employee.parent_id == main.id

    def test_employee_cannot_create_employee(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        employee = baker.make(settings.AUTH_USER_MODEL, parent=main)

        api_client.force_authenticate(user=employee)
        response = api_client.post(
            reverse("employee-list"),
            {
                "username": "blocked-user",
                "first_name": "No",
                "last_name": "Access",
                "email": "blocked@example.com",
                "number": "1111111111",
                "address": "Blocked Address",
                "password": "strong-pass-123",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_main_user_can_update_employee(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        employee = baker.make(settings.AUTH_USER_MODEL, parent=main, first_name="Old")

        api_client.force_authenticate(user=main)
        response = api_client.patch(
            reverse("employee-detail", args=[employee.id]),
            {"first_name": "Updated"},
            format="json",
        )

        employee.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert employee.first_name == "Updated"

    def test_main_user_can_delete_employee(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        employee = baker.make(settings.AUTH_USER_MODEL, parent=main)

        api_client.force_authenticate(user=main)
        response = api_client.delete(reverse("employee-detail", args=[employee.id]))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not type(employee).objects.filter(id=employee.id).exists()

    def test_main_user_can_ban_employee_and_blacklist_tokens(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        employee = baker.make(settings.AUTH_USER_MODEL, parent=main, is_active=True)

        RefreshToken.for_user(employee)
        RefreshToken.for_user(employee)

        api_client.force_authenticate(user=main)
        response = api_client.post(reverse("employee-ban", args=[employee.id]), format="json")

        employee.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert employee.is_active is False
        assert OutstandingToken.objects.filter(user=employee).count() == 2
        assert BlacklistedToken.objects.filter(token__user=employee).count() == 2

    def test_employee_cannot_ban_other_employee(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        employee = baker.make(settings.AUTH_USER_MODEL, parent=main)
        other_employee = baker.make(settings.AUTH_USER_MODEL, parent=main)

        api_client.force_authenticate(user=employee)
        response = api_client.post(reverse("employee-ban", args=[other_employee.id]), format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_main_user_can_unban_employee(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        employee = baker.make(settings.AUTH_USER_MODEL, parent=main, is_active=False)

        api_client.force_authenticate(user=main)
        response = api_client.post(reverse("employee-unban", args=[employee.id]), format="json")

        employee.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert employee.is_active is True


@pytest.mark.django_db
class TestAuthViews:
    def test_user_can_login_and_get_auth_cookies(self, api_client):
        user = baker.make(settings.AUTH_USER_MODEL, username="login-user")
        user.set_password("strong-pass-123")
        user.save()

        response = api_client.post(
            LOGIN_URL,
            {
                "username": "login-user",
                "password": "strong-pass-123",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "Login successful"
        assert "access" in response.cookies
        assert "refresh" in response.cookies

    def test_invalid_credentials_return_400(self, api_client):
        response = api_client.post(
            LOGIN_URL,
            {
                "username": "missing-user",
                "password": "wrong-pass",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "invalid credentials"

    def test_refresh_requires_refresh_cookie(self, api_client):
        response = api_client.post(REFRESH_URL, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "No refresh token"

    def test_refresh_rotates_token_and_blacklists_old_refresh(self, api_client):
        user = baker.make(settings.AUTH_USER_MODEL)
        refresh = RefreshToken.for_user(user)
        api_client.cookies["refresh"] = str(refresh)

        response = api_client.post(REFRESH_URL, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "token refreshed"
        assert "access" in response.cookies
        assert "refresh" in response.cookies
        assert response.cookies["refresh"].value != str(refresh)
        assert BlacklistedToken.objects.filter(token__jti=refresh["jti"]).exists()

    def test_invalid_refresh_token_returns_401(self, api_client):
        api_client.cookies["refresh"] = "bad-refresh-token"
        response = api_client.post(REFRESH_URL, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data["error"] == "Invalid refresh token"

    def test_logout_clears_cookies_and_blacklists_refresh(self, api_client):
        user = baker.make(settings.AUTH_USER_MODEL)
        refresh = RefreshToken.for_user(user)
        api_client.cookies["refresh"] = str(refresh)

        response = api_client.post(LOGOUT_URL, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "Logged out"
        assert BlacklistedToken.objects.filter(token__jti=refresh["jti"]).exists()
        assert "access" in response.cookies
        assert response.cookies["access"].value == ""
        assert "refresh" in response.cookies
        assert response.cookies["refresh"].value == ""

    def test_csrf_view_sets_cookie(self, api_client):
        response = api_client.get(CSRF_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "csrf cookie set"
        assert "csrftoken" in response.cookies


@pytest.mark.django_db
class TestCookieJwtAuthentication:
    def test_missing_access_cookie_returns_none(self):
        request = APIRequestFactory().get("/history/party/")

        assert CookieJwtAuthentication().authenticate(request) is None

    def test_invalid_access_cookie_returns_none(self):
        request = APIRequestFactory().get("/history/party/")
        request.COOKIES["access"] = "not-a-token"

        assert CookieJwtAuthentication().authenticate(request) is None

    def test_valid_access_cookie_authenticates_user(self):
        user = baker.make(settings.AUTH_USER_MODEL)
        access_token = RefreshToken.for_user(user).access_token
        request = APIRequestFactory().get("/history/party/")
        request.COOKIES["access"] = str(access_token)

        authenticated_user, validated_token = CookieJwtAuthentication().authenticate(request)

        assert authenticated_user.id == user.id
        assert str(validated_token) == str(access_token)

    def test_post_without_csrf_token_is_forbidden(self):
        user = baker.make(settings.AUTH_USER_MODEL)
        access_token = RefreshToken.for_user(user).access_token
        request = APIRequestFactory(enforce_csrf_checks=True).post(
            "/history/party/",
            {},
            format="json",
        )
        request.COOKIES["access"] = str(access_token)

        with pytest.raises(exceptions.PermissionDenied):
            CookieJwtAuthentication().authenticate(request)
