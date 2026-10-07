from django.contrib import admin
from .models import DriverProfile, DriverCurrentLocation, DriverDocument


class DriverDocumentInline(admin.TabularInline):
    model = DriverDocument
    extra = 0
    fields = ("document_type", "document_number", "file_url", "review_status", "is_current")
    readonly_fields = ("created_at",)


class DriverCurrentLocationInline(admin.StackedInline):
    model = DriverCurrentLocation
    can_delete = False
    max_num = 1
    readonly_fields = ("recorded_at", "created_at", "updated_at")


@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "license_number", "approval_status", "is_online", "approved_by", "approved_at", "created_at")
    list_filter = ("approval_status", "is_online", "created_at")
    search_fields = ("user__mobile_number", "user__full_name", "license_number")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [DriverCurrentLocationInline, DriverDocumentInline]


@admin.register(DriverCurrentLocation)
class DriverCurrentLocationAdmin(admin.ModelAdmin):
    list_display = ("driver", "latitude", "longitude", "accuracy_meters", "recorded_at")
    search_fields = ("driver__user__mobile_number", "driver__license_number")
    readonly_fields = ("id", "recorded_at", "created_at", "updated_at")


@admin.register(DriverDocument)
class DriverDocumentAdmin(admin.ModelAdmin):
    list_display = ("driver", "document_type", "document_number", "review_status", "is_current", "reviewed_by", "created_at")
    list_filter = ("document_type", "review_status", "is_current")
    search_fields = ("driver__user__mobile_number", "document_number")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
