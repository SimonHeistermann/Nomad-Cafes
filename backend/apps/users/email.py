"""
Email service for user-related emails.

Provides functions to send verification emails, password reset emails,
and other user-related notifications.

Emails are sent asynchronously via Django-RQ background jobs.
In development without Redis, emails fall back to synchronous sending.

In development:
  - Without Redis: emails sent synchronously via console backend
  - With Redis: emails queued and sent via RQ worker

In production:
  - Emails queued via Django-RQ
  - Sent via Resend API (configure RESEND_API_KEY)
  - Run worker: python manage.py rqworker default email
"""

import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def _get_redis_available() -> bool:
    """Check if Redis is available for background jobs."""
    redis_url = getattr(settings, "REDIS_URL", None)
    if not redis_url:
        return False

    try:
        import redis
        r = redis.from_url(redis_url)
        r.ping()
        return True
    except Exception:
        return False


def send_verification_email(user, plain_token: str = None) -> bool:
    """
    Send email verification link to user.

    Args:
        user: User instance
        plain_token: The plain (unhashed) token to include in the email link.
                    Required because the database stores the hashed token.

    Returns:
        bool: True if email queued/sent successfully, False otherwise
    """
    if not plain_token:
        logger.warning(f"No verification token provided for user {user.email}")
        return False

    if _get_redis_available():
        # Queue as background job
        from apps.users.tasks import send_verification_email_task
        try:
            send_verification_email_task.delay(str(user.id), plain_token)
            logger.info(f"Verification email queued for {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to queue verification email for {user.email}: {e}")
            # Fall through to sync sending

    # Fallback: send synchronously
    from apps.users.tasks import send_verification_email_task
    return send_verification_email_task(str(user.id), plain_token)


def send_password_reset_email(user, plain_token: str = None) -> bool:
    """
    Send password reset link to user.

    Args:
        user: User instance
        plain_token: The plain (unhashed) token to include in the email link.
                    Required because the database stores the hashed token.

    Returns:
        bool: True if email queued/sent successfully, False otherwise
    """
    if not plain_token:
        logger.warning(f"No reset token provided for user {user.email}")
        return False

    if _get_redis_available():
        # Queue as background job
        from apps.users.tasks import send_password_reset_email_task
        try:
            send_password_reset_email_task.delay(str(user.id), plain_token)
            logger.info(f"Password reset email queued for {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to queue password reset email for {user.email}: {e}")
            # Fall through to sync sending

    # Fallback: send synchronously
    from apps.users.tasks import send_password_reset_email_task
    return send_password_reset_email_task(str(user.id), plain_token)


def send_welcome_email(user) -> bool:
    """
    Send welcome email after successful registration and verification.

    Args:
        user: User instance

    Returns:
        bool: True if email queued/sent successfully, False otherwise
    """
    if _get_redis_available():
        # Queue as background job
        from apps.users.tasks import send_welcome_email_task
        try:
            send_welcome_email_task.delay(str(user.id))
            logger.info(f"Welcome email queued for {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to queue welcome email for {user.email}: {e}")
            # Fall through to sync sending

    # Fallback: send synchronously
    from apps.users.tasks import send_welcome_email_task
    return send_welcome_email_task(str(user.id))
