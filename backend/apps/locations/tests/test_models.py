"""
Tests for Location model.
"""

import pytest

from apps.locations.models import Location


pytestmark = pytest.mark.django_db


class TestLocationModel:
    """Tests for Location model."""

    def test_create_location(self, db):
        """Test creating a location."""
        location = Location.objects.create(
            name={"en": "Paris", "de": "Paris"},
            slug="paris",
            country="France",
            country_code="FR",
        )
        assert location.slug == "paris"
        assert location.get_name("en") == "Paris"
        assert location.display_name == "Paris"

    def test_location_str(self, location):
        """Test location string representation."""
        assert str(location) == "Berlin"

    def test_get_name_fallback(self, db):
        """Test name fallback to English."""
        location = Location.objects.create(
            name={"en": "Tokyo"},
            slug="tokyo",
            country="Japan",
        )
        # Request German, should fallback to English
        assert location.get_name("de") == "Tokyo"
