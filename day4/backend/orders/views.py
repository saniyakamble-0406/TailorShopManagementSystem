from rest_framework import viewsets

from accounts.permissions import (
    get_user_role,
    IsAdminStaffOrReadOnly,
)

from .models import (
    Service,
    Order,
    OrderItem,
    OrderStatusHistory,
)

from .serializers import (
    ServiceSerializer,
    OrderSerializer,
    OrderItemSerializer,
    OrderStatusHistorySerializer,
)


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminStaffOrReadOnly]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role in ("admin", "staff"):
            return Service.objects.all()

        return Service.objects.filter(is_active=True)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminStaffOrReadOnly]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role in ("admin", "staff"):
            return Order.objects.all()

        if role == "customer":
            return Order.objects.filter(
                customer__user__user=self.request.user
            )

        return Order.objects.none()


class OrderItemViewSet(viewsets.ModelViewSet):
    serializer_class = OrderItemSerializer
    permission_classes = [IsAdminStaffOrReadOnly]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role in ("admin", "staff"):
            return OrderItem.objects.all()

        if role == "customer":
            return OrderItem.objects.filter(
                order__customer__user__user=self.request.user
            )

        return OrderItem.objects.none()


class OrderStatusHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = OrderStatusHistorySerializer
    permission_classes = [IsAdminStaffOrReadOnly]

    def get_queryset(self):
        role = get_user_role(self.request.user)

        if role in ("admin", "staff"):
            return OrderStatusHistory.objects.all()

        if role == "customer":
            return OrderStatusHistory.objects.filter(
                order__customer__user__user=self.request.user
            )

        return OrderStatusHistory.objects.none()