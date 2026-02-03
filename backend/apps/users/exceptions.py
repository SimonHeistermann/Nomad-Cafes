"""
Custom exception handling for consistent API error responses.

All errors follow the format:
{
    "message": "Human readable message",
    "code": "error_code",
    "request_id": "abc12345",  // For debugging/support
    "details": {...}  // Optional field-level errors
}
"""

from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
)
from django.http import Http404
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats all errors consistently.

    Includes request_id from RequestLoggingMiddleware for debugging.
    """
    response = exception_handler(exc, context)

    if response is None:
        return None

    # Get request ID from middleware (if available)
    request = context.get("request")
    request_id = getattr(request, "request_id", None) if request else None

    # Build consistent error response
    error_response = {
        "message": "An error occurred",
        "code": "error",
    }

    # Add request_id if available
    if request_id:
        error_response["request_id"] = request_id

    if isinstance(exc, ValidationError):
        error_response["message"] = "Validation failed"
        error_response["code"] = "validation_error"
        error_response["details"] = response.data
    elif isinstance(exc, NotAuthenticated):
        error_response["message"] = "Authentication required"
        error_response["code"] = "not_authenticated"
    elif isinstance(exc, AuthenticationFailed):
        error_response["message"] = str(exc.detail) if hasattr(exc, "detail") else "Authentication failed"
        error_response["code"] = "authentication_failed"
    elif isinstance(exc, (PermissionDenied, DjangoPermissionDenied)):
        error_response["message"] = "You do not have permission to perform this action"
        error_response["code"] = "permission_denied"
    elif isinstance(exc, Http404):
        error_response["message"] = "Not found"
        error_response["code"] = "not_found"
    else:
        # Generic handling for other DRF exceptions
        if hasattr(exc, "detail"):
            if isinstance(exc.detail, str):
                error_response["message"] = exc.detail
            elif isinstance(exc.detail, dict):
                error_response["details"] = exc.detail
                if "detail" in exc.detail:
                    error_response["message"] = exc.detail["detail"]
            elif isinstance(exc.detail, list):
                error_response["message"] = exc.detail[0] if exc.detail else "Error"
        error_response["code"] = exc.default_code if hasattr(exc, "default_code") else "error"

    response.data = error_response
    return response


class APIException(Exception):
    """Base exception for custom API errors."""

    status_code = 400
    default_message = "An error occurred"
    default_code = "error"

    def __init__(self, message=None, code=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        super().__init__(self.message)


class InvalidCredentials(APIException):
    """Raised when login credentials are invalid."""

    status_code = 401
    default_message = "Invalid email or password"
    default_code = "invalid_credentials"


class EmailAlreadyExists(APIException):
    """Raised when email is already registered."""

    status_code = 400
    default_message = "An account with this email already exists"
    default_code = "email_exists"


class InvalidToken(APIException):
    """Raised when a token is invalid or expired."""

    status_code = 400
    default_message = "Invalid or expired token"
    default_code = "invalid_token"


class EmailNotVerified(APIException):
    """Raised when email verification is required."""

    status_code = 403
    default_message = "Please verify your email address"
    default_code = "email_not_verified"
