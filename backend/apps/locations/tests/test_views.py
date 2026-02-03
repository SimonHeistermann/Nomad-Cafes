"""
Tests for Location API endpoints.
"""

import pytest
from django.urls import reverse
from rest_framework import status


pytestmark = pytest.mark.django_db


class TestLocationEndpoints:
    """Tests for Location API endpoints."""

    def test_list_locations(self, api_client, location):
        """GET /api/locations/ - list all locations."""
        url = reverse("locations:location-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_list_excludes_inactive(self, api_client, location, inactive_location):
        """Inactive locations should not be listed."""
        url = reverse("locations:location-list")
        response = api_client.get(url)

        slugs = [loc["slug"] for loc in response.data["results"]]
        assert location.slug in slugs
        assert inactive_location.slug not in slugs

    def test_retrieve_location(self, api_client, location):
        """GET /api/locations/{slug}/ - retrieve single location."""
        url = reverse("locations:location-detail", kwargs={"slug": location.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["slug"] == location.slug
        assert response.data["country"] == "Germany"

    def test_trending_locations(self, api_client, location):
        """GET /api/locations/trending/ - list trending locations."""
        # Update cafe_count to make it appear in trending
        location.cafe_count = 10
        location.save()

        url = reverse("locations:location-trending")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_country(self, api_client, location):
        """Filter locations by country."""
        url = reverse("locations:location-list")
        response = api_client.get(url, {"country": "Germany"})

        assert response.status_code == status.HTTP_200_OK
        for loc in response.data["results"]:
            assert loc["country_code"] == "DE" or "germany" in loc["slug"].lower()

    def test_create_location_requires_admin(self, api_client):
        """Creating a location requires admin authentication."""
        url = reverse("locations:location-list")
        response = api_client.post(
            url,
            {"name": {"en": "Test"}, "slug": "test", "country": "Test"},
            format="json",
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filter_by_has_cafes_true(self, api_client, location_factory):
        """Filter to only locations with cafes."""
        # Create location with cafes
        location_with_cafes = location_factory(
            name={"en": "With Cafes"},
            slug="with-cafes",
            is_active=True,
            cafe_count=5,
        )
        # Create location without cafes
        location_without_cafes = location_factory(
            name={"en": "Without Cafes"},
            slug="without-cafes",
            is_active=True,
            cafe_count=0,
        )

        url = reverse("locations:location-list")
        response = api_client.get(url, {"has_cafes": "true"})

        assert response.status_code == status.HTTP_200_OK
        slugs = [loc["slug"] for loc in response.data["results"]]
        assert "with-cafes" in slugs
        assert "without-cafes" not in slugs

    def test_filter_by_has_cafes_false(self, api_client, location_factory):
        """Filter without has_cafes returns all locations."""
        location_factory(
            name={"en": "Location 1"},
            slug="location-1",
            is_active=True,
            cafe_count=5,
        )
        location_factory(
            name={"en": "Location 2"},
            slug="location-2",
            is_active=True,
            cafe_count=0,
        )

        url = reverse("locations:location-list")
        response = api_client.get(url, {"has_cafes": "false"})

        assert response.status_code == status.HTTP_200_OK
        # Should return both locations when has_cafes=false
        assert response.data["count"] >= 2

    def test_filter_by_is_featured(self, api_client, location_factory):
        """Filter to only featured locations."""
        featured = location_factory(
            name={"en": "Featured"},
            slug="featured-location",
            is_active=True,
            is_featured=True,
        )
        not_featured = location_factory(
            name={"en": "Not Featured"},
            slug="not-featured",
            is_active=True,
            is_featured=False,
        )

        url = reverse("locations:location-list")
        response = api_client.get(url, {"is_featured": "true"})

        assert response.status_code == status.HTTP_200_OK
        slugs = [loc["slug"] for loc in response.data["results"]]
        assert "featured-location" in slugs
