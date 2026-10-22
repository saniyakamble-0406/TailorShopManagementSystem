from django.db import models
from accounts.models import UserProfile


class Customer(models.Model):
    user = models.OneToOneField(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='customer_profile',
        null=True,
        blank=True
    )
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name


class Measurement(models.Model):
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='measurements'
    )
    clothing_type = models.CharField(max_length=100)
    measurement_data = models.JSONField()
    measured_by = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='measurements_taken'
    )
    measured_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.full_name} - {self.clothing_type}"


class MeasurementHistory(models.Model):
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='measurement_history'
    )
    measurement = models.ForeignKey(
        Measurement,
        on_delete=models.CASCADE,
        related_name='history'
    )
    clothing_type = models.CharField(max_length=100)
    measurement_data = models.JSONField()
    recorded_by = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='measurement_history_records'
    )
    recorded_at = models.DateTimeField()

    def __str__(self):
        return f"{self.customer.full_name} - {self.clothing_type} History"