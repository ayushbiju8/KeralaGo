import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator


class PaymentMethod(models.TextChoices):
    CASH = "CASH", "Cash"
    UPI = "UPI", "UPI"
    GATEWAY = "GATEWAY", "Online Gateway"


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    SUCCESS = "SUCCESS", "Success"
    FAILED = "FAILED", "Failed"


class Payment(models.Model):
    """
    Payment attempt or transaction for a ride.
    Allows multiple payment attempts, but only exactly one SUCCESS per ride.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    ride = models.ForeignKey(
        'rides.Ride',
        on_delete=models.PROTECT,
        related_name="payments"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Transaction amount in INR"
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices
    )
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )
    gateway_reference = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        db_index=True,
        help_text="Reference ID from Razorpay / Stripe / Bank"
    )
    idempotency_key = models.UUIDField(
        unique=True,
        default=uuid.uuid4,
        help_text="Unique idempotency token to prevent double-charging"
    )
    paid_at = models.DateTimeField(
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
        db_table = "payments_payment"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["ride", "status"], name="payment_ride_status_idx"),
            models.Index(fields=["status", "created_at"], name="payment_status_created_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gte=Decimal("0.00")),
                name="payment_amount_gte_zero"
            ),
            # Only ONE SUCCESSFUL payment may exist for a ride
            models.UniqueConstraint(
                fields=["ride"],
                condition=models.Q(status=PaymentStatus.SUCCESS),
                name="unique_successful_payment_per_ride"
            ),
        ]

    def __str__(self):
        return f"Payment {self.id} for Ride {self.ride_id}: ₹{self.amount} ({self.status})"


class LedgerEntryType(models.TextChoices):
    RIDE_EARNING = "RIDE_EARNING", "Ride Earning"
    COMMISSION = "COMMISSION", "Platform Commission"
    ADJUSTMENT = "ADJUSTMENT", "Adjustment"
    PAYOUT = "PAYOUT", "Payout"


class PayoutStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    SUCCESS = "SUCCESS", "Success"
    FAILED = "FAILED", "Failed"


class Payout(models.Model):
    """
    Bank transfer or withdrawal payout record to a driver.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    driver = models.ForeignKey(
        'drivers.DriverProfile',
        on_delete=models.PROTECT,
        related_name="payouts"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Disbursement amount in INR"
    )
    status = models.CharField(
        max_length=20,
        choices=PayoutStatus.choices,
        default=PayoutStatus.PENDING,
        db_index=True
    )
    gateway_reference = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Bank payout transaction / UTR reference"
    )
    processed_at = models.DateTimeField(
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
        db_table = "payments_payout"
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=Decimal("0.00")),
                name="payout_amount_positive"
            ),
        ]

    def __str__(self):
        return f"Payout {self.id} to Driver {self.driver.license_number}: ₹{self.amount} ({self.status})"


class DriverLedgerEntry(models.Model):
    """
    Auditable financial double-entry ledger for driver balance tracking.
    Never update or delete existing entries; append-only audit trail.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    driver = models.ForeignKey(
        'drivers.DriverProfile',
        on_delete=models.PROTECT,
        related_name="ledger_entries"
    )
    ride = models.ForeignKey(
        'rides.Ride',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="ledger_entries"
    )
    payout = models.ForeignKey(
        Payout,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="ledger_entries"
    )
    entry_type = models.CharField(
        max_length=30,
        choices=LedgerEntryType.choices
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Positive amount for this entry"
    )
    description = models.CharField(
        max_length=255
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "payments_driver_ledger"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["driver", "entry_type"], name="ledger_driver_type_idx"),
            models.Index(fields=["driver", "created_at"], name="ledger_driver_created_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=Decimal("0.00")),
                name="ledger_amount_positive"
            ),
        ]

    def __str__(self):
        return f"LedgerEntry({self.driver.license_number}, {self.entry_type}): ₹{self.amount}"
