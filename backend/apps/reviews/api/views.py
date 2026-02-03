"""
ViewSets for Review model.

Provides nested endpoints under cafes:
- GET /api/cafes/{cafe_slug}/reviews/ - List reviews for a cafe
- POST /api/cafes/{cafe_slug}/reviews/ - Create review (auth required)
- GET /api/cafes/{cafe_slug}/reviews/{id}/ - Get review detail
- PATCH /api/cafes/{cafe_slug}/reviews/{id}/ - Update review (owner only)
- DELETE /api/cafes/{cafe_slug}/reviews/{id}/ - Delete review (owner/admin)

And user's reviews:
- GET /api/reviews/me/ - Get current user's reviews
"""

from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.cafes.models import Cafe
from apps.users.api.permissions import IsOwnerOrAdmin
from apps.reviews.models import Review
from .serializers import (
    ReviewListSerializer,
    ReviewDetailSerializer,
    ReviewCreateSerializer,
    ReviewUpdateSerializer,
    UserReviewSerializer,
)
from .throttling import ReviewCreateThrottle


class CafeReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for reviews nested under cafes.

    Endpoints:
    - GET /api/cafes/{cafe_slug}/reviews/ - List reviews
    - POST /api/cafes/{cafe_slug}/reviews/ - Create review
    - GET /api/cafes/{cafe_slug}/reviews/{id}/ - Get review
    - PATCH /api/cafes/{cafe_slug}/reviews/{id}/ - Update review
    - DELETE /api/cafes/{cafe_slug}/reviews/{id}/ - Delete review
    """

    owner_field = "user"  # For IsOwnerOrAdmin permission

    def get_cafe(self):
        """Get the cafe from URL kwargs."""
        cafe_slug = self.kwargs.get("cafe_slug")
        return get_object_or_404(Cafe, slug=cafe_slug, is_active=True)

    def get_queryset(self):
        """Filter reviews by cafe and active status."""
        cafe = self.get_cafe()
        return Review.objects.filter(
            cafe=cafe, is_active=True
        ).select_related("user").order_by("-created_at")

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [AllowAny()]

    def get_throttles(self):
        if self.action == "create":
            return [ReviewCreateThrottle()]
        return []

    def get_serializer_class(self):
        if self.action == "create":
            return ReviewCreateSerializer
        if self.action in ["update", "partial_update"]:
            return ReviewUpdateSerializer
        if self.action == "retrieve":
            return ReviewDetailSerializer
        return ReviewListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action == "create":
            context["cafe"] = self.get_cafe()
        return context

    def create(self, request, *args, **kwargs):
        """Create a new review for the cafe."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        # Return the created review with list serializer
        output_serializer = ReviewListSerializer(review)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """Delete a review (soft delete by setting is_active=False)."""
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])

        # Trigger rating recalculation
        instance.cafe.update_rating_stats()

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserReviewViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    """
    ViewSet for current user's reviews.

    Endpoints:
    - GET /api/reviews/me/ - List user's reviews
    - GET /api/reviews/me/{id}/ - Get specific review
    """

    serializer_class = UserReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(
            user=self.request.user, is_active=True
        ).select_related("cafe").order_by("-created_at")

    @action(detail=False, methods=["get"])
    def me(self, request):
        """Alias for list - GET /api/reviews/me/"""
        return self.list(request)
