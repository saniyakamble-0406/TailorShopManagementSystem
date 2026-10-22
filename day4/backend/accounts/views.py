from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response

from .models import UserProfile, Staff, Notification
from .serializers import (
    UserProfileSerializer,
    StaffSerializer,
    NotificationSerializer,
)
from .permissions import (
    get_user_role,
    IsAdminOrOwnUserProfile,
    IsAdminOrOwnStaffRecord,
    IsAdminStaffOrReadOnly,
)


# ==========================================
# ROLE-BASED LOGIN API
# ==========================================

class RoleBasedLoginView(ObtainAuthToken):
    """
    Authenticate a user and return an API token and active role.
    Expects username, password, and optional role.
    """

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        role = get_user_role(user)

        # Reject accounts without an active recognised role.
        if role not in ("admin", "staff", "customer"):
            return Response(
                {
                    "detail": (
                        "No active role is assigned to this account."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # If a role was selected on the login form, verify it.
        requested_role = request.data.get("role")

        if requested_role and requested_role != role:
            return Response(
                {
                    "detail": (
                        "The selected role does not match this account."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get or create the authentication token.
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "token": token.key,
                "username": user.get_username(),
                "role": role,
            },
            status=status.HTTP_200_OK,
        )


# ==========================================
# USER PROFILE API
# ==========================================

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminOrOwnUserProfile]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role == "admin":
            return UserProfile.objects.all()

        if role in ("staff", "customer"):
            return UserProfile.objects.filter(
                user=self.request.user
            )

        return UserProfile.objects.none()


# ==========================================
# STAFF API
# ==========================================

class StaffViewSet(viewsets.ModelViewSet):
    serializer_class = StaffSerializer
    permission_classes = [IsAdminOrOwnStaffRecord]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role == "admin":
            return Staff.objects.all()

        if role == "staff":
            return Staff.objects.filter(
                user__user=self.request.user
            )

        return Staff.objects.none()


# ==========================================
# NOTIFICATION API
# ==========================================

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminStaffOrReadOnly]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role in ("admin", "staff"):
            return Notification.objects.all()

        if role == "customer":
            return Notification.objects.filter(
                user__user=self.request.user
            )

        return Notification.objects.none()