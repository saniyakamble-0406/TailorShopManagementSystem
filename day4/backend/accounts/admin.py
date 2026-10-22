from django.contrib import admin
from .models import Notification, Staff, UserProfile

admin.site.register(Notification)
admin.site.register(Staff)
admin.site.register(UserProfile)