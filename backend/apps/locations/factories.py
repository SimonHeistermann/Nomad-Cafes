"""
Factory classes for Location model.
"""

import factory
from factory.django import DjangoModelFactory
from faker import Faker

from .models import Location

fake = Faker()

# Curated list of real nomad-friendly cities
NOMAD_CITIES = [
    {"name": {"en": "Berlin", "de": "Berlin"}, "country": "Germany", "country_code": "DE", "region": "Berlin", "timezone": "Europe/Berlin"},
    {"name": {"en": "Lisbon", "pt": "Lisboa"}, "country": "Portugal", "country_code": "PT", "region": "Lisboa", "timezone": "Europe/Lisbon"},
    {"name": {"en": "Barcelona", "es": "Barcelona"}, "country": "Spain", "country_code": "ES", "region": "Catalonia", "timezone": "Europe/Madrid"},
    {"name": {"en": "Amsterdam", "nl": "Amsterdam"}, "country": "Netherlands", "country_code": "NL", "region": "North Holland", "timezone": "Europe/Amsterdam"},
    {"name": {"en": "Prague", "cs": "Praha"}, "country": "Czech Republic", "country_code": "CZ", "region": "Prague", "timezone": "Europe/Prague"},
    {"name": {"en": "Bangkok", "th": "กรุงเทพ"}, "country": "Thailand", "country_code": "TH", "region": "Bangkok", "timezone": "Asia/Bangkok"},
    {"name": {"en": "Bali", "id": "Bali"}, "country": "Indonesia", "country_code": "ID", "region": "Bali", "timezone": "Asia/Makassar"},
    {"name": {"en": "Chiang Mai", "th": "เชียงใหม่"}, "country": "Thailand", "country_code": "TH", "region": "Chiang Mai", "timezone": "Asia/Bangkok"},
    {"name": {"en": "Mexico City", "es": "Ciudad de México"}, "country": "Mexico", "country_code": "MX", "region": "CDMX", "timezone": "America/Mexico_City"},
    {"name": {"en": "Medellín", "es": "Medellín"}, "country": "Colombia", "country_code": "CO", "region": "Antioquia", "timezone": "America/Bogota"},
    {"name": {"en": "Buenos Aires"}, "country": "Argentina", "country_code": "AR", "region": "Buenos Aires", "timezone": "America/Argentina/Buenos_Aires"},
    {"name": {"en": "Tokyo", "ja": "東京"}, "country": "Japan", "country_code": "JP", "region": "Tokyo", "timezone": "Asia/Tokyo"},
    {"name": {"en": "Seoul", "ko": "서울"}, "country": "South Korea", "country_code": "KR", "region": "Seoul", "timezone": "Asia/Seoul"},
    {"name": {"en": "Ho Chi Minh City", "vi": "Thành phố Hồ Chí Minh"}, "country": "Vietnam", "country_code": "VN", "region": "Ho Chi Minh", "timezone": "Asia/Ho_Chi_Minh"},
    {"name": {"en": "Cape Town"}, "country": "South Africa", "country_code": "ZA", "region": "Western Cape", "timezone": "Africa/Johannesburg"},
]


class LocationFactory(DjangoModelFactory):
    """Factory for creating Location instances."""

    class Meta:
        model = Location
        skip_postgeneration_save = True

    name = factory.LazyAttribute(lambda _: {"en": fake.city()})
    slug = factory.LazyAttribute(lambda o: o.name["en"].lower().replace(" ", "-"))
    country = factory.LazyAttribute(lambda _: fake.country())
    country_code = factory.LazyAttribute(lambda _: fake.country_code())
    region = factory.LazyAttribute(lambda _: fake.state())
    timezone = "UTC"
    latitude = factory.LazyAttribute(lambda _: float(fake.latitude()))
    longitude = factory.LazyAttribute(lambda _: float(fake.longitude()))
    is_active = True
    is_featured = False

    @factory.lazy_attribute
    def image_url(self):
        return f"https://source.unsplash.com/800x600/?city,{self.name.get('en', 'city')}"

    @factory.lazy_attribute
    def thumbnail_url(self):
        return f"https://source.unsplash.com/400x300/?city,{self.name.get('en', 'city')}"

    @factory.lazy_attribute
    def hero_image_url(self):
        return f"https://source.unsplash.com/1920x1080/?city,{self.name.get('en', 'city')}"


class FeaturedLocationFactory(LocationFactory):
    """Factory for creating featured locations."""

    is_featured = True
    cafe_count = factory.LazyAttribute(lambda _: fake.random_int(min=5, max=50))


def create_real_locations():
    """Create locations based on real nomad-friendly cities."""
    locations = []
    for city_data in NOMAD_CITIES:
        location = Location.objects.create(
            name=city_data["name"],
            slug=city_data["name"]["en"].lower().replace(" ", "-").replace("í", "i"),
            country=city_data["country"],
            country_code=city_data["country_code"],
            region=city_data.get("region", ""),
            timezone=city_data["timezone"],
            latitude=fake.latitude(),
            longitude=fake.longitude(),
            is_active=True,
            is_featured=True,
            image_url=f"https://source.unsplash.com/800x600/?{city_data['name']['en']},city",
            thumbnail_url=f"https://source.unsplash.com/400x300/?{city_data['name']['en']},city",
            hero_image_url=f"https://source.unsplash.com/1920x1080/?{city_data['name']['en']},skyline",
        )
        locations.append(location)
    return locations
