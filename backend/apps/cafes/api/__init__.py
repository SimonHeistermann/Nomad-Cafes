"""
Cafes API module.

Contains serializers, views, urls, and filters for cafe management.
"""

from .serializers import (
    CafeListSerializer,
    CafeDetailSerializer,
    CafeCreateUpdateSerializer,
    CafeMinimalSerializer,
    FavoriteSerializer,
    FavoriteCheckSerializer,
    StatsSerializer,
)
from .views import (
    CafeViewSet,
    FavoriteViewSet,
    StatsView,
)
from .filters import CafeFilter

__all__ = [
    # Serializers
    "CafeListSerializer",
    "CafeDetailSerializer",
    "CafeCreateUpdateSerializer",
    "CafeMinimalSerializer",
    "FavoriteSerializer",
    "FavoriteCheckSerializer",
    "StatsSerializer",
    # Views
    "CafeViewSet",
    "FavoriteViewSet",
    "StatsView",
    # Filters
    "CafeFilter",
]
