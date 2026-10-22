
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import UserProfile
from customers.models import Customer
from .models import Service, Order, OrderItem, OrderStatusHistory


User = get_user_model()


class OrderAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # Test users and their profiles
        self.user1 = User.objects.create_user(
            username="order_customer_one",
            email="ordercustomer1@example.com",
            password="TestPassword123!",
        )

        self.profile1 = UserProfile.objects.create(
            user=self.user1,
            username="order_customer_one",
            email="ordercustomer1@example.com",
            role="customer",
            is_active=True,
        )

        self.user2 = User.objects.create_user(
            username="order_customer_two",
            email="ordercustomer2@example.com",
            password="TestPassword123!",
        )

        self.profile2 = UserProfile.objects.create(
            user=self.user2,
            username="order_customer_two",
            email="ordercustomer2@example.com",
            role="customer",
            is_active=True,
        )

        # Test customers
        self.customer1 = Customer.objects.create(
            user=self.profile1,
            full_name="Order Test Customer One",
            phone="1111111111",
            email="ordercustomer1@example.com",
        )

        self.customer2 = Customer.objects.create(
            user=self.profile2,
            full_name="Order Test Customer Two",
            phone="2222222222",
            email="ordercustomer2@example.com",
        )

        # Test service
        self.service = Service.objects.create(
            service_name="Test Shirt Stitching",
            description="Service for automated tests",
            price=Decimal("500.00"),
            estimated_days=5,
            is_active=True,
        )

        # Each customer has a separate order
        self.order1 = Order.objects.create(
            order_number="TEST-ORD-001",
            customer=self.customer1,
            created_by=self.profile1,
            fabric_source="Customer",
            special_instructions="",
            discount=Decimal("0.00"),
            final_amount=Decimal("500.00"),
            delivery_date=timezone.localdate(),
            status="received",
        )

        self.order2 = Order.objects.create(
            order_number="TEST-ORD-002",
            customer=self.customer2,
            created_by=self.profile2,
            fabric_source="Customer",
            special_instructions="",
            discount=Decimal("0.00"),
            final_amount=Decimal("700.00"),
            delivery_date=timezone.localdate(),
            status="received",
        )

        # Order items
        self.item1 = OrderItem.objects.create(
            order=self.order1,
            service=self.service,
            clothing_type="Shirt",
            quantity=1,
            unit_price=Decimal("500.00"),
            subtotal=Decimal("500.00"),
        )

        self.item2 = OrderItem.objects.create(
            order=self.order2,
            service=self.service,
            clothing_type="Shirt",
            quantity=1,
            unit_price=Decimal("700.00"),
            subtotal=Decimal("700.00"),
        )

        # Status history
        self.history1 = OrderStatusHistory.objects.create(
            order=self.order1,
            status="received",
            changed_by=self.profile1,
            changed_at=timezone.now(),
            notes="Initial test status",
        )

        self.history2 = OrderStatusHistory.objects.create(
            order=self.order2,
            status="received",
            changed_by=self.profile2,
            changed_at=timezone.now(),
            notes="Initial test status",
        )

    def test_customer_can_only_see_own_orders(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(reverse("order-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {item["id"] for item in response.data}
        self.assertEqual(returned_ids, {self.order1.id})

    def test_customer_can_only_see_own_order_items(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(reverse("orderitem-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {item["id"] for item in response.data}
        self.assertEqual(returned_ids, {self.item1.id})

    def test_customer_can_only_see_own_order_history(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(
            reverse("orderstatushistory-list")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {item["id"] for item in response.data}
        self.assertEqual(returned_ids, {self.history1.id})

    def test_customer_cannot_create_order(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            reverse("order-list"),
            {
                "order_number": "UNAUTHORIZED-ORDER",
                "customer": self.customer1.id,
                "created_by": self.profile1.id,
                "fabric_source": "Customer",
                "discount": "0.00",
                "final_amount": "100.00",
                "delivery_date": str(timezone.localdate()),
                "status": "received",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_user_cannot_access_orders(self):
        response = self.client.get(reverse("order-list"))

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )
