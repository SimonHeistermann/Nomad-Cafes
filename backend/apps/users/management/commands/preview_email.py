"""
Management command to preview email templates.

Usage:
    python manage.py preview_email verification
    python manage.py preview_email password_reset
    python manage.py preview_email welcome
    python manage.py preview_email --list
    python manage.py preview_email verification --html  # Output HTML only
    python manage.py preview_email verification --text  # Output text only
    python manage.py preview_email verification --open  # Open in browser

This command renders email templates with sample data and displays them,
making it easy to preview emails during development without sending them.
"""

import tempfile
import webbrowser
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.template.loader import render_to_string


# Sample data for email preview
SAMPLE_CONTEXT = {
    "display_name": "Jane Doe",
    "year": datetime.now().year,
    "frontend_url": getattr(settings, "FRONTEND_URL", "http://localhost:5173"),
}

EMAIL_TEMPLATES = {
    "verification": {
        "name": "Email Verification",
        "html_template": "emails/verification_email.html",
        "text_template": "emails/verification_email.txt",
        "subject": "Verify your email - Nomad Cafes",
        "extra_context": {
            "verification_url": "{frontend_url}/verify-email?token=sample_token_abc123",
        },
    },
    "password_reset": {
        "name": "Password Reset",
        "html_template": "emails/password_reset_email.html",
        "text_template": "emails/password_reset_email.txt",
        "subject": "Reset your password - Nomad Cafes",
        "extra_context": {
            "reset_url": "{frontend_url}/reset-password?token=sample_reset_token_xyz789",
        },
    },
    "welcome": {
        "name": "Welcome Email",
        "html_template": "emails/welcome_email.html",
        "text_template": "emails/welcome_email.txt",
        "subject": "Welcome to Nomad Cafes!",
        "extra_context": {
            "explore_url": "{frontend_url}/explore",
        },
    },
}


class Command(BaseCommand):
    help = "Preview email templates with sample data"

    def add_arguments(self, parser):
        parser.add_argument(
            "template",
            nargs="?",
            choices=list(EMAIL_TEMPLATES.keys()),
            help="Email template to preview",
        )
        parser.add_argument(
            "--list",
            action="store_true",
            help="List all available email templates",
        )
        parser.add_argument(
            "--html",
            action="store_true",
            help="Output HTML version only",
        )
        parser.add_argument(
            "--text",
            action="store_true",
            help="Output text version only",
        )
        parser.add_argument(
            "--open",
            action="store_true",
            help="Open HTML version in browser",
        )
        parser.add_argument(
            "--name",
            type=str,
            default="Jane Doe",
            help="Sample recipient name (default: Jane Doe)",
        )

    def handle(self, *args, **options):
        if options["list"]:
            self.list_templates()
            return

        template_key = options["template"]
        if not template_key:
            raise CommandError(
                "Please specify a template name or use --list to see available templates.\n"
                f"Available: {', '.join(EMAIL_TEMPLATES.keys())}"
            )

        template_config = EMAIL_TEMPLATES[template_key]

        # Build context
        context = SAMPLE_CONTEXT.copy()
        context["display_name"] = options["name"]

        # Process extra context (replace {frontend_url} placeholder)
        for key, value in template_config["extra_context"].items():
            if isinstance(value, str):
                context[key] = value.format(frontend_url=context["frontend_url"])
            else:
                context[key] = value

        # Render templates
        html_content = render_to_string(template_config["html_template"], context)
        text_content = render_to_string(template_config["text_template"], context)

        # Output based on options
        show_both = not options["html"] and not options["text"]

        self.stdout.write(self.style.SUCCESS(f"\n{'='*60}"))
        self.stdout.write(self.style.SUCCESS(f"Email Preview: {template_config['name']}"))
        self.stdout.write(self.style.SUCCESS(f"Subject: {template_config['subject']}"))
        self.stdout.write(self.style.SUCCESS(f"{'='*60}\n"))

        if options["open"]:
            # Open HTML in browser
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".html", delete=False
            ) as f:
                f.write(html_content)
                temp_path = f.name

            webbrowser.open(f"file://{temp_path}")
            self.stdout.write(
                self.style.SUCCESS(f"Opened email preview in browser: {temp_path}")
            )
            return

        if options["html"] or show_both:
            self.stdout.write(self.style.MIGRATE_HEADING("HTML Version:"))
            self.stdout.write("-" * 40)
            self.stdout.write(html_content)
            self.stdout.write("")

        if options["text"] or show_both:
            self.stdout.write(self.style.MIGRATE_HEADING("Text Version:"))
            self.stdout.write("-" * 40)
            self.stdout.write(text_content)
            self.stdout.write("")

    def list_templates(self):
        self.stdout.write(self.style.SUCCESS("\nAvailable Email Templates:"))
        self.stdout.write("-" * 40)

        for key, config in EMAIL_TEMPLATES.items():
            self.stdout.write(f"  {self.style.MIGRATE_LABEL(key)}")
            self.stdout.write(f"    Name: {config['name']}")
            self.stdout.write(f"    Subject: {config['subject']}")
            self.stdout.write("")

        self.stdout.write("Usage:")
        self.stdout.write("  python manage.py preview_email <template>")
        self.stdout.write("  python manage.py preview_email verification --open")
        self.stdout.write("  python manage.py preview_email password_reset --html")
        self.stdout.write("")
