"""
URL configuration for reviews app.

User's reviews endpoint:
- GET /api/reviews/me/ - List user's reviews
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import UserReviewViewSet

app_name = "reviews"

router = DefaultRouter()
router.register("reviews", UserReviewViewSet, basename="review")

urlpatterns = [
    path("", include(router.urls)),
]
