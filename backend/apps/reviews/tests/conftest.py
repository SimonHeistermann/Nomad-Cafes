"""
Shared fixtures for review tests.
"""

import pytest
from rest_framework.test import APIClient

from apps.cafes.models import Cafe
from apps.locations.models import Location
from apps.users.models import User
from apps.reviews.models import Review


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
        email="reviewer@example.com",
        password="TestPass123!",
        name="Reviewer",
    )


@pytest.fixture
def other_user(db):
    """Create another test user."""
    return User.objects.create_user(
        email="other@example.com",
        password="TestPass123!",
        name="Other User",
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_superuser(
        email="admin@example.com",
        password="AdminPass123!",
        name="Admin",
    )


@pytest.fixture
def location(db):
    """Create a test location."""
    return Location.objects.create(
        name={"en": "Berlin"},
        slug="berlin",
        country="Germany",
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
        is_active=True,
    )


@pytest.fixture
def review(db, user, cafe):
    """Create a test review."""
    return Review.objects.create(
        user=user,
        cafe=cafe,
        rating_overall=4,
        rating_wifi=5,
        rating_power=4,
        rating_noise=3,
        rating_coffee=4,
        text="Great place for working. Good wifi and plenty of power outlets.",
        language="en",
    )
