"""
Signals for Cafe app.

Updates:
- Location.cafe_count when cafes are created/deleted/modified
"""

from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver

from .models import Cafe


@receiver(pre_save, sender=Cafe)
def cafe_pre_save(sender, instance, **kwargs):
    """Track location change before save."""
    if instance.pk:
        try:
            old_instance = Cafe.objects.get(pk=instance.pk)
            instance._old_location_id = old_instance.location_id
            instance._old_is_active = old_instance.is_active
        except Cafe.DoesNotExist:
            instance._old_location_id = None
            instance._old_is_active = None
    else:
        instance._old_location_id = None
        instance._old_is_active = None


@receiver(post_save, sender=Cafe)
def cafe_post_save(sender, instance, created, **kwargs):
    """Update location cafe_count after cafe save."""
    if created:
        # New cafe created
        if instance.is_active:
            update_location_cafe_count(instance.location_id, 1)
    else:
        # Existing cafe updated
        old_location_id = getattr(instance, "_old_location_id", None)
        old_is_active = getattr(instance, "_old_is_active", None)

        # Location changed
        if old_location_id and old_location_id != instance.location_id:
            if old_is_active:
                update_location_cafe_count(old_location_id, -1)
            if instance.is_active:
                update_location_cafe_count(instance.location_id, 1)

        # Active status changed (same location)
        elif old_is_active != instance.is_active:
            delta = 1 if instance.is_active else -1
            update_location_cafe_count(instance.location_id, delta)


@receiver(post_delete, sender=Cafe)
def cafe_post_delete(sender, instance, **kwargs):
    """Update location cafe_count after cafe delete."""
    if instance.is_active:
        update_location_cafe_count(instance.location_id, -1)


def update_location_cafe_count(location_id, delta):
    """
    Update the cafe_count for a location.

    Args:
        location_id: UUID of the location
        delta: Amount to change (positive or negative)
    """
    from apps.locations.models import Location
    from django.db.models import F

    if location_id:
        Location.objects.filter(id=location_id).update(
            cafe_count=F("cafe_count") + delta
        )
