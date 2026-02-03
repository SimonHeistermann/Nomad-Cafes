"""
Tests for custom permission classes.
"""

import pytest
from unittest.mock import Mock, MagicMock
from rest_framework.permissions import SAFE_METHODS

from apps.users.api.permissions import (
    IsAdminUser,
    IsOwnerOrAdmin,
    IsOwnerOrReadOnly,
    IsAuthenticatedOrReadOnly,
    IsCafeOwnerOrAdmin,
)


pytestmark = pytest.mark.django_db


class TestIsAdminUser:
    """Tests for IsAdminUser permission."""

    def test_denies_unauthenticated_user(self):
        """Unauthenticated users are denied."""
        permission = IsAdminUser()
        request = Mock()
        request.user = None

        assert permission.has_permission(request, None) is False

    def test_denies_authenticated_non_admin(self, user):
        """Regular authenticated users are denied."""
        permission = IsAdminUser()
        request = Mock()
        request.user = user

        assert permission.has_permission(request, None) is False

    def test_allows_admin_user(self, admin_user):
        """Admin users are allowed."""
        permission = IsAdminUser()
        request = Mock()
        request.user = admin_user

        assert permission.has_permission(request, None) is True


class TestIsOwnerOrAdmin:
    """Tests for IsOwnerOrAdmin permission."""

    def test_denies_unauthenticated_user(self):
        """Unauthenticated users are denied view-level permission."""
        permission = IsOwnerOrAdmin()
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = False

        # Returns None or False (both falsy) for unauthenticated
        assert not permission.has_permission(request, None)

    def test_allows_authenticated_user(self, user):
        """Authenticated users get view-level permission."""
        permission = IsOwnerOrAdmin()
        request = Mock()
        request.user = user

        assert permission.has_permission(request, None) is True

    def test_object_permission_denies_unauthenticated(self):
        """Unauthenticated users denied object-level permission."""
        permission = IsOwnerOrAdmin()
        request = Mock()
        request.user = None
        obj = Mock()

        assert permission.has_object_permission(request, None, obj) is False

    def test_object_permission_allows_admin(self, admin_user):
        """Admins allowed object-level permission regardless of ownership."""
        permission = IsOwnerOrAdmin()
        request = Mock()
        request.user = admin_user
        obj = Mock()
        obj.user = Mock(id="other-user-id")

        assert permission.has_object_permission(request, None, obj) is True

    def test_object_permission_allows_owner(self, user):
        """Object owner is allowed."""
        permission = IsOwnerOrAdmin()
        request = Mock()
        request.user = user
        obj = Mock()
        obj.user = user

        view = Mock()
        view.owner_field = "user"

        assert permission.has_object_permission(request, view, obj) is True

    def test_object_permission_denies_non_owner(self, user, user_factory):
        """Non-owner regular user is denied."""
        other_user = user_factory()
        permission = IsOwnerOrAdmin()
        request = Mock()
        request.user = user
        obj = Mock()
        obj.user = other_user

        view = Mock()
        view.owner_field = "user"

        assert permission.has_object_permission(request, view, obj) is False

    def test_custom_owner_field(self, user):
        """Custom owner field is respected."""
        permission = IsOwnerOrAdmin()
        request = Mock()
        request.user = user
        obj = Mock()
        obj.author = user
        obj.user = Mock(id="other-id")

        view = Mock()
        view.owner_field = "author"

        assert permission.has_object_permission(request, view, obj) is True

    def test_uuid_owner_field(self, user):
        """UUID owner field (not foreign key) works."""
        permission = IsOwnerOrAdmin()
        request = Mock()
        request.user = user
        obj = Mock()
        obj.user = user.id  # UUID instead of User object

        view = Mock()
        view.owner_field = "user"

        assert permission.has_object_permission(request, view, obj) is True


