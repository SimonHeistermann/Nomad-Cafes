"""
Serializers for core functionality.
"""

from rest_framework import serializers


class ContactSerializer(serializers.Serializer):
    """
    Serializer for contact form submissions.
    """

    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    subject = serializers.ChoiceField(
        choices=[
            ("general", "General Inquiry"),
            ("support", "Technical Support"),
            ("feedback", "Feedback"),
            ("partnership", "Partnership"),
            ("cafe_submission", "Submit a Cafe"),
            ("bug_report", "Bug Report"),
        ]
    )
    message = serializers.CharField(min_length=20, max_length=2000)

    def validate_message(self, value):
        """Validate message content."""
        # Basic spam detection
        spam_keywords = ["casino", "viagra", "lottery", "winner"]
        if any(keyword in value.lower() for keyword in spam_keywords):
            raise serializers.ValidationError("Message contains prohibited content.")
        return value


class HealthCheckSerializer(serializers.Serializer):
    """
    Serializer for health check response.
    """

    status = serializers.CharField()
    version = serializers.CharField()
    timestamp = serializers.DateTimeField()
    database = serializers.CharField()
    cache = serializers.CharField()
