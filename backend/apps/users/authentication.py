"""
Custom JWT Cookie Authentication for Django REST Framework.

This module provides a cookie-based JWT authentication that:
- Reads access tokens from httpOnly cookies (XSS-safe)
- Falls back to Authorization header for API clients
- Handles token refresh via separate refresh cookie
"""

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTCookieAuthentication(JWTAuthentication):
    """
    JWT Authentication that reads tokens from cookies first,
    then falls back to Authorization header.

    Cookie names are configured in settings:
    - JWT_AUTH_COOKIE: Access token cookie name (default: "access_token")
    - JWT_AUTH_REFRESH_COOKIE: Refresh token cookie name (default: "refresh_token")
    """

    def authenticate(self, request):
        # Try cookie first
        raw_token = self._get_token_from_cookie(request)

        # Fall back to header if no cookie
        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError):
            return None

        return self.get_user(validated_token), validated_token

    def _get_token_from_cookie(self, request):
        """Extract access token from cookie."""
        cookie_name = getattr(settings, "JWT_AUTH_COOKIE", "access_token")
        return request.COOKIES.get(cookie_name)


def set_jwt_cookies(response, access_token, refresh_token=None):
    """
    Helper to set JWT tokens as httpOnly cookies on a response.

    Args:
        response: Django/DRF Response object
        access_token: The JWT access token string
        refresh_token: The JWT refresh token string (optional)

    Returns:
        The response with cookies set
    """
    cookie_settings = {
        "httponly": getattr(settings, "JWT_AUTH_COOKIE_HTTP_ONLY", True),
        "secure": getattr(settings, "JWT_AUTH_COOKIE_SECURE", False),
        "samesite": getattr(settings, "JWT_AUTH_COOKIE_SAMESITE", "Lax"),
        "path": getattr(settings, "JWT_AUTH_COOKIE_PATH", "/"),
    }

    domain = getattr(settings, "JWT_AUTH_COOKIE_DOMAIN", None)
    if domain:
        cookie_settings["domain"] = domain

    # Access token cookie
    access_cookie_name = getattr(settings, "JWT_AUTH_COOKIE", "access_token")
    access_max_age = int(
        settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()
    )
    response.set_cookie(
        access_cookie_name,
        access_token,
        max_age=access_max_age,
        **cookie_settings,
    )

    # Refresh token cookie (if provided)
    if refresh_token:
        refresh_cookie_name = getattr(
            settings, "JWT_AUTH_REFRESH_COOKIE", "refresh_token"
        )
        refresh_max_age = int(
            settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()
        )
        response.set_cookie(
            refresh_cookie_name,
            refresh_token,
            max_age=refresh_max_age,
            **cookie_settings,
        )

    return response


def delete_jwt_cookies(response):
    """
    Helper to delete JWT cookies (for logout).

    Args:
        response: Django/DRF Response object

    Returns:
        The response with cookies deleted
    """
    access_cookie_name = getattr(settings, "JWT_AUTH_COOKIE", "access_token")
    refresh_cookie_name = getattr(
        settings, "JWT_AUTH_REFRESH_COOKIE", "refresh_token"
    )

    path = getattr(settings, "JWT_AUTH_COOKIE_PATH", "/")
    domain = getattr(settings, "JWT_AUTH_COOKIE_DOMAIN", None)

    delete_kwargs = {"path": path}
    if domain:
        delete_kwargs["domain"] = domain

    response.delete_cookie(access_cookie_name, **delete_kwargs)
    response.delete_cookie(refresh_cookie_name, **delete_kwargs)

    return response
