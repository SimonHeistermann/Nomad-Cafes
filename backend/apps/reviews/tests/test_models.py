"""
Tests for Review model.
"""

import pytest

from apps.cafes.models import Cafe
from apps.locations.models import Location
from apps.reviews.models import Review


pytestmark = pytest.mark.django_db


class TestReviewModel:
    """Tests for Review model."""

    def test_create_review(self, user, cafe):
        """Test creating a review."""
        review = Review.objects.create(
            user=user,
            cafe=cafe,
            rating_overall=5,
            text="Amazing cafe! Perfect for remote work.",
        )
        assert review.rating_overall == 5
        assert review.user == user
        assert review.cafe == cafe
        assert review.is_active is True

    def test_review_str(self, review):
        """Test review string representation."""
        assert "reviewer@example.com" in str(review)
        assert "Test Cafe" in str(review)
        assert "4" in str(review)

    def test_review_updates_cafe_rating(self, user, cafe):
        """Test that creating a review updates cafe rating."""
        Review.objects.create(
            user=user,
            cafe=cafe,
            rating_overall=5,
            rating_wifi=5,
            text="Perfect cafe for working!",
        )

        cafe.refresh_from_db()
        assert cafe.rating_count == 1
        assert cafe.rating_avg == 5

    def test_unique_user_cafe_constraint(self, user, cafe, review):
        """Test that a user can only review a cafe once."""
        with pytest.raises(Exception):  # IntegrityError
            Review.objects.create(
                user=user,
                cafe=cafe,
                rating_overall=3,
                text="Trying to review again...",
            )


class TestCafeRatingUpdate:
    """Tests for automatic cafe rating updates."""

    def test_rating_calculated_on_review_create(self, user, other_user, cafe):
        """Cafe rating is calculated when reviews are created."""
        Review.objects.create(
            user=user,
            cafe=cafe,
            rating_overall=5,
            rating_wifi=5,
            text="Five star review!",
        )

        cafe.refresh_from_db()
        assert cafe.rating_avg == 5
        assert cafe.rating_wifi == 5
        assert cafe.rating_count == 1

        # Create another cafe for other_user to review
        Review.objects.filter(user=user).delete()

        # Now both users can review
        Review.objects.create(
            user=user,
            cafe=cafe,
            rating_overall=4,
            rating_wifi=4,
            text="Four star review!",
        )
        Review.objects.create(
            user=other_user,
            cafe=cafe,
            rating_overall=2,
            rating_wifi=2,
            text="Two star review!",
        )

        cafe.refresh_from_db()
        assert cafe.rating_count == 2
        assert cafe.rating_avg == 3  # (4 + 2) / 2
        assert cafe.rating_wifi == 3  # (4 + 2) / 2


class TestLocationCafeCountSignal:
    """Tests for location cafe_count signal."""

    def test_cafe_count_increases_on_create(self, location):
        """Location cafe_count increases when cafe is created."""
        initial_count = location.cafe_count

        Cafe.objects.create(
            name="New Cafe",
            slug="new-cafe",
            location=location,
            address="New Street",
            city="Berlin",
            is_active=True,
        )

        location.refresh_from_db()
        assert location.cafe_count == initial_count + 1

    def test_cafe_count_unchanged_for_inactive(self, location):
        """Location cafe_count doesn't change for inactive cafes."""
        initial_count = location.cafe_count

        Cafe.objects.create(
            name="Inactive Cafe",
            slug="inactive-cafe",
            location=location,
            address="Hidden Street",
            city="Berlin",
            is_active=False,
        )

        location.refresh_from_db()
        assert location.cafe_count == initial_count

    def test_cafe_count_decreases_on_deactivate(self, location, cafe):
        """Location cafe_count decreases when cafe is deactivated."""
        location.refresh_from_db()
        initial_count = location.cafe_count

        cafe.is_active = False
        cafe.save()

        location.refresh_from_db()
        assert location.cafe_count == initial_count - 1
