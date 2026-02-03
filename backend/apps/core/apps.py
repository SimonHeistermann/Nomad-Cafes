"""
Core app configuration.
"""

import atexit
import logging
import signal
import sys

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    verbose_name = "Core"

    def ready(self):
        """
        Called when Django starts.
        Register signal handlers for graceful shutdown.
        """
        # Only register in the main process (not in management commands or tests)
        if self._is_main_process():
            self._register_shutdown_handlers()

    def _is_main_process(self) -> bool:
        """Check if we're in the main process (not autoreload subprocess)."""
        import os

        # In Django's autoreload, RUN_MAIN is set in the child process
        return os.environ.get("RUN_MAIN") != "true" or "runserver" not in sys.argv

    def _register_shutdown_handlers(self):
        """Register handlers for graceful shutdown signals."""
        # Register atexit handler for cleanup
        atexit.register(self._cleanup_on_exit)

        # Handle SIGTERM (sent by Docker/Kubernetes for graceful stop)
        signal.signal(signal.SIGTERM, self._handle_sigterm)

        # Handle SIGINT (Ctrl+C) - Note: May be overridden by Django
        try:
            signal.signal(signal.SIGINT, self._handle_sigint)
        except ValueError:
            # Cannot set signal handler in non-main thread
            pass

        logger.debug("Graceful shutdown handlers registered")

    def _handle_sigterm(self, signum, frame):
        """Handle SIGTERM signal for graceful shutdown."""
        logger.info("Received SIGTERM, initiating graceful shutdown...")
        self._graceful_shutdown()
        sys.exit(0)

    def _handle_sigint(self, signum, frame):
        """Handle SIGINT signal (Ctrl+C)."""
        logger.info("Received SIGINT, initiating graceful shutdown...")
        self._graceful_shutdown()
        sys.exit(0)

    def _cleanup_on_exit(self):
        """Cleanup function called on normal exit."""
        logger.info("Application shutting down, cleaning up...")
        self._graceful_shutdown()

    def _graceful_shutdown(self):
        """
        Perform graceful shutdown tasks.
        - Close database connections
        - Flush caches
        - Complete pending background jobs
        """
        from django.core.cache import cache
        from django.db import connections

        # Close all database connections
        for conn in connections.all():
            try:
                conn.close()
                logger.debug(f"Closed database connection: {conn.alias}")
            except Exception as e:
                logger.warning(f"Error closing database connection: {e}")

        # Clear/close cache connections
        try:
            cache.close()
            logger.debug("Cache connections closed")
        except Exception as e:
            logger.warning(f"Error closing cache: {e}")

        logger.info("Graceful shutdown complete")
