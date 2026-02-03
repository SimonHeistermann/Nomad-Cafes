"""
Custom permissions for the API.

Permission Classes:
- IsAdminUser: Only admin users
- IsOwnerOrAdmin: Object owner or admin
- IsOwnerOrReadOnly: Owner can modify, others read-only
- IsAuthenticatedOrReadOnly: Authenticated can modify, others read-only
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """
    Permission that only allows admin users.
    Checks both role='admin' and is_superuser.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_admin


class IsOwnerOrAdmin(BasePermission):
    """
    Permission that allows object owners and admins.

    For object-level permissions, the object must have a 'user' field
    or the view must define 'owner_field' attribute.

    Usage:
        class MyView(APIView):
            permission_classes = [IsOwnerOrAdmin]
            owner_field = 'author'  # optional, defaults to 'user'
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins always have access
        if request.user.is_admin:
            return True

        # Get owner field name (default to 'user')
        owner_field = getattr(view, "owner_field", "user")

        # Get owner from object
        owner = getattr(obj, owner_field, None)

        # Handle foreign key (User object) or UUID field
        if hasattr(owner, "id"):
            return owner.id == request.user.id
        return owner == request.user.id


class IsOwnerOrReadOnly(BasePermission):
    """
    Permission that allows:
    - Read access to everyone
    - Write access only to object owner

    Object must have a 'user' field or view must define 'owner_field'.
    """

    def has_permission(self, request, view):
        # Allow read for everyone
        if request.method in SAFE_METHODS:
            return True
        # Write requires authentication
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions for any request
        if request.method in SAFE_METHODS:
            return True

        # Write permissions only for owner
        owner_field = getattr(view, "owner_field", "user")
        owner = getattr(obj, owner_field, None)

        if hasattr(owner, "id"):
            return owner.id == request.user.id
        return owner == request.user.id


class IsAuthenticatedOrReadOnly(BasePermission):
    """
    Permission that allows:
    - Read access to everyone (including anonymous)
    - Write access only to authenticated users
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated


class IsCafeOwnerOrAdmin(BasePermission):
    """
    Permission for cafe-related operations.

    Allows:
    - Admins: full access
    - Cafe owners: access to their own cafes

    The object must have an 'owner' field pointing to a User.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins always have access
        if request.user.is_admin:
            return True

        # Check if user is cafe owner
        owner = getattr(obj, "owner", None)
        if owner and hasattr(owner, "id"):
            return owner.id == request.user.id

        return False
