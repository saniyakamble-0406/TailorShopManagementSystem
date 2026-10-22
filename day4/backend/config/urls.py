from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.views import (
    RoleBasedLoginView,
    UserProfileViewSet,
    StaffViewSet,
    NotificationViewSet,
)

from customers.views import (
    CustomerViewSet,
    MeasurementViewSet,
    MeasurementHistoryViewSet,
)

from orders.views import (
    ServiceViewSet,
    OrderViewSet,
    OrderItemViewSet,
    OrderStatusHistoryViewSet,
)

from payments.views import PaymentViewSet


# ==========================================
# API ROUTER
# ==========================================

router = DefaultRouter()

router.register(
    "users",
    UserProfileViewSet,
    basename="userprofile",
)

router.register(
    "staff",
    StaffViewSet,
    basename="staff",
)

router.register(
    "notifications",
    NotificationViewSet,
    basename="notification",
)

router.register(
    "customers",
    CustomerViewSet,
    basename="customer",
)

router.register(
    "measurements",
    MeasurementViewSet,
    basename="measurement",
)

router.register(
    "measurement-history",
    MeasurementHistoryViewSet,
    basename="measurementhistory",
)

router.register(
    "services",
    ServiceViewSet,
    basename="service",
)

router.register(
    "orders",
    OrderViewSet,
    basename="order",
)

router.register(
    "order-items",
    OrderItemViewSet,
    basename="orderitem",
)

router.register(
    "order-status-history",
    OrderStatusHistoryViewSet,
    basename="orderstatushistory",
)

router.register(
    "payments",
    PaymentViewSet,
    basename="payment",
)


# ==========================================
# URL PATTERNS
# ==========================================

urlpatterns = [
    path("admin/", admin.site.urls),

    # Login API
    path(
        "api/login/",
        RoleBasedLoginView.as_view(),
        name="api-login",
    ),

    # All registered REST API endpoints
    path("api/", include(router.urls)),
]