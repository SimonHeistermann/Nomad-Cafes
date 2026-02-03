"""
Factory classes for Cafe and Favorite models.

Uses the single source of truth for Categories and Features from Cafe model.
"""

import factory
from factory.django import DjangoModelFactory
from faker import Faker
from django.utils.text import slugify

from apps.locations.factories import LocationFactory
from apps.users.factories import UserFactory
from .models import Cafe, Favorite

fake = Faker()

# Category-specific cafe name templates
CAFE_NAME_TEMPLATES = {
    Cafe.Category.CAFE: [
        "The Coffee Lab", "Daily Grind", "Bean Counter", "The Roastery",
        "Morning Brew", "Espresso House", "The Barista", "Coffee Corner",
        "Cafe Luna", "The Java Joint", "Aroma Cafe", "Brew & Bean",
    ],
    Cafe.Category.COWORKING: [
        "Nomad Hub", "Remote Office", "Digital Den", "Work & Coffee",
        "The Cowork Space", "Flex Desk Cafe", "Laptop Lounge", "Hive Office",
        "Productivity Place", "The Work Hub", "Connect Coworking",
    ],
    Cafe.Category.RESTAURANT: [
        "Green Leaf Bistro", "Urban Kitchen", "The Lunch Spot", "Fresh & Co",
        "Garden Table", "The Eatery", "Cafe Restaurant", "The Dining Room",
        "Good Food Kitchen", "Table & Brew", "The Food Lab",
    ],
    Cafe.Category.HOTEL_CAFE: [
        "The Lobby Cafe", "Grand Hotel Coffee", "Atrium Lounge", "The Palm Court",
        "Hotel Espresso", "Lobby Brew", "The Concierge Cafe", "Sunset Lounge",
        "The Hotel Bar & Cafe", "Guest House Coffee", "The Suite Cafe",
    ],
    Cafe.Category.LIBRARY: [
        "Library Cafe", "The Reading Room", "Book & Bean", "Page Turner Cafe",
        "The Study Hall", "Quiet Corner Cafe", "Archive Cafe", "Scholar's Rest",
        "The Library Lounge", "Words & Coffee", "Chapter Cafe",
    ],
    Cafe.Category.OTHER: [
        "Community Hub", "The Local Spot", "Public House Cafe", "The Gathering Place",
        "Crossroads Cafe", "The Meeting Point", "Social Cafe", "Neighborhood Brew",
    ],
}

# Features to use from the Cafe.Feature enum
# Top 6 filterable features (more common in seed data)
TOP_FEATURES = [
    Cafe.Feature.FAST_WIFI,
    Cafe.Feature.POWER_OUTLETS,
    Cafe.Feature.QUIET,
    Cafe.Feature.OUTDOOR_SEATING,
    Cafe.Feature.PET_FRIENDLY,
    Cafe.Feature.OPEN_LATE,
]

# All other features
ADDITIONAL_FEATURES = [
    Cafe.Feature.AIR_CONDITIONING,
    Cafe.Feature.GREAT_COFFEE,
    Cafe.Feature.FOOD_AVAILABLE,
    Cafe.Feature.VEGAN_OPTIONS,
    Cafe.Feature.MEETING_FRIENDLY,
    Cafe.Feature.GOOD_LIGHTING,
    Cafe.Feature.ACCESSIBLE,
    Cafe.Feature.PARKING,
    Cafe.Feature.BIKE_PARKING,
    Cafe.Feature.SMOKE_FREE,
    Cafe.Feature.STANDING_DESKS,
    Cafe.Feature.ACCEPTS_CARDS,
    Cafe.Feature.RESERVATIONS,
    Cafe.Feature.ALCOHOL,
]

# Region-specific phone number prefixes
PHONE_PREFIXES = {
    'Bali': '+62 361-',
    'Bangkok': '+66 2-',
    'Chiang Mai': '+66 53-',
    'Lisbon': '+351 21-',
    'Berlin': '+49 30-',
    'Barcelona': '+34 93-',
    'Amsterdam': '+31 20-',
    'Tokyo': '+81 3-',
    'Seoul': '+82 2-',
    'Mexico City': '+52 55-',
    'Buenos Aires': '+54 11-',
    'Medellín': '+57 4-',
    'Ho Chi Minh City': '+84 28-',
    'Prague': '+420 2-',
    'Cape Town': '+27 21-',
    'London': '+44 20-',
    'Paris': '+33 1-',
    'New York': '+1 212-',
    'San Francisco': '+1 415-',
    'Los Angeles': '+1 310-',
    'Sydney': '+61 2-',
    'Melbourne': '+61 3-',
    'Singapore': '+65 6-',
    'Hong Kong': '+852 2-',
    'Dubai': '+971 4-',
}


def generate_safe_slug(name: str, unique_suffix: str = "") -> str:
    """Generate a slug-safe string, removing commas and special chars."""
    # Remove problematic characters before slugify
    clean_name = name.replace(",", "").replace("'", "").replace('"', "").replace("&", "and")
    base_slug = slugify(clean_name)[:50]
    if unique_suffix:
        return f"{base_slug}-{unique_suffix}"
    return base_slug


