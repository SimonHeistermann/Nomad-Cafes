# Generated manually

from django.db import migrations


class Migration(migrations.Migration):
    """Rename tags field to features for clarity."""

    dependencies = [
        ("cafes", "0002_add_logo_url_and_owner_role"),
    ]

    operations = [
        migrations.RenameField(
            model_name="cafe",
            old_name="tags",
            new_name="features",
        ),
    ]
