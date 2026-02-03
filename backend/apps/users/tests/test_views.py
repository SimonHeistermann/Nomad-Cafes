"""
Tests for User API endpoints.
"""

import pytest
from django.urls import reverse
from rest_framework import status


pytestmark = pytest.mark.django_db


class TestRegisterEndpoint:
    """Tests for POST /api/auth/register/"""

    def test_register_success(self, api_client, user_data):
        """Test successful registration."""
        url = reverse("users:register")
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert "user" in response.data
        assert response.data["user"]["email"] == user_data["email"]
        assert response.data["user"]["name"] == user_data["name"]

        # Check cookies are set
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies
        assert response.cookies["access_token"]["httponly"]

    def test_register_duplicate_email(self, api_client, user, user_data):
        """Test registration with existing email fails."""
        url = reverse("users:register")
        user_data["email"] = user.email
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_weak_password(self, api_client, user_data):
        """Test registration with weak password fails."""
        url = reverse("users:register")
        user_data["password"] = "123"
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_invalid_email(self, api_client, user_data):
        """Test registration with invalid email fails."""
        url = reverse("users:register")
        user_data["email"] = "not-an-email"
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestLoginEndpoint:
    """Tests for POST /api/auth/login/"""

    def test_login_success(self, api_client, user):
        """Test successful login."""
        url = reverse("users:login")
        response = api_client.post(
            url,
            {"email": "testuser@example.com", "password": "TestPass123!"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert "user" in response.data
        assert response.data["user"]["email"] == user.email
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies

    def test_login_wrong_password(self, api_client, user):
        """Test login with wrong password fails."""
        url = reverse("users:login")
        response = api_client.post(
            url,
            {"email": user.email, "password": "WrongPassword123!"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_user(self, api_client):
        """Test login with nonexistent email fails."""
        url = reverse("users:login")
        response = api_client.post(
            url,
            {"email": "nonexistent@example.com", "password": "SomePass123!"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_inactive_user(self, api_client, user):
        """Test login with inactive user fails."""
        user.is_active = False
        user.save()

        url = reverse("users:login")
        response = api_client.post(
            url,
            {"email": user.email, "password": "TestPass123!"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestLogoutEndpoint:
    """Tests for POST /api/auth/logout/"""

    def test_logout_success(self, authenticated_client):
        """Test successful logout."""
        logout_url = reverse("users:logout")
        response = authenticated_client.post(logout_url)

        assert response.status_code == status.HTTP_200_OK

        # Check cookies are cleared
        assert response.cookies["access_token"].value == ""
        assert response.cookies["refresh_token"].value == ""

    def test_logout_unauthenticated(self, api_client):
        """Test logout without authentication fails."""
        url = reverse("users:logout")
        response = api_client.post(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestMeEndpoint:
    """Tests for GET/PATCH /api/auth/me/"""

    def test_me_authenticated(self, authenticated_client, user):
        """Test getting current user profile."""
        me_url = reverse("users:me")
        response = authenticated_client.get(me_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email
        assert response.data["name"] == user.name

    def test_me_unauthenticated(self, api_client):
        """Test getting profile without auth fails."""
        url = reverse("users:me")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile(self, authenticated_client, user):
        """Test updating user profile."""
        me_url = reverse("users:me")
        response = authenticated_client.patch(
            me_url,
            {"name": "Updated Name"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Name"

        # Verify in DB
        user.refresh_from_db()
        assert user.name == "Updated Name"


class TestTokenRefresh:
    """Tests for POST /api/auth/token/refresh/"""

    def test_token_refresh_success(self, api_client, user):
        """Test successful token refresh."""
        # Login first to get cookies
        login_url = reverse("users:login")
        login_response = api_client.post(
            login_url,
            {"email": "testuser@example.com", "password": "TestPass123!"},
            format="json",
        )
        assert login_response.status_code == status.HTTP_200_OK

        # Set the cookies on client
        api_client.cookies = login_response.cookies

        # Refresh token
        refresh_url = reverse("users:token_refresh")
        response = api_client.post(refresh_url)

        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.cookies

    def test_token_refresh_no_cookie(self, api_client):
        """Test token refresh without cookie fails."""
        url = reverse("users:token_refresh")
        response = api_client.post(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestPasswordReset:
    """Tests for password reset flow."""

    def test_request_password_reset(self, api_client, user):
        """Test requesting password reset."""
        url = reverse("users:password_reset")
        response = api_client.post(
            url,
            {"email": user.email},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

        # Check token was generated
        user.refresh_from_db()
        assert user.password_reset_token != ""

    def test_request_password_reset_nonexistent_email(self, api_client):
        """Test password reset with nonexistent email still returns 200 (security)."""
        url = reverse("users:password_reset")
        response = api_client.post(
            url,
            {"email": "nonexistent@example.com"},
            format="json",
        )

        # Should still return 200 to prevent email enumeration
        assert response.status_code == status.HTTP_200_OK

    def test_confirm_password_reset(self, api_client, user):
        """Test confirming password reset."""
        # Generate reset token (returns plain token, stores hashed)
        plain_token = user.set_password_reset_token()
        user.save()

        url = reverse("users:password_reset_confirm")
        response = api_client.post(
            url,
            {"token": plain_token, "new_password": "NewSecurePass123!"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

        # Check password was changed
        user.refresh_from_db()
        assert user.check_password("NewSecurePass123!")
        assert user.password_reset_token == ""


class TestChangePassword:
    """Tests for POST /api/auth/change-password/"""

    def test_change_password_success(self, authenticated_client, user):
        """Test changing password while authenticated."""
        change_url = reverse("users:change_password")
        response = authenticated_client.post(
            change_url,
            {
                "current_password": "TestPass123!",
                "new_password": "NewSecurePass456!",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

        # Verify new password works
        user.refresh_from_db()
        assert user.check_password("NewSecurePass456!")

    def test_change_password_wrong_current(self, authenticated_client):
        """Test changing password with wrong current password fails."""
        change_url = reverse("users:change_password")
        response = authenticated_client.post(
            change_url,
            {
                "current_password": "WrongPassword!",
                "new_password": "NewPass123!",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestEmailVerification:
    """Tests for email verification flow."""

    def test_verify_email(self, api_client, user):
        """Test verifying email with valid token."""
        # Generate verification token (returns plain token, stores hashed)
        user.is_email_verified = False
        plain_token = user.set_email_verification_token()
        user.save()

        url = reverse("users:verify_email")
        response = api_client.post(
            url,
            {"token": plain_token},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

        user.refresh_from_db()
        assert user.is_email_verified
        assert user.email_verification_token == ""

    def test_verify_email_invalid_token(self, api_client):
        """Test verifying email with invalid token fails."""
        url = reverse("users:verify_email")
        response = api_client.post(
            url,
            {"token": "invalid-token"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
