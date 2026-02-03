"""
Tests for User model.
"""

import pytest

from apps.users.models import User


pytestmark = pytest.mark.django_db


class TestUserModel:
    """Tests for User model."""

    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(
            email="newuser@example.com",
            password="TestPass123!",
            name="New User",
        )
        assert user.email == "newuser@example.com"
        assert user.name == "New User"
        assert user.role == User.Role.USER
        assert user.check_password("TestPass123!")
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_superuser(self):
        """Test creating a superuser."""
        admin = User.objects.create_superuser(
            email="superadmin@example.com",
            password="AdminPass123!",
        )
        assert admin.email == "superadmin@example.com"
        assert admin.role == User.Role.ADMIN
        assert admin.is_staff
        assert admin.is_superuser
        assert admin.is_admin

    def test_email_normalized(self):
        """Test that email is normalized."""
        user = User.objects.create_user(
            email="Test@EXAMPLE.COM",
            password="TestPass123!",
        )
        assert user.email == "Test@example.com"

    def test_display_name_with_name(self):
        """Test display_name returns name when set."""
        user = User.objects.create_user(
            email="user@example.com",
            password="TestPass123!",
            name="John Doe",
        )
        assert user.display_name == "John Doe"

    def test_display_name_without_name(self):
        """Test display_name returns email prefix when name not set."""
        user = User.objects.create_user(
            email="john@example.com",
            password="TestPass123!",
        )
        assert user.display_name == "john"

    def test_create_user_without_email_raises_error(self):
        """Test that creating a user without email raises ValueError."""
        with pytest.raises(ValueError, match="Email is required"):
            User.objects.create_user(email="", password="TestPass123!")

    def test_create_superuser_without_is_staff_raises_error(self):
        """Test that creating superuser with is_staff=False raises ValueError."""
        with pytest.raises(ValueError, match="Superuser must have is_staff=True"):
            User.objects.create_superuser(
                email="admin@example.com",
                password="AdminPass123!",
                is_staff=False,
            )

    def test_create_superuser_without_is_superuser_raises_error(self):
        """Test that creating superuser with is_superuser=False raises ValueError."""
        with pytest.raises(ValueError, match="Superuser must have is_superuser=True"):
            User.objects.create_superuser(
                email="admin2@example.com",
                password="AdminPass123!",
                is_superuser=False,
            )

    def test_str_returns_email(self):
        """Test that __str__ returns the user's email."""
        user = User.objects.create_user(
            email="strtest@example.com",
            password="TestPass123!",
        )
        assert str(user) == "strtest@example.com"

    def test_is_owner_property(self):
        """Test is_owner property returns True for OWNER role."""
        user = User.objects.create_user(
            email="owner@example.com",
            password="TestPass123!",
            role=User.Role.OWNER,
        )
        assert user.is_owner is True

    def test_is_owner_property_false_for_regular_user(self):
        """Test is_owner property returns False for regular user."""
        user = User.objects.create_user(
            email="regular@example.com",
            password="TestPass123!",
        )
        assert user.is_owner is False


