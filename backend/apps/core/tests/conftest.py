"""
Shared fixtures for core tests.
"""

import pytest
from rest_framework.test import APIClient


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
