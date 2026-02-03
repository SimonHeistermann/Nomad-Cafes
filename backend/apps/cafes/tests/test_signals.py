"""
Tests for Cafe app signals.
"""

import pytest
from apps.cafes.models import Cafe
from apps.locations.models import Location


pytestmark = pytest.mark.django_db


class TestCafeSignals:
    """Tests for cafe create/update/delete signals."""

    @pytest.fixture
    def location(self, db):
        """Create a test location."""
        return Location.objects.create(
            name={"en": "Test Location"},
            slug="test-location",
            country="Test Country",
            country_code="TC",
            is_active=True,
            cafe_count=0,
        )

    @pytest.fixture
    def second_location(self, db):
        """Create a second test location."""
        return Location.objects.create(
            name={"en": "Second Location"},
            slug="second-location",
            country="Test Country",
            country_code="TC",
            is_active=True,
            cafe_count=0,
        )

    def test_creating_active_cafe_increments_count(self, location):
        """Creating an active cafe increments location cafe_count."""
        assert location.cafe_count == 0

        Cafe.objects.create(
            name="Test Cafe",
            slug="test-cafe",
            location=location,
            is_active=True,
        )

        location.refresh_from_db()
        assert location.cafe_count == 1

    def test_creating_inactive_cafe_does_not_increment_count(self, location):
        """Creating an inactive cafe does not increment location cafe_count."""
        assert location.cafe_count == 0

        Cafe.objects.create(
            name="Test Cafe",
            slug="test-cafe-inactive",
            location=location,
            is_active=False,
        )

        location.refresh_from_db()
        assert location.cafe_count == 0

    def test_activating_cafe_increments_count(self, location):
        """Changing cafe from inactive to active increments count."""
        cafe = Cafe.objects.create(
            name="Test Cafe",
            slug="test-cafe",
            location=location,
            is_active=False,
        )
        location.refresh_from_db()
        assert location.cafe_count == 0

        cafe.is_active = True
        cafe.save()

        location.refresh_from_db()
        assert location.cafe_count == 1

    def test_deactivating_cafe_decrements_count(self, location):
        """Changing cafe from active to inactive decrements count."""
        cafe = Cafe.objects.create(
            name="Test Cafe",
            slug="test-cafe",
            location=location,
            is_active=True,
        )
        location.refresh_from_db()
        assert location.cafe_count == 1

        cafe.is_active = False
        cafe.save()

        location.refresh_from_db()
        assert location.cafe_count == 0

    def test_changing_location_updates_both_counts(self, location, second_location):
        """Moving cafe to different location updates both locations."""
        cafe = Cafe.objects.create(
            name="Test Cafe",
            slug="test-cafe",
            location=location,
            is_active=True,
        )

        location.refresh_from_db()
        second_location.refresh_from_db()
        assert location.cafe_count == 1
        assert second_location.cafe_count == 0

        # Move cafe to second location
        cafe.location = second_location
        cafe.save()

        location.refresh_from_db()
        second_location.refresh_from_db()
        assert location.cafe_count == 0
        assert second_location.cafe_count == 1

    def test_deleting_active_cafe_decrements_count(self, location):
        """Deleting an active cafe decrements location cafe_count."""
        cafe = Cafe.objects.create(
            name="Test Cafe",
            slug="test-cafe",
            location=location,
            is_active=True,
        )

        location.refresh_from_db()
        assert location.cafe_count == 1

        cafe.delete()

        location.refresh_from_db()
        assert location.cafe_count == 0

    def test_deleting_inactive_cafe_does_not_change_count(self, location):
        """Deleting an inactive cafe does not change location cafe_count."""
        cafe = Cafe.objects.create(
            name="Test Cafe",
            slug="test-cafe",
            location=location,
            is_active=False,
        )

        location.refresh_from_db()
        assert location.cafe_count == 0

        cafe.delete()

        location.refresh_from_db()
        assert location.cafe_count == 0

    def test_moving_inactive_cafe_does_not_change_counts(self, location, second_location):
        """Moving an inactive cafe does not affect either location count."""
        cafe = Cafe.objects.create(
            name="Test Cafe",
            slug="test-cafe",
            location=location,
            is_active=False,
        )

        # Add active cafe to each location first
        Cafe.objects.create(
            name="Active Cafe 1",
            slug="active-cafe-1",
            location=location,
            is_active=True,
        )
        Cafe.objects.create(
            name="Active Cafe 2",
            slug="active-cafe-2",
            location=second_location,
            is_active=True,
        )

        location.refresh_from_db()
        second_location.refresh_from_db()
        assert location.cafe_count == 1
        assert second_location.cafe_count == 1

        # Move inactive cafe
        cafe.location = second_location
        cafe.save()

        location.refresh_from_db()
        second_location.refresh_from_db()
        # Counts should not change since the moved cafe was inactive
        assert location.cafe_count == 1
        assert second_location.cafe_count == 1
