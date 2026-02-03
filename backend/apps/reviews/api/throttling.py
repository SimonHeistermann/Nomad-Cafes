"""
Custom throttling for review endpoints.
"""

from django.conf import settings
from rest_framework.throttling import UserRateThrottle


class ReviewCreateThrottle(UserRateThrottle):
    """
    Throttle for creating reviews.

    Prevents spam by limiting review creation.
    Rate configurable via THROTTLE_REVIEW_CREATE setting (default: 10/hour).
    """

    scope = "review_create"

    def get_rate(self):
        return getattr(settings, "THROTTLE_REVIEW_CREATE", "10/hour")
