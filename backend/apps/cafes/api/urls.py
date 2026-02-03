"""
URL configuration for cafes app.

Includes nested review routes:
- GET/POST /api/cafes/{slug}/reviews/
- GET/PATCH/DELETE /api/cafes/{slug}/reviews/{id}/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.reviews.api.views import CafeReviewViewSet
from .views import CafeViewSet, FavoriteViewSet, StatsView, CafeMetadataView

app_name = "cafes"

router = DefaultRouter()
router.register("cafes", CafeViewSet, basename="cafe")
router.register("favorites", FavoriteViewSet, basename="favorite")
router.register("stats", StatsView, basename="stats")

# Nested review routes under cafes
cafe_review_list = CafeReviewViewSet.as_view({
    "get": "list",
    "post": "create",
})

cafe_review_detail = CafeReviewViewSet.as_view({
    "get": "retrieve",
    "patch": "partial_update",
    "delete": "destroy",
})

urlpatterns = [
    path("", include(router.urls)),
    # Cafe metadata (allowed categories, features, etc.)
    path(
        "cafes/metadata/",
        CafeMetadataView.as_view(),
        name="cafe-metadata",
    ),
    # Nested reviews: /api/cafes/{cafe_slug}/reviews/
    path(
        "cafes/<slug:cafe_slug>/reviews/",
        cafe_review_list,
        name="cafe-review-list",
    ),
    path(
        "cafes/<slug:cafe_slug>/reviews/<uuid:pk>/",
        cafe_review_detail,
        name="cafe-review-detail",
    ),
]
