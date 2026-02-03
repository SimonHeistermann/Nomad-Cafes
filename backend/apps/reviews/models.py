"""
Review model for cafe reviews.
"""

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Review(models.Model):
    """
    User review for a cafe.

    Features:
    - Multiple rating dimensions (wifi, power, noise, coffee, overall)
    - One review per user per cafe
    - Optional photos
    - Language tracking for i18n
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relationships
    cafe = models.ForeignKey(
        "cafes.Cafe",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )

    # Ratings (1-5 scale)
    rating_overall = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        db_index=True,
    )
    rating_wifi = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
    )
    rating_power = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
    )
    rating_noise = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text="Higher = quieter",
    )
    rating_coffee = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
    )

    # Content
    text = models.TextField(max_length=2000)
    language = models.CharField(
        max_length=5,
        default="en",
        help_text="Language code (e.g., en, de)",
    )

    # Photos (JSONB array of URLs)
    photos = models.JSONField(
        default=list,
        blank=True,
        help_text='["url1", "url2", ...]',
    )

    # Status
    is_active = models.BooleanField(default=True, db_index=True)
    is_verified = models.BooleanField(
        default=False,
        help_text="Review from verified visit",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reviews"
        unique_together = ["cafe", "user"]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["cafe", "is_active", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.cafe.name} ({self.rating_overall}★)"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update cafe rating stats
        self.cafe.update_rating_stats()

    def delete(self, *args, **kwargs):
        cafe = self.cafe
        super().delete(*args, **kwargs)
        # Update cafe rating stats after delete
        cafe.update_rating_stats()
