from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from accounts.models import UserProfile
from .models import Customer, Measurement, MeasurementHistory


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id',
            'user',
            'full_name',
            'phone',
            'email',
            'address',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]


class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = [
            'id',
            'customer',
            'clothing_type',
            'measurement_data',
            'measured_by',
            'measured_at',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
        ]

    def _get_recorded_by(self, fallback=None):
        request = self.context.get('request')

        if request and request.user.is_authenticated:
            profile = UserProfile.objects.filter(
                user=request.user,
                is_active=True,
            ).first()

            if profile:
                return profile

        return fallback

    def _create_history_snapshot(self, measurement, recorded_by):
        MeasurementHistory.objects.create(
            customer=measurement.customer,
            measurement=measurement,
            clothing_type=measurement.clothing_type,
            measurement_data=measurement.measurement_data,
            recorded_by=recorded_by,
            recorded_at=timezone.now(),
        )

    def create(self, validated_data):
        with transaction.atomic():
            measurement = super().create(validated_data)

            recorded_by = self._get_recorded_by(
                measurement.measured_by
            )

            self._create_history_snapshot(
                measurement,
                recorded_by,
            )

            return measurement

    def update(self, instance, validated_data):
        with transaction.atomic():
            measurement = super().update(
                instance,
                validated_data,
            )

            recorded_by = self._get_recorded_by(
                measurement.measured_by
            )

            self._create_history_snapshot(
                measurement,
                recorded_by,
            )

            return measurement


class MeasurementHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasurementHistory
        fields = [
            'id',
            'customer',
            'measurement',
            'clothing_type',
            'measurement_data',
            'recorded_by',
            'recorded_at',
        ]
        read_only_fields = [
            'id',
        ]