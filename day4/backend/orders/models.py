from django.db import models
from accounts.models import UserProfile
from customers.models import Customer, Measurement


class Service(models.Model):
    service_name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_days = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.service_name


class Order(models.Model):
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('measurement_confirmed', 'Measurement Confirmed'),
        ('cutting', 'Cutting'),
        ('stitching', 'Stitching'),
        ('finishing', 'Finishing'),
        ('ready', 'Ready'),
        ('delivered', 'Delivered'),
        ('alteration', 'Alteration'),
        ('cancelled', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=30, unique=True)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    created_by = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_orders'
    )
    fabric_source = models.CharField(max_length=100, blank=True)
    special_instructions = models.TextField(blank=True)
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    final_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    delivery_date = models.DateField()
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='received'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    measurement = models.ForeignKey(
        Measurement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_items'
    )
    clothing_type = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    def __str__(self):
        return f"{self.order.order_number} - {self.clothing_type}"


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='order_status_changes'
    )
    changed_at = models.DateTimeField()
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.status}"