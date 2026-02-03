"""
Serializers for Review model.
"""

from rest_framework import serializers

from apps.users.api.serializers import UserSerializer
from apps.reviews.models import Review


class ReviewListSerializer(serializers.ModelSerializer):
    """
    Serializer for review list view.
    Shows review with minimal user info.
    """

    author_name = serializers.CharField(source="user.display_name", read_only=True)
    author_avatar_url = serializers.CharField(source="user.avatar_url", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "author_name",
            "author_avatar_url",
            "rating_overall",
            "rating_wifi",
            "rating_power",
            "rating_noise",
            "rating_coffee",
            "text",
            "language",
            "photos",
            "is_verified",
            "created_at",
        ]


class ReviewDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for review detail view.
    Full representation including user details.
    """

    user = UserSerializer(read_only=True)
    cafe_name = serializers.CharField(source="cafe.name", read_only=True)
    cafe_slug = serializers.CharField(source="cafe.slug", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "cafe_name",
            "cafe_slug",
            "rating_overall",
            "rating_wifi",
            "rating_power",
            "rating_noise",
            "rating_coffee",
            "text",
            "language",
            "photos",
            "is_verified",
            "created_at",
            "updated_at",
        ]


class ReviewCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a review.
    User and cafe are set from context.
    """

    class Meta:
        model = Review
        fields = [
            "rating_overall",
            "rating_wifi",
            "rating_power",
            "rating_noise",
            "rating_coffee",
            "text",
            "language",
            "photos",
        ]

    def validate_rating_overall(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def validate_text(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Review must be at least 10 characters")
        return value.strip()

    def validate(self, attrs):
        # Check if user already reviewed this cafe
        user = self.context["request"].user
        cafe = self.context["cafe"]

        if Review.objects.filter(user=user, cafe=cafe).exists():
            raise serializers.ValidationError(
                {"non_field_errors": ["You have already reviewed this cafe"]}
            )

        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        validated_data["cafe"] = self.context["cafe"]
        return super().create(validated_data)


class ReviewUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating a review.
    Only allows updating content, not ratings structure.
    """

    class Meta:
        model = Review
        fields = [
            "rating_overall",
            "rating_wifi",
            "rating_power",
            "rating_noise",
            "rating_coffee",
            "text",
            "language",
            "photos",
        ]

    def validate_rating_overall(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def validate_text(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Review must be at least 10 characters")
        return value.strip()


class UserReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for user's own reviews (GET /api/reviews/me/).
    Includes cafe info.
    """

    cafe_id = serializers.UUIDField(source="cafe.id", read_only=True)
    cafe_name = serializers.CharField(source="cafe.name", read_only=True)
    cafe_slug = serializers.CharField(source="cafe.slug", read_only=True)
    cafe_thumbnail = serializers.CharField(source="cafe.thumbnail_url", read_only=True)
    cafe_city = serializers.CharField(source="cafe.city", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "cafe_id",
            "cafe_name",
            "cafe_slug",
            "cafe_thumbnail",
            "cafe_city",
            "rating_overall",
            "rating_wifi",
            "rating_power",
            "rating_noise",
            "rating_coffee",
            "text",
            "language",
            "photos",
            "created_at",
            "updated_at",
        ]
