from django.contrib import admin
from .models import Payment, Payout, DriverLedgerEntry


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "ride", "amount", "payment_method", "status", "gateway_reference", "paid_at", "created_at")
    list_filter = ("status", "payment_method", "created_at")
    search_fields = ("id", "ride__id", "gateway_reference")
    readonly_fields = ("id", "idempotency_key", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ("id", "driver", "amount", "status", "gateway_reference", "processed_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("id", "driver__license_number", "gateway_reference")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(DriverLedgerEntry)
class DriverLedgerEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "driver", "entry_type", "amount", "ride", "payout", "created_at")
    list_filter = ("entry_type", "created_at")
    search_fields = ("driver__license_number", "description", "ride__id")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
