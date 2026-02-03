"""
ViewSets and views for Location model.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from apps.locations.models import Location
from .serializers import (
    LocationListSerializer,
    LocationDetailSerializer,
    LocationCreateUpdateSerializer,
    TrendingLocationSerializer,
)
from .filters import LocationFilter


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Location CRUD operations.

    Endpoints:
    - GET /api/locations/ - List all locations
    - GET /api/locations/{slug}/ - Get location detail
    - POST /api/locations/ - Create location (admin only)
    - PATCH /api/locations/{slug}/ - Update location (admin only)
    - DELETE /api/locations/{slug}/ - Delete location (admin only)
    - GET /api/locations/trending/ - Get trending locations
    """

    queryset = Location.objects.filter(is_active=True)
    lookup_field = "slug"
    filterset_class = LocationFilter
    search_fields = ["name", "country", "region"]
    ordering_fields = ["name", "cafe_count", "created_at"]
    ordering = ["-cafe_count"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action == "list":
            return LocationListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return LocationCreateUpdateSerializer
        if self.action == "trending":
            return TrendingLocationSerializer
        return LocationDetailSerializer

    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def trending(self, request):
        """
        GET /api/locations/trending/

        Returns top locations by cafe count.
        """
        try:
            limit = int(request.query_params.get("limit", 6))
        except (ValueError, TypeError):
            return Response(
                {"message": "Invalid limit parameter", "code": "invalid_parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(
            cafe_count__gt=0, is_featured=True
        ).order_by("-cafe_count")[:limit]

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
