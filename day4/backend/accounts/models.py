
from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('customer', 'Customer'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
        null=True,
        blank=True
    )

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username


class Staff(models.Model):
    user = models.OneToOneField(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='staff_profile',
        null=True,
        blank=True
    )

    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    address = models.TextField(blank=True)
    joined_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = [
        ('order_update', 'Order Update'),
        ('payment_update', 'Payment Update'),
        ('delivery_reminder', 'Delivery Reminder'),
        ('general', 'General'),
    ]

    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPE_CHOICES
    )

    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.message
