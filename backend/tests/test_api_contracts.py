"""
API Contract Tests - Schema Validation.

Ensures API responses match expected schemas and contracts.
These tests catch breaking changes to the API structure.
"""

import pytest
from django.urls import reverse
from rest_framework import status


pytestmark = pytest.mark.django_db


class TestUserApiContract:
    """Contract tests for user-related endpoints."""

    REQUIRED_USER_FIELDS = {"id", "email", "name", "role", "is_email_verified", "created_at"}
    REQUIRED_PROFILE_FIELDS = REQUIRED_USER_FIELDS | {"bio", "avatar_url"}

    def test_register_response_contract(self, api_client):
        """Register endpoint returns expected structure."""
        url = reverse("users:register")
        response = api_client.post(
            url,
            {
                "email": "contract@example.com",
                "password": "ContractPass123!",
                "name": "Contract User",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert "user" in response.data

        user_data = response.data["user"]
        assert self.REQUIRED_USER_FIELDS.issubset(user_data.keys())

        # Type checks
        assert isinstance(user_data["id"], str)  # UUID string
        assert isinstance(user_data["email"], str)
        assert isinstance(user_data["is_email_verified"], bool)

    def test_login_response_contract(self, api_client, user):
        """Login endpoint returns expected structure."""
        url = reverse("users:login")
        response = api_client.post(
            url,
            {"email": user.email, "password": "TestPass123!"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert "user" in response.data
        assert self.REQUIRED_USER_FIELDS.issubset(response.data["user"].keys())

        # Cookies must be set
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies

    def test_me_response_contract(self, authenticated_client):
        """Me endpoint returns full profile structure."""
        url = reverse("users:me")
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert self.REQUIRED_PROFILE_FIELDS.issubset(response.data.keys())


class TestCafeApiContract:
    """Contract tests for cafe-related endpoints."""

    # Core fields that must exist in list view
    REQUIRED_CAFE_LIST_FIELDS = {
        "id", "name", "slug", "category", "price_level",
        "rating_avg", "rating_count", "is_featured", "city", "location_name",
    }

    # Additional fields for detail view (different from list - no location_name)
    REQUIRED_CAFE_DETAIL_FIELDS = {
        "id", "name", "slug", "category", "price_level",
        "rating_avg", "rating_count", "is_featured",
        "description", "amenities", "opening_hours", "gallery",
    }

    def test_cafe_list_response_contract(self, api_client, cafe):
        """Cafe list endpoint returns expected structure."""
        url = reverse("cafes:cafe-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        # Pagination structure
        assert "count" in response.data
        assert "results" in response.data
        assert isinstance(response.data["count"], int)
        assert isinstance(response.data["results"], list)

        if response.data["results"]:
            cafe_data = response.data["results"][0]
            missing = self.REQUIRED_CAFE_LIST_FIELDS - set(cafe_data.keys())
            assert not missing, f"Missing fields: {missing}"

            # Location info as strings
            assert "city" in cafe_data
            assert "location_name" in cafe_data

    def test_cafe_detail_response_contract(self, api_client, cafe):
        """Cafe detail endpoint returns full structure."""
        url = reverse("cafes:cafe-detail", kwargs={"slug": cafe.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        missing = self.REQUIRED_CAFE_DETAIL_FIELDS - set(response.data.keys())
        assert not missing, f"Missing fields: {missing}"

        # Type checks
        assert isinstance(response.data["features"], list)
        assert isinstance(response.data["gallery"], list)
        assert isinstance(response.data["opening_hours"], dict)

    def test_cafe_detail_social_links_contract(self, api_client, cafe):
        """Cafe detail social_links includes all platform fields including twitter."""
        # Set up social links
        cafe.social_links = {
            "instagram": "https://instagram.com/test",
            "facebook": "https://facebook.com/test",
            "twitter": "https://x.com/test",
            "tiktok": "https://tiktok.com/@test",
        }
        cafe.save()

        url = reverse("cafes:cafe-detail", kwargs={"slug": cafe.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "social_links" in response.data

        social_links = response.data["social_links"]
        assert "instagram" in social_links
        assert "facebook" in social_links
        assert "twitter" in social_links  # X (formerly Twitter)
        assert "tiktok" in social_links

    def test_popular_cafes_invalid_page_size_returns_400(self, api_client):
        """Popular cafes endpoint returns 400 for invalid page_size parameter."""
        url = reverse("cafes:cafe-popular")
        response = api_client.get(url, {"page_size": "invalid"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "message" in response.data
        assert "code" in response.data
        assert response.data["code"] == "invalid_parameter"

    def test_favorite_list_response_contract(self, authenticated_client, cafe, user):
        """Favorite list returns expected structure."""
        # Add a favorite first
        from apps.cafes.models import Favorite
        Favorite.objects.create(user=user, cafe=cafe)

        url = reverse("cafes:favorite-list")
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data

        if response.data["results"]:
            favorite = response.data["results"][0]
            assert "id" in favorite
            assert "cafe" in favorite
            assert "created_at" in favorite
            # Nested cafe should have expected fields
            assert "name" in favorite["cafe"]
            assert "slug" in favorite["cafe"]


class TestReviewApiContract:
    """Contract tests for review-related endpoints."""

    REQUIRED_REVIEW_FIELDS = {
        "id", "rating_overall", "rating_wifi", "rating_power",
        "rating_noise", "rating_coffee", "text", "created_at",
    }

    def test_review_list_response_contract(self, api_client, cafe):
        """Review list endpoint returns expected structure."""
        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data

    def test_review_create_response_contract(self, authenticated_client, cafe):
        """Review creation returns expected structure."""
        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = authenticated_client.post(
            url,
            {
                "rating_overall": 4,
                "rating_wifi": 5,
                "rating_power": 4,
                "rating_noise": 3,
                "rating_coffee": 4,
                "text": "Contract test review - testing the API contract",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        missing = self.REQUIRED_REVIEW_FIELDS - set(response.data.keys())
        assert not missing, f"Missing fields: {missing}"

        # Type checks
        assert isinstance(response.data["rating_overall"], int)
        assert 1 <= response.data["rating_overall"] <= 5


class TestLocationApiContract:
    """Contract tests for location-related endpoints."""

    REQUIRED_LOCATION_LIST_FIELDS = {
        "id", "name", "slug", "country", "country_code",
        "cafe_count", "thumbnail_url", "is_featured",
    }

    REQUIRED_LOCATION_DETAIL_FIELDS = REQUIRED_LOCATION_LIST_FIELDS | {
        "region", "timezone", "latitude", "longitude",
        "image_url", "hero_image_url",
    }

    REQUIRED_TRENDING_LOCATION_FIELDS = {
        "id", "name", "slug", "country_code", "thumbnail_url", "cafe_count",
    }

    def test_location_list_response_contract(self, api_client, location):
        """Location list endpoint returns expected structure."""
        url = reverse("locations:location-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data

        if response.data["results"]:
            loc_data = response.data["results"][0]
            missing = self.REQUIRED_LOCATION_LIST_FIELDS - set(loc_data.keys())
            assert not missing, f"Missing fields: {missing}"

    def test_location_detail_response_contract(self, api_client, location):
        """Location detail endpoint returns full structure."""
        url = reverse("locations:location-detail", kwargs={"slug": location.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        missing = self.REQUIRED_LOCATION_DETAIL_FIELDS - set(response.data.keys())
        assert not missing, f"Missing fields: {missing}"

    def test_trending_locations_response_contract(self, api_client, location):
        """Trending locations endpoint returns expected structure with country_code."""
        # Mark location as featured for it to appear in trending
        location.is_featured = True
        location.cafe_count = 5
        location.save()

        url = reverse("locations:location-trending")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)

        if response.data:
            loc_data = response.data[0]
            missing = self.REQUIRED_TRENDING_LOCATION_FIELDS - set(loc_data.keys())
            assert not missing, f"Missing fields: {missing}"
            # Verify country_code is present (required for frontend)
            assert "country_code" in loc_data

    def test_trending_locations_invalid_limit_returns_400(self, api_client):
        """Trending locations endpoint returns 400 for invalid limit parameter."""
        url = reverse("locations:location-trending")
        response = api_client.get(url, {"limit": "invalid"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "message" in response.data
        assert "code" in response.data
        assert response.data["code"] == "invalid_parameter"


class TestErrorResponseContract:
    """Contract tests for error responses."""

    def test_validation_error_format(self, api_client):
        """Validation errors return consistent structure."""
        url = reverse("users:register")
        response = api_client.post(
            url,
            {"email": "invalid-email", "password": "123"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # Should have field-level errors
        assert isinstance(response.data, dict)

    def test_not_found_error_format(self, api_client):
        """404 errors return consistent structure."""
        url = reverse("cafes:cafe-detail", kwargs={"slug": "nonexistent-cafe"})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_unauthorized_error_format(self, api_client):
        """401 errors return consistent structure."""
        url = reverse("users:me")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestPaginationContract:
    """Contract tests for pagination structure."""

    def test_pagination_structure(self, api_client, cafe_factory, location):
        """Paginated responses have consistent structure."""
        # Create multiple cafes
        for i in range(5):
            cafe_factory(location=location, is_active=True)

        url = reverse("cafes:cafe-list")
        response = api_client.get(url, {"page_size": 2})

        assert response.status_code == status.HTTP_200_OK

        # Required pagination fields
        assert "count" in response.data
        assert "next" in response.data
        assert "previous" in response.data
        assert "results" in response.data

        assert isinstance(response.data["count"], int)
        assert isinstance(response.data["results"], list)
