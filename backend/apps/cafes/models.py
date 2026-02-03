"""
Cafe model - the core entity of the application.
"""

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils.text import slugify


class Cafe(models.Model):
    """
    Represents a cafe/workspace for digital nomads.

    Features:
    - i18n support via JSONB for description, overview
    - JSONB for flexible data: features, amenities, gallery, opening_hours, social_links
    - Denormalized rating fields for performance
    - Full-text search friendly
    """

    class PriceLevel(models.IntegerChoices):
        BUDGET = 1, "$"
        MODERATE = 2, "$$"
        EXPENSIVE = 3, "$$$"
        PREMIUM = 4, "$$$$"

    class Category(models.TextChoices):
        CAFE = "cafe", "Café"
        COWORKING = "coworking", "Coworking Space"
        RESTAURANT = "restaurant", "Restaurant"
        HOTEL_CAFE = "hotel_cafe", "Hotel Café"
        LIBRARY = "library", "Library"
        OTHER = "other", "Other"

    # Category colors - single source of truth for badge/UI colors
    CATEGORY_COLORS = {
        "cafe": "#22C55E",        # Green
        "coworking": "#3B82F6",   # Blue
        "restaurant": "#EF4444",  # Red
        "hotel_cafe": "#8B5CF6",  # Purple
        "library": "#F59E0B",     # Amber
        "other": "#6B7280",       # Gray
    }

    class Feature(models.TextChoices):
        """
        Allowed features for cafes - single source of truth.
        These are the ONLY valid feature values.
        """
        # Top 6 filterable features
        FAST_WIFI = "fast_wifi", "Fast WiFi"
        POWER_OUTLETS = "power_outlets", "Power Outlets"
        QUIET = "quiet", "Quiet Environment"
        OUTDOOR_SEATING = "outdoor_seating", "Outdoor Seating"
        PET_FRIENDLY = "pet_friendly", "Pet Friendly"
        OPEN_LATE = "open_late", "Open Late"

        # Additional features
        AIR_CONDITIONING = "air_conditioning", "Air Conditioning"
        GREAT_COFFEE = "great_coffee", "Great Coffee"
        FOOD_AVAILABLE = "food_available", "Food Available"
        VEGAN_OPTIONS = "vegan_options", "Vegan Options"
        MEETING_FRIENDLY = "meeting_friendly", "Meeting Friendly"
        GOOD_LIGHTING = "good_lighting", "Good Natural Light"
        ACCESSIBLE = "accessible", "Wheelchair Accessible"
        PARKING = "parking", "Parking Available"
        BIKE_PARKING = "bike_parking", "Bike Parking"
        SMOKE_FREE = "smoke_free", "Smoke Free"
        STANDING_DESKS = "standing_desks", "Standing Desks"
        ACCEPTS_CARDS = "accepts_cards", "Accepts Credit Cards"
        RESERVATIONS = "reservations", "Takes Reservations"
        ALCOHOL = "alcohol", "Serves Alcohol"

    # Top features for filtering (subset of Feature choices)
    TOP_FEATURES = [
        Feature.FAST_WIFI,
        Feature.POWER_OUTLETS,
        Feature.QUIET,
        Feature.OUTDOOR_SEATING,
        Feature.PET_FRIENDLY,
        Feature.OPEN_LATE,
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Basic info
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)

    # i18n fields (JSONB)
    description = models.JSONField(
        default=dict,
        blank=True,
        help_text='Localized description: {"en": "...", "de": "..."}',
    )
    overview = models.JSONField(
        default=dict,
        blank=True,
        help_text='Localized overview/tagline: {"en": "...", "de": "..."}',
    )

    # Location relationship
    location = models.ForeignKey(
        "locations.Location",
        on_delete=models.PROTECT,
        related_name="cafes",
    )

    # Address details
    address = models.CharField(max_length=300)
    address_line_2 = models.CharField(max_length=200, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, db_index=True)  # Denormalized for filtering

    # Coordinates
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )

    # Contact
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(max_length=500, blank=True)

    # Social links (JSONB)
    social_links = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"instagram": "url", "facebook": "url", "twitter": "url"}',
    )

    # Images
    image_url = models.URLField(max_length=500, blank=True)
    thumbnail_url = models.URLField(max_length=500, blank=True)
    logo_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="Brand logo/badge image URL",
    )
    gallery = models.JSONField(
        default=list,
        blank=True,
        help_text='["url1", "url2", ...]',
    )

    # Classification
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.CAFE,
        db_index=True,
    )
    category_color = models.CharField(
        max_length=7,
        default="#6B7280",
        help_text="Hex color for category badge",
    )
    price_level = models.PositiveSmallIntegerField(
        choices=PriceLevel.choices,
        default=PriceLevel.MODERATE,
        db_index=True,
    )

    # Features for filtering (JSONB array) - only values from Feature.choices allowed
    features = models.JSONField(
        default=list,
        blank=True,
        help_text='Features array using Feature enum values: ["fast_wifi", "quiet", "outdoor_seating"]',
    )

    @classmethod
    def get_allowed_features(cls):
        """Get list of all allowed feature values."""
        return [choice[0] for choice in cls.Feature.choices]

    @classmethod
    def validate_features(cls, features):
        """Validate that all features are from the allowed set."""
        allowed = cls.get_allowed_features()
        invalid = [f for f in features if f not in allowed]
        if invalid:
            raise ValueError(f"Invalid features: {invalid}. Allowed: {allowed}")
        return features

    # Amenities (JSONB)
    amenities = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"wifi": true, "wifi_speed": "50mbps", "power_outlets": true, ...}',
    )

    # Opening hours (JSONB)
    opening_hours = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"monday": {"open": "08:00", "close": "18:00"}, ...}',
    )
    timezone = models.CharField(
        max_length=50,
        blank=True,
        help_text="IANA timezone, inherits from location if empty",
    )

    # Ratings (denormalized for performance)
    rating_avg = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        db_index=True,
    )
    rating_count = models.PositiveIntegerField(default=0)

    # Individual rating averages
    rating_wifi = models.DecimalField(
        max_digits=3, decimal_places=2, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    rating_power = models.DecimalField(
        max_digits=3, decimal_places=2, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    rating_noise = models.DecimalField(
        max_digits=3, decimal_places=2, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    rating_coffee = models.DecimalField(
        max_digits=3, decimal_places=2, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )

    # Status flags
    is_featured = models.BooleanField(default=False, db_index=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, db_index=True)
    allows_contact = models.BooleanField(
        default=True,
        help_text="Show contact form on detail page",
    )

    # Ownership (optional - for cafe owners managing their listing)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_cafes",
    )
    owner_role = models.CharField(
        max_length=100,
        blank=True,
        help_text="Owner's role, e.g. 'Owner & café designer', 'F&B Manager'",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cafes"
        ordering = ["-rating_avg", "-created_at"]
        indexes = [
            models.Index(fields=["location", "is_active"]),
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["city", "is_active"]),
            models.Index(fields=["is_featured", "rating_avg"]),
            models.Index(fields=["price_level", "rating_avg"]),
            models.Index(fields=["-rating_avg", "-rating_count"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generate slug if not set, sanitizing special characters
        if not self.slug:
            # Remove commas and other problematic chars before slugify
            clean_name = self.name.replace(",", "").replace("'", "").replace('"', "")
            base_slug = slugify(clean_name)[:50]  # Limit base slug length
            self.slug = f"{base_slug}-{str(self.id)[:8]}" if self.id else base_slug
        # Auto-set category color based on category
        if self.category:
            self.category_color = self.CATEGORY_COLORS.get(self.category, "#6B7280")
        # Inherit timezone from location if not set
        if not self.timezone and self.location_id:
            self.timezone = self.location.timezone
        super().save(*args, **kwargs)

    def get_description(self, language="en"):
        """Get localized description."""
        if isinstance(self.description, dict):
            return self.description.get(language) or self.description.get("en", "")
        return str(self.description) if self.description else ""

    def get_overview(self, language="en"):
        """Get localized overview."""
        if isinstance(self.overview, dict):
            return self.overview.get(language) or self.overview.get("en", "")
        return str(self.overview) if self.overview else ""

    @property
    def is_open(self):
        """Check if cafe is currently open based on opening_hours."""
        # Simplified - real implementation would use timezone-aware datetime
        return True  # Placeholder

    def update_rating_stats(self):
        """
        Recalculate rating statistics from reviews.
        Called by signal when reviews change.
        """
        from django.db.models import Avg, Count

        stats = self.reviews.filter(is_active=True).aggregate(
            avg_overall=Avg("rating_overall"),
            avg_wifi=Avg("rating_wifi"),
            avg_power=Avg("rating_power"),
            avg_noise=Avg("rating_noise"),
            avg_coffee=Avg("rating_coffee"),
            count=Count("id"),
        )

        self.rating_avg = stats["avg_overall"] or 0
        self.rating_wifi = stats["avg_wifi"] or 0
        self.rating_power = stats["avg_power"] or 0
        self.rating_noise = stats["avg_noise"] or 0
        self.rating_coffee = stats["avg_coffee"] or 0
        self.rating_count = stats["count"] or 0
        self.save(
            update_fields=[
                "rating_avg",
                "rating_wifi",
                "rating_power",
                "rating_noise",
                "rating_coffee",
                "rating_count",
            ]
        )


class Favorite(models.Model):
    """User's favorite cafes."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
    )
    cafe = models.ForeignKey(
        Cafe,
        on_delete=models.CASCADE,
        related_name="favorites",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "favorites"
        unique_together = ["user", "cafe"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} → {self.cafe.name}"
