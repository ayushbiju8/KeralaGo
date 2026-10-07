import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    """
    Bilateral rating and review between passenger and driver for a completed ride.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    ride = models.ForeignKey(
        'rides.Ride',
        on_delete=models.PROTECT,
        related_name="reviews"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reviews_written"
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reviews_received"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating score from 1 (poor) to 5 (excellent)"
    )
    comment = models.TextField(
        blank=True,
        default=""
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "support_review"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["reviewee", "created_at"], name="review_reviewee_created_idx"),
            models.Index(fields=["ride"], name="review_ride_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name="review_rating_between_1_and_5"
            ),
            models.CheckConstraint(
                condition=~models.Q(reviewer=models.F("reviewee")),
                name="review_reviewer_cannot_be_reviewee"
            ),
            models.UniqueConstraint(
                fields=["ride", "reviewer", "reviewee"],
                name="unique_review_per_reviewer_reviewee_ride"
            ),
        ]

    def __str__(self):
        return f"Review for Ride {self.ride_id}: {self.rating}★ ({self.reviewer.mobile_number} -> {self.reviewee.mobile_number})"

    def clean(self):
        super().clean()
        if hasattr(self, "reviewer") and hasattr(self, "reviewee"):
            if self.reviewer_id == self.reviewee_id:
                raise ValidationError("Reviewer cannot review themselves.")
        if hasattr(self, "ride") and self.ride:
            participants = {self.ride.customer_id}
            if self.ride.driver_id:
                participants.add(self.ride.driver_id)
            if self.reviewer_id not in participants:
                raise ValidationError({"reviewer": "Reviewer must be a participant in the ride."})
            if self.reviewee_id not in participants:
                raise ValidationError({"reviewee": "Reviewee must be a participant in the ride."})


class SOSStatus(models.TextChoices):
    TRIGGERED = "TRIGGERED", "Triggered"
    ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
    RESOLVED = "RESOLVED", "Resolved"


class SOSAlert(models.Model):
    """
    Emergency distress signal emitted by passenger or driver.
    Immutable safety audit record.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="sos_alerts"
    )
    ride = models.ForeignKey(
        'rides.Ride',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="sos_alerts"
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
    status = models.CharField(
        max_length=20,
        choices=SOSStatus.choices,
        default=SOSStatus.TRIGGERED,
        db_index=True
    )
    message = models.TextField(
        blank=True,
        default=""
    )
    acknowledged_at = models.DateTimeField(
        null=True,
        blank=True
    )
    resolved_at = models.DateTimeField(
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
        db_table = "support_sos_alert"
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(latitude__gte=Decimal("-90.0")) & models.Q(latitude__lte=Decimal("90.0")),
                name="sos_lat_valid"
            ),
            models.CheckConstraint(
                condition=models.Q(longitude__gte=Decimal("-180.0")) & models.Q(longitude__lte=Decimal("180.0")),
                name="sos_lon_valid"
            ),
        ]

    def __str__(self):
        return f"SOS by {self.user.mobile_number} at ({self.latitude}, {self.longitude}) [{self.status}]"


class TicketStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"


class SupportTicket(models.Model):
    """
    Customer service and safety incident support ticket.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="support_tickets"
    )
    ride = models.ForeignKey(
        'rides.Ride',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="support_tickets"
    )
    subject = models.CharField(
        max_length=255
    )
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices,
        default=TicketStatus.OPEN,
        db_index=True
    )
    assigned_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets"
    )
    resolved_at = models.DateTimeField(
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
        db_table = "support_ticket"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status", "created_at"], name="ticket_user_status_idx"),
            models.Index(fields=["ride", "status"], name="ticket_ride_status_idx"),
            models.Index(fields=["assigned_admin", "status"], name="ticket_admin_status_idx"),
        ]

    def __str__(self):
        return f"Ticket #{str(self.id)[:8]}: {self.subject} ({self.status})"


class SupportTicketMessage(models.Model):
    """
    Threaded reply message inside a SupportTicket.
    CASCADE on delete of ticket since messages have no standalone meaning.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="ticket_messages"
    )
    message = models.TextField()
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "support_ticket_message"
        ordering = ["created_at"]

    def __str__(self):
        return f"Message by {self.sender.mobile_number} on Ticket #{str(self.ticket_id)[:8]}"
