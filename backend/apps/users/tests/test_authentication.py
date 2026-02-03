"""
Tests for JWT Cookie Authentication.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import timedelta
from django.http import HttpResponse

from apps.users.authentication import (
    JWTCookieAuthentication,
    set_jwt_cookies,
    delete_jwt_cookies,
)


pytestmark = pytest.mark.django_db


class TestJWTCookieAuthentication:
    """Tests for JWTCookieAuthentication class."""

    def test_authenticate_with_cookie(self, user, settings):
        """Authenticates using access token from cookie."""
        from rest_framework_simplejwt.tokens import AccessToken

        auth = JWTCookieAuthentication()
        token = AccessToken.for_user(user)

        request = Mock()
        request.COOKIES = {"access_token": str(token)}
        request.META = {}

        result = auth.authenticate(request)

        assert result is not None
        user_result, token_result = result
        assert user_result.id == user.id

    def test_authenticate_with_header(self, user, settings):
        """Authenticates using Authorization header when no cookie."""
        from rest_framework_simplejwt.tokens import AccessToken

        auth = JWTCookieAuthentication()
        token = AccessToken.for_user(user)

        request = Mock()
        request.COOKIES = {}
        request.META = {"HTTP_AUTHORIZATION": f"Bearer {str(token)}"}

        result = auth.authenticate(request)

        assert result is not None
        user_result, token_result = result
        assert user_result.id == user.id

    def test_returns_none_when_no_token(self):
        """Returns None when no cookie or header token."""
        auth = JWTCookieAuthentication()

        request = Mock()
        request.COOKIES = {}
        request.META = {}

        result = auth.authenticate(request)

        assert result is None

    def test_returns_none_for_invalid_token(self):
        """Returns None for invalid token."""
        auth = JWTCookieAuthentication()

        request = Mock()
        request.COOKIES = {"access_token": "invalid-token"}
        request.META = {}

        result = auth.authenticate(request)

        assert result is None


class TestSetJwtCookies:
    """Tests for set_jwt_cookies helper."""

    def test_sets_access_cookie(self, settings):
        """Sets access token cookie on response."""
        settings.SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(minutes=30)}

        response = HttpResponse()
        set_jwt_cookies(response, "access-token-value")

        assert "access_token" in response.cookies
        assert response.cookies["access_token"].value == "access-token-value"
        assert response.cookies["access_token"]["httponly"] is True

    def test_sets_refresh_cookie(self, settings):
        """Sets refresh token cookie when provided."""
        settings.SIMPLE_JWT = {
            "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
            "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
        }

        response = HttpResponse()
        set_jwt_cookies(response, "access-token", "refresh-token")

        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies
        assert response.cookies["refresh_token"].value == "refresh-token"

    def test_uses_cookie_settings(self, settings):
        """Uses cookie settings from Django settings."""
        settings.SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(minutes=30)}
        settings.JWT_AUTH_COOKIE_SECURE = True
        settings.JWT_AUTH_COOKIE_SAMESITE = "Strict"

        response = HttpResponse()
        set_jwt_cookies(response, "token")

        assert response.cookies["access_token"]["secure"] is True
        assert response.cookies["access_token"]["samesite"] == "Strict"

    def test_sets_domain_when_configured(self, settings):
        """Sets cookie domain when configured."""
        settings.SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(minutes=30)}
        settings.JWT_AUTH_COOKIE_DOMAIN = ".example.com"

        response = HttpResponse()
        set_jwt_cookies(response, "token")

        assert response.cookies["access_token"]["domain"] == ".example.com"


class TestDeleteJwtCookies:
    """Tests for delete_jwt_cookies helper."""

    def test_deletes_both_cookies(self, settings):
        """Deletes both access and refresh cookies."""
        response = HttpResponse()
        response.set_cookie("access_token", "value")
        response.set_cookie("refresh_token", "value")

        delete_jwt_cookies(response)

        # Check that delete was called (cookies are set to expire)
        assert response.cookies["access_token"]["max-age"] == 0
        assert response.cookies["refresh_token"]["max-age"] == 0

    def test_uses_path_setting(self, settings):
        """Uses configured path for cookie deletion."""
        settings.JWT_AUTH_COOKIE_PATH = "/api/"

        response = HttpResponse()
        delete_jwt_cookies(response)

        assert response.cookies["access_token"]["path"] == "/api/"

    def test_uses_domain_setting(self, settings):
        """Uses configured domain for cookie deletion."""
        settings.JWT_AUTH_COOKIE_DOMAIN = ".example.com"

        response = HttpResponse()
        delete_jwt_cookies(response)

        assert response.cookies["access_token"]["domain"] == ".example.com"
