"""
Tests for Review API endpoints.
"""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.cafes.models import Cafe
from apps.reviews.models import Review


pytestmark = pytest.mark.django_db


class TestCafeReviewEndpoints:
    """Tests for nested review endpoints under cafes."""

    def test_list_cafe_reviews(self, api_client, cafe, review):
        """GET /api/cafes/{slug}/reviews/ - list cafe reviews."""
        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["rating_overall"] == 4

    def test_list_excludes_inactive_reviews(self, api_client, cafe, review):
        """Inactive reviews should not be listed."""
        review.is_active = False
        review.save()

        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0

    def test_create_review_authenticated(self, api_client, user, cafe):
        """POST /api/cafes/{slug}/reviews/ - authenticated user."""
        api_client.force_authenticate(user=user)

        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = api_client.post(
            url,
            {
                "rating_overall": 5,
                "rating_wifi": 4,
                "text": "Excellent cafe for remote work!",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["rating_overall"] == 5
        assert Review.objects.filter(user=user, cafe=cafe).exists()

    def test_create_review_unauthenticated(self, api_client, cafe):
        """POST /api/cafes/{slug}/reviews/ - unauthenticated fails."""
        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = api_client.post(
            url,
            {
                "rating_overall": 5,
                "text": "Great cafe!",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_review_duplicate_fails(self, api_client, user, cafe, review):
        """User cannot review same cafe twice."""
        api_client.force_authenticate(user=user)

        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = api_client.post(
            url,
            {
                "rating_overall": 3,
                "text": "Trying to review again...",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_review_invalid_rating(self, api_client, user, cafe):
        """Rating must be between 1 and 5."""
        api_client.force_authenticate(user=user)

        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = api_client.post(
            url,
            {
                "rating_overall": 10,
                "text": "Invalid rating test",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_review_short_text(self, api_client, user, cafe):
        """Review text must be at least 10 characters."""
        api_client.force_authenticate(user=user)

        url = reverse("cafes:cafe-review-list", kwargs={"cafe_slug": cafe.slug})
        response = api_client.post(
            url,
            {
                "rating_overall": 4,
                "text": "Short",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_review(self, api_client, cafe, review):
        """GET /api/cafes/{slug}/reviews/{id}/ - retrieve single review."""
        url = reverse(
            "cafes:cafe-review-detail",
            kwargs={"cafe_slug": cafe.slug, "pk": review.id},
        )
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["rating_overall"] == 4

    def test_update_review_owner(self, api_client, user, cafe, review):
        """PATCH /api/cafes/{slug}/reviews/{id}/ - owner can update."""
        api_client.force_authenticate(user=user)

        url = reverse(
            "cafes:cafe-review-detail",
            kwargs={"cafe_slug": cafe.slug, "pk": review.id},
        )
        response = api_client.patch(
            url,
            {"text": "Updated review text - still a great place!"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        review.refresh_from_db()
        assert "Updated" in review.text

    def test_update_review_other_user_fails(self, api_client, other_user, cafe, review):
        """Other users cannot update someone's review."""
        api_client.force_authenticate(user=other_user)

        url = reverse(
            "cafes:cafe-review-detail",
            kwargs={"cafe_slug": cafe.slug, "pk": review.id},
        )
        response = api_client.patch(
            url,
            {"text": "Trying to modify someone else's review"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_review_owner(self, api_client, user, cafe, review):
        """DELETE /api/cafes/{slug}/reviews/{id}/ - owner can delete."""
        api_client.force_authenticate(user=user)

        url = reverse(
            "cafes:cafe-review-detail",
            kwargs={"cafe_slug": cafe.slug, "pk": review.id},
        )
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        review.refresh_from_db()
        assert review.is_active is False

    def test_delete_review_admin(self, api_client, admin_user, cafe, review):
        """Admin can delete any review."""
        api_client.force_authenticate(user=admin_user)

        url = reverse(
            "cafes:cafe-review-detail",
            kwargs={"cafe_slug": cafe.slug, "pk": review.id},
        )
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT


class TestUserReviewsEndpoint:
    """Tests for user's reviews endpoint."""

    def test_list_my_reviews(self, api_client, user, review):
        """GET /api/reviews/ - list user's reviews."""
        api_client.force_authenticate(user=user)

        url = reverse("reviews:review-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["cafe_name"] == "Test Cafe"

    def test_list_my_reviews_unauthenticated(self, api_client):
        """GET /api/reviews/ - unauthenticated fails."""
        url = reverse("reviews:review-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_shows_only_own_reviews(self, api_client, user, other_user, cafe):
        """User only sees their own reviews."""
        # Create reviews for both users
        Review.objects.create(
            user=user,
            cafe=cafe,
            rating_overall=5,
            text="My review of this cafe",
        )

        # Create another cafe for other_user
        location = cafe.location
        other_cafe = Cafe.objects.create(
            name="Other Cafe",
            slug="other-cafe",
            location=location,
            address="Other Street",
            city="Berlin",
            is_active=True,
        )
        Review.objects.create(
            user=other_user,
            cafe=other_cafe,
            rating_overall=3,
            text="Other user's review",
        )

        api_client.force_authenticate(user=user)
        url = reverse("reviews:review-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["cafe_name"] == "Test Cafe"
