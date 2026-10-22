from rest_framework import serializers
from .models import Service, Order, OrderItem, OrderStatusHistory


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            'id',
            'service_name',
            'description',
            'price',
            'estimated_days',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at'
        ]


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'customer',
            'created_by',
            'fabric_source',
            'special_instructions',
            'discount',
            'final_amount',
            'delivery_date',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'order',
            'service',
            'measurement',
            'clothing_type',
            'quantity',
            'unit_price',
            'subtotal'
        ]
        read_only_fields = [
            'id'
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = [
            'id',
            'order',
            'status',
            'changed_by',
            'changed_at',
            'notes'
        ]
        read_only_fields = [
            'id'
        ]