"""
Factory classes for User model.
"""

import factory
from factory.django import DjangoModelFactory
from faker import Faker

from .models import User

fake = Faker()


BIO_TEMPLATES = [
    "Digital nomad exploring cafes around the world.",
    "Remote worker and coffee enthusiast.",
    "Freelance developer seeking the best wifi spots.",
    "Traveling the world one cafe at a time.",
    "Student looking for quiet study spaces.",
    "Writer searching for creative inspiration.",
    "Entrepreneur working from anywhere.",
    "Designer with a passion for good coffee.",
    "Software engineer who loves coworking spaces.",
    "Content creator and cafe hopper.",
]


class UserFactory(DjangoModelFactory):
    """Factory for creating User instances."""

    class Meta:
        model = User

    email = factory.LazyAttribute(lambda _: fake.unique.email())
    name = factory.LazyAttribute(lambda _: fake.name())
    is_active = True
    is_email_verified = True
    role = User.Role.USER

    @factory.lazy_attribute
    def bio(self):
        # About 70% of users have a bio
        if fake.random_int(min=1, max=10) <= 7:
            return fake.random_element(elements=BIO_TEMPLATES)
        return ""

    @factory.lazy_attribute
    def avatar_url(self):
        return f"https://api.dicebear.com/7.x/avataaars/svg?seed={fake.uuid4()}"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override create to properly set and save password."""
        obj = super()._create(model_class, *args, **kwargs)
        obj.set_password("TestPass123!")
        obj.save(update_fields=["password"])
        return obj


class AdminUserFactory(UserFactory):
    """Factory for creating admin users."""

    role = User.Role.ADMIN
    is_superuser = True
    is_staff = True


class CafeOwnerFactory(UserFactory):
    """Factory for creating cafe owner users."""

    role = User.Role.OWNER


class UnverifiedUserFactory(UserFactory):
    """Factory for creating unverified users."""

    is_email_verified = False
