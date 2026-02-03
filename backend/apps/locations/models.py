"""
Location model for cities/regions where cafes are located.
"""

import uuid

from django.db import models
from django.utils.text import slugify


class Location(models.Model):
    """
    Represents a city or region where cafes are located.

    Supports i18n for name via JSONB field:
    {"en": "Berlin", "de": "Berlin"}
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Name with i18n support (JSONB)
    name = models.JSONField(
        default=dict,
        help_text='Localized name: {"en": "Berlin", "de": "Berlin"}',
    )

    slug = models.SlugField(max_length=100, unique=True, db_index=True)

    # Location details
    country = models.CharField(max_length=100, db_index=True)
    country_code = models.CharField(max_length=2, blank=True)  # ISO 3166-1 alpha-2
    region = models.CharField(max_length=100, blank=True)  # State/Province
    timezone = models.CharField(
        max_length=50,
        default="UTC",
        help_text="IANA timezone (e.g., Europe/Berlin)",
    )

    # Images
    image_url = models.URLField(max_length=500, blank=True)
    thumbnail_url = models.URLField(max_length=500, blank=True)
    hero_image_url = models.URLField(max_length=500, blank=True)

    # Coordinates for map
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )

    # Denormalized counts (updated via signals)
    cafe_count = models.PositiveIntegerField(default=0)

    # Status
    is_featured = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "locations"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["country", "is_active"]),
            models.Index(fields=["is_featured", "cafe_count"]),
        ]

    def __str__(self):
        return self.get_name()

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.get_name("en"))
        super().save(*args, **kwargs)

    def get_name(self, language="en"):
        """Get localized name, fallback to English."""
        if isinstance(self.name, dict):
            return self.name.get(language) or self.name.get("en", "")
        return str(self.name)

    @property
    def display_name(self):
        """Default display name (English)."""
        return self.get_name("en")
