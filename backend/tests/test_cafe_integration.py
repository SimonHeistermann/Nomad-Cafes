"""
Integration tests for cafe operations.

Tests complete user journeys:
- Browse cafes → View details → Favorite
- Search and filter cafes
- Review submission flow
"""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.cafes.models import Cafe, Favorite
from apps.reviews.models import Review


pytestmark = pytest.mark.django_db


class TestCafeBrowsingFlow:
    """Test cafe discovery and browsing flows."""

    def test_browse_cafes_flow(self, api_client, cafe, location):
        """Test: List cafes → Filter → View details."""
        # Step 1: List all cafes
        list_url = reverse("cafes:cafe-list")
        response = api_client.get(list_url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) >= 1

        # Step 2: Filter by location
        response = api_client.get(list_url, {"location": location.slug})

        assert response.status_code == status.HTTP_200_OK
        # API returns flat location_name field, not nested location object
        for cafe_data in response.data["results"]:
            assert "location_name" in cafe_data

        # Step 3: View cafe details
        detail_url = reverse("cafes:cafe-detail", kwargs={"slug": cafe.slug})
        response = api_client.get(detail_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["slug"] == cafe.slug
        assert "name" in response.data
        # Detail view returns location as nested object
        assert "location" in response.data or "location_name" in response.data

    def test_search_cafes(self, api_client, cafe_factory, location):
        """Test cafe search functionality."""
        # Create cafes with specific names
        cafe_factory(name="Coffee Paradise", location=location, is_active=True)
        cafe_factory(name="Tea House", location=location, is_active=True)
        cafe_factory(name="Coffee Lab", location=location, is_active=True)

        url = reverse("cafes:cafe-list")

        # Search for "coffee"
        response = api_client.get(url, {"search": "coffee"})

        assert response.status_code == status.HTTP_200_OK
        # Should find cafes with "Coffee" in name
        names = [c["name"] for c in response.data["results"]]
        assert any("Coffee" in name for name in names)

    def test_filter_by_features(self, api_client, cafe_factory, location):
        """Test filtering cafes by features."""
        # Create cafe with specific features
        wifi_cafe = cafe_factory(
            name="Wifi Cafe",
            location=location,
            features=["fast_wifi", "power_outlets"],
            is_active=True,
        )

        url = reverse("cafes:cafe-list")
        response = api_client.get(url, {"features": "fast_wifi"})

        assert response.status_code == status.HTTP_200_OK


class TestFavoriteFlow:
    """Test cafe favorite functionality."""

    def test_favorite_flow(self, authenticated_client, cafe, user):
        """Test: Check favorite → Add → List → Remove."""
        # Step 1: Check if favorited (should be false)
        # FavoriteViewSet uses cafe_id as lookup_field
        check_url = reverse("cafes:favorite-detail", kwargs={"cafe_id": cafe.id})
        response = authenticated_client.get(check_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_favorited"] is False

        # Step 2: Add favorite (POST to list endpoint with cafe_id in body)
        add_url = reverse("cafes:favorite-list")
        response = authenticated_client.post(add_url, {"cafe_id": str(cafe.id)}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Favorite.objects.filter(user=user, cafe=cafe).exists()

        # Step 3: Check again (should be true)
        response = authenticated_client.get(check_url)
        assert response.data["is_favorited"] is True

        # Step 4: List favorites
        list_url = reverse("cafes:favorite-list")
        response = authenticated_client.get(list_url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1
        slugs = [f["cafe"]["slug"] for f in response.data["results"]]
        assert cafe.slug in slugs

        # Step 5: Remove favorite (DELETE to detail endpoint)
        remove_url = reverse("cafes:favorite-detail", kwargs={"cafe_id": cafe.id})
        response = authenticated_client.delete(remove_url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Favorite.objects.filter(user=user, cafe=cafe).exists()

    def test_favorite_requires_auth(self, api_client, cafe):
        """Unauthenticated users cannot favorite."""
        url = reverse("cafes:favorite-list")
        response = api_client.post(url, {"cafe_id": str(cafe.id)}, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestReviewFlow:
    """Test cafe review submission flow."""

    def test_review_submission_flow(self, authenticated_client, cafe, user):
        """Test: View reviews → Submit review → Edit → Delete."""
        # Step 1: List reviews (should be empty)
        list_url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = authenticated_client.get(list_url)

        assert response.status_code == status.HTTP_200_OK

        # Step 2: Submit a review
        review_data = {
            "rating_overall": 4,
            "rating_wifi": 5,
            "rating_power": 4,
            "rating_noise": 3,
            "rating_coffee": 5,
            "text": "Great cafe for remote work!",
        }
        response = authenticated_client.post(list_url, review_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        review_id = response.data["id"]

        # Verify review exists
        assert Review.objects.filter(user=user, cafe=cafe).exists()

        # Step 3: Cafe ratings should be updated
        cafe.refresh_from_db()
        assert cafe.rating_count == 1
        assert cafe.rating_avg == 4.0

        # Step 4: Edit review
        detail_url = reverse(
            "cafes:cafe-review-detail",
            kwargs={"cafe_slug": cafe.slug, "pk": review_id},
        )
        response = authenticated_client.patch(
            detail_url,
            {"rating_overall": 5, "text": "Updated: Even better than I thought!"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["rating_overall"] == 5

        # Step 5: Delete review (soft delete - sets is_active=False)
        response = authenticated_client.delete(detail_url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        # Soft delete: review exists but is_active=False
        review = Review.objects.get(id=review_id)
        assert review.is_active is False

    def test_cannot_review_same_cafe_twice(self, authenticated_client, cafe, user):
        """User cannot submit multiple reviews for same cafe."""
        # Ensure no previous reviews exist for this user+cafe (from other tests)
        Review.objects.filter(user=user, cafe=cafe).delete()

        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})

        # First review (all rating fields required, text must be >= 10 chars)
        review_data = {
            "rating_overall": 4,
            "rating_wifi": 4,
            "rating_power": 4,
            "rating_noise": 4,
            "rating_coffee": 4,
            "text": "This is a good cafe for working",
        }
        response = authenticated_client.post(url, review_data, format="json")
        assert response.status_code == status.HTTP_201_CREATED, f"Failed: {response.data}"

        # Second review should fail (duplicate review for same user+cafe)
        review_data["text"] = "Another review I want to post"
        review_data["rating_overall"] = 5
        response = authenticated_client.post(url, review_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_review_requires_auth(self, api_client, cafe):
        """Unauthenticated users cannot review."""
        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = api_client.post(
            url,
            {"rating_overall": 4, "text": "Test"},
            format="json",
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestLocationBrowsingFlow:
    """Test location discovery flow."""

    def test_location_flow(self, api_client, location, cafe):
        """Test: List locations → View details → See cafes."""
        # Step 1: List locations
        list_url = reverse("locations:location-list")
        response = api_client.get(list_url)

        assert response.status_code == status.HTTP_200_OK

        # Step 2: View location details
        detail_url = reverse("locations:location-detail", kwargs={"slug": location.slug})
        response = api_client.get(detail_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["slug"] == location.slug

        # Step 3: Get cafes for this location
        cafes_url = reverse("cafes:cafe-list")
        response = api_client.get(cafes_url, {"location": location.slug})

        assert response.status_code == status.HTTP_200_OK


class TestPopularAndFeaturedFlow:
    """Test popular and featured content endpoints."""

    def test_popular_cafes(self, api_client, cafe_factory, location):
        """Test popular cafes endpoint."""
        # Create cafes with different ratings
        cafe_factory(
            name="Top Rated",
            location=location,
            rating_avg=4.8,
            rating_count=50,
            is_active=True,
        )
        cafe_factory(
            name="Medium Rated",
            location=location,
            rating_avg=3.5,
            rating_count=20,
            is_active=True,
        )

        url = reverse("cafes:cafe-popular")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_trending_locations(self, api_client, location_factory):
        """Test trending locations endpoint."""
        location_factory(is_active=True, is_featured=True, cafe_count=10)
        location_factory(is_active=True, is_featured=True, cafe_count=5)

        url = reverse("locations:location-trending")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
