"""
Factory classes for Review model.
"""

import factory
from factory.django import DjangoModelFactory
from faker import Faker

from apps.users.factories import UserFactory
from apps.cafes.factories import CafeFactory
from .models import Review

fake = Faker()

# Realistic review templates
POSITIVE_REVIEWS = [
    "Great place to work! Fast wifi and plenty of outlets. The coffee is excellent too.",
    "One of my favorite spots in the city. Quiet atmosphere, friendly staff, and good food options.",
    "Perfect for remote work. I spent the whole day here and was very productive.",
    "Amazing coffee and even better vibes. The staff doesn't mind if you stay for hours.",
    "Highly recommend for digital nomads. Good wifi, comfortable seating, and reasonable prices.",
    "This place has everything a remote worker needs. Will definitely come back!",
    "Fantastic workspace. The natural light is perfect and they have standing desks available.",
    "Been coming here for months. Consistent quality and always a good work environment.",
]

MIXED_REVIEWS = [
    "Good wifi but can get crowded during lunch hours. Come early for the best seats.",
    "Nice atmosphere but the coffee is average. Good for working though.",
    "Decent spot for work. Wifi could be faster but outlets are plentiful.",
    "The food is great but it's not the quietest place. Good for creative work.",
]

NEGATIVE_REVIEWS = [
    "Wifi was unreliable and the staff seemed annoyed when I asked about it.",
    "Too noisy for focused work. Maybe better for casual meetings.",
    "Limited outlets and no good spots for laptop work. Nice cafe otherwise.",
]


class ReviewFactory(DjangoModelFactory):
    """Factory for creating Review instances."""

    class Meta:
        model = Review

    user = factory.SubFactory(UserFactory)
    cafe = factory.SubFactory(CafeFactory)
    rating_overall = factory.LazyAttribute(lambda _: fake.random_int(min=3, max=5))
    language = "en"
    is_active = True
    is_verified = False

    @factory.lazy_attribute
    def text(self):
        rating = self.rating_overall
        if rating >= 4:
            return fake.random_element(elements=POSITIVE_REVIEWS)
        elif rating == 3:
            return fake.random_element(elements=MIXED_REVIEWS)
        else:
            return fake.random_element(elements=NEGATIVE_REVIEWS)

    @factory.lazy_attribute
    def rating_wifi(self):
        return fake.random_int(min=2, max=5) if fake.boolean(chance_of_getting_true=70) else None

    @factory.lazy_attribute
    def rating_power(self):
        return fake.random_int(min=2, max=5) if fake.boolean(chance_of_getting_true=70) else None

    @factory.lazy_attribute
    def rating_noise(self):
        return fake.random_int(min=2, max=5) if fake.boolean(chance_of_getting_true=60) else None

    @factory.lazy_attribute
    def rating_coffee(self):
        return fake.random_int(min=2, max=5) if fake.boolean(chance_of_getting_true=80) else None

    @factory.lazy_attribute
    def photos(self):
        if fake.boolean(chance_of_getting_true=30):
            return [
                f"https://source.unsplash.com/400x300/?cafe,review,{i}"
                for i in range(fake.random_int(min=1, max=3))
            ]
        return []


class PositiveReviewFactory(ReviewFactory):
    """Factory for creating positive reviews (4-5 stars)."""

    rating_overall = factory.LazyAttribute(lambda _: fake.random_int(min=4, max=5))
    text = factory.LazyAttribute(lambda _: fake.random_element(elements=POSITIVE_REVIEWS))


class VerifiedReviewFactory(ReviewFactory):
    """Factory for creating verified reviews."""

    is_verified = True
    rating_overall = factory.LazyAttribute(lambda _: fake.random_int(min=4, max=5))
