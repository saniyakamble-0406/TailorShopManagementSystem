
from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APIClient

from .models import UserProfile, Staff, Notification


User = get_user_model()


class AccountsAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # First customer
        self.customer_user1 = User.objects.create_user(
            username="accounts_customer_one",
            email="accounts_customer1@example.com",
            password="TestPassword123!",
        )

        self.customer_profile1 = UserProfile.objects.create(
            user=self.customer_user1,
            username="accounts_customer_one",
            email="accounts_customer1@example.com",
            role="customer",
            is_active=True,
        )

        # Second customer
        self.customer_user2 = User.objects.create_user(
            username="accounts_customer_two",
            email="accounts_customer2@example.com",
            password="TestPassword123!",
        )

        self.customer_profile2 = UserProfile.objects.create(
            user=self.customer_user2,
            username="accounts_customer_two",
            email="accounts_customer2@example.com",
            role="customer",
            is_active=True,
        )

        # First staff member
        self.staff_user1 = User.objects.create_user(
            username="accounts_staff_one",
            email="accounts_staff1@example.com",
            password="TestPassword123!",
        )

        self.staff_profile1 = UserProfile.objects.create(
            user=self.staff_user1,
            username="accounts_staff_one",
            email="accounts_staff1@example.com",
            role="staff",
            is_active=True,
        )

        self.staff_record1 = Staff.objects.create(
            user=self.staff_profile1,
            full_name="Test Staff One",
            phone="1111111111",
            joined_date=date(2026, 1, 1),
            is_active=True,
        )

        # Second staff member
        self.staff_user2 = User.objects.create_user(
            username="accounts_staff_two",
            email="accounts_staff2@example.com",
            password="TestPassword123!",
        )

        self.staff_profile2 = UserProfile.objects.create(
            user=self.staff_user2,
            username="accounts_staff_two",
            email="accounts_staff2@example.com",
            role="staff",
            is_active=True,
        )

        self.staff_record2 = Staff.objects.create(
            user=self.staff_profile2,
            full_name="Test Staff Two",
            phone="2222222222",
            joined_date=date(2026, 1, 2),
            is_active=True,
        )

        # Notifications for the two customers
        self.notification1 = Notification.objects.create(
            user=self.customer_profile1,
            notification_type="general",
            message="Notification for customer one",
        )

        self.notification2 = Notification.objects.create(
            user=self.customer_profile2,
            notification_type="general",
            message="Notification for customer two",
        )

        # Admin user
        self.admin_user = User.objects.create_superuser(
            username="accounts_test_admin",
            email="accounts_admin@example.com",
            password="TestPassword123!",
        )

    def test_customer_can_only_see_own_profile(self):
        self.client.force_authenticate(
            user=self.customer_user1
        )

        response = self.client.get(
            reverse("userprofile-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertEqual(
            returned_ids,
            {self.customer_profile1.id},
        )

    def test_customer_cannot_create_user_profile(self):
        self.client.force_authenticate(
            user=self.customer_user1
        )

        response = self.client.post(
            reverse("userprofile-list"),
            {
                "username": "unauthorized_profile",
                "email": "unauthorized@example.com",
                "role": "customer",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_staff_can_only_see_own_staff_record(self):
        self.client.force_authenticate(
            user=self.staff_user1
        )

        response = self.client.get(
            reverse("staff-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertEqual(
            returned_ids,
            {self.staff_record1.id},
        )

    def test_customer_can_only_see_own_notifications(self):
        self.client.force_authenticate(
            user=self.customer_user1
        )

        response = self.client.get(
            reverse("notification-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertEqual(
            returned_ids,
            {self.notification1.id},
        )

    def test_customer_cannot_create_notification(self):
        self.client.force_authenticate(
            user=self.customer_user1
        )

        response = self.client.post(
            reverse("notification-list"),
            {
                "user": self.customer_profile1.id,
                "notification_type": "general",
                "message": "Unauthorized test notification",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_user_cannot_access_profiles(self):
        response = self.client.get(
            reverse("userprofile-list")
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_admin_can_see_all_user_profiles(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.get(
            reverse("userprofile-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertEqual(
            returned_ids,
            {
                self.customer_profile1.id,
                self.customer_profile2.id,
                self.staff_profile1.id,
                self.staff_profile2.id,
            },
        )