class CafeFactory(DjangoModelFactory):
    """Factory for creating Cafe instances with valid categories and features."""

    class Meta:
        model = Cafe
        skip_postgeneration_save = True

    # Generate a random cafe name
    @factory.lazy_attribute
    def name(self):
        # Pick a random name from all cafe templates
        all_names = []
        for names in CAFE_NAME_TEMPLATES.values():
            all_names.extend(names)
        base_name = fake.random_element(elements=all_names)
        # Add a unique suffix to avoid duplicates
        return f"{base_name} {fake.random_int(min=1, max=999)}"

    # Generate slug from name, properly sanitized
    @factory.lazy_attribute
    def slug(self):
        return generate_safe_slug(self.name, str(fake.uuid4())[:8])

    location = factory.SubFactory(LocationFactory)
    address = factory.LazyAttribute(lambda _: fake.street_address())
    city = factory.LazyAttribute(lambda o: o.location.name.get("en", "Unknown"))
    postal_code = factory.LazyAttribute(lambda _: fake.postcode())
    latitude = factory.LazyAttribute(lambda _: float(fake.latitude()))
    longitude = factory.LazyAttribute(lambda _: float(fake.longitude()))

    # Proper category distribution across all categories
    @factory.lazy_attribute
    def category(self):
        return fake.random_element(elements=[
            Cafe.Category.CAFE,
            Cafe.Category.CAFE,
            Cafe.Category.CAFE,        # ~30% cafes
            Cafe.Category.COWORKING,
            Cafe.Category.COWORKING,   # ~20% coworking
            Cafe.Category.RESTAURANT,
            Cafe.Category.RESTAURANT,  # ~20% restaurants
            Cafe.Category.HOTEL_CAFE,  # ~10% hotel cafes
            Cafe.Category.LIBRARY,     # ~10% libraries
            Cafe.Category.OTHER,       # ~10% other
        ])

    # Auto-set based on category via model save()
    category_color = factory.LazyAttribute(
        lambda o: Cafe.CATEGORY_COLORS.get(o.category, "#6B7280")
    )

    price_level = factory.LazyAttribute(lambda _: fake.random_int(min=1, max=4))

    @factory.lazy_attribute
    def phone(self):
        """Generate region-specific phone number based on city."""
        prefix = PHONE_PREFIXES.get(self.city, '+1 555-')
        return f'{prefix}{fake.random_int(min=100, max=999)}-{fake.random_int(min=1000, max=9999)}'

    # Website - only about 60% of cafes have a website
    @factory.lazy_attribute
    def website(self):
        if fake.random_int(min=1, max=10) <= 6:
            domain = fake.domain_name()
            return f"https://www.{domain}"
        return ""

    # Owner role - about 80% of cafes have owner role specified
    @factory.lazy_attribute
    def owner_role(self):
        if fake.random_int(min=1, max=10) <= 8:
            roles = [
                "Owner",
                "Owner & founder",
                "Café manager",
                "Owner & barista",
                "F&B Manager",
                "Co-owner",
                "Head barista",
                "General manager",
                "Owner & café designer",
            ]
            return fake.random_element(roles)
        return ""

    # Logo URL - empty for now (fallback testing), can be filled later
    logo_url = ""

    is_active = True
    is_featured = False
    is_verified = False

    @factory.lazy_attribute
    def description(self):
        return {
            "en": fake.paragraph(nb_sentences=3),
            "de": fake.paragraph(nb_sentences=3),
        }

    @factory.lazy_attribute
    def overview(self):
        return {
            "en": fake.sentence(),
            "de": fake.sentence(),
        }

    @factory.lazy_attribute
    def image_url(self):
        return f"https://source.unsplash.com/800x600/?cafe,coffee"

    @factory.lazy_attribute
    def thumbnail_url(self):
        return f"https://source.unsplash.com/400x300/?cafe,coffee"

    @factory.lazy_attribute
    def gallery(self):
        return [
            f"https://source.unsplash.com/800x600/?cafe,interior,{i}"
            for i in range(fake.random_int(min=2, max=5))
        ]

    @factory.lazy_attribute
    def features(self):
        """Generate features using only allowed Feature enum values."""
        # Always include 2-3 top features (more common in real data)
        num_top = fake.random_int(min=2, max=3)
        top = fake.random_elements(
            elements=[f.value for f in TOP_FEATURES],
            length=num_top,
            unique=True
        )
        # Add 1-3 additional features
        num_additional = fake.random_int(min=1, max=3)
        additional = fake.random_elements(
            elements=[f.value for f in ADDITIONAL_FEATURES],
            length=num_additional,
            unique=True
        )
        return list(set(top + additional))

    @factory.lazy_attribute
    def amenities(self):
        """Generate amenities dict based on features."""
        return {
            "wifi": True,
            "wifi_speed": fake.random_element(["25mbps", "50mbps", "100mbps"]),
            "power_outlets": True,
            "air_conditioning": fake.boolean(),
        }

    @factory.lazy_attribute
    def opening_hours(self):
        return {
            "monday": {"open": "08:00", "close": "18:00"},
            "tuesday": {"open": "08:00", "close": "18:00"},
            "wednesday": {"open": "08:00", "close": "18:00"},
            "thursday": {"open": "08:00", "close": "18:00"},
            "friday": {"open": "08:00", "close": "20:00"},
            "saturday": {"open": "09:00", "close": "17:00"},
            "sunday": {"open": "10:00", "close": "16:00"},
        }

    @factory.lazy_attribute
    def social_links(self):
        """Generate social links - not all cafes have all platforms."""
        links = {}
        # Instagram - about 70% have it
        if fake.random_int(min=1, max=10) <= 7:
            links["instagram"] = f"https://instagram.com/{fake.user_name()}"
        # Facebook - about 40% have it
        if fake.random_int(min=1, max=10) <= 4:
            links["facebook"] = f"https://facebook.com/{fake.user_name()}"
        # Twitter - about 20% have it
        if fake.random_int(min=1, max=10) <= 2:
            links["twitter"] = f"https://twitter.com/{fake.user_name()}"
        return links


