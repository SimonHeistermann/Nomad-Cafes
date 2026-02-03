"""
Users API module.

Contains serializers, views, urls, permissions and throttling for user authentication.
"""

from .serializers import (
    UserSerializer,
    UserProfileUpdateSerializer,
    RegisterSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerifySerializer,
    ResendVerificationSerializer,
    ChangePasswordSerializer,
)
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
from .permissions import (
    IsAdminUser,
    IsOwnerOrAdmin,
    IsOwnerOrReadOnly,
    IsAuthenticatedOrReadOnly,
    IsCafeOwnerOrAdmin,
)
from .throttling import (
    AuthRateThrottle,
    PasswordResetThrottle,
    EmailVerificationThrottle,
)

__all__ = [
    # Serializers
    "UserSerializer",
    "UserProfileUpdateSerializer",
    "RegisterSerializer",
    "LoginSerializer",
    "PasswordResetRequestSerializer",
    "PasswordResetConfirmSerializer",
    "EmailVerifySerializer",
    "ResendVerificationSerializer",
    "ChangePasswordSerializer",
    # Views
    "RegisterView",
    "LoginView",
    "LogoutView",
    "TokenRefreshView",
    "MeView",
    "PasswordResetRequestView",
    "PasswordResetConfirmView",
    "EmailVerifyView",
    "ResendVerificationView",
    "ChangePasswordView",
    # Permissions
    "IsAdminUser",
    "IsOwnerOrAdmin",
    "IsOwnerOrReadOnly",
    "IsAuthenticatedOrReadOnly",
    "IsCafeOwnerOrAdmin",
    # Throttling
    "AuthRateThrottle",
    "PasswordResetThrottle",
    "EmailVerificationThrottle",
]
