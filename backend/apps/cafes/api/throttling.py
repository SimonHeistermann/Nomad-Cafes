"""
Custom throttling for cafe-related endpoints.
"""

from django.conf import settings
from rest_framework.throttling import UserRateThrottle


class FavoriteCreateThrottle(UserRateThrottle):
    """
    Throttle for creating favorites.

    Prevents spam by limiting favorite creation.
    Rate configurable via THROTTLE_FAVORITE_CREATE setting (default: 50/hour).
    """

    scope = "favorite_create"

    def get_rate(self):
        return getattr(settings, "THROTTLE_FAVORITE_CREATE", "50/hour")