class FeaturedCafeFactory(CafeFactory):
    """Factory for creating featured cafes with ratings and owners."""

    is_featured = True
    is_verified = True
    rating_avg = factory.LazyAttribute(lambda _: round(fake.pyfloat(min_value=3.5, max_value=5.0), 2))
    rating_count = factory.LazyAttribute(lambda _: fake.random_int(min=10, max=200))
    rating_wifi = factory.LazyAttribute(lambda _: round(fake.pyfloat(min_value=3.0, max_value=5.0), 2))
    rating_power = factory.LazyAttribute(lambda _: round(fake.pyfloat(min_value=3.0, max_value=5.0), 2))
    rating_noise = factory.LazyAttribute(lambda _: round(fake.pyfloat(min_value=3.0, max_value=5.0), 2))
    rating_coffee = factory.LazyAttribute(lambda _: round(fake.pyfloat(min_value=3.0, max_value=5.0), 2))
    # Featured cafes have verified owners
    owner = factory.SubFactory(UserFactory)

    # Featured cafes always have owner role
    @factory.lazy_attribute
    def owner_role(self):
        roles = [
            "Owner",
            "Owner & founder",
            "Owner & barista",
            "Co-owner",
            "Owner & café designer",
        ]
        return fake.random_element(roles)

    # Featured cafes always have website
    @factory.lazy_attribute
    def website(self):
        domain = fake.domain_name()
        return f"https://www.{domain}"


class CoworkingSpaceFactory(CafeFactory):
    """Factory for creating coworking-specific spaces."""

    category = Cafe.Category.COWORKING

    @factory.lazy_attribute
    def features(self):
        """Coworking spaces always have certain features."""
        base_features = [
            Cafe.Feature.FAST_WIFI.value,
            Cafe.Feature.POWER_OUTLETS.value,
            Cafe.Feature.MEETING_FRIENDLY.value,
        ]
        extra = fake.random_elements(
            elements=[f.value for f in ADDITIONAL_FEATURES],
            length=2,
            unique=True
        )
        return list(set(base_features + extra))


class HotelCafeFactory(CafeFactory):
    """Factory for creating hotel cafe spaces."""

    category = Cafe.Category.HOTEL_CAFE

    @factory.lazy_attribute
    def features(self):
        """Hotel cafes typically have certain features."""
        base_features = [
            Cafe.Feature.FAST_WIFI.value,
            Cafe.Feature.AIR_CONDITIONING.value,
            Cafe.Feature.QUIET.value,
        ]
        extra = fake.random_elements(
            elements=[f.value for f in TOP_FEATURES],
            length=2,
            unique=True
        )
        return list(set(base_features + extra))


class LibraryCafeFactory(CafeFactory):
    """Factory for creating library cafe spaces."""

    category = Cafe.Category.LIBRARY

    @factory.lazy_attribute
    def features(self):
        """Library cafes are always quiet with wifi."""
        base_features = [
            Cafe.Feature.FAST_WIFI.value,
            Cafe.Feature.QUIET.value,
            Cafe.Feature.GOOD_LIGHTING.value,
        ]
        extra = fake.random_elements(
            elements=[Cafe.Feature.POWER_OUTLETS.value, Cafe.Feature.ACCESSIBLE.value],
            length=1,
            unique=True
        )
        return list(set(base_features + extra))


class RestaurantCafeFactory(CafeFactory):
    """Factory for creating restaurant spaces."""

    category = Cafe.Category.RESTAURANT

    @factory.lazy_attribute
    def features(self):
        """Restaurants typically have food-related features."""
        base_features = [
            Cafe.Feature.FOOD_AVAILABLE.value,
            Cafe.Feature.ACCEPTS_CARDS.value,
        ]
        extra = fake.random_elements(
            elements=[f.value for f in TOP_FEATURES],
            length=3,
            unique=True
        )
        return list(set(base_features + extra))


class FavoriteFactory(DjangoModelFactory):
    """Factory for creating Favorite instances."""

    class Meta:
        model = Favorite

    user = factory.SubFactory(UserFactory)
    cafe = factory.SubFactory(CafeFactory)
