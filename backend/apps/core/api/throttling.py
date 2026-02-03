"""
Custom throttling classes for core endpoints.
"""

from rest_framework.throttling import AnonRateThrottle


class ContactThrottle(AnonRateThrottle):
    """
    Throttle for contact form submissions.

    Rate configurable via THROTTLE_CONTACT setting (default: 5/hour).
    """

    scope = "contact"
