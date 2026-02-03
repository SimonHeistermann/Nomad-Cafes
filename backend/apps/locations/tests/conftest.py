"""
Shared fixtures for location tests.
"""

import pytest
from rest_framework.test import APIClient

from apps.locations.models import Location


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
def location(db):
    """Create a test location."""
    return Location.objects.create(
        name={"en": "Berlin", "de": "Berlin"},
        slug="berlin",
        country="Germany",
        country_code="DE",
        region="Berlin",
        timezone="Europe/Berlin",
        is_featured=True,
        is_active=True,
    )


@pytest.fixture
def inactive_location(db):
    """Create an inactive test location."""
    return Location.objects.create(
        name={"en": "Hidden City"},
        slug="hidden-city",
        country="Unknown",
        is_active=False,
    )
