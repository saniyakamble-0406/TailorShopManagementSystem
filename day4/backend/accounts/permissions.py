from django.core.exceptions import ObjectDoesNotExist
from rest_framework.permissions import BasePermission, SAFE_METHODS


def get_user_role(user):
    """Return the active authenticated user's role."""

    if not user or not user.is_authenticated:
        return None

    if user.is_superuser:
        return "admin"

    try:
        profile = user.profile
    except ObjectDoesNotExist:
        return None

    if not profile.is_active:
        return None

    return profile.role


class IsAdminOrOwnUserProfile(BasePermission):
    """Admins manage profiles; users can only read their own profile."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if get_user_role(request.user) == "admin":
            return True

        return request.method in SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        if get_user_role(request.user) == "admin":
            return True

        return (
            request.method in SAFE_METHODS
            and getattr(obj, "user_id", None) == request.user.id
        )


class IsAdminOrOwnStaffRecord(BasePermission):
    """Admins manage staff records; staff can read their own record."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if get_user_role(request.user) == "admin":
            return True

        return request.method in SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        if get_user_role(request.user) == "admin":
            return True

        profile = getattr(obj, "user", None)

        return (
            request.method in SAFE_METHODS
            and profile is not None
            and profile.user_id == request.user.id
        )


class IsAdminStaffOrReadOnly(BasePermission):
    """Admins and staff can manage records; customers have read-only access."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = get_user_role(request.user)

        if role in ("admin", "staff"):
            return True

        return request.method in SAFE_METHODS