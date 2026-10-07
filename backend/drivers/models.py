import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator


class ApprovalStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class DriverProfile(models.Model):
    """
    Driver profile entity. Exactly one per DRIVER-role User.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="driver_profile"
    )
    license_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Government driving license number"
    )
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        db_index=True
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_driver_profiles",
        help_text="Admin who approved or reviewed this driver"
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True
    )
    is_online = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Driver online availability for hailing"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "drivers_driver_profile"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["approval_status", "is_online"], name="driver_approval_online_idx"),
            models.Index(fields=["is_online"], name="driver_online_idx"),
        ]

    def __str__(self):
        return f"Driver {self.user.mobile_number} [{self.license_number}] ({self.approval_status})"

    def clean(self):
        super().clean()
        if hasattr(self, "user") and self.user:
            from accounts.models import UserRole
            if self.user.role != UserRole.DRIVER:
                raise ValidationError({"user": "Only users with role DRIVER can have a DriverProfile."})

    @property
    def is_verified(self):
        return self.approval_status == ApprovalStatus.APPROVED


class DriverCurrentLocation(models.Model):
    """
    Current real-time location snapshot of the driver.
    Not for historical location tracking. OneToOne with DriverProfile.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    driver = models.OneToOneField(
        DriverProfile,
        on_delete=models.CASCADE,
        related_name="current_location"
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(Decimal("-90.0")), MaxValueValidator(Decimal("90.0"))],
        help_text="WGS-84 latitude (-90 to +90)"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(Decimal("-180.0")), MaxValueValidator(Decimal("180.0"))],
        help_text="WGS-84 longitude (-180 to +180)"
    )
    accuracy_meters = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="GPS accuracy radius in meters"
    )
    recorded_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp of latest GPS fix"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "drivers_current_location"
        indexes = [
            models.Index(fields=["latitude", "longitude"], name="driver_loc_coords_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(latitude__gte=Decimal("-90.0")) & models.Q(latitude__lte=Decimal("90.0")),
                name="drivers_location_lat_valid"
            ),
            models.CheckConstraint(
                condition=models.Q(longitude__gte=Decimal("-180.0")) & models.Q(longitude__lte=Decimal("180.0")),
                name="drivers_location_lon_valid"
            ),
        ]

    def __str__(self):
        return f"Loc({self.driver.user.mobile_number}): ({self.latitude}, {self.longitude})"


class DocumentType(models.TextChoices):
    DRIVING_LICENSE = "DRIVING_LICENSE", "Driving License"
    RC = "RC", "Registration Certificate (RC)"
    INSURANCE = "INSURANCE", "Insurance Certificate"
    IDENTITY = "IDENTITY", "Identity Proof"


class DriverDocument(models.Model):
    """
    KYC and compliance documents uploaded by driver.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    driver = models.ForeignKey(
        DriverProfile,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    document_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices
    )
    document_number = models.CharField(
        max_length=100
    )
    file_url = models.URLField(
        max_length=500,
        help_text="Object storage URL for document file"
    )
    review_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        db_index=True
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_driver_documents"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True
    )
    rejection_reason = models.TextField(
        blank=True,
        default=""
    )
    is_current = models.BooleanField(
        default=True,
        help_text="Designates the current active version of this document type"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "drivers_driver_document"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["driver", "review_status"], name="driver_doc_review_idx"),
            models.Index(fields=["review_status", "created_at"], name="doc_status_created_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["driver", "document_type"],
                condition=models.Q(is_current=True),
                name="unique_current_driver_document"
            ),
        ]

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.driver.user.mobile_number} ({self.review_status})"

    def clean(self):
        super().clean()
        if self.review_status == ApprovalStatus.REJECTED and not self.rejection_reason.strip():
            raise ValidationError({
                "rejection_reason": "Rejection reason is required when document is marked as REJECTED."
            })
