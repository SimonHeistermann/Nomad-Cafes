"""
Admin configuration for Review model.
"""

from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "cafe",
        "rating_overall",
        "language",
        "is_active",
        "is_verified",
        "created_at",
    ]
    list_filter = [
        "rating_overall",
        "language",
        "is_active",
        "is_verified",
        "created_at",
    ]
    search_fields = ["user__email", "cafe__name", "text"]
    raw_id_fields = ["user", "cafe"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (None, {"fields": ("user", "cafe")}),
        (
            "Ratings",
            {
                "fields": (
                    "rating_overall",
                    "rating_wifi",
                    "rating_power",
                    "rating_noise",
                    "rating_coffee",
                )
            },
        ),
        (
            "Content",
            {
                "fields": (
                    "text",
                    "language",
                    "photos",
                )
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "is_active",
                    "is_verified",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    actions = ["activate_reviews", "deactivate_reviews", "verify_reviews"]

    @admin.action(description="Activate selected reviews")
    def activate_reviews(self, request, queryset):
        count = queryset.update(is_active=True)
        # Recalculate ratings for affected cafes
        for review in queryset:
            review.cafe.update_rating_stats()
        self.message_user(request, f"{count} reviews activated.")

    @admin.action(description="Deactivate selected reviews")
    def deactivate_reviews(self, request, queryset):
        count = queryset.update(is_active=False)
        for review in queryset:
            review.cafe.update_rating_stats()
        self.message_user(request, f"{count} reviews deactivated.")

    @admin.action(description="Mark as verified")
    def verify_reviews(self, request, queryset):
        count = queryset.update(is_verified=True)
        self.message_user(request, f"{count} reviews verified.")
