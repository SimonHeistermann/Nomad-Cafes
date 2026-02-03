"""
Tests for Cafe API endpoints.
"""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.cafes.models import Favorite


pytestmark = pytest.mark.django_db


class TestCafeEndpoints:
    """Tests for Cafe API endpoints."""

    def test_list_cafes(self, api_client, cafe):
        """GET /api/cafes/ - list all cafes."""
        url = reverse("cafes:cafe-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_list_excludes_inactive(self, api_client, cafe, inactive_cafe):
        """Inactive cafes should not be listed."""
        url = reverse("cafes:cafe-list")
        response = api_client.get(url)

        slugs = [c["slug"] for c in response.data["results"]]
        assert cafe.slug in slugs
        assert inactive_cafe.slug not in slugs

    def test_retrieve_cafe(self, api_client, cafe):
        """GET /api/cafes/{slug}/ - retrieve single cafe."""
        url = reverse("cafes:cafe-detail", kwargs={"slug": cafe.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["slug"] == cafe.slug
        assert response.data["city"] == "Berlin"
        assert "location" in response.data

    def test_filter_by_category(self, api_client, cafe):
        """Filter cafes by category."""
        url = reverse("cafes:cafe-list")
        response = api_client.get(url, {"category": "cafe"})

        assert response.status_code == status.HTTP_200_OK
        for c in response.data["results"]:
            assert c["category"] == "cafe"

    def test_filter_by_price_level(self, api_client, cafe):
        """Filter cafes by price level."""
        url = reverse("cafes:cafe-list")
        response = api_client.get(url, {"price_level": 2})

        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_city(self, api_client, cafe):
        """Filter cafes by city."""
        url = reverse("cafes:cafe-list")
        response = api_client.get(url, {"city": "berlin"})

        assert response.status_code == status.HTTP_200_OK

    def test_search_cafes(self, api_client, cafe):
        """Search cafes by name."""
        url = reverse("cafes:cafe-list")
        response = api_client.get(url, {"search": "Test"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_popular_cafes(self, api_client, cafe):
        """GET /api/cafes/popular/ - list popular cafes."""
        # Add rating to make it appear in popular
        cafe.rating_avg = 4.5
        cafe.rating_count = 10
        cafe.save()

        url = reverse("cafes:cafe-popular")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_create_cafe_requires_admin(self, api_client, location):
        """Creating a cafe requires admin authentication."""
        url = reverse("cafes:cafe-list")
        response = api_client.post(
            url,
            {
                "name": "New Cafe",
                "location": str(location.id),
                "address": "Test",
                "city": "Berlin",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filter_by_invalid_feature_returns_empty(self, api_client, cafe_factory, location):
        """Filtering by invalid feature returns empty results."""
        # Create cafe with valid features
        cafe_factory(
            name="Wifi Cafe",
            location=location,
            features=["fast_wifi"],
            is_active=True,
        )

        url = reverse("cafes:cafe-list")
        response = api_client.get(url, {"feature": "invalid_feature_that_does_not_exist"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0

    def test_filter_by_valid_feature(self, api_client, cafe_factory, location):
        """Filtering by valid feature returns matching cafes."""
        cafe_factory(
            name="Power Cafe",
            slug="power-cafe",
            location=location,
            features=["power_outlets"],
            is_active=True,
        )
        cafe_factory(
            name="No Power Cafe",
            slug="no-power-cafe",
            location=location,
            features=["fast_wifi"],
            is_active=True,
        )

        url = reverse("cafes:cafe-list")
        response = api_client.get(url, {"feature": "power_outlets"})

        assert response.status_code == status.HTTP_200_OK
        slugs = [c["slug"] for c in response.data["results"]]
        assert "power-cafe" in slugs

    def test_filter_by_price_range(self, api_client, cafe_factory, location):
        """Filter cafes by price range."""
        cafe_factory(
            name="Cheap Cafe",
            slug="cheap-cafe",
            location=location,
            price_level=1,
            is_active=True,
        )
        cafe_factory(
            name="Expensive Cafe",
            slug="expensive-cafe",
            location=location,
            price_level=4,
            is_active=True,
        )

        url = reverse("cafes:cafe-list")
        response = api_client.get(url, {"price_min": 1, "price_max": 2})

        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_rating_min(self, api_client, cafe_factory, location):
        """Filter cafes by minimum rating."""
        cafe_factory(
            name="High Rated",
            slug="high-rated",
            location=location,
            rating_avg=4.5,
            is_active=True,
        )
        cafe_factory(
            name="Low Rated",
            slug="low-rated",
            location=location,
            rating_avg=2.5,
            is_active=True,
        )

        url = reverse("cafes:cafe-list")
        response = api_client.get(url, {"rating_min": 4.0})

        assert response.status_code == status.HTTP_200_OK
        slugs = [c["slug"] for c in response.data["results"]]
        assert "high-rated" in slugs
        assert "low-rated" not in slugs


class TestFavoriteEndpoints:
    """Tests for Favorite API endpoints."""

    def test_list_favorites_requires_auth(self, api_client):
        """GET /api/favorites/ - requires authentication."""
        url = reverse("cafes:favorite-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_add_favorite(self, api_client, user, cafe):
        """POST /api/favorites/ - add cafe to favorites."""
        api_client.force_authenticate(user=user)

        url = reverse("cafes:favorite-list")
        response = api_client.post(
            url,
            {"cafe_id": str(cafe.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Favorite.objects.filter(user=user, cafe=cafe).exists()

    def test_list_favorites(self, api_client, user, cafe):
        """GET /api/favorites/ - list user's favorites."""
        Favorite.objects.create(user=user, cafe=cafe)
        api_client.force_authenticate(user=user)

        url = reverse("cafes:favorite-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    def test_check_favorite(self, api_client, user, cafe):
        """GET /api/favorites/{cafe_id}/ - check if favorited."""
        Favorite.objects.create(user=user, cafe=cafe)
        api_client.force_authenticate(user=user)

        url = reverse("cafes:favorite-detail", kwargs={"cafe_id": cafe.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_favorited"] is True

    def test_remove_favorite(self, api_client, user, cafe):
        """DELETE /api/favorites/{cafe_id}/ - remove from favorites."""
        Favorite.objects.create(user=user, cafe=cafe)
        api_client.force_authenticate(user=user)

        url = reverse("cafes:favorite-detail", kwargs={"cafe_id": cafe.id})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Favorite.objects.filter(user=user, cafe=cafe).exists()


class TestStatsEndpoint:
    """Tests for Stats API endpoint."""

    def test_get_stats(self, api_client, cafe, user):
        """GET /api/stats/ - retrieve platform statistics."""
        url = reverse("cafes:stats-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "cafes" in response.data
        assert "locations" in response.data
        assert "users" in response.data
        assert response.data["cafes"] >= 1
