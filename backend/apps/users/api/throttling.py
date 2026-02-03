"""
Custom throttling classes for authentication endpoints.
"""

from rest_framework.throttling import SimpleRateThrottle


class AuthRateThrottle(SimpleRateThrottle):
    """
    Strict throttling for authentication endpoints to prevent brute force.

    Rate is configured via THROTTLE_AUTH setting (default: 10/minute).
    """

    scope = "auth"

    def get_cache_key(self, request, view):
        # Use IP address for unauthenticated requests
        ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class TokenRefreshThrottle(SimpleRateThrottle):
    """
    Throttling for token refresh endpoint to prevent abuse.

    This limits how often a client can refresh their token, which helps:
    - Prevent token refresh abuse/DoS
    - Limit the impact of stolen refresh tokens
    - Encourage proper token management on the client side

    Rate configurable via THROTTLE_TOKEN_REFRESH setting (default: 30/minute).
    A higher rate than auth because legitimate apps may refresh frequently.
    """

    scope = "token_refresh"

    def get_cache_key(self, request, view):
        # Use IP address for all requests (refresh doesn't require auth header)
        ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class PasswordResetThrottle(SimpleRateThrottle):
    """
    Very strict throttling for password reset to prevent abuse.

    Rate configurable via THROTTLE_PASSWORD_RESET setting (default: 3/hour).
    """

    scope = "password_reset"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class EmailVerificationThrottle(SimpleRateThrottle):
    """
    Throttling for email verification resend requests.

    Rate configurable via THROTTLE_EMAIL_VERIFICATION setting (default: 5/hour).
    """

    scope = "email_verification"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
