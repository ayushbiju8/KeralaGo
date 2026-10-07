import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.hashers import make_password, check_password


class FareConfig(models.Model):
    """
    Versioned fare configuration per vehicle category.
    Historical rides do NOT depend on current fare configs; snapshot values are stored on RideFare.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    category = models.ForeignKey(
        'vehicles.VehicleCategory',
        on_delete=models.PROTECT,
        related_name="fare_configs"
    )
    base_fare = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Base charge for booking / minimum starting charge"
    )
    per_km_rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Charge per kilometer"
    )
    per_minute_rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Charge per minute of trip time"
    )
    minimum_fare = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Minimum allowable trip fare"
    )
    cancellation_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Standard fee applied if ride cancelled after threshold"
    )
    platform_commission_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("100.00"))],
        help_text="Platform commission percentage between 0 and 100"
    )
    effective_from = models.DateTimeField(
        help_text="Start timestamp of validity"
    )
    effective_to = models.DateTimeField(
        null=True,
        blank=True,
        help_text="End timestamp of validity (null for ongoing)"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "rides_fare_config"
        ordering = ["-effective_from"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(base_fare__gte=Decimal("0.00")),
                name="fare_config_base_fare_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(per_km_rate__gte=Decimal("0.00")),
                name="fare_config_per_km_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(per_minute_rate__gte=Decimal("0.00")),
                name="fare_config_per_min_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(minimum_fare__gte=Decimal("0.00")),
                name="fare_config_min_fare_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(cancellation_fee__gte=Decimal("0.00")),
                name="fare_config_canc_fee_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(platform_commission_percent__gte=Decimal("0.00")) &
                          models.Q(platform_commission_percent__lte=Decimal("100.00")),
                name="fare_config_commission_0_to_100"
            ),
        ]

    def __str__(self):
        return f"FareConfig: {self.category.name} from {self.effective_from.strftime('%Y-%m-%d')}"


class RideStatus(models.TextChoices):
    REQUESTED = "REQUESTED", "Requested"
    ACCEPTED = "ACCEPTED", "Accepted"
    DRIVER_ARRIVED = "DRIVER_ARRIVED", "Driver Arrived"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class Ride(models.Model):
    """
    Central transactional entity for taxi booking lifecycle.
    """
    LEGAL_TRANSITIONS = {
        RideStatus.REQUESTED: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
        RideStatus.ACCEPTED: [RideStatus.DRIVER_ARRIVED, RideStatus.CANCELLED],
        RideStatus.DRIVER_ARRIVED: [RideStatus.IN_PROGRESS, RideStatus.CANCELLED],
        RideStatus.IN_PROGRESS: [RideStatus.COMPLETED, RideStatus.CANCELLED],
        RideStatus.COMPLETED: [],
        RideStatus.CANCELLED: [],
    }

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="customer_rides",
        help_text="Passenger who requested the ride (must have role USER)"
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="driver_rides",
        help_text="Driver fulfilling the ride (must have role DRIVER)"
    )
    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="rides"
    )
    vehicle_category = models.ForeignKey(
        'vehicles.VehicleCategory',
        on_delete=models.PROTECT,
        related_name="rides"
    )
    status = models.CharField(
        max_length=20,
        choices=RideStatus.choices,
        default=RideStatus.REQUESTED,
        db_index=True
    )
    estimated_distance_km = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True
    )
    estimated_duration_minutes = models.PositiveIntegerField(
        null=True,
        blank=True
    )
    actual_distance_km = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True
    )
    actual_duration_minutes = models.PositiveIntegerField(
        null=True,
        blank=True
    )
    estimated_fare = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    final_fare = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    trip_pin_hash = models.CharField(
        max_length=255,
        blank=True,
        help_text="Hashed 4-digit start OTP / PIN verified before trip start"
    )
    requested_at = models.DateTimeField(
        auto_now_add=True
    )
    accepted_at = models.DateTimeField(
        null=True,
        blank=True
    )
    driver_arrived_at = models.DateTimeField(
        null=True,
        blank=True
    )
    started_at = models.DateTimeField(
        null=True,
        blank=True
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "rides_ride"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["customer", "status", "created_at"], name="ride_cust_status_created_idx"),
            models.Index(fields=["driver", "status", "created_at"], name="ride_drv_status_created_idx"),
            models.Index(fields=["status", "created_at"], name="ride_status_created_idx"),
            models.Index(fields=["vehicle_category", "status", "created_at"], name="ride_cat_status_created_idx"),
            models.Index(fields=["created_at"], name="ride_created_idx"),
        ]
        constraints = [
            # A USER must not have multiple active rides
            models.UniqueConstraint(
                fields=["customer"],
                condition=models.Q(status__in=[
                    RideStatus.REQUESTED,
                    RideStatus.ACCEPTED,
                    RideStatus.DRIVER_ARRIVED,
                    RideStatus.IN_PROGRESS
                ]),
                name="unique_active_ride_per_customer"
            ),
            # A DRIVER must not have multiple active rides
            models.UniqueConstraint(
                fields=["driver"],
                condition=models.Q(driver__isnull=False) & models.Q(status__in=[
                    RideStatus.ACCEPTED,
                    RideStatus.DRIVER_ARRIVED,
                    RideStatus.IN_PROGRESS
                ]),
                name="unique_active_ride_per_driver"
            ),
        ]

    def __str__(self):
        return f"Ride {self.id} [{self.status}] (Customer: {self.customer.mobile_number})"

    def clean(self):
        super().clean()
        from accounts.models import UserRole
        if hasattr(self, "customer") and self.customer and self.customer.role != UserRole.USER:
            raise ValidationError({"customer": "Only users with role USER can create rides."})
        if self.driver and self.driver.role != UserRole.DRIVER:
            raise ValidationError({"driver": "Assigned driver must have role DRIVER."})

    def set_trip_pin(self, raw_pin: str):
        raw = str(raw_pin).strip()
        if len(raw) != 4 or not raw.isdigit():
            raise ValueError("Trip PIN must consist of exactly 4 numeric digits.")
        self.trip_pin_hash = make_password(raw)

    def verify_trip_pin(self, raw_pin: str) -> bool:
        if not self.trip_pin_hash:
            return False
        return check_password(str(raw_pin).strip(), self.trip_pin_hash)

    def transition_to(self, new_status: str):
        allowed = self.LEGAL_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            raise ValidationError(
                f"Illegal state transition from '{self.status}' to '{new_status}'. "
                f"Permitted next states: {allowed or 'Terminal state reached'}"
            )
        self.status = new_status


class StopType(models.TextChoices):
    PICKUP = "PICKUP", "Pickup"
    DESTINATION = "DESTINATION", "Destination"


class RideStop(models.Model):
    """
    Waypoints for a ride. Exactly one PICKUP and one DESTINATION per ride.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    ride = models.ForeignKey(
        Ride,
        on_delete=models.CASCADE,
        related_name="stops"
    )
    stop_type = models.CharField(
        max_length=20,
        choices=StopType.choices
    )
    address = models.CharField(
        max_length=500
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(Decimal("-90.0")), MaxValueValidator(Decimal("90.0"))]
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(Decimal("-180.0")), MaxValueValidator(Decimal("180.0"))]
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "rides_stop"
        constraints = [
            models.UniqueConstraint(
                fields=["ride", "stop_type"],
                name="unique_stop_type_per_ride"
            ),
            models.CheckConstraint(
                condition=models.Q(latitude__gte=Decimal("-90.0")) & models.Q(latitude__lte=Decimal("90.0")),
                name="ride_stop_lat_valid"
            ),
            models.CheckConstraint(
                condition=models.Q(longitude__gte=Decimal("-180.0")) & models.Q(longitude__lte=Decimal("180.0")),
                name="ride_stop_lon_valid"
            ),
        ]

    def __str__(self):
        return f"{self.get_stop_type_display()} for Ride {self.ride_id}: ({self.latitude}, {self.longitude})"


