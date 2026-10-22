from django.contrib import admin
from .models import Customer, Measurement, MeasurementHistory

admin.site.register(Customer)
admin.site.register(Measurement)
admin.site.register(MeasurementHistory)