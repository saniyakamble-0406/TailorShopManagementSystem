from rest_framework import serializers
from .models import UserProfile, Staff, Notification


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id',
            'username',
            'email',
            'role',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at'
        ]


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = [
            'id',
            'user',
            'full_name',
            'phone',
            'address',
            'joined_date',
            'is_active',
            'created_at'
        ]
        read_only_fields = [
            'id',
            'created_at'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'order',
            'notification_type',
            'message',
            'is_read',
            'created_at'
        ]
        read_only_fields = [
            'id',
            'created_at'
        ]