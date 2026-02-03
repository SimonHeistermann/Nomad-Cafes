"""
Admin configuration for Location model.
"""

from django.contrib import admin

from .models import Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = [
        "display_name",
        "country",
        "region",
        "cafe_count",
        "is_featured",
        "is_active",
        "created_at",
    ]
    list_filter = ["country", "is_featured", "is_active", "created_at"]
    search_fields = ["name", "country", "region", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["-cafe_count", "name"]
    readonly_fields = ["cafe_count", "created_at", "updated_at"]

    fieldsets = (
        (None, {"fields": ("name", "slug")}),
        (
            "Location Details",
            {
                "fields": (
                    "country",
                    "country_code",
                    "region",
                    "timezone",
                )
            },
        ),
        (
            "Coordinates",
            {
                "fields": ("latitude", "longitude"),
                "classes": ("collapse",),
            },
        ),
        (
            "Images",
            {
                "fields": (
                    "image_url",
                    "thumbnail_url",
                    "hero_image_url",
                )
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "is_featured",
                    "is_active",
                    "cafe_count",
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

    actions = ["make_featured", "make_unfeatured"]

    @admin.action(description="Mark selected locations as featured")
    def make_featured(self, request, queryset):
        count = queryset.update(is_featured=True)
        self.message_user(request, f"{count} locations marked as featured.")

    @admin.action(description="Remove featured status")
    def make_unfeatured(self, request, queryset):
        count = queryset.update(is_featured=False)
        self.message_user(request, f"{count} locations unfeatured.")
