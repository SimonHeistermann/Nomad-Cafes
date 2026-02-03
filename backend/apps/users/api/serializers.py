"""
User authentication and profile serializers.

Security Note:
    All security tokens (email verification, password reset) are hashed
    before storage using SHA256. The plain tokens are only sent to users
    via email and never stored in the database.
"""

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Public user representation.
    Used in responses and for displaying user info.
    """

    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "bio",
            "display_name",
            "avatar_url",
            "role",
            "is_email_verified",
            "created_at",
        ]
        read_only_fields = ["id", "email", "role", "is_email_verified", "created_at"]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    class Meta:
        model = User
        fields = ["name", "bio", "avatar_url"]


class RegisterSerializer(serializers.Serializer):
    """
    User registration serializer.

    Validates:
    - Email uniqueness
    - Password strength (Django validators)
    - Name presence
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists")
        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data.get("name", ""),
        )
        # Generate email verification token (returns plain token, stores hash)
        plain_token = user.set_email_verification_token()
        user.save(update_fields=["email_verification_token", "email_verification_sent_at"])
        # Store plain token temporarily for email sending (not persisted)
        user._plain_verification_token = plain_token
        return user


class LoginSerializer(serializers.Serializer):
    """
    User login serializer.

    Validates credentials and returns authenticated user.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower().strip()
        password = attrs.get("password", "")

        if not email or not password:
            raise serializers.ValidationError("Email and password are required")

        user = authenticate(
            request=self.context.get("request"),
            username=email,  # Django uses username field for auth
            password=password,
        )

        if not user:
            raise serializers.ValidationError("Invalid email or password")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated")

        attrs["user"] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Request password reset via email."""

    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()

    def save(self):
        email = self.validated_data["email"]
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
            # Generate token (returns plain token, stores hash)
            plain_token = user.set_password_reset_token()
            user.save(update_fields=["password_reset_token", "password_reset_sent_at"])
            # Store plain token temporarily for email sending (not persisted)
            user._plain_reset_token = plain_token
            return user
        except User.DoesNotExist:
            # Don't reveal if email exists - security best practice
            return None


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirm password reset with token and new password."""

    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        token = attrs.get("token")

        # Find user by hashed token
        user = User.find_by_password_reset_token(token)
        if not user:
            raise serializers.ValidationError({"token": "Invalid or expired token"})

        # Verify token (includes expiry check)
        if not user.verify_password_reset_token(token):
            raise serializers.ValidationError({"token": "Token has expired"})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.clear_password_reset_token()
        user.save(update_fields=["password", "password_reset_token", "password_reset_sent_at"])
        return user


class EmailVerifySerializer(serializers.Serializer):
    """Verify email with token."""

    token = serializers.CharField()

    def validate(self, attrs):
        token = attrs.get("token")

        # Find user by hashed token
        user = User.find_by_email_verification_token(token)
        if not user:
            raise serializers.ValidationError({"token": "Invalid or expired token"})

        # Verify token (includes expiry check)
        if not user.verify_email_token(token):
            raise serializers.ValidationError({"token": "Token has expired"})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.is_email_verified = True
        user.clear_email_verification_token()
        user.save(update_fields=["is_email_verified", "email_verification_token", "email_verification_sent_at"])
        return user


class ResendVerificationSerializer(serializers.Serializer):
    """Resend email verification."""

    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()

    def save(self):
        email = self.validated_data["email"]
        try:
            user = User.objects.get(
                email__iexact=email,
                is_email_verified=False,
                is_active=True,
            )
            # Generate new token (returns plain token, stores hash)
            plain_token = user.set_email_verification_token()
            user.save(update_fields=["email_verification_token", "email_verification_sent_at"])
            # Store plain token temporarily for email sending (not persisted)
            user._plain_verification_token = plain_token
            return user
        except User.DoesNotExist:
            # Don't reveal if email exists
            return None


class ChangePasswordSerializer(serializers.Serializer):
    """Change password for authenticated user."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
