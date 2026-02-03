"""
Locations API module.

Contains serializers, views, urls, and filters for location management.
"""

from .serializers import (
    LocationListSerializer,
    LocationDetailSerializer,
    LocationCreateUpdateSerializer,
    TrendingLocationSerializer,
)
from .views import LocationViewSet
from .filters import LocationFilter

__all__ = [
    # Serializers
    "LocationListSerializer",
    "LocationDetailSerializer",
    "LocationCreateUpdateSerializer",
    "TrendingLocationSerializer",
    # Views
    "LocationViewSet",
    # Filters
    "LocationFilter",
]
