from rest_framework import status, viewsets
from rest_framework.response import Response

from accounts.permissions import (
    get_user_role,
    IsAdminStaffOrReadOnly,
)

from .models import Customer, Measurement, MeasurementHistory

from .serializers import (
    CustomerSerializer,
    MeasurementSerializer,
    MeasurementHistorySerializer,
)


# ==========================================
# CUSTOMER API
# ==========================================

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminStaffOrReadOnly]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role in ("admin", "staff"):
            return Customer.objects.all()

        if role == "customer":
            return Customer.objects.filter(
                user__user=self.request.user
            )

        return Customer.objects.none()

    def destroy(self, request, *args, **kwargs):
        customer = self.get_object()

        # Protect orders from accidental cascade deletion.
        if customer.orders.exists():
            return Response(
                {
                    "detail": (
                        "This customer cannot be deleted because "
                        "orders are associated with this customer."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        # Protect existing measurement records.
        if (
            customer.measurements.exists()
            or customer.measurement_history.exists()
        ):
            return Response(
                {
                    "detail": (
                        "This customer cannot be deleted because "
                        "measurement records are associated with "
                        "this customer."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        return super().destroy(request, *args, **kwargs)


# ==========================================
# MEASUREMENT API
# ==========================================

class MeasurementViewSet(viewsets.ModelViewSet):
    serializer_class = MeasurementSerializer
    permission_classes = [IsAdminStaffOrReadOnly]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role in ("admin", "staff"):
            return Measurement.objects.all()

        if role == "customer":
            return Measurement.objects.filter(
                customer__user__user=self.request.user
            )

        return Measurement.objects.none()


# ==========================================
# MEASUREMENT HISTORY API
# ==========================================

class MeasurementHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = MeasurementHistorySerializer
    permission_classes = [IsAdminStaffOrReadOnly]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role in ("admin", "staff"):
            return MeasurementHistory.objects.all()

        if role == "customer":
            return MeasurementHistory.objects.filter(
                customer__user__user=self.request.user
            )

        return MeasurementHistory.objects.none()