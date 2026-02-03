from pathlib import Path
from datetime import timedelta
import os

import dj_database_url
import sentry_sdk
from dotenv import load_dotenv
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.redis import RedisIntegration

# -----------------------------------------------------------------------------
# Base / Env
# -----------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

def env(name: str, default: str | None = None) -> str | None:
    return os.getenv(name, default)

def env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.lower() in ("1", "true", "yes", "y", "on")

def env_list(name: str, default: str = "") -> list[str]:
    raw = os.getenv(name, default)
    return [x.strip() for x in raw.split(",") if x.strip()]

ENVIRONMENT = env("DJANGO_ENV", "development") 
DEBUG = env_bool("DJANGO_DEBUG", default=(ENVIRONMENT != "production"))

SECRET_KEY = env("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if ENVIRONMENT == "production":
        raise RuntimeError("DJANGO_SECRET_KEY is not set")
    SECRET_KEY = "dev-insecure-key"

# -----------------------------------------------------------------------------
# Hosts
# -----------------------------------------------------------------------------
if DEBUG:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]
else:
    # Must be provided in production
    ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", default="")

# -----------------------------------------------------------------------------
# Security (production defaults)
# -----------------------------------------------------------------------------
SECURE_PROXY_SSL_HEADER = None
USE_X_FORWARDED_HOST = False

if ENVIRONMENT == "production":
    if env_bool("USE_X_FORWARDED_PROTO", default=False):
        SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
        USE_X_FORWARDED_HOST = True

    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", default=True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    SECURE_HSTS_SECONDS = int(env("SECURE_HSTS_SECONDS", "3600"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True)
    SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", default=True)
else:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# -----------------------------------------------------------------------------
# Application definition
# -----------------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",
    "django_filters",
    "rest_framework_simplejwt.token_blacklist",
    "rest_framework_simplejwt",
    "rest_framework.authtoken",
    "drf_spectacular",
    "django_rq",

    "apps.core.apps.CoreConfig",
    "apps.cafes.apps.CafesConfig",
    "apps.reviews.apps.ReviewsConfig",
    "apps.users.apps.UsersConfig",
    "apps.locations.apps.LocationsConfig",
]

MIDDLEWARE = [
    "apps.core.middleware.RequestLoggingMiddleware",
    "apps.core.middleware.ErrorHandlerMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.middleware.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
DATABASE_URL = env("DATABASE_URL")
if not DATABASE_URL and ENVIRONMENT == "production":
    raise RuntimeError("DATABASE_URL is not set in production")

DATABASES = {
    "default": dj_database_url.config(
        default=DATABASE_URL or f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
    )
}

# -----------------------------------------------------------------------------
# Cache (Redis with fallback to local memory)
# -----------------------------------------------------------------------------
REDIS_URL = env("REDIS_URL")

if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
            "KEY_PREFIX": env("CACHE_KEY_PREFIX", "nomadcafe"),
        }
    }
else:
    # Local memory cache for development without Redis
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "unique-snowflake",
        }
    }

# -----------------------------------------------------------------------------
# Custom User Model
# -----------------------------------------------------------------------------
AUTH_USER_MODEL = "users.User"

# -----------------------------------------------------------------------------
# Password validation
# -----------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -----------------------------------------------------------------------------
# Internationalization
# -----------------------------------------------------------------------------
LANGUAGE_CODE = env("LANGUAGE_CODE", "en-us")
TIME_ZONE = env("TIME_ZONE", "Europe/Berlin")
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -----------------------------------------------------------------------------
# Static files
# -----------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Whitenoise storage (prod-friendly)
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    }
}

# -----------------------------------------------------------------------------
# CORS / CSRF (Vite dev + production domains)
# -----------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", default="http://localhost:5173")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", default="http://localhost:5173")


# Must be True for cookie-based auth
CORS_ALLOW_CREDENTIALS = True

# -----------------------------------------------------------------------------
# Django REST Framework + SimpleJWT
# -----------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.users.authentication.JWTCookieAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": int(env("API_PAGE_SIZE", "20")),
    "EXCEPTION_HANDLER": "apps.users.exceptions.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # Filtering
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    # Throttling
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": env("THROTTLE_ANON", "100/hour"),
        "user": env("THROTTLE_USER", "1000/hour"),
        "auth": env("THROTTLE_AUTH", "10/minute"),  # For login/register
        "token_refresh": env("THROTTLE_TOKEN_REFRESH", "30/minute"),  # Token refresh abuse prevention
        "password_reset": env("THROTTLE_PASSWORD_RESET", "3/hour"),  # Password reset abuse prevention
        "email_verification": env("THROTTLE_EMAIL_VERIFICATION", "5/hour"),  # Email verification resend
        "contact": env("THROTTLE_CONTACT", "5/hour"),  # Contact form spam protection
        "review_create": env("THROTTLE_REVIEW_CREATE", "10/hour"),  # Review spam protection
        "favorite_create": env("THROTTLE_FAVORITE_CREATE", "50/hour"),  # Favorite spam protection
    },
}