class RideLocationPing(models.Model):
    """
    Append-only historical location telemetry for active rides.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    ride = models.ForeignKey(
        Ride,
        on_delete=models.CASCADE,
        related_name="location_pings"
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="ride_pings"
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(Decimal("-90.0")), MaxValueValidator(Decimal("90.0"))]
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(Decimal("-180.0")), MaxValueValidator(Decimal("180.0"))]
    )
    recorded_at = models.DateTimeField(
        db_index=True
    )
    accuracy_meters = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )
    speed_kph = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )
    heading_degrees = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "rides_location_ping"
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["ride", "-recorded_at"], name="ping_ride_rec_idx"),
            models.Index(fields=["driver", "-recorded_at"], name="ping_driver_rec_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(latitude__gte=Decimal("-90.0")) & models.Q(latitude__lte=Decimal("90.0")),
                name="ride_ping_lat_valid"
            ),
            models.CheckConstraint(
                condition=models.Q(longitude__gte=Decimal("-180.0")) & models.Q(longitude__lte=Decimal("180.0")),
                name="ride_ping_lon_valid"
            ),
        ]

    def __str__(self):
        return f"Ping({self.ride_id}): ({self.latitude}, {self.longitude}) at {self.recorded_at}"


class CancelledBy(models.TextChoices):
    USER = "USER", "User"
    DRIVER = "DRIVER", "Driver"
    SYSTEM = "SYSTEM", "System"
    ADMIN = "ADMIN", "Admin"


class RideCancellation(models.Model):
    """
    Cancellation details for terminated rides.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    ride = models.OneToOneField(
        Ride,
        on_delete=models.CASCADE,
        related_name="cancellation"
    )
    cancelled_by = models.CharField(
        max_length=20,
        choices=CancelledBy.choices
    )
    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cancelled_rides"
    )
    reason = models.TextField()
    cancellation_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    cancelled_at = models.DateTimeField(
        auto_now_add=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "rides_cancellation"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(cancellation_charge__gte=Decimal("0.00")),
                name="cancellation_charge_gte_zero"
            ),
        ]

    def __str__(self):
        return f"Cancellation for Ride {self.ride_id} by {self.cancelled_by}"


