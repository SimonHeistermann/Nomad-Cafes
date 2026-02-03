from django.apps import AppConfig


class CafesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.cafes"

    def ready(self):
        # Import signals to register them
        import apps.cafes.signals  # noqa: F401
