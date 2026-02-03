"""
Tests for custom middleware.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from django.http import JsonResponse
from django.test import RequestFactory

from apps.core.middleware import (
    RequestLoggingMiddleware,
    ErrorHandlerMiddleware,
    SecurityHeadersMiddleware,
)


class TestRequestLoggingMiddleware:
    """Tests for RequestLoggingMiddleware."""

    def test_adds_request_id(self):
        """Adds unique request ID to request and response."""
        get_response = Mock(return_value=JsonResponse({}))
        middleware = RequestLoggingMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/api/test/")

        response = middleware(request)

        assert hasattr(request, "request_id")
        assert len(request.request_id) == 8
        assert "X-Request-ID" in response

    def test_logs_api_requests(self):
        """Logs API endpoint requests."""
        get_response = Mock(return_value=JsonResponse({}))
        middleware = RequestLoggingMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/api/test/")

        with patch("apps.core.middleware.logger") as mock_logger:
            middleware(request)
            mock_logger.info.assert_called()

    def test_does_not_log_non_api_requests(self):
        """Does not log non-API requests."""
        get_response = Mock(return_value=JsonResponse({}))
        middleware = RequestLoggingMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/admin/")

        with patch("apps.core.middleware.logger") as mock_logger:
            middleware(request)
            mock_logger.info.assert_not_called()


class TestErrorHandlerMiddleware:
    """Tests for ErrorHandlerMiddleware."""

    def test_normal_request_passes_through(self):
        """Normal requests pass through unchanged."""
        response = JsonResponse({"data": "test"})
        get_response = Mock(return_value=response)
        middleware = ErrorHandlerMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/api/test/")

        result = middleware(request)

        assert result == response

    def test_returns_none_for_non_api_exceptions(self):
        """Returns None for exceptions on non-API paths."""
        get_response = Mock()
        middleware = ErrorHandlerMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/admin/")
        exception = Exception("Test error")

        result = middleware.process_exception(request, exception)

        assert result is None

    def test_handles_api_exceptions(self):
        """Handles exceptions on API paths with JSON response."""
        get_response = Mock()
        middleware = ErrorHandlerMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/api/test/")
        request.request_id = "test-123"
        exception = Exception("Test error")

        with patch("apps.core.middleware.logger"):
            response = middleware.process_exception(request, exception)

        assert response is not None
        assert response.status_code == 500
        assert response["Content-Type"] == "application/json"

    def test_includes_request_id_in_error_response(self):
        """Includes request ID in error response."""
        get_response = Mock()
        middleware = ErrorHandlerMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/api/test/")
        request.request_id = "abc123"
        exception = Exception("Test error")

        with patch("apps.core.middleware.logger"):
            response = middleware.process_exception(request, exception)

        import json
        data = json.loads(response.content)
        assert data["request_id"] == "abc123"

    def test_uses_unknown_request_id_when_not_set(self):
        """Uses 'unknown' when request_id not available."""
        get_response = Mock()
        middleware = ErrorHandlerMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/api/test/")
        # Don't set request_id
        exception = Exception("Test error")

        with patch("apps.core.middleware.logger"):
            response = middleware.process_exception(request, exception)

        import json
        data = json.loads(response.content)
        assert data["request_id"] == "unknown"


class TestSecurityHeadersMiddleware:
    """Tests for SecurityHeadersMiddleware."""

    def test_adds_security_headers(self):
        """Adds security headers to all responses."""
        response = JsonResponse({})
        get_response = Mock(return_value=response)
        middleware = SecurityHeadersMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/")

        result = middleware(request)

        assert result["X-Content-Type-Options"] == "nosniff"
        assert result["X-Frame-Options"] == "DENY"
        assert result["Referrer-Policy"] == "strict-origin-when-cross-origin"

    def test_adds_csp_for_api_routes(self):
        """Adds Content-Security-Policy for API routes."""
        response = JsonResponse({})
        get_response = Mock(return_value=response)
        middleware = SecurityHeadersMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/api/test/")

        result = middleware(request)

        assert "Content-Security-Policy" in result
        assert result["Content-Security-Policy"] == "default-src 'none'"

    def test_no_csp_for_non_api_routes(self):
        """Does not add CSP for non-API routes."""
        response = JsonResponse({})
        get_response = Mock(return_value=response)
        middleware = SecurityHeadersMiddleware(get_response)

        factory = RequestFactory()
        request = factory.get("/admin/")

        result = middleware(request)

        assert "Content-Security-Policy" not in result
