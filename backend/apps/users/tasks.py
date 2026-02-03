"""
Background tasks for user-related operations.

Uses Django-RQ for async job processing. Tasks are enqueued and processed
by RQ workers running separately from the web server.

Usage:
    from apps.users.tasks import send_verification_email_task
    send_verification_email_task.delay(user_id, plain_token)

Running workers:
    python manage.py rqworker default email
"""

import logging
from datetime import datetime

from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import django_rq

logger = logging.getLogger(__name__)

# Frontend URL for email links
FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:5173")


def _send_email(to: str, subject: str, html_content: str, text_content: str) -> bool:
    """
    Send email using Resend API or Django's email backend.

    Uses Resend in production (when RESEND_API_KEY is set),
    falls back to Django's configured email backend otherwise.
    """
    resend_api_key = getattr(settings, "RESEND_API_KEY", "")

    if resend_api_key:
        # Use Resend API
        try:
            import resend
            resend.api_key = resend_api_key

            params = {
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html_content,
                "text": text_content,
            }

            response = resend.Emails.send(params)
            logger.info(f"Email sent via Resend to {to}, id: {response.get('id', 'unknown')}")
            return True

        except Exception as e:
            logger.error(f"Resend API error sending to {to}: {e}")
            return False
    else:
        # Fall back to Django email backend (console in dev)
        from django.core.mail import send_mail

        try:
            sent = send_mail(
                subject=subject,
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to],
                html_message=html_content,
                fail_silently=False,
            )
            return sent > 0
        except Exception as e:
            logger.error(f"Django email error sending to {to}: {e}")
            return False


def _get_template_context(extra_context: dict = None) -> dict:
    """Build base template context with common variables."""
    context = {
        "year": datetime.now().year,
        "frontend_url": FRONTEND_URL,
    }
    if extra_context:
        context.update(extra_context)
    return context


@django_rq.job("email")
def send_verification_email_task(user_id: str, plain_token: str) -> bool:
    """
    Background task to send email verification.

    Args:
        user_id: UUID of the user
        plain_token: Plain (unhashed) verification token

    Returns:
        bool: True if email sent successfully
    """
    from apps.users.models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for verification email")
        return False

    verification_url = f"{FRONTEND_URL}/verify-email?token={plain_token}"

    context = _get_template_context({
        "display_name": user.display_name,
        "verification_url": verification_url,
    })

    html_content = render_to_string("emails/verification_email.html", context)
    text_content = render_to_string("emails/verification_email.txt", context)

    success = _send_email(
        to=user.email,
        subject="Verify your email - Nomad Cafes",
        html_content=html_content,
        text_content=text_content,
    )

    if success:
        logger.info(f"Verification email sent to {user.email}")
    else:
        logger.error(f"Failed to send verification email to {user.email}")

    return success


@django_rq.job("email")
def send_password_reset_email_task(user_id: str, plain_token: str) -> bool:
    """
    Background task to send password reset email.

    Args:
        user_id: UUID of the user
        plain_token: Plain (unhashed) reset token

    Returns:
        bool: True if email sent successfully
    """
    from apps.users.models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for password reset email")
        return False

    reset_url = f"{FRONTEND_URL}/reset-password?token={plain_token}"

    context = _get_template_context({
        "display_name": user.display_name,
        "reset_url": reset_url,
    })

    html_content = render_to_string("emails/password_reset_email.html", context)
    text_content = render_to_string("emails/password_reset_email.txt", context)

    success = _send_email(
        to=user.email,
        subject="Reset your password - Nomad Cafes",
        html_content=html_content,
        text_content=text_content,
    )

    if success:
        logger.info(f"Password reset email sent to {user.email}")
    else:
        logger.error(f"Failed to send password reset email to {user.email}")

    return success


@django_rq.job("email")
def send_welcome_email_task(user_id: str) -> bool:
    """
    Background task to send welcome email after verification.

    Args:
        user_id: UUID of the user

    Returns:
        bool: True if email sent successfully
    """
    from apps.users.models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for welcome email")
        return False

    explore_url = f"{FRONTEND_URL}/explore"

    context = _get_template_context({
        "display_name": user.display_name,
        "explore_url": explore_url,
    })

    html_content = render_to_string("emails/welcome_email.html", context)
    text_content = render_to_string("emails/welcome_email.txt", context)

    success = _send_email(
        to=user.email,
        subject="Welcome to Nomad Cafes!",
        html_content=html_content,
        text_content=text_content,
    )

    if success:
        logger.info(f"Welcome email sent to {user.email}")
    else:
        logger.error(f"Failed to send welcome email to {user.email}")

    return success