# -----------------------------------------------------------------------------
# OpenAPI / Swagger (drf-spectacular)
# -----------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "Nomad Cafes API",
    "DESCRIPTION": "API for discovering cafes optimized for remote work and digital nomads.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "CONTACT": {"email": "api@nomadcafe.dev"},
    "LICENSE": {"name": "MIT"},
    "TAGS": [
        {"name": "Auth", "description": "Authentication endpoints"},
        {"name": "Users", "description": "User profile management"},
        {"name": "Locations", "description": "Location management"},
        {"name": "Cafes", "description": "Cafe discovery and management"},
        {"name": "Reviews", "description": "Cafe reviews"},
        {"name": "Favorites", "description": "User favorites"},
        {"name": "Core", "description": "Health check, contact, stats"},
    ],
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": "/api/",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(env("JWT_ACCESS_MINUTES", "30"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(env("JWT_REFRESH_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": env_bool("JWT_ROTATE_REFRESH", default=True),
    "BLACKLIST_AFTER_ROTATION": env_bool("JWT_BLACKLIST", default=True),
    "AUTH_HEADER_TYPES": ("Bearer",),
    # Custom claims
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# -----------------------------------------------------------------------------
# JWT Cookie Settings
# -----------------------------------------------------------------------------
# Security Decision: SameSite Cookie Policy
# -----------------------------------------
# Using "Lax" for same-site requests. This is appropriate because:
# 1. Frontend and API are on the same origin (no cross-site requests needed)
# 2. "Lax" allows cookies on top-level navigation (user clicking links)
# 3. "Lax" blocks cookies on cross-site POST/PUT/DELETE (CSRF protection)
# 4. "Strict" would break OAuth flows if added later
#
# If frontend and API are on different domains, use "None" with Secure=True.
# Never use "None" without HTTPS in production.
JWT_AUTH_COOKIE = "access_token"
JWT_AUTH_REFRESH_COOKIE = "refresh_token"
JWT_AUTH_COOKIE_SECURE = ENVIRONMENT == "production"
JWT_AUTH_COOKIE_HTTP_ONLY = True
JWT_AUTH_COOKIE_SAMESITE = env("JWT_COOKIE_SAMESITE", "Lax")
JWT_AUTH_COOKIE_PATH = "/"
JWT_AUTH_COOKIE_DOMAIN = env("JWT_COOKIE_DOMAIN", None)  # None = current domain

# -----------------------------------------------------------------------------
# Email Settings
# -----------------------------------------------------------------------------
# In production, use Resend backend; in development, use console
EMAIL_BACKEND = env("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", "localhost")
EMAIL_PORT = int(env("EMAIL_PORT", "587"))
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "noreply@nomadcafe.dev")
CONTACT_EMAIL = env("CONTACT_EMAIL", "hello@nomadcafe.dev")

# Resend API for production emails
RESEND_API_KEY = env("RESEND_API_KEY", "")

# -----------------------------------------------------------------------------
# Django-RQ (Background Jobs)
# -----------------------------------------------------------------------------
# Redis connection for RQ - uses same Redis as cache if available
RQ_QUEUES = {
    "default": {
        "URL": REDIS_URL or "redis://localhost:6379/0",
        "DEFAULT_TIMEOUT": 360,
    },
    "email": {
        "URL": REDIS_URL or "redis://localhost:6379/0",
        "DEFAULT_TIMEOUT": 120,
    },
}

# RQ job result TTL (in seconds) - how long to keep job results
RQ_RESULT_TTL = 86400  # 24 hours

# -----------------------------------------------------------------------------
# App Settings
# -----------------------------------------------------------------------------
APP_VERSION = env("APP_VERSION", "1.0.0")

# Frontend URL for email links
FRONTEND_URL = env("FRONTEND_URL", "http://localhost:5173")

# -----------------------------------------------------------------------------
# Logging (useful in dev + production)
# -----------------------------------------------------------------------------
LOG_LEVEL = env("DJANGO_LOG_LEVEL", "INFO")
LOG_FORMAT = env("DJANGO_LOG_FORMAT", "simple")  # "simple" or "json"

# JSON formatter for structured logging (log aggregators like ELK, Datadog)
_JSON_FORMATTER = {
    "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
    "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
    "datefmt": "%Y-%m-%dT%H:%M:%S%z",
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {
            "format": "[{asctime}] {levelname} {name}: {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "json": _JSON_FORMATTER if LOG_FORMAT == "json" else {
            "format": "[{asctime}] {levelname} {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": LOG_FORMAT if LOG_FORMAT in ("simple", "json") else "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING" if LOG_LEVEL == "INFO" else LOG_LEVEL,
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
    },
}

# -----------------------------------------------------------------------------
# Sentry (Error Tracking & Performance Monitoring)
# -----------------------------------------------------------------------------
SENTRY_DSN = env("SENTRY_DSN", "")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=env("SENTRY_ENVIRONMENT", ENVIRONMENT),
        release=APP_VERSION,

        # Performance monitoring - sample 10% of transactions by default
        traces_sample_rate=float(env("SENTRY_TRACES_SAMPLE_RATE", "0.1")),

        # Profile 10% of sampled transactions
        profiles_sample_rate=float(env("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),

        # Integrations
        integrations=[
            DjangoIntegration(
                transaction_style="url",
                middleware_spans=True,
            ),
            LoggingIntegration(
                level=None,  # Capture all log levels as breadcrumbs
                event_level="ERROR",  # Send ERROR and above as events
            ),
            RedisIntegration(),
        ],

        # Privacy - don't send PII
        send_default_pii=False,

        # Filter out health check transactions to reduce noise
        before_send_transaction=lambda event, hint: (
            None if event.get("transaction") in ["/api/health/", "/api/ready/"] else event
        ),
    )