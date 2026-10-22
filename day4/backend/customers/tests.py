from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import UserProfile
from .models import Customer, Measurement, MeasurementHistory


User = get_user_model()


class CustomerAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # First customer and login account
        self.user1 = User.objects.create_user(
            username="customer_one",
            email="customer1@example.com",
            password="TestPassword123!"
        )

        self.profile1 = UserProfile.objects.create(
            user=self.user1,
            username="customer_one",
            email="customer1@example.com",
            role="customer",
            is_active=True
        )

        self.customer1 = Customer.objects.create(
            user=self.profile1,
            full_name="Customer One",
            phone="1111111111",
            email="customer1@example.com"
        )

        # Second customer and login account
        self.user2 = User.objects.create_user(
            username="customer_two",
            email="customer2@example.com",
            password="TestPassword123!"
        )

        self.profile2 = UserProfile.objects.create(
            user=self.user2,
            username="customer_two",
            email="customer2@example.com",
            role="customer",
            is_active=True
        )

        self.customer2 = Customer.objects.create(
            user=self.profile2,
            full_name="Customer Two",
            phone="2222222222",
            email="customer2@example.com"
        )

        # Measurements for both customers
        self.measurement1 = Measurement.objects.create(
            customer=self.customer1,
            clothing_type="Shirt",
            measurement_data={
                "unit": "inches",
                "chest": 38
            },
            measured_by=self.profile1,
            measured_at=timezone.now()
        )

        self.measurement2 = Measurement.objects.create(
            customer=self.customer2,
            clothing_type="Shirt",
            measurement_data={
                "unit": "inches",
                "chest": 40
            },
            measured_by=self.profile2,
            measured_at=timezone.now()
        )

        # Measurement history for both customers
        self.history1 = MeasurementHistory.objects.create(
            customer=self.customer1,
            measurement=self.measurement1,
            clothing_type="Shirt",
            measurement_data={
                "unit": "inches",
                "chest": 38
            },
            recorded_by=self.profile1,
            recorded_at=timezone.now()
        )

        self.history2 = MeasurementHistory.objects.create(
            customer=self.customer2,
            measurement=self.measurement2,
            clothing_type="Shirt",
            measurement_data={
                "unit": "inches",
                "chest": 40
            },
            recorded_by=self.profile2,
            recorded_at=timezone.now()
        )

    def test_customer_can_only_see_own_customer_record(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(reverse("customer-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertEqual(returned_ids, {self.customer1.id})

    def test_customer_can_only_see_own_measurements(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(reverse("measurement-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertEqual(returned_ids, {self.measurement1.id})

    def test_customer_can_only_see_own_measurement_history(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(
            reverse("measurementhistory-list")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertEqual(returned_ids, {self.history1.id})

    def test_customer_cannot_create_customer_record(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            reverse("customer-list"),
            {
                "full_name": "Unauthorized Customer",
                "phone": "3333333333",
                "email": "unauthorized@example.com",
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_unauthenticated_user_cannot_access_customer_api(self):
        response = self.client.get(reverse("customer-list"))

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN
            ]
        )