class TestIsOwnerOrReadOnly:
    """Tests for IsOwnerOrReadOnly permission."""

    def test_allows_read_for_unauthenticated(self):
        """Unauthenticated users can read."""
        permission = IsOwnerOrReadOnly()
        request = Mock()
        request.method = "GET"
        request.user = None

        assert permission.has_permission(request, None) is True

    def test_denies_write_for_unauthenticated(self):
        """Unauthenticated users cannot write."""
        permission = IsOwnerOrReadOnly()
        request = Mock()
        request.method = "POST"
        request.user = Mock()
        request.user.is_authenticated = False

        # Returns None or False (both falsy) for unauthenticated
        assert not permission.has_permission(request, None)

    def test_allows_write_for_authenticated(self, user):
        """Authenticated users get view-level write permission."""
        permission = IsOwnerOrReadOnly()
        request = Mock()
        request.method = "POST"
        request.user = user

        assert permission.has_permission(request, None) is True

    def test_object_read_allowed_for_anyone(self, user_factory):
        """Object read allowed for anyone."""
        other_user = user_factory()
        permission = IsOwnerOrReadOnly()
        request = Mock()
        request.method = "GET"
        request.user = other_user
        obj = Mock()

        assert permission.has_object_permission(request, None, obj) is True

    def test_object_write_allowed_for_owner(self, user):
        """Object write allowed for owner."""
        permission = IsOwnerOrReadOnly()
        request = Mock()
        request.method = "PATCH"
        request.user = user
        obj = Mock()
        obj.user = user

        view = Mock()
        view.owner_field = "user"

        assert permission.has_object_permission(request, view, obj) is True

    def test_object_write_denied_for_non_owner(self, user, user_factory):
        """Object write denied for non-owner."""
        other_user = user_factory()
        permission = IsOwnerOrReadOnly()
        request = Mock()
        request.method = "DELETE"
        request.user = other_user
        obj = Mock()
        obj.user = user

        view = Mock()
        view.owner_field = "user"

        assert permission.has_object_permission(request, view, obj) is False


class TestIsAuthenticatedOrReadOnly:
    """Tests for IsAuthenticatedOrReadOnly permission."""

    def test_allows_read_for_unauthenticated(self):
        """Unauthenticated users can read."""
        permission = IsAuthenticatedOrReadOnly()
        request = Mock()
        request.method = "GET"
        request.user = None

        assert permission.has_permission(request, None) is True

    def test_denies_write_for_unauthenticated(self):
        """Unauthenticated users cannot write."""
        permission = IsAuthenticatedOrReadOnly()
        request = Mock()
        request.method = "POST"
        request.user = Mock()
        request.user.is_authenticated = False

        # Returns None or False (both falsy) for unauthenticated
        assert not permission.has_permission(request, None)

    def test_allows_write_for_authenticated(self, user):
        """Authenticated users can write."""
        permission = IsAuthenticatedOrReadOnly()
        request = Mock()
        request.method = "POST"
        request.user = user

        assert permission.has_permission(request, None) is True


class TestIsCafeOwnerOrAdmin:
    """Tests for IsCafeOwnerOrAdmin permission."""

    def test_denies_unauthenticated_user(self):
        """Unauthenticated users are denied."""
        permission = IsCafeOwnerOrAdmin()
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = False

        # Returns None or False (both falsy) for unauthenticated
        assert not permission.has_permission(request, None)

    def test_allows_authenticated_user(self, user):
        """Authenticated users get view-level permission."""
        permission = IsCafeOwnerOrAdmin()
        request = Mock()
        request.user = user

        assert permission.has_permission(request, None) is True

    def test_object_permission_denies_unauthenticated(self):
        """Unauthenticated users denied object-level permission."""
        permission = IsCafeOwnerOrAdmin()
        request = Mock()
        request.user = None
        obj = Mock()

        assert permission.has_object_permission(request, None, obj) is False

    def test_object_permission_allows_admin(self, admin_user):
        """Admins allowed object-level permission."""
        permission = IsCafeOwnerOrAdmin()
        request = Mock()
        request.user = admin_user
        obj = Mock()
        obj.owner = Mock(id="other-id")

        assert permission.has_object_permission(request, None, obj) is True

    def test_object_permission_allows_cafe_owner(self, user):
        """Cafe owner is allowed."""
        permission = IsCafeOwnerOrAdmin()
        request = Mock()
        request.user = user
        obj = Mock()
        obj.owner = user

        assert permission.has_object_permission(request, None, obj) is True

    def test_object_permission_denies_non_owner(self, user, user_factory):
        """Non-owner is denied."""
        other_user = user_factory()
        permission = IsCafeOwnerOrAdmin()
        request = Mock()
        request.user = user
        obj = Mock()
        obj.owner = other_user

        assert permission.has_object_permission(request, None, obj) is False

    def test_object_permission_denies_when_no_owner(self, user):
        """Denied when object has no owner."""
        permission = IsCafeOwnerOrAdmin()
        request = Mock()
        request.user = user
        obj = Mock(spec=[])  # No owner attribute

        assert permission.has_object_permission(request, None, obj) is False
