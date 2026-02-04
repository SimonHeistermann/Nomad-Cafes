"""
Management command to seed the database with sample data.

Usage:
    python manage.py seed_data              # Seed all data
    python manage.py seed_data --locations  # Seed only locations
    python manage.py seed_data --cafes 50   # Seed 50 cafes
    python manage.py seed_data --clear      # Clear existing data first
"""

import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from faker import Faker

from apps.users.models import User
from apps.users.factories import UserFactory, AdminUserFactory, CafeOwnerFactory
from apps.locations.models import Location
from apps.locations.factories import create_real_locations
from apps.cafes.models import Cafe, Favorite
from apps.cafes.factories import CafeFactory, FeaturedCafeFactory, CoworkingSpaceFactory
from apps.reviews.models import Review
from apps.reviews.factories import ReviewFactory, PositiveReviewFactory, VerifiedReviewFactory

fake = Faker()


class Command(BaseCommand):
    help = "Seed the database with sample data for development"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before seeding",
        )
        parser.add_argument(
            "--locations",
            action="store_true",
            help="Seed only locations",
        )
        parser.add_argument(
            "--users",
            type=int,
            default=0,
            help="Number of users to create",
        )
        parser.add_argument(
            "--cafes",
            type=int,
            default=0,
            help="Number of cafes to create",
        )
        parser.add_argument(
            "--reviews",
            type=int,
            default=0,
            help="Number of reviews to create",
        )
        parser.add_argument(
            "--full",
            action="store_true",
            help="Run full seed with recommended amounts",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.clear_data()

        if options["full"]:
            self.seed_full()
        elif options["locations"]:
            self.seed_locations()
        else:
            # Seed specific amounts
            if options["users"] > 0:
                self.seed_users(options["users"])
            if options["cafes"] > 0:
                self.seed_cafes(options["cafes"])
            if options["reviews"] > 0:
                self.seed_reviews(options["reviews"])

            # If no specific options, show help
            if not any([options["users"], options["cafes"], options["reviews"], options["locations"]]):
                self.stdout.write(self.style.WARNING(
                    "No options specified. Use --full for complete seed or specify counts.\n"
                    "Examples:\n"
                    "  python manage.py seed_data --full\n"
                    "  python manage.py seed_data --cafes 50\n"
                    "  python manage.py seed_data --clear --full"
                ))

    def clear_data(self):
        """Clear all seeded data (preserving superusers)."""
        self.stdout.write("Clearing existing data...")

        with transaction.atomic():
            Review.objects.all().delete()
            Favorite.objects.all().delete()
            Cafe.objects.all().delete()
            Location.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        self.stdout.write(self.style.SUCCESS("Data cleared!"))

    def seed_full(self):
        """Run full seed with all data types."""
        self.stdout.write(self.style.NOTICE("Starting full database seed..."))

        with transaction.atomic():
            # 1. Create admin and demo users
            self.seed_demo_users()

            # 2. Create real locations
            locations = self.seed_locations()

            # 3. Create cafes
            cafes = self.seed_cafes(count=100, locations=locations)

            # 4. Create reviews
            self.seed_reviews(count=300, cafes=cafes)

            # 5. Create favorites
            self.seed_favorites(cafes=cafes)

        self.stdout.write(self.style.SUCCESS("\n✅ Full seed completed!"))
        self.print_stats()

    def seed_demo_users(self):
        """Create demo users for testing."""
        self.stdout.write("Creating demo users...")

        # Create admin user if not exists
        if not User.objects.filter(email="admin@nomadcafe.dev").exists():
            AdminUserFactory(
                email="admin@nomadcafe.dev",
                name="Admin User",
            )
            self.stdout.write(self.style.SUCCESS("  Created admin@nomadcafe.dev"))

        # Create demo user if not exists
        if not User.objects.filter(email="demo@nomadcafe.dev").exists():
            UserFactory(
                email="demo@nomadcafe.dev",
                name="Demo User",
            )
            self.stdout.write(self.style.SUCCESS("  Created demo@nomadcafe.dev"))

        # Create cafe owner
        if not User.objects.filter(email="owner@nomadcafe.dev").exists():
            CafeOwnerFactory(
                email="owner@nomadcafe.dev",
                name="Cafe Owner",
            )
            self.stdout.write(self.style.SUCCESS("  Created owner@nomadcafe.dev"))

        # Create additional random users
        for _ in range(20):
            UserFactory()

        self.stdout.write(self.style.SUCCESS("  Created 20 additional users"))

    def seed_users(self, count):
        """Create random users."""
        self.stdout.write(f"Creating {count} users...")
        for _ in range(count):
            UserFactory()
        self.stdout.write(self.style.SUCCESS(f"  Created {count} users"))

    def seed_locations(self):
        """Create real nomad-friendly locations."""
        self.stdout.write("Creating locations...")

        # Check if locations already exist
        existing = Location.objects.filter(is_active=True).count()
        if existing > 0:
            self.stdout.write(self.style.WARNING(f"  {existing} locations already exist, skipping..."))
            return list(Location.objects.filter(is_active=True))

        locations = create_real_locations()
        self.stdout.write(self.style.SUCCESS(f"  Created {len(locations)} locations"))
        return locations

    def seed_cafes(self, count=100, locations=None):
        """Create cafes across locations."""
        self.stdout.write(f"Creating {count} cafes...")

        if locations is None:
            locations = list(Location.objects.filter(is_active=True))

        if not locations:
            self.stdout.write(self.style.ERROR("  No locations found! Run seed_locations first."))
            return []

        cafes = []
        factories = [CafeFactory, FeaturedCafeFactory, CoworkingSpaceFactory]

        for i in range(count):
            location = random.choice(locations)
            factory = random.choice(factories)

            # Ensure unique slug using Django's slugify for proper sanitization
            base_name = f"{fake.company()} Cafe"
            slug = f"{slugify(base_name)[:45]}-{i}"

            cafe = factory(
                location=location,
                city=location.name.get("en", "Unknown"),
                slug=slug,
            )
            cafes.append(cafe)

            # Update location cafe count
            location.cafe_count = Cafe.objects.filter(location=location, is_active=True).count()
            location.save(update_fields=["cafe_count"])

        self.stdout.write(self.style.SUCCESS(f"  Created {count} cafes"))
        return cafes

    def seed_reviews(self, count=300, cafes=None):
        """Create reviews for cafes."""
        self.stdout.write(f"Creating {count} reviews...")

        if cafes is None:
            cafes = list(Cafe.objects.filter(is_active=True))

        if not cafes:
            self.stdout.write(self.style.ERROR("  No cafes found! Run seed_cafes first."))
            return

        users = list(User.objects.filter(is_active=True))
        if len(users) < 5:
            self.stdout.write("  Creating additional users for reviews...")
            for _ in range(20):
                users.append(UserFactory())

        created = 0
        attempts = 0
        max_attempts = count * 3

        while created < count and attempts < max_attempts:
            attempts += 1
            user = random.choice(users)
            cafe = random.choice(cafes)

            # Check if user already reviewed this cafe
            if Review.objects.filter(user=user, cafe=cafe).exists():
                continue

            # Randomly choose factory
            factory = random.choices(
                [PositiveReviewFactory, ReviewFactory, VerifiedReviewFactory],
                weights=[0.6, 0.3, 0.1]
            )[0]

            factory(user=user, cafe=cafe)
            created += 1

        # Update cafe ratings
        for cafe in cafes:
            cafe.update_rating_stats()

        self.stdout.write(self.style.SUCCESS(f"  Created {created} reviews"))

    def seed_favorites(self, cafes=None):
        """Create favorites for demo user."""
        self.stdout.write("Creating favorites...")

        try:
            demo_user = User.objects.get(email="demo@nomadcafe.dev")
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING("  Demo user not found, skipping favorites"))
            return

        if cafes is None:
            cafes = list(Cafe.objects.filter(is_active=True)[:20])

        # Favorite some random cafes for demo user
        favorited = random.sample(cafes, min(10, len(cafes)))
        for cafe in favorited:
            Favorite.objects.get_or_create(user=demo_user, cafe=cafe)

        self.stdout.write(self.style.SUCCESS(f"  Created {len(favorited)} favorites for demo user"))

    def print_stats(self):
        """Print database statistics."""
        self.stdout.write("\n📊 Database Statistics:")
        self.stdout.write(f"   Users: {User.objects.count()}")
        self.stdout.write(f"   Locations: {Location.objects.filter(is_active=True).count()}")
        self.stdout.write(f"   Cafes: {Cafe.objects.filter(is_active=True).count()}")
        self.stdout.write(f"   Reviews: {Review.objects.filter(is_active=True).count()}")
        self.stdout.write(f"   Favorites: {Favorite.objects.count()}")
        self.stdout.write("\n🔑 Demo Accounts:")
        self.stdout.write("   admin@nomadcafe.dev / TestPass123!")
        self.stdout.write("   demo@nomadcafe.dev / TestPass123!")
        self.stdout.write("   owner@nomadcafe.dev / TestPass123!")
