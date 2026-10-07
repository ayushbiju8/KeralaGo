from django.contrib import admin
from .models import FareConfig, Ride, RideStop, RideLocationPing, RideCancellation, RideFare, RideSettlement


class RideStopInline(admin.TabularInline):
    model = RideStop
    extra = 0
    readonly_fields = ("created_at", "updated_at")


class RideFareInline(admin.StackedInline):
    model = RideFare
    can_delete = False
    max_num = 1
    readonly_fields = ("created_at", "updated_at")


class RideSettlementInline(admin.StackedInline):
    model = RideSettlement
    can_delete = False
    max_num = 1
    readonly_fields = ("settled_at", "created_at", "updated_at")


class RideCancellationInline(admin.StackedInline):
    model = RideCancellation
    can_delete = False
    max_num = 1
    readonly_fields = ("cancelled_at", "created_at", "updated_at")


@admin.register(FareConfig)
class FareConfigAdmin(admin.ModelAdmin):
    list_display = ("category", "base_fare", "per_km_rate", "minimum_fare", "platform_commission_percent", "effective_from", "effective_to")
    list_filter = ("category", "effective_from")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-effective_from",)


@admin.register(Ride)
class RideAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "driver", "vehicle_category", "status", "final_fare", "requested_at", "completed_at")
    list_filter = ("status", "vehicle_category", "requested_at")
    search_fields = ("id", "customer__mobile_number", "driver__mobile_number")
    readonly_fields = ("id", "requested_at", "created_at", "updated_at", "trip_pin_hash")
    ordering = ("-created_at",)
    inlines = [RideStopInline, RideFareInline, RideSettlementInline, RideCancellationInline]


@admin.register(RideStop)
class RideStopAdmin(admin.ModelAdmin):
    list_display = ("ride", "stop_type", "address", "latitude", "longitude", "created_at")
    list_filter = ("stop_type",)
    search_fields = ("address", "ride__id")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(RideLocationPing)
class RideLocationPingAdmin(admin.ModelAdmin):
    list_display = ("ride", "driver", "latitude", "longitude", "speed_kph", "recorded_at")
    search_fields = ("ride__id", "driver__mobile_number")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-recorded_at",)


@admin.register(RideCancellation)
class RideCancellationAdmin(admin.ModelAdmin):
    list_display = ("ride", "cancelled_by", "cancellation_charge", "cancelled_at")
    list_filter = ("cancelled_by",)
    search_fields = ("ride__id", "reason")
    readonly_fields = ("id", "cancelled_at", "created_at", "updated_at")


@admin.register(RideFare)
class RideFareAdmin(admin.ModelAdmin):
    list_display = ("ride", "gross_fare", "base_fare", "distance_charge", "duration_charge", "cancellation_charge", "discount")
    search_fields = ("ride__id",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(RideSettlement)
class RideSettlementAdmin(admin.ModelAdmin):
    list_display = ("ride", "gross_fare", "platform_commission", "driver_net_earnings", "settled_at")
    search_fields = ("ride__id",)
    readonly_fields = ("id", "settled_at", "created_at", "updated_at")
