"""
ViewSets and views for Cafe and Favorite models.
"""

from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.api.permissions import IsAdminUser
from apps.cafes.models import Cafe, Favorite
from .serializers import (
    CafeListSerializer,
    CafeDetailSerializer,
    CafeCreateUpdateSerializer,
    CafeMinimalSerializer,
    FavoriteSerializer,
    CafeMetadataSerializer,
    StatsSerializer,
)
from .filters import CafeFilter
from .throttling import FavoriteCreateThrottle


class CafeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Cafe CRUD operations.

    Endpoints:
    - GET /api/cafes/ - List all cafes (with filters)
    - GET /api/cafes/{slug}/ - Get cafe detail
    - POST /api/cafes/ - Create cafe (admin only)
    - PATCH /api/cafes/{slug}/ - Update cafe (admin only)
    - DELETE /api/cafes/{slug}/ - Delete cafe (admin only)
    - GET /api/cafes/popular/ - Get popular cafes
    """

    queryset = Cafe.objects.filter(is_active=True).select_related("location")
    lookup_field = "slug"
    filterset_class = CafeFilter
    search_fields = ["name", "city", "address"]
    ordering_fields = ["name", "rating_avg", "rating_count", "price_level", "created_at"]
    ordering = ["-rating_avg", "-rating_count"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action == "list":
            return CafeListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return CafeCreateUpdateSerializer
        if self.action == "popular":
            return CafeMinimalSerializer
        return CafeDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Handle search parameter
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(city__icontains=search) |
                Q(address__icontains=search)
            )

        return queryset

    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def popular(self, request):
        """
        GET /api/cafes/popular/

        Returns top-rated cafes using weighted scoring.
        Simple approach: order by rating_avg * rating_count to balance quality and popularity.
        """
        try:
            limit = int(request.query_params.get("page_size", 10))
        except (ValueError, TypeError):
            return Response(
                {"message": "Invalid page_size parameter", "code": "invalid_parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Simple scoring: rating_avg weighted by having reviews
        # Order by rating first, then by review count for tiebreakers
        queryset = self.get_queryset().filter(
            rating_count__gte=1
        ).order_by("-rating_avg", "-rating_count")[:limit]

        serializer = CafeListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user favorites.

    Endpoints:
    - GET /api/favorites/ - List user's favorites
    - POST /api/favorites/ - Add favorite (body: {cafe_id: uuid})
    - DELETE /api/favorites/{cafe_id}/ - Remove favorite
    - GET /api/favorites/{cafe_id}/ - Check if favorited
    """

    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "cafe_id"

    def get_throttles(self):
        if self.action == "create":
            return [FavoriteCreateThrottle()]
        return []

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related("cafe")

    def retrieve(self, request, *args, **kwargs):
        """
        Check if a cafe is favorited.
        Returns {"is_favorited": true/false}
        """
        cafe_id = kwargs.get("cafe_id")
        is_favorited = self.get_queryset().filter(cafe_id=cafe_id).exists()
        return Response({"is_favorited": is_favorited})

    def destroy(self, request, *args, **kwargs):
        """Remove favorite by cafe_id."""
        cafe_id = kwargs.get("cafe_id")
        deleted, _ = self.get_queryset().filter(cafe_id=cafe_id).delete()

        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {"message": "Favorite not found"},
            status=status.HTTP_404_NOT_FOUND,
        )


class StatsView(viewsets.ViewSet):
    """
    Stats endpoints for homepage.
    """

    permission_classes = [AllowAny]
    serializer_class = StatsSerializer

    @extend_schema(
        summary="Get platform statistics",
        description="Returns aggregate counts of cafes, locations, users, and reviews.",
        responses={200: StatsSerializer},
        tags=["stats"],
    )
    @method_decorator(cache_page(60 * 30))  # Cache for 30 minutes
    def list(self, request):
        """
        GET /api/stats/

        Returns platform statistics.
        """
        from apps.users.models import User
        from apps.locations.models import Location
        from apps.reviews.models import Review

        stats = {
            "cafes": Cafe.objects.filter(is_active=True).count(),
            "locations": Location.objects.filter(is_active=True).count(),
            "users": User.objects.filter(is_active=True).count(),
            "reviews": Review.objects.filter(is_active=True).count() if hasattr(Review, 'objects') else 0,
        }

        serializer = StatsSerializer(stats)
        return Response(serializer.data)


class CafeMetadataView(APIView):
    """
    GET /api/cafes/metadata/

    Returns allowed categories, features, and other metadata.
    Used by frontend to populate filter dropdowns and validate inputs.
    """

    permission_classes = [AllowAny]

    @method_decorator(cache_page(60 * 60))  # Cache for 1 hour
    def get(self, request):
        serializer = CafeMetadataSerializer({})
        return Response(serializer.data)
