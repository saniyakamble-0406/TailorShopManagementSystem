from rest_framework import viewsets

from accounts.permissions import (
    get_user_role,
    IsAdminStaffOrReadOnly,
)

from .models import Payment
from .serializers import PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminStaffOrReadOnly]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role in ("admin", "staff"):
            return Payment.objects.all()

        if role == "customer":
            return Payment.objects.filter(
                order__customer__user__user=self.request.user
            )

        return Payment.objects.none()