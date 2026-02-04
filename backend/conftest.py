"""
Shared pytest configuration and fixtures for all backend tests.

This file is automatically loaded by pytest and provides:
- Database configuration
- Common fixtures (api_client, users, auth)
- Test settings overrides
- Factory integrations
"""

import pytest
from rest_framework.test import APIClient

from apps.users.models import User
from apps.users.factories import UserFactory
from apps.locations.factories import LocationFactory
from apps.cafes.factories import CafeFactory


# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def disable_throttling(settings):
    """Disable throttling for all tests globally."""
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_CLASSES": [],
        "DEFAULT_THROTTLE_RATES": {
            "anon": "10000/minute",
            "user": "10000/minute",
            "auth": "10000/minute",
            "token_refresh": "10000/minute",
            "password_reset": "10000/minute",
            "email_verification": "10000/minute",
            "contact": "10000/minute",
            "review_create": "10000/minute",
            "favorite_create": "10000/minute",
        },
    }


@pytest.fixture(autouse=True)
def clear_throttle_cache():
    """Clear the throttle cache before each test to avoid rate limit carryover."""
    from django.core.cache import cache
    cache.clear()
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def use_console_email_backend(settings):
    """Use console email backend for all tests."""
    settings.EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    settings.RESEND_API_KEY = ""


# -----------------------------------------------------------------------------
# API Client Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture
def api_client(db):
    """Unauthenticated API client with database access."""
    return APIClient()


@pytest.fixture
def authenticated_client(db, user):
    """API client authenticated as a regular user."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def admin_client(db, admin_user):
    """API client authenticated as admin."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


# -----------------------------------------------------------------------------
# User Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture
def user(db):
    """Create a verified user with known credentials."""
    return User.objects.create_user(
        email="testuser@example.com",
        password="TestPass123!",
        name="Test User",
        is_email_verified=True,
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_superuser(
        email="admin@example.com",
        password="AdminPass123!",
        name="Admin User",
    )


@pytest.fixture
def unverified_user(db):
    """Create an unverified user."""
    return User.objects.create_user(
        email="unverified@example.com",
        password="TestPass123!",
        name="Unverified User",
        is_email_verified=False,
    )


@pytest.fixture
def user_factory(db):
    """Return UserFactory for creating multiple users."""
    return UserFactory


@pytest.fixture
def user_data():
    """Test data for user registration."""
    return {
        "email": "newregistration@example.com",
        "password": "SecurePass123!",
        "name": "New Registration User",
    }


# -----------------------------------------------------------------------------
# Location Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture
def location(db):
    """Create a basic test location."""
    return LocationFactory(
        name={"en": "Berlin", "de": "Berlin"},
        slug="berlin",
        country="Germany",
        country_code="DE",
        is_active=True,
    )


@pytest.fixture
def location_factory(db):
    """Return LocationFactory for creating multiple locations."""
    return LocationFactory


# -----------------------------------------------------------------------------
# Cafe Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture
def cafe(db, location):
    """Create a basic test cafe."""
    return CafeFactory(
        name="Test Cafe",
        slug="test-cafe",
        location=location,
        is_active=True,
    )


@pytest.fixture
def cafe_factory(db):
    """Return CafeFactory for creating multiple cafes."""
    return CafeFactory


# -----------------------------------------------------------------------------
# Auth Helper Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture
def auth_tokens(api_client, user):
    """
    Login a user and return the tokens from cookies.
    Useful for testing authenticated flows.
    """
    from django.urls import reverse

    response = api_client.post(
        reverse("users:login"),
        {"email": "testuser@example.com", "password": "TestPass123!"},
        format="json",
    )
    return {
        "access_token": response.cookies.get("access_token"),
        "refresh_token": response.cookies.get("refresh_token"),
    }


@pytest.fixture
def user_with_verification_token(db):
    """Create a user with a pending verification token."""
    user = User.objects.create_user(
        email="newuser@example.com",
        password="TestPass123!",
        name="New User",
        is_email_verified=False,
    )
    plain_token = user.set_email_verification_token()
    user.save()
    return user, plain_token


@pytest.fixture
def user_with_reset_token(db):
    """Create a user with a pending password reset token."""
    user = User.objects.create_user(
        email="resetuser@example.com",
        password="OldPass123!",
        name="Reset User",
        is_email_verified=True,
    )
    plain_token = user.set_password_reset_token()
    user.save()
    return user, plain_token
