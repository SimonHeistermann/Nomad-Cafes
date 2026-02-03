"""
Filters for Cafe API.
"""

from django_filters import rest_framework as filters

from apps.cafes.models import Cafe


class CafeFilter(filters.FilterSet):
    """
    Filters for Cafe queryset.

    Supports:
    - category: exact match (values from Cafe.Category)
    - price_level: exact or range (price_min, price_max)
    - location: by location slug
    - city: case-insensitive
    - is_featured: boolean
    - feature: filter by feature in features array (values from Cafe.Feature)
    - search: full-text search on name, description
    """

    category = filters.CharFilter(lookup_expr="iexact")
    price_level = filters.NumberFilter()
    price_min = filters.NumberFilter(field_name="price_level", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price_level", lookup_expr="lte")
    location = filters.CharFilter(field_name="location__slug", lookup_expr="iexact")
    city = filters.CharFilter(lookup_expr="icontains")
    is_featured = filters.BooleanFilter()
    # Support both "feature" and "tag" for backward compatibility
    feature = filters.CharFilter(method="filter_by_feature")
    tag = filters.CharFilter(method="filter_by_feature")  # Legacy alias
    rating_min = filters.NumberFilter(field_name="rating_avg", lookup_expr="gte")

    class Meta:
        model = Cafe
        fields = [
            "category",
            "price_level",
            "location",
            "city",
            "is_featured",
        ]

    def filter_by_feature(self, queryset, name, value):
        """Filter cafes that have a specific feature.

        Only accepts values from Cafe.Feature enum.
        Note: Using icontains on JSON field for SQLite compatibility.
        PostgreSQL would use: features__contains=[value]
        """
        # Validate that the feature is allowed
        allowed_features = Cafe.get_allowed_features()
        if value not in allowed_features:
            # Return empty queryset for invalid features
            return queryset.none()

        # SQLite-compatible: search for feature in JSON string representation
        # This works because features are stored as ["feature1", "feature2", ...]
        return queryset.filter(features__icontains=f'"{value}"')
