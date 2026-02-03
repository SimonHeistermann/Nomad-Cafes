"""
Authentication and user management views.

All auth endpoints:
- POST /api/auth/register/
- POST /api/auth/login/
- POST /api/auth/logout/
- POST /api/auth/token/refresh/
- GET  /api/auth/me/
- PATCH /api/auth/me/
- POST /api/auth/password-reset/
- POST /api/auth/password-reset/confirm/
- POST /api/auth/verify-email/
- POST /api/auth/resend-verification/
- POST /api/auth/change-password/
"""

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import serializers as drf_serializers
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.users.authentication import set_jwt_cookies, delete_jwt_cookies
from apps.users.models import User, AuthAuditLog
from apps.users.email import send_verification_email, send_password_reset_email
from .throttling import (
    AuthRateThrottle,
    PasswordResetThrottle,
    EmailVerificationThrottle,
    TokenRefreshThrottle,
)
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


def get_tokens_for_user(user):
    """Generate JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# =============================================================================
# Response Serializers for OpenAPI Documentation
# =============================================================================

class AuthSuccessResponseSerializer(drf_serializers.Serializer):
    """Response containing message and user data (login/register)."""
    message = drf_serializers.CharField(help_text="Success message")
    user = UserSerializer(help_text="User profile data")


class MessageResponseSerializer(drf_serializers.Serializer):
    """Generic message-only response."""
    message = drf_serializers.CharField(help_text="Status message")


class ErrorResponseSerializer(drf_serializers.Serializer):
    """Standard error response format."""
    message = drf_serializers.CharField(help_text="Error message")
    code = drf_serializers.CharField(required=False, help_text="Error code for programmatic handling")
    details = drf_serializers.DictField(required=False, help_text="Field-specific errors")


# =============================================================================
# Auth Views
# =============================================================================

class RegisterView(APIView):
    """
    POST /api/auth/register/

    Register a new user account.
    Returns user data and sets auth cookies.
    """

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        request=RegisterSerializer,
        responses={
            201: AuthSuccessResponseSerializer,
            400: ErrorResponseSerializer,
            429: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Register a new user",
        description="Create a new user account. Returns user data and sets httpOnly auth cookies.",
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens
        tokens = get_tokens_for_user(user)

        # Build response
        response = Response(
            {
                "message": "Registration successful",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

        # Set cookies
        set_jwt_cookies(response, tokens["access"], tokens["refresh"])

        # Send verification email with plain token (non-blocking - logs on failure)
        # The plain token is stored temporarily on the user object by the serializer
        plain_token = getattr(user, "_plain_verification_token", None)
        if plain_token:
            send_verification_email(user, plain_token)

        # Log audit event
        AuthAuditLog.log_event(
            event_type=AuthAuditLog.EventType.REGISTER,
            request=request,
            user=user,
        )

        return response


class LoginView(APIView):
    """
    POST /api/auth/login/

    Authenticate user and return tokens via cookies.
    """

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        request=LoginSerializer,
        responses={
            200: AuthSuccessResponseSerializer,
            400: ErrorResponseSerializer,
            429: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Login user",
        description="Authenticate user with email and password. Sets httpOnly auth cookies on success.",
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})

        # Check for validation errors (including auth failures)
        if not serializer.is_valid():
            # Log failed login attempt
            email = request.data.get("email", "")
            AuthAuditLog.log_event(
                event_type=AuthAuditLog.EventType.LOGIN_FAILURE,
                request=request,
                email=email,
                success=False,
                failure_reason="invalid_credentials",
            )
            serializer.is_valid(raise_exception=True)  # Re-raise to return error response

        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)

        response = Response(
            {
                "message": "Login successful",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

        set_jwt_cookies(response, tokens["access"], tokens["refresh"])

        # Log successful login
        AuthAuditLog.log_event(
            event_type=AuthAuditLog.EventType.LOGIN_SUCCESS,
            request=request,
            user=user,
        )

        return response


class LogoutView(APIView):
    """
    POST /api/auth/logout/

    Logout user by blacklisting refresh token and clearing cookies.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,
        responses={
            200: MessageResponseSerializer,
            401: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Logout user",
        description="Blacklists the refresh token and clears auth cookies.",
    )
    def post(self, request):
        user = request.user  # Capture before any token operations

        try:
            # Get refresh token from cookie
            refresh_cookie = getattr(settings, "JWT_AUTH_REFRESH_COOKIE", "refresh_token")
            refresh_token = request.COOKIES.get(refresh_cookie)

            if refresh_token:
                # Blacklist the refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
        except TokenError:
            # Token already blacklisted or invalid - continue with logout
            pass

        response = Response(
            {"message": "Logout successful"},
            status=status.HTTP_200_OK,
        )

        delete_jwt_cookies(response)

        # Log audit event
        AuthAuditLog.log_event(
            event_type=AuthAuditLog.EventType.LOGOUT,
            request=request,
            user=user if user.is_authenticated else None,
        )

        return response


