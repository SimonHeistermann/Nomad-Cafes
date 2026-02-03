from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # Django-RQ dashboard (admin-only, for monitoring background jobs)
    path("admin/rq/", include("django_rq.urls")),

    # API endpoints (using api/ submodules)
    path("api/", include("apps.core.api.urls")),
    path("api/", include("apps.cafes.api.urls")),
    path("api/", include("apps.reviews.api.urls")),
    path("api/", include("apps.users.api.urls")),
    path("api/", include("apps.locations.api.urls")),

    # OpenAPI / Swagger documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
