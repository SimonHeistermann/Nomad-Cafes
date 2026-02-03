"""
Serializers for Location model.
"""

from rest_framework import serializers

from apps.locations.models import Location


class LocationListSerializer(serializers.ModelSerializer):
    """
    Serializer for location list view.
    Lightweight representation for listings.
    """

    name = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = [
            "id",
            "name",
            "slug",
            "country",
            "country_code",
            "image_url",
            "thumbnail_url",
            "cafe_count",
            "is_featured",
        ]

    def get_name(self, obj):
        """Get localized name based on request language."""
        request = self.context.get("request")
        lang = "en"
        if request:
            lang = request.headers.get("Accept-Language", "en")[:2]
        return obj.get_name(lang)


class LocationDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for location detail view.
    Full representation with all fields.
    """

    name = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = [
            "id",
            "name",
            "slug",
            "country",
            "country_code",
            "region",
            "timezone",
            "image_url",
            "thumbnail_url",
            "hero_image_url",
            "latitude",
            "longitude",
            "cafe_count",
            "is_featured",
            "created_at",
        ]

    def get_name(self, obj):
        request = self.context.get("request")
        lang = "en"
        if request:
            lang = request.headers.get("Accept-Language", "en")[:2]
        return obj.get_name(lang)


class LocationCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating locations (admin only).
    """

    class Meta:
        model = Location
        fields = [
            "name",
            "slug",
            "country",
            "country_code",
            "region",
            "timezone",
            "image_url",
            "thumbnail_url",
            "hero_image_url",
            "latitude",
            "longitude",
            "is_featured",
            "is_active",
        ]

    def validate_name(self, value):
        """Ensure name is a valid i18n dict."""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Name must be a dictionary with language codes")
        if "en" not in value:
            raise serializers.ValidationError("English name (en) is required")
        return value


class TrendingLocationSerializer(serializers.ModelSerializer):
    """
    Serializer for trending locations endpoint.
    Minimal fields for performance.
    """

    name = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = [
            "id",
            "name",
            "slug",
            "country_code",
            "thumbnail_url",
            "cafe_count",
        ]

    def get_name(self, obj):
        request = self.context.get("request")
        lang = "en"
        if request:
            lang = request.headers.get("Accept-Language", "en")[:2]
        return obj.get_name(lang)
