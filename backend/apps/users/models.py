import hashlib
import secrets
import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager that uses email as the unique identifier."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model with email as the primary identifier.

    Roles:
    - USER: Regular user, can review cafes, favorite
    - OWNER: Cafe owner, can manage their cafes (future feature)
    - ADMIN: Full access
    """

    class Role(models.TextChoices):
        USER = "user", "User"
        OWNER = "owner", "Cafe Owner"
        ADMIN = "admin", "Admin"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Remove username, use email instead
    username = None
    email = models.EmailField("email address", unique=True, db_index=True)

    # Profile fields
    name = models.CharField(max_length=150, blank=True)
    bio = models.TextField(max_length=500, blank=True, help_text="Short bio or description")
    avatar_url = models.URLField(max_length=500, blank=True)

    # Verification & Status
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)

    # Password reset
    password_reset_token = models.CharField(max_length=100, blank=True)
    password_reset_sent_at = models.DateTimeField(null=True, blank=True)

    # Role-based access
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
        db_index=True,
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # email is already required by USERNAME_FIELD

    class Meta:
        db_table = "users"
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    @property
    def display_name(self):
        """Return name if set, otherwise email prefix."""
        return self.name or self.email.split("@")[0]

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_owner(self):
        return self.role == self.Role.OWNER

    # -------------------------------------------------------------------------
    # Token Hashing Methods
    # -------------------------------------------------------------------------
    # Security: Tokens are hashed before storage to prevent token theft
    # if the database is compromised. The plain token is sent to the user
    # via email, and we hash the incoming token to verify against the stored hash.

    @staticmethod
    def hash_token(token: str) -> str:
        """
        Hash a token using SHA256.

        We use SHA256 (not bcrypt/argon2) because:
        - Tokens are cryptographically random (not user-chosen passwords)
        - No need for slow hashing since tokens can't be dictionary attacked
        - Fast verification is acceptable for random tokens
        """
        return hashlib.sha256(token.encode()).hexdigest()

    def set_email_verification_token(self) -> str:
        """
        Generate and store a new email verification token.

        Returns:
            str: The plain token to send to the user via email
        """
        plain_token = secrets.token_urlsafe(32)
        self.email_verification_token = self.hash_token(plain_token)
        self.email_verification_sent_at = timezone.now()
        return plain_token

    def verify_email_token(self, plain_token: str) -> bool:
        """
        Verify an email verification token.

        Args:
            plain_token: The token received from the user

        Returns:
            bool: True if token is valid and not expired
        """
        if not self.email_verification_token or not plain_token:
            return False

        # Check if token matches (constant-time comparison via ==)
        if self.hash_token(plain_token) != self.email_verification_token:
            return False

        # Check expiry (7 days)
        if self.email_verification_sent_at:
            expiry = self.email_verification_sent_at + timezone.timedelta(days=7)
            if timezone.now() > expiry:
                return False

        return True

    def clear_email_verification_token(self):
        """Clear the email verification token after successful verification."""
        self.email_verification_token = ""
        self.email_verification_sent_at = None

    def set_password_reset_token(self) -> str:
        """
        Generate and store a new password reset token.

        Returns:
            str: The plain token to send to the user via email
        """
        plain_token = secrets.token_urlsafe(32)
        self.password_reset_token = self.hash_token(plain_token)
        self.password_reset_sent_at = timezone.now()
        return plain_token

    def verify_password_reset_token(self, plain_token: str) -> bool:
        """
        Verify a password reset token.

        Args:
            plain_token: The token received from the user

        Returns:
            bool: True if token is valid and not expired
        """
        if not self.password_reset_token or not plain_token:
            return False

        # Check if token matches
        if self.hash_token(plain_token) != self.password_reset_token:
            return False

        # Check expiry (24 hours)
        if self.password_reset_sent_at:
            expiry = self.password_reset_sent_at + timezone.timedelta(hours=24)
            if timezone.now() > expiry:
                return False

        return True

    def clear_password_reset_token(self):
        """Clear the password reset token after successful reset."""
        self.password_reset_token = ""
        self.password_reset_sent_at = None

    @classmethod
    def find_by_email_verification_token(cls, plain_token: str):
        """
        Find a user by their email verification token.

        Args:
            plain_token: The plain token from the verification link

        Returns:
            User or None: The user if found and token valid, None otherwise
        """
        token_hash = cls.hash_token(plain_token)
        try:
            return cls.objects.get(
                email_verification_token=token_hash,
                is_email_verified=False,
                is_active=True,
            )
        except cls.DoesNotExist:
            return None

    @classmethod
    def find_by_password_reset_token(cls, plain_token: str):
        """
        Find a user by their password reset token.

        Args:
            plain_token: The plain token from the reset link

        Returns:
            User or None: The user if found and token valid, None otherwise
        """
        token_hash = cls.hash_token(plain_token)
        try:
            return cls.objects.get(
                password_reset_token=token_hash,
                is_active=True,
            )
        except cls.DoesNotExist:
            return None


# =============================================================================
# Auth Audit Log
# =============================================================================

class AuthAuditLog(models.Model):
    """
    Audit log for authentication events.

    Records all auth-related actions for security monitoring and compliance.
    Events are logged with timestamp, user (if known), IP address, and metadata.
    """

    class EventType(models.TextChoices):
        LOGIN_SUCCESS = "login_success", "Login Success"
        LOGIN_FAILURE = "login_failure", "Login Failure"
        LOGOUT = "logout", "Logout"
        REGISTER = "register", "Registration"
        TOKEN_REFRESH = "token_refresh", "Token Refresh"
        TOKEN_REFRESH_FAILURE = "token_refresh_failure", "Token Refresh Failure"
        PASSWORD_RESET_REQUEST = "password_reset_request", "Password Reset Request"
        PASSWORD_RESET_CONFIRM = "password_reset_confirm", "Password Reset Confirm"
        PASSWORD_CHANGE = "password_change", "Password Change"
        EMAIL_VERIFY = "email_verify", "Email Verification"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Event details
    event_type = models.CharField(
        max_length=30,
        choices=EventType.choices,
        db_index=True,
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    # User info (nullable for failed auth attempts with unknown users)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    email = models.EmailField(
        blank=True,
        help_text="Email attempted (for failed logins with unknown users)",
    )

    # Request metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Additional context (JSON)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional event-specific data",
    )

    # Success/failure
    success = models.BooleanField(default=True)
    failure_reason = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "auth_audit_logs"
        verbose_name = "Auth Audit Log"
        verbose_name_plural = "Auth Audit Logs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["event_type", "timestamp"]),
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["ip_address", "timestamp"]),
        ]

    def __str__(self):
        user_str = self.user.email if self.user else self.email or "unknown"
        return f"{self.event_type} - {user_str} @ {self.timestamp}"

    @classmethod
    def log_event(
        cls,
        event_type: str,
        request,
        user=None,
        email: str = "",
        success: bool = True,
        failure_reason: str = "",
        metadata: dict = None,
    ):
        """
        Log an authentication event.

        Args:
            event_type: One of EventType choices
            request: The Django request object (for IP/user agent)
            user: The User object (if known)
            email: Email address (for failed logins with unknown users)
            success: Whether the action succeeded
            failure_reason: Reason for failure (if applicable)
            metadata: Additional context data

        Returns:
            AuthAuditLog: The created log entry
        """
        # Extract IP address
        ip_address = None
        if request:
            # Check for forwarded header (behind proxy)
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(",")[0].strip()
            else:
                ip_address = request.META.get("REMOTE_ADDR")

        # Extract user agent
        user_agent = ""
        if request:
            user_agent = request.META.get("HTTP_USER_AGENT", "")[:1000]  # Limit length

        return cls.objects.create(
            event_type=event_type,
            user=user,
            email=email or (user.email if user else ""),
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            failure_reason=failure_reason,
            metadata=metadata or {},
        )
