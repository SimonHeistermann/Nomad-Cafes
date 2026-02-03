"""
Tests for background email tasks.
"""

import pytest
from unittest.mock import patch, MagicMock, Mock
from datetime import datetime

from apps.users.tasks import (
    _send_email,
    _get_template_context,
    send_verification_email_task,
    send_password_reset_email_task,
    send_welcome_email_task,
)


pytestmark = pytest.mark.django_db


class TestSendEmail:
    """Tests for _send_email helper function."""

    @patch("apps.users.tasks.settings")
    @patch("django.core.mail.send_mail")
    def test_uses_django_backend_when_no_resend_key(self, mock_send_mail, mock_settings):
        """Falls back to Django email backend when RESEND_API_KEY not set."""
        mock_settings.RESEND_API_KEY = ""
        mock_settings.DEFAULT_FROM_EMAIL = "noreply@test.com"
        mock_send_mail.return_value = 1

        result = _send_email(
            to="user@test.com",
            subject="Test Subject",
            html_content="<p>Hello</p>",
            text_content="Hello",
        )

        assert result is True
        mock_send_mail.assert_called_once_with(
            subject="Test Subject",
            message="Hello",
            from_email="noreply@test.com",
            recipient_list=["user@test.com"],
            html_message="<p>Hello</p>",
            fail_silently=False,
        )

    @patch("apps.users.tasks.settings")
    @patch("django.core.mail.send_mail")
    def test_returns_false_when_django_send_fails(self, mock_send_mail, mock_settings):
        """Returns False when Django email backend fails."""
        mock_settings.RESEND_API_KEY = ""
        mock_settings.DEFAULT_FROM_EMAIL = "noreply@test.com"
        mock_send_mail.side_effect = Exception("SMTP error")

        result = _send_email(
            to="user@test.com",
            subject="Test",
            html_content="<p>Hello</p>",
            text_content="Hello",
        )

        assert result is False

    @patch("apps.users.tasks.settings")
    def test_uses_resend_when_api_key_set(self, mock_settings):
        """Uses Resend API when RESEND_API_KEY is set."""
        mock_settings.RESEND_API_KEY = "re_test_key"
        mock_settings.DEFAULT_FROM_EMAIL = "noreply@test.com"

        with patch("resend.Emails.send") as mock_resend:
            mock_resend.return_value = {"id": "email-123"}

            result = _send_email(
                to="user@test.com",
                subject="Test Subject",
                html_content="<p>Hello</p>",
                text_content="Hello",
            )

            assert result is True
            mock_resend.assert_called_once()

    @patch("apps.users.tasks.settings")
    def test_returns_false_when_resend_fails(self, mock_settings):
        """Returns False when Resend API fails."""
        mock_settings.RESEND_API_KEY = "re_test_key"
        mock_settings.DEFAULT_FROM_EMAIL = "noreply@test.com"

        with patch("resend.Emails.send") as mock_resend:
            mock_resend.side_effect = Exception("API error")

            result = _send_email(
                to="user@test.com",
                subject="Test",
                html_content="<p>Hello</p>",
                text_content="Hello",
            )

            assert result is False


class TestGetTemplateContext:
    """Tests for _get_template_context helper."""

    def test_includes_base_context(self):
        """Includes year and frontend_url in context."""
        context = _get_template_context()

        assert "year" in context
        assert context["year"] == datetime.now().year
        assert "frontend_url" in context

    def test_merges_extra_context(self):
        """Merges extra context with base context."""
        extra = {"name": "John", "custom_field": "value"}
        context = _get_template_context(extra)

        assert context["name"] == "John"
        assert context["custom_field"] == "value"
        assert "year" in context
        assert "frontend_url" in context


class TestSendVerificationEmailTask:
    """Tests for send_verification_email_task."""

    def test_returns_false_for_nonexistent_user(self):
        """Returns False when user doesn't exist."""
        result = send_verification_email_task("00000000-0000-0000-0000-000000000000", "token")
        assert result is False

    @patch("apps.users.tasks._send_email")
    def test_sends_verification_email(self, mock_send, user):
        """Sends verification email to user."""
        mock_send.return_value = True

        result = send_verification_email_task(str(user.id), "test-token-123")

        assert result is True
        mock_send.assert_called_once()

        # Check email parameters
        call_args = mock_send.call_args
        assert call_args[1]["to"] == user.email
        assert "Verify" in call_args[1]["subject"]
        assert "test-token-123" in call_args[1]["html_content"]

    @patch("apps.users.tasks._send_email")
    def test_returns_false_when_send_fails(self, mock_send, user):
        """Returns False when email sending fails."""
        mock_send.return_value = False

        result = send_verification_email_task(str(user.id), "token")

        assert result is False


class TestSendPasswordResetEmailTask:
    """Tests for send_password_reset_email_task."""

    def test_returns_false_for_nonexistent_user(self):
        """Returns False when user doesn't exist."""
        result = send_password_reset_email_task("00000000-0000-0000-0000-000000000000", "token")
        assert result is False

    @patch("apps.users.tasks._send_email")
    def test_sends_password_reset_email(self, mock_send, user):
        """Sends password reset email to user."""
        mock_send.return_value = True

        result = send_password_reset_email_task(str(user.id), "reset-token-456")

        assert result is True
        mock_send.assert_called_once()

        # Check email parameters
        call_args = mock_send.call_args
        assert call_args[1]["to"] == user.email
        assert "Reset" in call_args[1]["subject"]
        assert "reset-token-456" in call_args[1]["html_content"]

    @patch("apps.users.tasks._send_email")
    def test_returns_false_when_send_fails(self, mock_send, user):
        """Returns False when email sending fails."""
        mock_send.return_value = False

        result = send_password_reset_email_task(str(user.id), "token")

        assert result is False


class TestSendWelcomeEmailTask:
    """Tests for send_welcome_email_task."""

    def test_returns_false_for_nonexistent_user(self):
        """Returns False when user doesn't exist."""
        result = send_welcome_email_task("00000000-0000-0000-0000-000000000000")
        assert result is False

    @patch("apps.users.tasks._send_email")
    def test_sends_welcome_email(self, mock_send, user):
        """Sends welcome email to user."""
        mock_send.return_value = True

        result = send_welcome_email_task(str(user.id))

        assert result is True
        mock_send.assert_called_once()

        # Check email parameters
        call_args = mock_send.call_args
        assert call_args[1]["to"] == user.email
        assert "Welcome" in call_args[1]["subject"]

    @patch("apps.users.tasks._send_email")
    def test_returns_false_when_send_fails(self, mock_send, user):
        """Returns False when email sending fails."""
        mock_send.return_value = False

        result = send_welcome_email_task(str(user.id))

        assert result is False
