"""
Admin configuration for User model.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model with email as identifier."""

    list_display = [
        "email",
        "name",
        "role",
        "is_email_verified",
        "is_active",
        "is_staff",
        "created_at",
    ]
    list_filter = ["role", "is_email_verified", "is_active", "is_staff", "created_at"]
    search_fields = ["email", "name"]
    ordering = ["-created_at"]

    # Fieldsets for edit view
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Profile",
            {
                "fields": (
                    "name",
                    "avatar_url",
                )
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "role",
                    "is_email_verified",
                    "is_active",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Tokens",
            {
                "fields": (
                    "email_verification_token",
                    "email_verification_sent_at",
                    "password_reset_token",
                    "password_reset_sent_at",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                    "last_login",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    # Fieldsets for add view
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "name", "password1", "password2", "role"),
            },
        ),
    )

    readonly_fields = ["created_at", "updated_at", "last_login"]

    # Actions
    actions = ["verify_email", "deactivate_users", "activate_users"]

    @admin.action(description="Mark selected users as email verified")
    def verify_email(self, request, queryset):
        count = queryset.update(is_email_verified=True, email_verification_token="")
        self.message_user(request, f"{count} users marked as email verified.")

    @admin.action(description="Deactivate selected users")
    def deactivate_users(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"{count} users deactivated.")

    @admin.action(description="Activate selected users")
    def activate_users(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} users activated.")
