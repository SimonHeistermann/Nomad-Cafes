"""
Migration to rename Bookmark model to Favorite.

This renames:
- Model: Bookmark → Favorite
- Table: bookmarks → favorites
- Related names on User and Cafe models
"""

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("cafes", "0003_rename_tags_to_features"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Rename the model
        migrations.RenameModel(
            old_name="Bookmark",
            new_name="Favorite",
        ),
        # Rename the database table
        migrations.AlterModelTable(
            name="favorite",
            table="favorites",
        ),
        # Update the related_name on user field
        migrations.AlterField(
            model_name="favorite",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="favorites",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Update the related_name on cafe field
        migrations.AlterField(
            model_name="favorite",
            name="cafe",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="favorites",
                to="cafes.cafe",
            ),
        ),
    ]