class RideFare(models.Model):
    """
    Historical fare breakdown for completed rides.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    ride = models.OneToOneField(
        Ride,
        on_delete=models.PROTECT,
        related_name="fare_breakdown"
    )
    base_fare = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    distance_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    duration_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    cancellation_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    gross_fare = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "rides_fare"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(base_fare__gte=Decimal("0.00")),
                name="fare_base_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(distance_charge__gte=Decimal("0.00")),
                name="fare_distance_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(duration_charge__gte=Decimal("0.00")),
                name="fare_duration_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(cancellation_charge__gte=Decimal("0.00")),
                name="fare_cancellation_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(discount__gte=Decimal("0.00")),
                name="fare_discount_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(gross_fare__gte=Decimal("0.00")),
                name="fare_gross_gte_zero"
            ),
        ]

    def __str__(self):
        return f"RideFare({self.ride_id}): Gross ₹{self.gross_fare}"


class RideSettlement(models.Model):
    """
    Financial settlement split between platform commission and driver earnings.
    Invariant: gross_fare = platform_commission + driver_net_earnings
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    ride = models.OneToOneField(
        Ride,
        on_delete=models.PROTECT,
        related_name="settlement"
    )
    gross_fare = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    platform_commission = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    driver_net_earnings = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    settled_at = models.DateTimeField(
        auto_now_add=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "rides_settlement"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(gross_fare__gte=Decimal("0.00")),
                name="settlement_gross_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(platform_commission__gte=Decimal("0.00")),
                name="settlement_commission_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(driver_net_earnings__gte=Decimal("0.00")),
                name="settlement_driver_net_gte_zero"
            ),
            models.CheckConstraint(
                condition=models.Q(gross_fare=models.F("platform_commission") + models.F("driver_net_earnings")),
                name="settlement_balance_invariant"
            ),
        ]

    def __str__(self):
        return f"Settlement({self.ride_id}): Gross ₹{self.gross_fare} (Driver: ₹{self.driver_net_earnings}, Comm: ₹{self.platform_commission})"

    def clean(self):
        super().clean()
        if self.gross_fare != (self.platform_commission + self.driver_net_earnings):
            raise ValidationError("Gross fare must equal platform commission plus driver net earnings.")
