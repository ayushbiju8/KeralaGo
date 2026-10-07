import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone


class UserRole(models.TextChoices):
    USER = "USER", "User"
    DRIVER = "DRIVER", "Driver"
    ADMIN = "ADMIN", "Admin"


class CustomUserManager(BaseUserManager):
    """
    Manager for custom User model with mobile_number as unique identifier.
    """

    def create_user(self, mobile_number, password=None, **extra_fields):
        if not mobile_number:
            raise ValueError("The mobile number must be provided.")
        extra_fields.setdefault("role", UserRole.USER)
        extra_fields.setdefault("is_active", True)
        user = self.model(mobile_number=mobile_number.strip(), **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, mobile_number, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(mobile_number, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Core User entity for KeralaGO taxi booking platform.
    Mobile number + OTP based authentication.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    mobile_number = models.CharField(
        max_length=15,
        unique=True,
        db_index=True,
        help_text="Primary phone number (E.164 or national format) used for OTP login"
    )
    full_name = models.CharField(
        max_length=150,
        blank=True,
        default=""
    )
    role = models.CharField(
        max_length=10,
        choices=UserRole.choices,
        default=UserRole.USER,
        db_index=True,
        help_text="Role in platform: USER (Customer), DRIVER, or ADMIN"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Designates whether this user account is active."
    )
    is_staff = models.BooleanField(
        default=False,
        help_text="Designates whether this user can log into the Django admin site."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    objects = CustomUserManager()

    USERNAME_FIELD = "mobile_number"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "accounts_user"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["role"], name="accounts_user_role_idx"),
            models.Index(fields=["created_at"], name="accounts_user_created_idx"),
        ]

    def __str__(self):
        return f"{self.mobile_number} ({self.get_role_display()})"

    @property
    def is_driver(self):
        return self.role == UserRole.DRIVER

    @property
    def is_customer(self):
        return self.role == UserRole.USER

    @property
    def is_admin_user(self):
        return self.role == UserRole.ADMIN or self.is_staff or self.is_superuser


class OTPPurpose(models.TextChoices):
    LOGIN = "LOGIN", "Login"
    REGISTRATION = "REGISTRATION", "Registration"
    PHONE_CHANGE = "PHONE_CHANGE", "Phone Change"


class OTPChallenge(models.Model):
    """
    OTP Challenge record for mobile authentication.
    Plaintext OTP is never stored; hashed using Django password hashers.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    mobile_number = models.CharField(
        max_length=15,
        db_index=True
    )
    purpose = models.CharField(
        max_length=20,
        choices=OTPPurpose.choices,
        default=OTPPurpose.LOGIN
    )
    code_hash = models.CharField(
        max_length=255,
        help_text="Hashed OTP code"
    )
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when OTP was successfully consumed"
    )
    attempt_count = models.PositiveSmallIntegerField(
        default=0
    )
    max_attempts = models.PositiveSmallIntegerField(
        default=3
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "accounts_otp_challenge"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["mobile_number", "purpose"], name="otp_mobile_purpose_idx"),
            models.Index(fields=["expires_at"], name="otp_expires_idx"),
        ]

    def __str__(self):
        return f"OTP({self.mobile_number}, {self.purpose}, consumed={bool(self.consumed_at)})"

    def set_code(self, raw_code: str):
        self.code_hash = make_password(str(raw_code).strip())

    def verify_code(self, raw_code: str) -> bool:
        if self.consumed_at is not None:
            return False
        if timezone.now() > self.expires_at:
            return False
        if self.attempt_count >= self.max_attempts:
            return False

        self.attempt_count += 1
        is_valid = check_password(str(raw_code).strip(), self.code_hash)
        if is_valid:
            self.consumed_at = timezone.now()
        self.save(update_fields=["attempt_count", "consumed_at", "updated_at"])
        return is_valid


class UserProfile(models.Model):
    """
    Passenger/User specific metadata profile.
    Separated from the core auth User model.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    profile_photo = models.URLField(
        max_length=500,
        blank=True,
        null=True
    )
    default_payment_method = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "accounts_user_profile"

    def __str__(self):
        return f"Profile for {self.user.mobile_number}"


class EmergencyContact(models.Model):
    """
    Emergency contact for passenger safety.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="emergency_contacts"
    )
    name = models.CharField(
        max_length=150
    )
    mobile_number = models.CharField(
        max_length=15
    )
    relationship = models.CharField(
        max_length=50,
        blank=True,
        default=""
    )
    is_primary = models.BooleanField(
        default=False
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "accounts_emergency_contact"
        ordering = ["-is_primary", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(is_primary=True),
                name="unique_primary_emergency_contact_per_user"
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.mobile_number}) - User {self.user.mobile_number}"
