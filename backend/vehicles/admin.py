from django.contrib import admin
from .models import VehicleCategory, Vehicle


@admin.register(VehicleCategory)
class VehicleCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "capacity", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "code")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("name",)


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("registration_number", "make", "model", "category", "driver", "is_active", "created_at")
    list_filter = ("is_active", "category", "manufacture_year")
    search_fields = ("registration_number", "make", "model", "driver__user__mobile_number")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
