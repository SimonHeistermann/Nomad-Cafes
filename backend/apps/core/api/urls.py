"""
URL configuration for core app.
"""

from django.urls import path

from .views import ContactView, HealthCheckView, ReadinessProbeView

app_name = "core"

urlpatterns = [
    path("contact/", ContactView.as_view(), name="contact"),
    path("health/", HealthCheckView.as_view(), name="health"),
    path("ready/", ReadinessProbeView.as_view(), name="ready"),
]
