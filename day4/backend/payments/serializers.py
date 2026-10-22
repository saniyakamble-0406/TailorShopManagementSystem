from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id',
            'order',
            'amount',
            'payment_method',
            'payment_date',
            'recorded_by',
            'notes',
            'created_at'
        ]
        read_only_fields = [
            'id',
            'created_at'
        ]