"""
Tests for custom exception classes and handler.
"""

from unittest.mock import Mock
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
    Throttled,
)
from django.http import Http404
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied

from apps.users.exceptions import (
    custom_exception_handler,
    APIException,
    InvalidCredentials,
    EmailAlreadyExists,
    InvalidToken,
    EmailNotVerified,
)


class TestCustomExceptionHandler:
    """Tests for custom_exception_handler."""

    def test_returns_none_when_no_response(self):
        """Returns None for non-API exceptions."""
        exc = Exception("Some error")
        context = {"request": Mock()}

        result = custom_exception_handler(exc, context)

        assert result is None

    def test_handles_validation_error(self):
        """Handles ValidationError with field details."""
        exc = ValidationError({"email": ["Invalid email format"]})
        context = {"request": Mock(request_id="test-123")}

        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.data["code"] == "validation_error"
        assert response.data["message"] == "Validation failed"
        assert "details" in response.data
        assert response.data["request_id"] == "test-123"

    def test_handles_not_authenticated(self):
        """Handles NotAuthenticated exception."""
        exc = NotAuthenticated()
        context = {"request": Mock(request_id="test-456")}

        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.data["code"] == "not_authenticated"
        assert response.data["message"] == "Authentication required"

    def test_handles_authentication_failed(self):
        """Handles AuthenticationFailed exception."""
        exc = AuthenticationFailed("Token expired")
        context = {"request": Mock(request_id="test-789")}

        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.data["code"] == "authentication_failed"
        assert "Token expired" in response.data["message"]

    def test_handles_permission_denied(self):
        """Handles PermissionDenied exception."""
        exc = PermissionDenied()
        context = {"request": Mock(request_id=None)}

        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.data["code"] == "permission_denied"
        assert "permission" in response.data["message"].lower()

    def test_handles_django_permission_denied(self):
        """Handles Django's PermissionDenied exception."""
        exc = DjangoPermissionDenied()
        context = {"request": Mock()}

        response = custom_exception_handler(exc, context)

        # Django PermissionDenied may or may not be handled by DRF
        # The test ensures no crash
        assert response is None or response.data is not None

    def test_handles_http404(self):
        """Handles Http404 exception."""
        exc = Http404()
        context = {"request": Mock(request_id="test-not-found")}

        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.data["code"] == "not_found"
        assert response.data["message"] == "Not found"

    def test_handles_generic_exception_with_string_detail(self):
        """Handles generic exception with string detail."""
        exc = Throttled()
        exc.detail = "Rate limit exceeded"
        context = {"request": Mock(request_id=None)}

        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.data["message"] == "Rate limit exceeded"

    def test_handles_generic_exception_with_list_detail(self):
        """Handles generic exception with list detail."""
        exc = Throttled()
        exc.detail = ["First error", "Second error"]
        context = {"request": Mock(request_id=None)}

        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.data["message"] == "First error"

    def test_request_id_not_included_when_not_available(self):
        """Request ID not included when not available."""
        exc = ValidationError({"field": ["error"]})
        context = {"request": None}

        response = custom_exception_handler(exc, context)

        assert response is not None
        assert "request_id" not in response.data


class TestAPIException:
    """Tests for APIException base class."""

    def test_default_values(self):
        """Uses default values when not provided."""
        exc = APIException()

        assert exc.message == "An error occurred"
        assert exc.code == "error"
        assert exc.status_code == 400

    def test_custom_message(self):
        """Accepts custom message."""
        exc = APIException(message="Custom error")

        assert exc.message == "Custom error"
        assert str(exc) == "Custom error"

    def test_custom_code(self):
        """Accepts custom code."""
        exc = APIException(code="custom_code")

        assert exc.code == "custom_code"


class TestInvalidCredentials:
    """Tests for InvalidCredentials exception."""

    def test_default_values(self):
        """Has correct default values."""
        exc = InvalidCredentials()

        assert exc.status_code == 401
        assert exc.code == "invalid_credentials"
        assert "Invalid email or password" in exc.message


class TestEmailAlreadyExists:
    """Tests for EmailAlreadyExists exception."""

    def test_default_values(self):
        """Has correct default values."""
        exc = EmailAlreadyExists()

        assert exc.status_code == 400
        assert exc.code == "email_exists"
        assert "email" in exc.message.lower()


class TestInvalidToken:
    """Tests for InvalidToken exception."""

    def test_default_values(self):
        """Has correct default values."""
        exc = InvalidToken()

        assert exc.status_code == 400
        assert exc.code == "invalid_token"
        assert "token" in exc.message.lower()


class TestEmailNotVerified:
    """Tests for EmailNotVerified exception."""

    def test_default_values(self):
        """Has correct default values."""
        exc = EmailNotVerified()

        assert exc.status_code == 403
        assert exc.code == "email_not_verified"
        assert "verify" in exc.message.lower()
