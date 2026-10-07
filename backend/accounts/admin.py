from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTPChallenge, UserProfile, EmergencyContact


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("mobile_number", "full_name", "role", "is_active", "is_staff", "created_at")
    list_filter = ("role", "is_active", "is_staff", "created_at")
    search_fields = ("mobile_number", "full_name")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("id", "mobile_number", "password")}),
        ("Personal info", {"fields": ("full_name", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("created_at", "updated_at")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("mobile_number", "full_name", "role", "password", "is_staff", "is_superuser"),
        }),
    )


@admin.register(OTPChallenge)
class OTPChallengeAdmin(admin.ModelAdmin):
    list_display = ("mobile_number", "purpose", "attempt_count", "max_attempts", "consumed_at", "expires_at", "created_at")
    list_filter = ("purpose", "created_at")
    search_fields = ("mobile_number",)
    readonly_fields = ("id", "code_hash", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "default_payment_method", "created_at")
    search_fields = ("user__mobile_number", "user__full_name")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ("name", "mobile_number", "relationship", "user", "is_primary", "created_at")
    list_filter = ("is_primary", "relationship")
    search_fields = ("name", "mobile_number", "user__mobile_number")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
