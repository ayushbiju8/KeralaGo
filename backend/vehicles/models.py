import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator


class ServiceType(models.TextChoices):
    STANDARD = "STANDARD", "Standard Ride"
    BIKE = "BIKE", "Bike"
    AUTO = "AUTO", "Auto Rickshaw"
    PINK = "PINK", "Pink Ride (Women Only)"
    PACKAGE = "PACKAGE", "Package Delivery"
    SHARE_TAXI = "SHARE_TAXI", "Share Taxi"
    RENTAL = "RENTAL", "Rentals"
    SCHEDULED = "SCHEDULED", "Scheduled Ride"


class VehicleCategory(models.Model):
    """
    Vehicle category metadata (e.g. AUTO, SEDAN, SUV, HATCHBACK).
    Configured dynamically in database rather than hardcoded enums.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    name = models.CharField(
        max_length=50,
        help_text="Human-readable category name (e.g. Auto, Sedan, SUV)"
    )
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        help_text="Unique category slug/identifier (e.g. AUTO, SEDAN, SUV)"
    )
    service_type = models.CharField(
        max_length=30,
        choices=ServiceType.choices,
        default=ServiceType.STANDARD,
        db_index=True
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Short description displayed on ride booking sheet"
    )
    icon_name = models.CharField(
        max_length=50,
        default="car",
        help_text="Expo/Material/Ionicons icon identifier"
    )
    icon_library = models.CharField(
        max_length=50,
        default="Ionicons"
    )
    image_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="3D vehicle graphic illustration URL"
    )
    is_womens_only = models.BooleanField(
        default=False,
        help_text="Exclusive to verified female drivers & female passengers"
    )
    display_order = models.PositiveSmallIntegerField(
        default=0,
        help_text="Ordering in suggestions and vehicle selection list"
    )
    capacity = models.PositiveSmallIntegerField(
        default=4,
        validators=[MinValueValidator(1)],
        help_text="Maximum passenger capacity"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this vehicle category is offered on the platform"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "vehicles_category"
        verbose_name_plural = "Vehicle categories"
        ordering = ["name"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(capacity__gt=0),
                name="vehicle_category_capacity_positive"
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"


class Vehicle(models.Model):
    """
    Individual vehicle registered and operated by a driver.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    driver = models.ForeignKey(
        'drivers.DriverProfile',
        on_delete=models.PROTECT,
        related_name="vehicles",
        help_text="Associated driver profile"
    )
    category = models.ForeignKey(
        VehicleCategory,
        on_delete=models.PROTECT,
        related_name="vehicles"
    )
    registration_number = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        help_text="Vehicle license plate / registration number (e.g. KL 07 CA 1234)"
    )
    make = models.CharField(
        max_length=50,
        help_text="Manufacturer (e.g. Maruti Suzuki, Bajaj, Hyundai)"
    )
    model = models.CharField(
        max_length=50,
        help_text="Model name (e.g. Dzire, RE, Creta)"
    )
    manufacture_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1990)],
        help_text="Year of manufacture"
    )
    capacity = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Seating capacity"
    )
    color = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Vehicle exterior color (e.g. Traditional Green & Yellow, White)"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Lifecycle flag. Only one active vehicle per driver is permitted."
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "vehicles_vehicle"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["driver", "is_active"], name="vehicle_driver_active_idx"),
            models.Index(fields=["category", "is_active"], name="vehicle_category_active_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["driver"],
                condition=models.Q(is_active=True),
                name="unique_active_vehicle_per_driver"
            ),
            models.CheckConstraint(
                condition=models.Q(capacity__gt=0),
                name="vehicle_capacity_positive"
            ),
        ]

    def __str__(self):
        return f"{self.make} {self.model} ({self.registration_number})"

    def clean(self):
        super().clean()
        if self.capacity <= 0:
            raise ValidationError({"capacity": "Capacity must be greater than zero."})
