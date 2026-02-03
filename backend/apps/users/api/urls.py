"""
URL configuration for users app (authentication endpoints).

All endpoints are prefixed with /api/auth/ in the main urls.py
"""

from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    TokenRefreshView,
    MeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    EmailVerifyView,
    ResendVerificationView,
    ChangePasswordView,
)

app_name = "users"

urlpatterns = [
    # Registration & Login
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),

    # Token refresh
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Current user
    path("auth/me/", MeView.as_view(), name="me"),

    # Password reset
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),

    # Email verification
    path("auth/verify-email/", EmailVerifyView.as_view(), name="verify_email"),
    path("auth/resend-verification/", ResendVerificationView.as_view(), name="resend_verification"),

    # Password change (authenticated)
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
]
