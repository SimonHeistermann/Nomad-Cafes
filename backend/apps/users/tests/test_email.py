"""
Tests for email service functions.
"""

import pytest
from unittest.mock import patch, MagicMock
import sys

from apps.users.email import (
    _get_redis_available,
    send_verification_email,
    send_password_reset_email,
    send_welcome_email,
)


pytestmark = pytest.mark.django_db


class TestRedisAvailability:
    """Tests for Redis availability check."""

    def test_redis_not_available_when_no_url(self, settings):
        """Returns False when REDIS_URL is not set."""
        settings.REDIS_URL = None
        assert _get_redis_available() is False

    def test_redis_not_available_when_empty_url(self, settings):
        """Returns False when REDIS_URL is empty."""
        settings.REDIS_URL = ""
        assert _get_redis_available() is False

    def test_redis_available_when_can_connect(self, settings):
        """Returns True when Redis connection works."""
        settings.REDIS_URL = "redis://localhost:6379"

        # Mock the redis module before importing
        mock_redis = MagicMock()
        mock_client = MagicMock()
        mock_redis.from_url.return_value = mock_client
        mock_client.ping.return_value = True

        with patch.dict(sys.modules, {'redis': mock_redis}):
            # Need to reload the module to pick up the mock
            import importlib
            from apps.users import email
            importlib.reload(email)

            result = email._get_redis_available()
            assert result is True

    def test_redis_not_available_when_connection_fails(self, settings):
        """Returns False when Redis connection fails - covers exception handling."""
        settings.REDIS_URL = "redis://nonexistent:6379"
        # This tests the real code path where connection fails
        assert _get_redis_available() is False


class TestSendVerificationEmail:
    """Tests for send_verification_email function."""

    def test_returns_false_when_no_token(self, user):
        """Returns False when no token provided."""
        result = send_verification_email(user, plain_token=None)
        assert result is False

    def test_returns_false_when_empty_token(self, user):
        """Returns False when empty token provided."""
        result = send_verification_email(user, plain_token="")
        assert result is False

    @patch("apps.users.email._get_redis_available", return_value=False)
    @patch("apps.users.tasks.send_verification_email_task")
    def test_sends_synchronously_when_no_redis(self, mock_task, mock_redis, user):
        """Falls back to synchronous sending when Redis unavailable."""
        mock_task.return_value = True

        result = send_verification_email(user, plain_token="test-token")

        assert result is True
        mock_task.assert_called_once_with(str(user.id), "test-token")

    @patch("apps.users.email._get_redis_available", return_value=True)
    @patch("apps.users.tasks.send_verification_email_task")
    def test_queues_when_redis_available(self, mock_task, mock_redis, user):
        """Queues task when Redis is available."""
        mock_task.delay = MagicMock()

        result = send_verification_email(user, plain_token="test-token")

        assert result is True
        mock_task.delay.assert_called_once_with(str(user.id), "test-token")


class TestSendPasswordResetEmail:
    """Tests for send_password_reset_email function."""

    def test_returns_false_when_no_token(self, user):
        """Returns False when no token provided."""
        result = send_password_reset_email(user, plain_token=None)
        assert result is False

    @patch("apps.users.email._get_redis_available", return_value=False)
    @patch("apps.users.tasks.send_password_reset_email_task")
    def test_sends_synchronously_when_no_redis(self, mock_task, mock_redis, user):
        """Falls back to synchronous sending when Redis unavailable."""
        mock_task.return_value = True

        result = send_password_reset_email(user, plain_token="reset-token")

        assert result is True
        mock_task.assert_called_once_with(str(user.id), "reset-token")

    @patch("apps.users.email._get_redis_available", return_value=True)
    @patch("apps.users.tasks.send_password_reset_email_task")
    def test_queues_when_redis_available(self, mock_task, mock_redis, user):
        """Queues task when Redis is available."""
        mock_task.delay = MagicMock()

        result = send_password_reset_email(user, plain_token="reset-token")

        assert result is True
        mock_task.delay.assert_called_once_with(str(user.id), "reset-token")


class TestSendWelcomeEmail:
    """Tests for send_welcome_email function."""

    @patch("apps.users.email._get_redis_available", return_value=False)
    @patch("apps.users.tasks.send_welcome_email_task")
    def test_sends_synchronously_when_no_redis(self, mock_task, mock_redis, user):
        """Falls back to synchronous sending when Redis unavailable."""
        mock_task.return_value = True

        result = send_welcome_email(user)

        assert result is True
        mock_task.assert_called_once_with(str(user.id))

    @patch("apps.users.email._get_redis_available", return_value=True)
    @patch("apps.users.tasks.send_welcome_email_task")
    def test_queues_when_redis_available(self, mock_task, mock_redis, user):
        """Queues task when Redis is available."""
        mock_task.delay = MagicMock()

        result = send_welcome_email(user)

        assert result is True
        mock_task.delay.assert_called_once_with(str(user.id))
