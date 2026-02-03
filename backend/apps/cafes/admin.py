"""
Admin configuration for Cafe and Favorite models.
"""

from django.contrib import admin

from .models import Cafe, Favorite


@admin.register(Cafe)
class CafeAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "city",
        "category",
        "price_level",
        "rating_avg",
        "rating_count",
        "is_featured",
        "is_active",
    ]
    list_filter = [
        "category",
        "price_level",
        "is_featured",
        "is_verified",
        "is_active",
        "location",
        "created_at",
    ]
    search_fields = ["name", "city", "address", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    raw_id_fields = ["location", "owner"]
    ordering = ["-created_at"]
    readonly_fields = [
        "rating_avg",
        "rating_count",
        "rating_wifi",
        "rating_power",
        "rating_noise",
        "rating_coffee",
        "created_at",
        "updated_at",
    ]

    fieldsets = (
        (None, {"fields": ("name", "slug", "owner")}),
        (
            "Location",
            {
                "fields": (
                    "location",
                    "address",
                    "address_line_2",
                    "postal_code",
                    "city",
                    "latitude",
                    "longitude",
                )
            },
        ),
        (
            "Contact",
            {
                "fields": (
                    "phone",
                    "email",
                    "website",
                    "social_links",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Content",
            {
                "fields": (
                    "description",
                    "overview",
                )
            },
        ),
        (
            "Images",
            {
                "fields": (
                    "image_url",
                    "thumbnail_url",
                    "gallery",
                )
            },
        ),
        (
            "Classification",
            {
                "fields": (
                    "category",
                    "category_color",
                    "price_level",
                    "features",
                )
            },
        ),
        (
            "Amenities & Hours",
            {
                "fields": (
                    "amenities",
                    "opening_hours",
                    "timezone",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Ratings (auto-calculated)",
            {
                "fields": (
                    "rating_avg",
                    "rating_count",
                    "rating_wifi",
                    "rating_power",
                    "rating_noise",
                    "rating_coffee",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "is_featured",
                    "is_verified",
                    "is_active",
                    "allows_contact",
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

    actions = ["make_featured", "make_verified", "recalculate_ratings"]

    @admin.action(description="Mark selected cafes as featured")
    def make_featured(self, request, queryset):
        count = queryset.update(is_featured=True)
        self.message_user(request, f"{count} cafes marked as featured.")

    @admin.action(description="Mark selected cafes as verified")
    def make_verified(self, request, queryset):
        count = queryset.update(is_verified=True)
        self.message_user(request, f"{count} cafes marked as verified.")

    @admin.action(description="Recalculate rating stats")
    def recalculate_ratings(self, request, queryset):
        for cafe in queryset:
            cafe.update_rating_stats()
        self.message_user(request, f"Ratings recalculated for {queryset.count()} cafes.")


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ["user", "cafe", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__email", "cafe__name"]
    raw_id_fields = ["user", "cafe"]
    ordering = ["-created_at"]