class TestUserTokenMethods:
    """Tests for User token generation and verification methods."""

    def test_set_email_verification_token(self):
        """Test setting email verification token."""
        user = User.objects.create_user(
            email="verify@example.com",
            password="TestPass123!",
        )
        plain_token = user.set_email_verification_token()
        user.save()

        assert plain_token is not None
        assert len(plain_token) > 20
        assert user.email_verification_token != plain_token  # Stored hashed
        assert user.email_verification_sent_at is not None

    def test_verify_email_token_valid(self):
        """Test verifying a valid email verification token."""
        user = User.objects.create_user(
            email="verify2@example.com",
            password="TestPass123!",
        )
        plain_token = user.set_email_verification_token()
        user.save()

        assert user.verify_email_token(plain_token) is True

    def test_verify_email_token_invalid(self):
        """Test verifying an invalid email verification token."""
        user = User.objects.create_user(
            email="verify3@example.com",
            password="TestPass123!",
        )
        user.set_email_verification_token()
        user.save()

        assert user.verify_email_token("invalid-token") is False

    def test_verify_email_token_empty_token(self):
        """Test verifying with empty token returns False."""
        user = User.objects.create_user(
            email="verify4@example.com",
            password="TestPass123!",
        )
        user.set_email_verification_token()
        user.save()

        assert user.verify_email_token("") is False

    def test_verify_email_token_no_stored_token(self):
        """Test verifying when no token is stored returns False."""
        user = User.objects.create_user(
            email="verify5@example.com",
            password="TestPass123!",
        )
        # No token set
        assert user.verify_email_token("some-token") is False

    def test_verify_email_token_expired(self):
        """Test verifying an expired email verification token."""
        from django.utils import timezone
        from datetime import timedelta

        user = User.objects.create_user(
            email="verify6@example.com",
            password="TestPass123!",
        )
        plain_token = user.set_email_verification_token()
        # Set sent_at to 8 days ago (token expires after 7 days)
        user.email_verification_sent_at = timezone.now() - timedelta(days=8)
        user.save()

        assert user.verify_email_token(plain_token) is False

    def test_clear_email_verification_token(self):
        """Test clearing email verification token."""
        user = User.objects.create_user(
            email="verify7@example.com",
            password="TestPass123!",
        )
        user.set_email_verification_token()
        user.save()

        user.clear_email_verification_token()
        user.save()

        assert user.email_verification_token == ""
        assert user.email_verification_sent_at is None

    def test_set_password_reset_token(self):
        """Test setting password reset token."""
        user = User.objects.create_user(
            email="reset@example.com",
            password="TestPass123!",
        )
        plain_token = user.set_password_reset_token()
        user.save()

        assert plain_token is not None
        assert len(plain_token) > 20
        assert user.password_reset_token != plain_token  # Stored hashed
        assert user.password_reset_sent_at is not None

    def test_verify_password_reset_token_valid(self):
        """Test verifying a valid password reset token."""
        user = User.objects.create_user(
            email="reset2@example.com",
            password="TestPass123!",
        )
        plain_token = user.set_password_reset_token()
        user.save()

        assert user.verify_password_reset_token(plain_token) is True

    def test_verify_password_reset_token_invalid(self):
        """Test verifying an invalid password reset token."""
        user = User.objects.create_user(
            email="reset3@example.com",
            password="TestPass123!",
        )
        user.set_password_reset_token()
        user.save()

        assert user.verify_password_reset_token("invalid-token") is False

    def test_verify_password_reset_token_empty_token(self):
        """Test verifying with empty password reset token returns False."""
        user = User.objects.create_user(
            email="reset4@example.com",
            password="TestPass123!",
        )
        user.set_password_reset_token()
        user.save()

        assert user.verify_password_reset_token("") is False

    def test_verify_password_reset_token_no_stored_token(self):
        """Test verifying when no password reset token is stored returns False."""
        user = User.objects.create_user(
            email="reset5@example.com",
            password="TestPass123!",
        )
        # No token set
        assert user.verify_password_reset_token("some-token") is False

    def test_verify_password_reset_token_expired(self):
        """Test verifying an expired password reset token."""
        from django.utils import timezone
        from datetime import timedelta

        user = User.objects.create_user(
            email="reset6@example.com",
            password="TestPass123!",
        )
        plain_token = user.set_password_reset_token()
        # Set sent_at to 25 hours ago (token expires after 24 hours)
        user.password_reset_sent_at = timezone.now() - timedelta(hours=25)
        user.save()

        assert user.verify_password_reset_token(plain_token) is False

    def test_clear_password_reset_token(self):
        """Test clearing password reset token."""
        user = User.objects.create_user(
            email="reset7@example.com",
            password="TestPass123!",
        )
        user.set_password_reset_token()
        user.save()

        user.clear_password_reset_token()
        user.save()

        assert user.password_reset_token == ""
        assert user.password_reset_sent_at is None

    def test_find_by_email_verification_token(self):
        """Test finding user by email verification token."""
        user = User.objects.create_user(
            email="find1@example.com",
            password="TestPass123!",
        )
        plain_token = user.set_email_verification_token()
        user.save()

        found_user = User.find_by_email_verification_token(plain_token)
        assert found_user == user

    def test_find_by_email_verification_token_not_found(self):
        """Test finding user with invalid token returns None."""
        found_user = User.find_by_email_verification_token("nonexistent-token")
        assert found_user is None

    def test_find_by_password_reset_token(self):
        """Test finding user by password reset token."""
        user = User.objects.create_user(
            email="find2@example.com",
            password="TestPass123!",
        )
        plain_token = user.set_password_reset_token()
        user.save()

        found_user = User.find_by_password_reset_token(plain_token)
        assert found_user == user

    def test_find_by_password_reset_token_not_found(self):
        """Test finding user with invalid password reset token returns None."""
        found_user = User.find_by_password_reset_token("nonexistent-token")
        assert found_user is None

    def test_hash_token_static_method(self):
        """Test hash_token static method produces consistent results."""
        token = "test-token-12345"
        hash1 = User.hash_token(token)
        hash2 = User.hash_token(token)

        assert hash1 == hash2
        assert hash1 != token  # Hash is different from original
