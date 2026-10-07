# KeralaGO Backend — Architecture, Implementation & Production Roadmap

> **Document Version:** 1.0.0  
> **Target Audience:** Co-developers, Backend Engineers, and System Architects  
> **Database Engine:** PostgreSQL 18.x  
> **Framework:** Django 5.2.x + Django REST Framework 3.17.x  
> **Authentication:** Mobile Number + Hashed OTP  

---

## Table of Contents
1. [Executive Summary & Architecture Vision](#1-executive-summary--architecture-vision)
2. [Project Directory & App Structure](#2-project-directory--app-structure)
3. [Environment & Database Configuration](#3-environment--database-configuration)
4. [Complete Domain Breakdown & Implemented Models](#4-complete-domain-breakdown--implemented-models)
   - [Accounts & Authentication](#domain-1-accounts--authentication)
   - [Drivers & Compliance](#domain-2-drivers--compliance)
   - [Vehicles & Fleet](#domain-3-vehicles--fleet)
   - [Rides & Lifecycle Management](#domain-4-rides--lifecycle-management)
   - [Payments, Ledger & Payouts](#domain-5-payments-ledger--payouts)
   - [Safety, Reviews & Support](#domain-6-safety-reviews--support)
5. [Database Invariants, Constraints & Indexes](#5-database-invariants-constraints--indexes)
6. [Django Admin Portal Setup](#6-django-admin-portal-setup)
7. [Validation & Verification Results](#7-validation--verification-results)
8. [Production-Ready Roadmap (Next Implementation Steps)](#8-production-ready-roadmap-next-implementation-steps)

---

## 1. Executive Summary & Architecture Vision

**KeralaGO** is an on-demand taxi-booking platform tailored for Kerala. The platform caters to three primary roles:
1. **`USER`** — Customer / Passenger hailing rides. (There is *no* separate `CUSTOMER` role in the schema).
2. **`DRIVER`** — Partner driver operating registered vehicles and fulfilling rides.
3. **`ADMIN`** — Operations, support, and compliance administrators.

### Core Architectural Decisions:
* **PostgreSQL Foundation**: Stored in a dedicated PostgreSQL database (`keralago_db`) running on localhost:5432.
* **UUID Primary Keys**: Every public and transactional entity uses `models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)` to prevent predictable sequential ID exposure.
* **Pure PostgreSQL Coordinates**: Avoids fragile, OS-dependent native C DLLs (GDAL/GEOS) by storing geographic coordinates using high-precision `DecimalField(max_digits=9, decimal_places=6)`. This guarantees sub-decimeter (~11 cm) GPS accuracy with PostgreSQL `CheckConstraint` bounds (`-90 to +90` latitude, `-180 to +180` longitude).
* **Strict 3NF Normalization**: Zero duplicate driver/vehicle metadata inside the transactional `Ride` table. Master data is linked strictly via foreign keys.
* **Financial Integrity**: All monetary values use `DecimalField(max_digits=12, decimal_places=2)`. Driver earnings rely on an immutable, append-only double-entry ledger (`DriverLedgerEntry`) rather than an un-auditable scalar balance.

---

## 2. Project Directory & App Structure

The backend has been modularized into domain-driven Django apps:

```text
backend/
├── config/                     # Django core project configuration
│   ├── settings.py             # Settings, PostgreSQL connection, custom user config
│   ├── urls.py                 # Root URL router
│   ├── asgi.py                 # ASGI entry point (ready for WebSockets)
│   └── wsgi.py                 # WSGI entry point
│
├── accounts/                   # User authentication & identity
│   ├── migrations/             # 0001_initial.py
│   ├── models.py               # User, OTPChallenge, UserProfile, EmergencyContact
│   ├── admin.py                # User & OTP challenge admin
│   └── apps.py
│
├── drivers/                    # Driver lifecycle, KYC & real-time telemetry
│   ├── migrations/             # 0001_initial.py
│   ├── models.py               # DriverProfile, DriverCurrentLocation, DriverDocument
│   ├── admin.py                # Driver admin with document/location inlines
│   └── apps.py
│
├── vehicles/                   # Fleet management & vehicle categories
│   ├── migrations/             # 0001_initial.py
│   ├── models.py               # VehicleCategory, Vehicle
│   ├── admin.py                # Category & Vehicle admin
│   └── apps.py
│
├── rides/                      # Core ride-hailing transactions & pricing
│   ├── migrations/             # 0001_initial.py
│   ├── models.py               # FareConfig, Ride, RideStop, RideLocationPing,
│   │                           # RideCancellation, RideFare, RideSettlement
│   ├── admin.py                # Ride admin with inlines for stops, fare, settlements
│   └── apps.py
│
├── payments/                   # Financial transactions, ledger & disbursements
│   ├── migrations/             # 0001_initial.py
│   ├── models.py               # Payment, Payout, DriverLedgerEntry
│   ├── admin.py                # Payment & ledger admin
│   └── apps.py
│
├── support/                    # Passenger safety, reviews & support tickets
│   ├── migrations/             # 0001_initial.py
│   ├── models.py               # Review, SOSAlert, SupportTicket, SupportTicketMessage
│   ├── admin.py                # Safety, ticket & review admin
│   └── apps.py
│
├── api/                        # API routing & existing health check
│   ├── urls.py                 # API endpoints (/api/health/)
│   └── views.py                # Health check endpoint
│
├── .env                        # Local database & secret key credentials (gitignored)
├── requirements.txt            # Python dependencies (django, djangorestframework, psycopg2-binary, etc.)
└── manage.py                   # Django CLI management executable
```

---

## 3. Environment & Database Configuration

### Active Configuration in `backend/.env`:
```ini
DB_NAME=keralago_db
DB_USER=postgres
DB_PASSWORD=@Bahubali2
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=django-insecure-ma05+6vmh^qj#=g&w1o36y7q$a*pt*xdbz!hr224=a$&ls%^$_
DEBUG=True
```

### PostgreSQL Engine in `backend/config/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'keralago_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', '@Bahubali2'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
AUTH_USER_MODEL = 'accounts.User'
```

---

## 4. Complete Domain Breakdown & Implemented Models

All **23 foundational models** are fully implemented, validated, and migrated into PostgreSQL:

### Domain 1: Accounts & Authentication
1. **`User`** (`accounts.User`)
   * Inherits from `AbstractBaseUser` + `PermissionsMixin`.
   * `id`: UUID primary key.
   * `mobile_number`: Unique E.164 phone number, serves as `USERNAME_FIELD`.
   * `full_name`: User's legal name.
   * `role`: Choices `USER`, `DRIVER`, `ADMIN`.
   * `CustomUserManager`: Provides `create_user` and `create_superuser`.
2. **`OTPChallenge`** (`accounts.OTPChallenge`)
   * Manages OTP login & verification cycles.
   * `code_hash`: Plaintext OTP is **never** stored; securely hashed via Django password hashers.
   * `purpose`: `LOGIN`, `REGISTRATION`, `PHONE_CHANGE`.
   * `expires_at`, `consumed_at`, `attempt_count`, `max_attempts` (default: 3).
3. **`UserProfile`** (`accounts.UserProfile`)
   * OneToOne relationship with `User` for customer metadata (`profile_photo`, `default_payment_method`).
4. **`EmergencyContact`** (`accounts.EmergencyContact`)
   * Linked via FK to `User`.
   * Enforces **at most 1 primary contact per user** via conditional unique constraint.

### Domain 2: Drivers & Compliance
5. **`DriverProfile`** (`drivers.DriverProfile`)
   * OneToOne with `User` (strictly validated to ensure `user.role == DRIVER`).
   * `license_number`: Unique driving license identifier.
   * `approval_status`: `PENDING`, `APPROVED`, `REJECTED`.
   * `approved_by`: Nullable FK to admin `User` (`on_delete=SET_NULL`).
   * `is_online`: Real-time availability flag.
6. **`DriverCurrentLocation`** (`drivers.DriverCurrentLocation`)
   * OneToOne with `DriverProfile`. Represents real-time location snapshot (not historical trail).
   * High-precision coordinates (`latitude`, `longitude`) with check constraints and `accuracy_meters`.
7. **`DriverDocument`** (`drivers.DriverDocument`)
   * KYC documents (`DRIVING_LICENSE`, `RC`, `INSURANCE`, `IDENTITY`).
   * Unique constraint: Only **one current document** per type per driver.
   * Model validation: Documents marked as `REJECTED` **must** provide a `rejection_reason`.

### Domain 3: Vehicles & Fleet
8. **`VehicleCategory`** (`vehicles.VehicleCategory`)
   * Dynamic category definitions stored in DB (e.g. `AUTO`, `SEDAN`, `SUV`).
   * Unique `code`, capacity, and active status.
9. **`Vehicle`** (`vehicles.Vehicle`)
   * FK to `DriverProfile` and `VehicleCategory` (`on_delete=PROTECT`).
   * `registration_number`: Unique license plate (e.g., `KL 07 CA 1234`).
   * Unique constraint: Only **one active vehicle per driver** at any given time.

### Domain 4: Rides & Lifecycle Management
10. **`FareConfig`** (`rides.FareConfig`)
    * Dynamic, versioned pricing matrices per `VehicleCategory`.
    * Fields: `base_fare`, `per_km_rate`, `per_minute_rate`, `minimum_fare`, `cancellation_fee`, `platform_commission_percent`.
    * Check constraints enforce non-negative values and commission $\in [0, 100]$.
11. **`Ride`** (`rides.Ride`)
    * Central transactional entity.
    * Foreign keys: `customer` (FK `User`, `PROTECT`), `driver` (FK `User`, `PROTECT`, nullable), `vehicle` (FK `Vehicle`, `PROTECT`, nullable), `vehicle_category` (FK `VehicleCategory`, `PROTECT`).
    * Lifecycle state machine:
      $$\text{REQUESTED} \longrightarrow \text{ACCEPTED} \longrightarrow \text{DRIVER\_ARRIVED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{COMPLETED} \quad (\text{or } \text{CANCELLED})$$
    * Helper methods: `transition_to(new_status)`, `set_trip_pin(raw_pin)`, `verify_trip_pin(raw_pin)`.
    * Trip PIN: 4-digit numeric code hashed via `make_password`.
    * Concurrency constraints: Conditional unique constraints preventing concurrent active rides for both customer and driver.
12. **`RideStop`** (`rides.RideStop`)
    * Normalized stops (`PICKUP`, `DESTINATION`).
    * Enforces exactly **one pickup** and **one destination** per ride via `UniqueConstraint(fields=['ride', 'stop_type'])`.
13. **`RideLocationPing`** (`rides.RideLocationPing`)
    * Append-only historical telemetry stream recording `latitude`, `longitude`, `speed_kph`, `heading_degrees`, and timestamp.
14. **`RideCancellation`** (`rides.RideCancellation`)
    * OneToOne with `Ride`. Records `cancelled_by` (`USER`, `DRIVER`, `SYSTEM`, `ADMIN`), `actor_user`, reason, and non-negative `cancellation_charge`.
15. **`RideFare`** (`rides.RideFare`)
    * OneToOne with `Ride`. Immutable historical fare breakdown (`base_fare`, `distance_charge`, `duration_charge`, `cancellation_charge`, `discount`, `gross_fare`).
16. **`RideSettlement`** (`rides.RideSettlement`)
    * OneToOne with `Ride`.
    * DB CheckConstraint enforces invariant:
      $$\text{gross\_fare} = \text{platform\_commission} + \text{driver\_net\_earnings}$$

### Domain 5: Payments, Ledger & Payouts
17. **`Payment`** (`payments.Payment`)
    * FK to `Ride` (`PROTECT`). Supports multiple attempts (`CASH`, `UPI`, `GATEWAY`).
    * `idempotency_key`: Unique UUID preventing double charges.
    * Conditional unique constraint: Exactly **one successful payment per ride**.
18. **`DriverLedgerEntry`** (`payments.DriverLedgerEntry`)
    * Double-entry bookkeeping ledger (`RIDE_EARNING`, `COMMISSION`, `ADJUSTMENT`, `PAYOUT`).
    * Strictly positive `amount > 0`. Append-only financial source of truth.
19. **`Payout`** (`payments.Payout`)
    * Bank disbursements to drivers (`PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`) with `amount > 0`.

### Domain 6: Safety, Reviews & Support
20. **`Review`** (`support.Review`)
    * Bilateral reviews (`USER` $\leftrightarrow$ `DRIVER`).
    * Check constraints enforce: `1 <= rating <= 5`, `reviewer != reviewee`, and unique per `(ride, reviewer, reviewee)`.
21. **`SOSAlert`** (`support.SOSAlert`)
    * Immutable emergency distress signal with coordinates, status (`TRIGGERED`, `ACKNOWLEDGED`, `RESOLVED`), and resolution timestamps.
22. **`SupportTicket`** (`support.SupportTicket`)
    * Customer issue ticketing with status workflow and admin assignment.
23. **`SupportTicketMessage`** (`support.SupportTicketMessage`)
    * Threaded replies cascading upon ticket deletion.

---

## 5. Database Invariants, Constraints & Indexes

### Key PostgreSQL Constraints:
| Constraint Name | Target Table | Type | Rule |
| :--- | :--- | :--- | :--- |
| `accounts_user.mobile_number` | `accounts_user` | UNIQUE | Mobile number unique across all users |
| `unique_primary_emergency_contact_per_user` | `accounts_emergency_contact` | Conditional UNIQUE | Exactly 1 `is_primary=True` contact per user |
| `unique_current_driver_document` | `drivers_driver_document` | Conditional UNIQUE | Exactly 1 `is_current=True` doc per document type |
| `unique_active_vehicle_per_driver` | `vehicles_vehicle` | Conditional UNIQUE | Exactly 1 `is_active=True` vehicle per driver |
| `unique_active_ride_per_customer` | `rides_ride` | Conditional UNIQUE | 1 active ride per customer (`REQUESTED` through `IN_PROGRESS`) |
| `unique_active_ride_per_driver` | `rides_ride` | Conditional UNIQUE | 1 active ride per driver (`ACCEPTED` through `IN_PROGRESS`) |
| `unique_stop_type_per_ride` | `rides_stop` | UNIQUE | Exactly 1 `PICKUP` and 1 `DESTINATION` per ride |
| `unique_successful_payment_per_ride` | `payments_payment` | Conditional UNIQUE | Maximum 1 payment with `status='SUCCESS'` per ride |
| `settlement_balance_invariant` | `rides_settlement` | CHECK | `gross_fare = platform_commission + driver_net_earnings` |
| `review_rating_between_1_and_5` | `support_review` | CHECK | `rating >= 1 AND rating <= 5` |
| `review_reviewer_cannot_be_reviewee` | `support_review` | CHECK | `reviewer != reviewee` |

### Taxi-Hailing Performance Indexes:
* **Ride Lookups**: `(customer, status, created_at)`, `(driver, status, created_at)`, `(status, created_at)`, `(vehicle_category, status, created_at)`.
* **Driver Dispatch**: `(approval_status, is_online)`, `(is_online)`.
* **Coordinates**: `(latitude, longitude)` on driver locations and ride stops.
* **Telemetry**: `(ride, -recorded_at)`, `(driver, -recorded_at)`.
* **Payments**: `(ride, status)`, `(status, created_at)`.

---

## 6. Django Admin Portal Setup

All 23 models are registered in Django Admin with customized configuration:
* **`UserAdmin`**: Role filtering, custom fieldsets, password hashing integration.
* **`DriverProfileAdmin`**: Inlines for live location snapshot and uploaded documents.
* **`RideAdmin`**: Inlines for stops, fare breakdown, settlement split, and cancellation details.
* **`SupportTicketAdmin`**: Inline conversation message thread.

---

## 7. Validation & Verification Results

A comprehensive verification script was executed against the PostgreSQL database, confirming:
* ✅ User creation, UUID primary keys, role segregation (`USER`, `DRIVER`, `ADMIN`).
* ✅ OTP hashing, validation, and single-use consumption.
* ✅ Active ride conflict prevention (rejection of duplicate concurrent rides).
* ✅ 4-digit PIN verification and illegal ride state transition rejection.
* ✅ Financial settlement invariant equation enforcement.
* ✅ Single successful payment constraint enforcement.
* ✅ Bilateral review constraints (`1-5` rating, self-review rejection).
* ✅ Pre-existing `/api/health/` returns `HTTP 200 OK`.

---

## 8. Production-Ready Roadmap (Next Implementation Steps)

To transition this robust data architecture into a full production platform, execute the following steps in sequence:

### Phase 1: Authentication & Session Management
1. **JWT Authentication**:
   * Integrate `djangorestframework-simplejwt`.
   * Configure access and refresh token lifetimes, rotation, and blacklist.
2. **SMS Gateway Integration**:
   * Implement SMS provider adapter (e.g. Twilio, MSG91, or Fast2SMS) for sending OTPs.
   * Add Redis-backed throttling/rate limiting on OTP request endpoints (e.g. max 3 requests per 10 minutes per IP/phone).
3. **Registration & Profile Completion APIs**:
   * Endpoints for customer name/profile setup after OTP verification.
   * Endpoints for driver registration and multi-part document file upload (integrated with AWS S3 / Cloudflare R2).

### Phase 2: Core Taxi Dispatch & Ride Service Layer
4. **Geospatial Proximity Service (Driver Matching)**:
   * Implement Haversine formula calculation in Python/SQL to find online, approved drivers within a given radius (e.g. 3–5 km).
   * Implement bounding-box spatial filtering queries on `DriverCurrentLocation`.
5. **Ride Dispatch State Machine Service**:
   * Encapsulate ride creation, broadcast to nearby drivers, acceptance, arrival, PIN verification, start, completion, and cancellation inside atomic service functions (`services/ride_service.py`).
   * Apply `select_for_update()` inside `transaction.atomic()` during driver acceptance to prevent race conditions.
6. **Fare Estimation Engine**:
   * Integration with Google Maps Distance Matrix API / OSRM (Open Source Routing Machine) to compute estimated distance and duration.
   * Dynamic fare calculation using active `FareConfig`.

### Phase 3: Real-Time Communication & Live Tracking
7. **WebSockets with Django Channels**:
   * Set up `channels` with Redis channel layers (`channels_redis`).
   * **Driver Location Tracking**: WebSocket channel receiving frequent driver GPS pings and updating `DriverCurrentLocation`.
   * **Active Ride Tracking**: WebSocket room per active ride broadcasting live driver coordinates to the customer.
   * **Ride Notifications**: Push instant ride offer alerts to drivers.

### Phase 4: Payments & Financial Settlements
8. **Payment Gateway Webhook Handlers**:
   * Integrate Razorpay / Stripe webhook endpoints for payment capture.
   * Implement idempotency verification using `Payment.idempotency_key` and DB-level row locks.
9. **Automated Fare Settlement & Ledger Pipeline**:
   * Trigger automatic creation of `RideFare` and `RideSettlement` upon ride completion.
   * Automatically credit driver earnings and platform commission in `DriverLedgerEntry`.
10. **Driver Payout System**:
    * Payout initiation and automated disbursement via RazorpayX / Cashfree Payouts API.

### Phase 5: Push Notifications & Background Tasks
11. **Celery Worker & Beat Scheduler**:
    * Configure Celery with Redis broker for asynchronous background execution.
    * Tasks: Expired OTP cleanup, ride request timeout handling, driver heartbeat checks (marking inactive drivers offline after 5 minutes of no pings).
12. **Push Notifications (FCM)**:
    * Integrate Firebase Cloud Messaging (FCM) for background alerts when the mobile app is in the background or killed.

### Phase 6: REST API Serialization & Documentation
13. **DRF Serializers & ViewSets**:
    * Implement versioned REST APIs under `/api/v1/`.
    * Generate interactive OpenAPI 3.0 / Swagger documentation using `drf-spectacular`.

### Phase 7: Production Hardening, CI/CD & Deployment
14. **Containerization**:
    * Create multi-stage `Dockerfile` and `docker-compose.production.yml` (Django, PostgreSQL, Redis, Celery worker, Celery beat, Nginx).
15. **Connection Pooling & Caching**:
    * Deploy PgBouncer for PostgreSQL connection pooling under heavy concurrent load.
    * Set up Redis caching for frequently accessed static master data (`VehicleCategory`, active `FareConfig`).
16. **Observability & Error Tracking**:
    * Integrate Sentry for real-time error logging.
    * Set up health check and metrics monitoring (Prometheus + Grafana).
17. **Automated CI/CD Pipeline**:
    * Configure GitHub Actions workflow running automated test suites, linting (Ruff/Flake8), and continuous deployment to cloud infrastructure (AWS ECS, Render, or DigitalOcean).
