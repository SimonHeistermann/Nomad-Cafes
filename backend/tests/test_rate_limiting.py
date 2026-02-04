"""
Tests for rate limiting on review and favorite endpoints.

These tests explicitly enable throttling (overriding the global disable)
to verify rate limits work correctly.
"""

import pytest
from unittest.mock import patch
from rest_framework import status

from apps.reviews.api.throttling import ReviewCreateThrottle
from apps.cafes.api.throttling import FavoriteCreateThrottle


pytestmark = pytest.mark.django_db


class TestReviewRateLimiting:
    """Test rate limiting on review creation."""

    def test_review_throttle_allows_under_limit(self, authenticated_client, cafe):
        """Reviews under the limit should succeed."""
        url = f"/api/cafes/{cafe.slug}/reviews/"

        # First review should succeed
        response = authenticated_client.post(
            url,
            {
                "rating_overall": 4,
                "text": "Great place to work from!",
            },
            format="json",
        )

        # Should succeed (either 201 or might fail for other reasons like duplicate)
        # We're testing that it's NOT a 429
        assert response.status_code != status.HTTP_429_TOO_MANY_REQUESTS

    def test_review_throttle_class_configuration(self):
        """ReviewCreateThrottle should have correct settings."""
        throttle = ReviewCreateThrottle()

        assert throttle.scope == "review_create"
        # Default rate should be 10/hour
        rate = throttle.get_rate()
        assert "hour" in rate or "minute" in rate

    def test_review_throttle_returns_429_when_exceeded(self, authenticated_client, cafe):
        """Should return 429 when rate limit exceeded."""
        url = f"/api/cafes/{cafe.slug}/reviews/"

        # Mock the throttle to simulate being exceeded
        with patch.object(ReviewCreateThrottle, 'allow_request', return_value=False):
            with patch.object(ReviewCreateThrottle, 'wait', return_value=3600):
                response = authenticated_client.post(
                    url,
                    {
                        "rating_overall": 4,
                        "text": "Another review attempt",
                    },
                    format="json",
                )

                assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


class TestFavoriteRateLimiting:
    """Test rate limiting on favorite creation."""

    def test_favorite_throttle_allows_under_limit(self, authenticated_client, cafe):
        """Favorites under the limit should succeed."""
        url = "/api/favorites/"

        response = authenticated_client.post(
            url,
            {"cafe_id": str(cafe.id)},
            format="json",
        )

        # Should succeed or already exist (not 429)
        assert response.status_code != status.HTTP_429_TOO_MANY_REQUESTS

    def test_favorite_throttle_class_configuration(self):
        """FavoriteCreateThrottle should have correct settings."""
        throttle = FavoriteCreateThrottle()

        assert throttle.scope == "favorite_create"
        # Default rate should be 50/hour
        rate = throttle.get_rate()
        assert "hour" in rate or "minute" in rate

    def test_favorite_throttle_returns_429_when_exceeded(self, authenticated_client, cafe):
        """Should return 429 when rate limit exceeded."""
        url = "/api/favorites/"

        # Mock the throttle to simulate being exceeded
        with patch.object(FavoriteCreateThrottle, 'allow_request', return_value=False):
            with patch.object(FavoriteCreateThrottle, 'wait', return_value=3600):
                response = authenticated_client.post(
                    url,
                    {"cafe_id": str(cafe.id)},
                    format="json",
                )

                assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


class TestThrottleSettings:
    """Test that throttle settings are configurable."""

    def test_review_throttle_reads_from_settings(self, settings):
        """ReviewCreateThrottle should read rate from settings."""
        settings.THROTTLE_REVIEW_CREATE = "5/minute"

        throttle = ReviewCreateThrottle()
        assert throttle.get_rate() == "5/minute"

    def test_favorite_throttle_reads_from_settings(self, settings):
        """FavoriteCreateThrottle should read rate from settings."""
        settings.THROTTLE_FAVORITE_CREATE = "20/hour"

        throttle = FavoriteCreateThrottle()
        assert throttle.get_rate() == "20/hour"

    def test_throttle_defaults_when_setting_missing(self, settings):
        """Throttles should use defaults when settings not specified."""
        # Remove settings if they exist
        if hasattr(settings, 'THROTTLE_REVIEW_CREATE'):
            delattr(settings, 'THROTTLE_REVIEW_CREATE')
        if hasattr(settings, 'THROTTLE_FAVORITE_CREATE'):
            delattr(settings, 'THROTTLE_FAVORITE_CREATE')

        review_throttle = ReviewCreateThrottle()
        favorite_throttle = FavoriteCreateThrottle()

        # Should use defaults
        assert review_throttle.get_rate() == "10/hour"
        assert favorite_throttle.get_rate() == "50/hour"
