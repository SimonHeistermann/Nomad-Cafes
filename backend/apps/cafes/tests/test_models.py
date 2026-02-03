"""
Tests for Cafe model.
"""

import pytest

from apps.cafes.models import Cafe


pytestmark = pytest.mark.django_db


class TestCafeModel:
    """Tests for Cafe model."""

    def test_create_cafe(self, location):
        """Test creating a cafe."""
        cafe = Cafe.objects.create(
            name="Nomad Coffee",
            slug="nomad-coffee",
            location=location,
            address="Main Street 1",
            city="Berlin",
        )
        assert cafe.slug == "nomad-coffee"
        assert cafe.category == Cafe.Category.CAFE
        assert cafe.price_level == Cafe.PriceLevel.MODERATE

    def test_cafe_str(self, cafe):
        """Test cafe string representation."""
        assert str(cafe) == "Test Cafe"

    def test_get_description_i18n(self, cafe):
        """Test internationalized description getter."""
        assert cafe.get_description("en") == "A great cafe for nomads"
        # Fallback to English
        assert cafe.get_description("de") == "A great cafe for nomads"
