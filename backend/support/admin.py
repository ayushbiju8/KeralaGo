from django.contrib import admin
from .models import Review, SOSAlert, SupportTicket, SupportTicketMessage


class SupportTicketMessageInline(admin.TabularInline):
    model = SupportTicketMessage
    extra = 1
    readonly_fields = ("created_at", "updated_at")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("ride", "reviewer", "reviewee", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("ride__id", "reviewer__mobile_number", "reviewee__mobile_number", "comment")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(SOSAlert)
class SOSAlertAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "ride", "status", "latitude", "longitude", "acknowledged_at", "resolved_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("user__mobile_number", "message")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("id", "subject", "user", "status", "assigned_admin", "resolved_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("subject", "user__mobile_number", "description")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
    inlines = [SupportTicketMessageInline]


@admin.register(SupportTicketMessage)
class SupportTicketMessageAdmin(admin.ModelAdmin):
    list_display = ("ticket", "sender", "created_at")
    search_fields = ("ticket__subject", "sender__mobile_number", "message")
    readonly_fields = ("id", "created_at", "updated_at")
