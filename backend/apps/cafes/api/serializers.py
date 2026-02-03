"""
Serializers for Cafe and Favorite models.
"""

from rest_framework import serializers

from apps.locations.api.serializers import LocationListSerializer
from apps.cafes.models import Cafe, Favorite


class CafeListSerializer(serializers.ModelSerializer):
    """
    Serializer for cafe list view.
    Lightweight representation for listings.
    """

    description = serializers.SerializerMethodField()
    location_name = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    features = serializers.ListField(read_only=True)
    # Ensure rating_avg is returned as float (not string from DecimalField)
    rating_avg = serializers.FloatField(read_only=True)

    class Meta:
        model = Cafe
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image_url",
            "thumbnail_url",
            "logo_url",
            "category",
            "category_color",
            "price_level",
            "city",
            "location_name",
            "phone",
            "rating_avg",
            "rating_count",
            "is_featured",
            "is_favorited",
            "features",
        ]

    def get_description(self, obj):
        request = self.context.get("request")
        lang = "en"
        if request:
            lang = request.headers.get("Accept-Language", "en")[:2]
        return obj.get_description(lang)

    def get_location_name(self, obj):
        request = self.context.get("request")
        lang = "en"
        if request:
            lang = request.headers.get("Accept-Language", "en")[:2]
        return obj.location.get_name(lang) if obj.location else None

    def get_is_favorited(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, cafe=obj).exists()
        return False


class CafeDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for cafe detail view.
    Full representation with all fields.
    """

    description = serializers.SerializerMethodField()
    overview = serializers.SerializerMethodField()
    location = LocationListSerializer(read_only=True)
    is_favorited = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    features = serializers.ListField(read_only=True)
    # Ensure all rating fields are returned as float (not string from DecimalField)
    rating_avg = serializers.FloatField(read_only=True)
    rating_wifi = serializers.FloatField(read_only=True)
    rating_power = serializers.FloatField(read_only=True)
    rating_noise = serializers.FloatField(read_only=True)
    rating_coffee = serializers.FloatField(read_only=True)

    class Meta:
        model = Cafe
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "overview",
            "location",
            "address",
            "address_line_2",
            "postal_code",
            "city",
            "latitude",
            "longitude",
            "phone",
            "email",
            "website",
            "social_links",
            "image_url",
            "thumbnail_url",
            "logo_url",
            "gallery",
            "category",
            "category_color",
            "price_level",
            "features",
            "amenities",
            "opening_hours",
            "timezone",
            "rating_avg",
            "rating_count",
            "rating_wifi",
            "rating_power",
            "rating_noise",
            "rating_coffee",
            "is_featured",
            "is_verified",
            "allows_contact",
            "is_favorited",
            "owner_name",
            "owner_role",
            "created_at",
            "updated_at",
        ]

    def get_description(self, obj):
        request = self.context.get("request")
        lang = "en"
        if request:
            lang = request.headers.get("Accept-Language", "en")[:2]
        return obj.get_description(lang)

    def get_overview(self, obj):
        request = self.context.get("request")
        lang = "en"
        if request:
            lang = request.headers.get("Accept-Language", "en")[:2]
        return obj.get_overview(lang)

    def get_is_favorited(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, cafe=obj).exists()
        return False

    def get_owner_name(self, obj):
        """Return owner's name if available."""
        if obj.owner:
            return obj.owner.name or obj.owner.email
        return None


class CafeCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating cafes (admin only).
    """

    features = serializers.ListField(
        child=serializers.CharField(),
        required=False,
    )

    class Meta:
        model = Cafe
        fields = [
            "name",
            "slug",
            "description",
            "overview",
            "location",
            "address",
            "address_line_2",
            "postal_code",
            "city",
            "latitude",
            "longitude",
            "phone",
            "email",
            "website",
            "social_links",
            "image_url",
            "thumbnail_url",
            "logo_url",
            "gallery",
            "category",
            "price_level",
            "features",
            "amenities",
            "opening_hours",
            "timezone",
            "is_featured",
            "is_verified",
            "is_active",
            "allows_contact",
            "owner",
            "owner_role",
        ]

    def validate_description(self, value):
        if value and not isinstance(value, dict):
            raise serializers.ValidationError("Description must be a dictionary with language codes")
        return value

    def validate_overview(self, value):
        if value and not isinstance(value, dict):
            raise serializers.ValidationError("Overview must be a dictionary with language codes")
        return value

    def validate_features(self, value):
        """Validate that all features are from the allowed set."""
        if value:
            allowed = Cafe.get_allowed_features()
            invalid = [f for f in value if f not in allowed]
            if invalid:
                raise serializers.ValidationError(
                    f"Invalid features: {invalid}. Allowed values: {allowed}"
                )
        return value

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class CafeMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal cafe serializer for nested representations.
    """

    # Ensure rating_avg is returned as float (not string from DecimalField)
    rating_avg = serializers.FloatField(read_only=True)

    class Meta:
        model = Cafe
        fields = [
            "id",
            "name",
            "slug",
            "thumbnail_url",
            "city",
            "rating_avg",
        ]


class FavoriteSerializer(serializers.ModelSerializer):
    """
    Serializer for user favorites.
    """

    cafe = CafeListSerializer(read_only=True)
    cafe_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "cafe", "cafe_id", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_cafe_id(self, value):
        if not Cafe.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Cafe not found")
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        cafe_id = validated_data["cafe_id"]

        favorite, created = Favorite.objects.get_or_create(
            user=user,
            cafe_id=cafe_id,
        )

        if not created:
            raise serializers.ValidationError({"cafe_id": "Already favorited"})

        return favorite


class FavoriteCheckSerializer(serializers.Serializer):
    """
    Serializer for checking if a cafe is favorited.
    """

    is_favorited = serializers.BooleanField(read_only=True)


class StatsSerializer(serializers.Serializer):
    """
    Serializer for platform statistics.
    Used by the stats endpoint for homepage counters.
    """

    cafes = serializers.IntegerField(help_text="Total number of active cafes")
    locations = serializers.IntegerField(help_text="Total number of active locations")
    users = serializers.IntegerField(help_text="Total number of active users")
    reviews = serializers.IntegerField(help_text="Total number of active reviews")


class CafeMetadataSerializer(serializers.Serializer):
    """
    Serializer for cafe metadata (categories, features, etc.).
    Used by frontend to know allowed values.
    """

    categories = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
    top_features = serializers.SerializerMethodField()
    category_colors = serializers.SerializerMethodField()

    def get_categories(self, obj):
        """Return list of category choices with value and label."""
        return [
            {"value": choice[0], "label": choice[1]}
            for choice in Cafe.Category.choices
        ]

    def get_features(self, obj):
        """Return list of all allowed feature choices."""
        return [
            {"value": choice[0], "label": choice[1]}
            for choice in Cafe.Feature.choices
        ]

    def get_top_features(self, obj):
        """Return list of top filterable features."""
        return [f.value for f in Cafe.TOP_FEATURES]

    def get_category_colors(self, obj):
        """Return category color mapping."""
        return Cafe.CATEGORY_COLORS