class TokenRefreshView(APIView):
    """
    POST /api/auth/token/refresh/

    Refresh access token using refresh token from cookie.
    """

    permission_classes = [AllowAny]
    throttle_classes = [TokenRefreshThrottle]

    @extend_schema(
        request=None,
        responses={
            200: MessageResponseSerializer,
            401: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Refresh access token",
        description="Refreshes the access token using the refresh token from the cookie. Sets new cookies on success.",
    )
    def post(self, request):
        refresh_cookie = getattr(settings, "JWT_AUTH_REFRESH_COOKIE", "refresh_token")
        refresh_token = request.COOKIES.get(refresh_cookie)

        if not refresh_token:
            # Log failed refresh attempt
            AuthAuditLog.log_event(
                event_type=AuthAuditLog.EventType.TOKEN_REFRESH_FAILURE,
                request=request,
                success=False,
                failure_reason="no_refresh_token",
            )
            return Response(
                {"message": "Refresh token not found", "code": "no_refresh_token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(refresh_token)
            user_id = refresh["user_id"]

            # Get new access token
            new_access = str(refresh.access_token)

            # If rotation enabled, get new refresh token
            new_refresh = None
            user = User.objects.get(id=user_id)
            if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS", False):
                # Blacklist old token if configured
                if settings.SIMPLE_JWT.get("BLACKLIST_AFTER_ROTATION", False):
                    refresh.blacklist()
                # Create new refresh token
                new_refresh_obj = RefreshToken.for_user(user)
                new_refresh = str(new_refresh_obj)

            response = Response(
                {"message": "Token refreshed"},
                status=status.HTTP_200_OK,
            )

            set_jwt_cookies(response, new_access, new_refresh or refresh_token)

            # Log successful refresh
            AuthAuditLog.log_event(
                event_type=AuthAuditLog.EventType.TOKEN_REFRESH,
                request=request,
                user=user,
            )

            return response

        except TokenError:
            # Log failed refresh attempt
            AuthAuditLog.log_event(
                event_type=AuthAuditLog.EventType.TOKEN_REFRESH_FAILURE,
                request=request,
                success=False,
                failure_reason="invalid_token",
            )
            response = Response(
                {"message": "Invalid or expired refresh token", "code": "invalid_token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            delete_jwt_cookies(response)
            return response


class MeView(RetrieveUpdateAPIView):
    """
    GET /api/auth/me/ - Get current user profile
    PATCH /api/auth/me/ - Update current user profile
    """

    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return UserProfileUpdateSerializer
        return UserSerializer

    @extend_schema(
        responses={
            200: UserSerializer,
            401: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Get current user profile",
        description="Returns the authenticated user's profile information.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        request=UserProfileUpdateSerializer,
        responses={
            200: UserSerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Update current user profile",
        description="Updates the authenticated user's profile. Only name, bio, and avatar_url can be updated.",
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)  # Always partial update
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(instance).data)


class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/

    Request password reset email.
    Always returns success to prevent email enumeration.
    """

    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetThrottle]

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={
            200: MessageResponseSerializer,
            400: ErrorResponseSerializer,
            429: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Request password reset",
        description="Sends a password reset email if the account exists. Always returns success to prevent email enumeration.",
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send password reset email if user exists
        if user:
            # The plain token is stored temporarily on the user object by the serializer
            plain_token = getattr(user, "_plain_reset_token", None)
            if plain_token:
                send_password_reset_email(user, plain_token)

        # Log audit event (always log, but user might be None for security)
        AuthAuditLog.log_event(
            event_type=AuthAuditLog.EventType.PASSWORD_RESET_REQUEST,
            request=request,
            user=user,
            email=request.data.get("email", ""),
        )

        # Always return success (security: don't reveal if email exists)
        return Response(
            {"message": "If an account exists with this email, you will receive a password reset link"},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm/

    Confirm password reset with token and new password.
    """

    permission_classes = [AllowAny]

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={
            200: MessageResponseSerializer,
            400: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Confirm password reset",
        description="Resets the user's password using the token from the reset email.",
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Log audit event
        AuthAuditLog.log_event(
            event_type=AuthAuditLog.EventType.PASSWORD_RESET_CONFIRM,
            request=request,
            user=user,
        )

        return Response(
            {"message": "Password has been reset successfully"},
            status=status.HTTP_200_OK,
        )


class EmailVerifyView(APIView):
    """
    POST /api/auth/verify-email/

    Verify email address with token.
    """

    permission_classes = [AllowAny]

    @extend_schema(
        request=EmailVerifySerializer,
        responses={
            200: MessageResponseSerializer,
            400: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Verify email address",
        description="Verifies the user's email address using the token from the verification email.",
    )
    def post(self, request):
        serializer = EmailVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Log audit event
        AuthAuditLog.log_event(
            event_type=AuthAuditLog.EventType.EMAIL_VERIFY,
            request=request,
            user=user,
        )

        return Response(
            {"message": "Email verified successfully"},
            status=status.HTTP_200_OK,
        )


class ResendVerificationView(APIView):
    """
    POST /api/auth/resend-verification/

    Resend email verification.
    Always returns success to prevent email enumeration.
    """

    permission_classes = [AllowAny]
    throttle_classes = [EmailVerificationThrottle]

    @extend_schema(
        request=ResendVerificationSerializer,
        responses={
            200: MessageResponseSerializer,
            400: ErrorResponseSerializer,
            429: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Resend verification email",
        description="Resends the email verification link. Always returns success to prevent email enumeration.",
    )
    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send verification email if user exists and is unverified
        if user:
            # The plain token is stored temporarily on the user object by the serializer
            plain_token = getattr(user, "_plain_verification_token", None)
            if plain_token:
                send_verification_email(user, plain_token)

        return Response(
            {"message": "If an unverified account exists with this email, you will receive a verification link"},
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/

    Change password for authenticated user.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ChangePasswordSerializer,
        responses={
            200: MessageResponseSerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
        },
        tags=["Auth"],
        summary="Change password",
        description="Changes the password for the authenticated user. Requires current password.",
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Log audit event
        AuthAuditLog.log_event(
            event_type=AuthAuditLog.EventType.PASSWORD_CHANGE,
            request=request,
            user=user,
        )

        return Response(
            {"message": "Password changed successfully"},
            status=status.HTTP_200_OK,
        )
