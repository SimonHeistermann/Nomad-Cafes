"""
Custom middleware for error handling and request processing.
"""

import logging
import time
import traceback
import uuid

from django.conf import settings
from django.http import JsonResponse

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """
    Middleware to log all API requests with timing information.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Generate request ID
        request_id = str(uuid.uuid4())[:8]
        request.request_id = request_id

        # Start timing
        start_time = time.time()

        # Process request
        response = self.get_response(request)

        # Calculate duration
        duration = time.time() - start_time

        # Log request (only for API endpoints)
        if request.path.startswith("/api/"):
            logger.info(
                f"[{request_id}] {request.method} {request.path} "
                f"-> {response.status_code} ({duration:.3f}s)"
            )

        # Add request ID to response headers
        response["X-Request-ID"] = request_id

        return response


class ErrorHandlerMiddleware:
    """
    Middleware to catch unhandled exceptions and return consistent JSON errors.

    This catches exceptions that aren't handled by DRF's exception handler
    (like 500 errors from database issues, etc.)
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        """Handle unhandled exceptions."""
        # Only handle API requests
        if not request.path.startswith("/api/"):
            return None

        # Get request ID if available
        request_id = getattr(request, "request_id", "unknown")

        # Log the full exception
        logger.error(
            f"[{request_id}] Unhandled exception: {exception}\n"
            f"{traceback.format_exc()}"
        )

        # Build error response
        error_response = {
            "message": "An unexpected error occurred",
            "code": "internal_error",
            "request_id": request_id,
        }

        # Include debug info in development
        if settings.DEBUG:
            error_response["debug"] = {
                "exception": str(exception),
                "type": type(exception).__name__,
            }

        return JsonResponse(error_response, status=500)


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers to all responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add security headers
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Add CSP for API responses
        if request.path.startswith("/api/"):
            response["Content-Security-Policy"] = "default-src 'none'"

        return response
