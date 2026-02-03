"""
Shared fixtures for user tests.
"""

import pytest
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.fixture(autouse=True)
def disable_throttling(settings):
    """Disable throttling for all tests."""
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_CLASSES": [],
        "DEFAULT_THROTTLE_RATES": {
            "anon": "10000/minute",
            "user": "10000/minute",
            "auth": "10000/minute",
            "password_reset": "10000/minute",
            "email_verification": "10000/minute",
        },
    }


@pytest.fixture
def api_client(db):
    """Create an API client for testing with database access."""
    return APIClient()


@pytest.fixture
def user_data():
    """Standard user registration data."""
    return {
        "email": "newregistration@example.com",
        "password": "SecurePass123!",
        "name": "New Registration User",
    }


@pytest.fixture
def user(db):
    """Create a verified test user with known credentials."""
    return User.objects.create_user(
        email="testuser@example.com",
        password="TestPass123!",
        name="Test User",
        is_email_verified=True,
    )


@pytest.fixture
def authenticated_client(db, user):
    """API client authenticated as a regular user."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_superuser(
        email="admin@example.com",
        password="AdminPass123!",
        name="Admin User",
    )
