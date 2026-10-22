
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import UserProfile
from customers.models import Customer
from orders.models import Order
from .models import Payment


User = get_user_model()


class PaymentAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # First customer
        self.user1 = User.objects.create_user(
            username="payment_customer_one",
            email="paymentcustomer1@example.com",
            password="TestPassword123!",
        )

        self.profile1 = UserProfile.objects.create(
            user=self.user1,
            username="payment_customer_one",
            email="paymentcustomer1@example.com",
            role="customer",
            is_active=True,
        )

        self.customer1 = Customer.objects.create(
            user=self.profile1,
            full_name="Payment Test Customer One",
            phone="1111111111",
            email="paymentcustomer1@example.com",
        )

        # Second customer
        self.user2 = User.objects.create_user(
            username="payment_customer_two",
            email="paymentcustomer2@example.com",
            password="TestPassword123!",
        )

        self.profile2 = UserProfile.objects.create(
            user=self.user2,
            username="payment_customer_two",
            email="paymentcustomer2@example.com",
            role="customer",
            is_active=True,
        )

        self.customer2 = Customer.objects.create(
            user=self.profile2,
            full_name="Payment Test Customer Two",
            phone="2222222222",
            email="paymentcustomer2@example.com",
        )

        # Order for first customer
        self.order1 = Order.objects.create(
            order_number="PAY-TEST-001",
            customer=self.customer1,
            created_by=self.profile1,
            fabric_source="Customer",
            discount=Decimal("0.00"),
            final_amount=Decimal("500.00"),
            delivery_date=timezone.localdate(),
            status="received",
        )

        # Order for second customer
        self.order2 = Order.objects.create(
            order_number="PAY-TEST-002",
            customer=self.customer2,
            created_by=self.profile2,
            fabric_source="Customer",
            discount=Decimal("0.00"),
            final_amount=Decimal("700.00"),
            delivery_date=timezone.localdate(),
            status="received",
        )

        # Payment for each customer
        self.payment1 = Payment.objects.create(
            order=self.order1,
            amount=Decimal("500.00"),
            payment_method="upi",
            payment_date=timezone.now(),
            recorded_by=self.profile1,
            notes="Payment API test record",
        )

        self.payment2 = Payment.objects.create(
            order=self.order2,
            amount=Decimal("700.00"),
            payment_method="cash",
            payment_date=timezone.now(),
            recorded_by=self.profile2,
            notes="Payment API test record",
        )

    def test_customer_can_only_see_own_payments(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(reverse("payment-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertEqual(returned_ids, {self.payment1.id})

    def test_customer_cannot_create_payment(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            reverse("payment-list"),
            {
                "order": self.order1.id,
                "amount": "100.00",
                "payment_method": "upi",
                "payment_date": timezone.now().isoformat(),
                "recorded_by": self.profile1.id,
                "notes": "Unauthorized test payment",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_user_cannot_access_payments(self):
        response = self.client.get(reverse("payment-list"))

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_staff_can_see_all_payments(self):
        staff_user = User.objects.create_user(
            username="payment_test_staff",
            email="paymentstaff@example.com",
            password="TestPassword123!",
        )

        UserProfile.objects.create(
            user=staff_user,
            username="payment_test_staff",
            email="paymentstaff@example.com",
            role="staff",
            is_active=True,
        )

        self.client.force_authenticate(user=staff_user)

        response = self.client.get(reverse("payment-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertEqual(
            returned_ids,
            {self.payment1.id, self.payment2.id},
        )
