"""
Views for core functionality.
"""

import logging
from datetime import datetime

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ContactSerializer, HealthCheckSerializer
from .throttling import ContactThrottle

logger = logging.getLogger(__name__)


class ContactView(APIView):
    """
    POST /api/contact/

    Handle contact form submissions.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ContactThrottle]
    serializer_class = ContactSerializer

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Log contact submission
        logger.info(
            f"Contact form submission: {data['subject']} from {data['email']}"
        )

        # In production, send email
        if settings.ENVIRONMENT == "production":
            try:
                send_mail(
                    subject=f"[Nomad Cafes] {data['subject']}: {data['name']}",
                    message=f"From: {data['name']} <{data['email']}>\n\n{data['message']}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.CONTACT_EMAIL],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error(f"Failed to send contact email: {e}")
                return Response(
                    {"message": "Failed to send message. Please try again later."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(
            {
                "message": "Thank you for your message. We'll get back to you soon!",
                "reference": f"NC-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            },
            status=status.HTTP_201_CREATED,
        )


class HealthCheckView(APIView):
    """
    GET /api/health/

    Liveness probe - checks if the application is running.
    Use for Kubernetes livenessProbe or load balancer health checks.

    Returns 200 if the application is alive (even if dependencies are degraded).
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = HealthCheckSerializer

    def get(self, request):
        # Check database
        db_status = "healthy"
        try:
            connection.ensure_connection()
        except Exception:
            db_status = "unhealthy"

        # Check cache
        cache_status = "healthy"
        try:
            cache.set("health_check", "ok", 1)
            if cache.get("health_check") != "ok":
                cache_status = "unhealthy"
        except Exception:
            cache_status = "unhealthy"

        response_data = {
            "status": "healthy" if db_status == "healthy" else "degraded",
            "version": getattr(settings, "APP_VERSION", "1.0.0"),
            "timestamp": datetime.now().isoformat(),
            "database": db_status,
            "cache": cache_status,
        }

        status_code = (
            status.HTTP_200_OK
            if response_data["status"] == "healthy"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        return Response(response_data, status=status_code)


class ReadinessProbeView(APIView):
    """
    GET /api/ready/

    Readiness probe - checks if the application is ready to receive traffic.
    Use for Kubernetes readinessProbe.

    Returns 200 only if ALL critical dependencies are healthy.
    Returns 503 if any critical dependency is unavailable.

    Difference from /health/:
    - /health/ (liveness): Is the app running? (restart if not)
    - /ready/ (readiness): Can the app handle requests? (remove from LB if not)
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        checks = {
            "database": self._check_database(),
            "cache": self._check_cache(),
            "migrations": self._check_migrations(),
        }

        # App is ready if database is healthy (cache is non-critical)
        critical_healthy = checks["database"]["status"] == "healthy"
        migrations_ok = checks["migrations"]["status"] == "healthy"

        all_ready = critical_healthy and migrations_ok

        response_data = {
            "ready": all_ready,
            "timestamp": datetime.now().isoformat(),
            "checks": checks,
        }

        status_code = status.HTTP_200_OK if all_ready else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(response_data, status=status_code)

    def _check_database(self) -> dict:
        """Check database connectivity and query execution."""
        try:
            connection.ensure_connection()
            # Execute a simple query to verify full connectivity
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return {"status": "healthy"}
        except Exception as e:
            logger.error(f"Database readiness check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}

    def _check_cache(self) -> dict:
        """Check cache read/write operations."""
        try:
            test_key = "readiness_probe_test"
            test_value = datetime.now().isoformat()
            cache.set(test_key, test_value, 10)
            retrieved = cache.get(test_key)
            if retrieved != test_value:
                return {"status": "unhealthy", "error": "Cache read/write mismatch"}
            cache.delete(test_key)
            return {"status": "healthy"}
        except Exception as e:
            logger.warning(f"Cache readiness check failed: {e}")
            # Cache failure is non-critical - app can work without it
            return {"status": "degraded", "error": str(e)}

    def _check_migrations(self) -> dict:
        """Check if all migrations have been applied."""
        try:
            from django.db.migrations.executor import MigrationExecutor

            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            if plan:
                return {
                    "status": "unhealthy",
                    "error": f"{len(plan)} pending migrations",
                }
            return {"status": "healthy"}
        except Exception as e:
            logger.error(f"Migration check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}
