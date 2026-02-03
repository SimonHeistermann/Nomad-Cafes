"""
Filters for Location API.
"""

from django_filters import rest_framework as filters

from apps.locations.models import Location


class LocationFilter(filters.FilterSet):
    """Filters for Location queryset."""

    country = filters.CharFilter(lookup_expr="iexact")
    is_featured = filters.BooleanFilter()
    has_cafes = filters.BooleanFilter(method="filter_has_cafes")

    class Meta:
        model = Location
        fields = ["country", "is_featured"]

    def filter_has_cafes(self, queryset, name, value):
        if value:
            return queryset.filter(cafe_count__gt=0)
        return queryset
