"""
Shared fixtures for cafe tests.
"""

import pytest
from rest_framework.test import APIClient

from apps.locations.models import Location
from apps.users.models import User
from apps.cafes.models import Cafe


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
def api_client():
    """Create an API client for testing."""
    return APIClient()


@pytest.fixture
def user(db):
    """Create a test user."""
    return User.objects.create_user(
        email="test@example.com",
        password="TestPass123!",
        name="Test User",
    )


@pytest.fixture
def location(db):
    """Create a test location."""
    return Location.objects.create(
        name={"en": "Berlin"},
        slug="berlin",
        country="Germany",
        country_code="DE",
        timezone="Europe/Berlin",
        is_active=True,
    )


@pytest.fixture
def cafe(db, location):
    """Create a test cafe."""
    return Cafe.objects.create(
        name="Test Cafe",
        slug="test-cafe",
        location=location,
        address="Test Street 1",
        city="Berlin",
        category=Cafe.Category.CAFE,
        price_level=Cafe.PriceLevel.MODERATE,
        description={"en": "A great cafe for nomads"},
        is_active=True,
        is_featured=True,
    )


@pytest.fixture
def inactive_cafe(db, location):
    """Create an inactive test cafe."""
    return Cafe.objects.create(
        name="Inactive Cafe",
        slug="inactive-cafe",
        location=location,
        address="Hidden Street 1",
        city="Berlin",
        is_active=False,
    )
