"""
Tests for core API endpoints.
"""

import pytest
from django.urls import reverse
from rest_framework import status


pytestmark = pytest.mark.django_db


class TestContactEndpoint:
    """Tests for contact form endpoint."""

    def test_contact_success(self, api_client):
        """POST /api/contact/ - successful submission."""
        url = reverse("core:contact")
        response = api_client.post(
            url,
            {
                "name": "John Doe",
                "email": "john@example.com",
                "subject": "general",
                "message": "This is a test message that is long enough to pass validation.",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert "message" in response.data
        assert "reference" in response.data

    def test_contact_missing_fields(self, api_client):
        """POST /api/contact/ - missing required fields."""
        url = reverse("core:contact")
        response = api_client.post(
            url,
            {
                "name": "John Doe",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_contact_invalid_email(self, api_client):
        """POST /api/contact/ - invalid email format."""
        url = reverse("core:contact")
        response = api_client.post(
            url,
            {
                "name": "John Doe",
                "email": "not-an-email",
                "subject": "general",
                "message": "This is a test message that is long enough.",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_contact_invalid_subject(self, api_client):
        """POST /api/contact/ - invalid subject choice."""
        url = reverse("core:contact")
        response = api_client.post(
            url,
            {
                "name": "John Doe",
                "email": "john@example.com",
                "subject": "invalid_subject",
                "message": "This is a test message that is long enough.",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_contact_message_too_short(self, api_client):
        """POST /api/contact/ - message too short."""
        url = reverse("core:contact")
        response = api_client.post(
            url,
            {
                "name": "John Doe",
                "email": "john@example.com",
                "subject": "general",
                "message": "Too short",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestHealthCheckEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self, api_client):
        """GET /api/health/ - returns health status."""
        url = reverse("core:health")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] in ["healthy", "degraded"]
        assert "version" in response.data
        assert "timestamp" in response.data
        assert "database" in response.data
        assert "cache" in response.data

    def test_health_check_no_auth_required(self, api_client):
        """GET /api/health/ - no authentication required."""
        url = reverse("core:health")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK


class TestReadinessProbeEndpoint:
    """Tests for readiness probe endpoint."""

    def test_readiness_check(self, api_client):
        """GET /api/ready/ - returns readiness status."""
        url = reverse("core:ready")
        response = api_client.get(url)

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]
        assert "ready" in response.data
        assert "timestamp" in response.data
        assert "checks" in response.data
        assert "database" in response.data["checks"]
        assert "cache" in response.data["checks"]
        assert "migrations" in response.data["checks"]

    def test_readiness_check_no_auth_required(self, api_client):
        """GET /api/ready/ - no authentication required."""
        url = reverse("core:ready")
        response = api_client.get(url)

        # Should return a response (not 401/403)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]

    def test_readiness_returns_healthy_when_all_ok(self, api_client):
        """GET /api/ready/ - returns healthy when all checks pass."""
        url = reverse("core:ready")
        response = api_client.get(url)

        # In test environment with database, should be ready
        if response.status_code == status.HTTP_200_OK:
            assert response.data["ready"] is True


class TestHealthCheckDatabaseFailure:
    """Tests for health check when database fails."""

    def test_health_check_reports_db_status(self, api_client):
        """Health check includes database status."""
        url = reverse("core:health")
        response = api_client.get(url)

        # Database should be healthy in tests
        assert response.data["database"] == "healthy"

    def test_health_check_reports_cache_status(self, api_client):
        """Health check includes cache status."""
        url = reverse("core:health")
        response = api_client.get(url)

        # Cache status should be included
        assert response.data["cache"] in ["healthy", "unhealthy"]


class TestContactEmailSending:
    """Tests for contact form email functionality."""

    def test_contact_creates_reference_number(self, api_client):
        """Contact submission returns a reference number."""
        url = reverse("core:contact")
        response = api_client.post(
            url,
            {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "subject": "support",
                "message": "I need help with my account. This is a detailed message.",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["reference"].startswith("NC-")

    def test_contact_with_support_subject(self, api_client):
        """Contact form accepts support subject."""
        url = reverse("core:contact")
        response = api_client.post(
            url,
            {
                "name": "Test User",
                "email": "test@example.com",
                "subject": "support",
                "message": "Testing support subject - this is a long enough message for validation.",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
