from django.db import models
from accounts.models import UserProfile
from orders.models import Order


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('bank_transfer', 'Bank Transfer'),
    ]

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES
    )
    payment_date = models.DateTimeField()
    recorded_by = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='recorded_payments'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.amount}"