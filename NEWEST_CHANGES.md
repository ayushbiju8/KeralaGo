# KeralaGO — Comprehensive Log of Newest Changes

> **Date:** October 23, 2026  
> **Status:** Synced & Integrated (`origin/main` + Local Authentication & Backend Feature Branch)

---

## Executive Summary

The KeralaGO codebase recently underwent two major phases of feature additions:
1. **Driver App Overhaul & Ride Lifecycle Simulation** (from main branch commits: `ad53106`, `2839b00`, `2d13bc7`): A complete visual and functional redesign of the Driver experience, including interactive stateful navigation, vehicle management, and a 5-stage interactive ride simulation modal with swipe-to-confirm gesture sliders.
2. **End-to-End Authentication, RBAC & Database Integration** (from the active feature branch): Full phone OTP login flow, dynamic Role-Based Access Control (`USER`, `DRIVER`, `ADMIN`), centralized API client layer, dual database support (SQLite + PostgreSQL), and automated database seeding.

---

## 1. Driver App Overhaul (Main Branch Commits)

### 1.1 Complete Driver Navigation Architecture (`DriverNavigator.tsx`)
Previously, `DriverNavigator` was a 7-line placeholder that only rendered a static home page. It is now a **stateful multi-screen navigator** supporting:
* **`home`**: [DriverHomePage.tsx](file:///d:/KeralaGo/KeralaGo/app/src/pages/driver/DriverHomePage.tsx)
* **`earnings`**: [DriverEarningsPage.tsx](file:///d:/KeralaGo/KeralaGo/app/src/pages/driver/DriverEarningsPage.tsx)
* **`bookings`**: [DriverTripsPage.tsx](file:///d:/KeralaGo/KeralaGo/app/src/pages/driver/DriverTripsPage.tsx)
* **`profile`**: [DriverProfilePage.tsx](file:///d:/KeralaGo/KeralaGo/app/src/pages/driver/DriverProfilePage.tsx)
* **`vehicle-details`**: [DriverVehicleDetailsPage.tsx](file:///d:/KeralaGo/KeralaGo/app/src/pages/driver/DriverVehicleDetailsPage.tsx)

### 1.2 Redesigned Driver Home Page (`DriverHomePage.tsx`)
* **Vehicle Status Card**: Displays vehicle model (*Maruti Swift Dzire*), plate number (*KL 07 AB 1234*), sedan badge, and vehicle thumbnail with navigation to vehicle specifications.
* **Daily Performance Metrics**: 3-column summary row displaying:
  * Total Trips today (`12`)
  * Total Earnings today (`₹1,240`)
  * Driver Rating (`4.8 ★`)
* **Surge & High Demand Banner**: Real-time demand indicator with pulse dot and demand percentage badge.
* **Today's Goal Tracker**: Progress bar tracking daily target completion (e.g. 70% toward daily earnings milestone).
* **Quick Action Buttons**: Fast shortcuts for vehicle checks and red SOS emergency dispatch card.
* **Driver Slide-Over Menu**: Side drawer with driver verification badges, vehicle documents, and bank payout settings.

### 1.3 New Dedicated Driver Screens
1. **Driver Earnings Page (`DriverEarningsPage.tsx`)**:
   * Weekly/daily earnings toggle with interactive earnings breakdown charts.
   * Recent ride payments and instant bank withdrawal triggers.
2. **Driver Bookings / Trips Page (`DriverTripsPage.tsx`)**:
   * Historical ride log showing pickup, dropoff, fare received, customer rating, and trip status tags.
3. **Driver Profile Page (`DriverProfilePage.tsx`)**:
   * Driver bio, emergency contact configuration, overall driver rating, verified documents checklist.
4. **Driver Vehicle Details Page (`DriverVehicleDetailsPage.tsx`)**:
   * Registration certificate (RC), commercial permit status, vehicle insurance validity, and pollution certificate details.

### 1.4 New UI Molecules & Gestures
* **`SwipeButton.tsx`**:
  * An interactive horizontal swipe-to-confirm action slider using `PanResponder` and `Animated.Value`.
  * Features animated chevron direction hints, clamped threshold snapping (snaps back below 65%, activates past 65%), and green (`#0F4A2B`) vs red (`#DC2626`) variants.
  * Sized for easy touch manipulation on mobile devices (64pt height, 54pt draggable knob).
* **`DriverHeroCarBanner.tsx`**:
  * Car banner component featuring vehicle silhouette and quick status highlights.
* **Live Kerala Map Updates (`KeralaMapBackground.tsx`)**:
  * Live Google Maps integration centered on MACE College of Engineering / Kothamangalam coordinates.
  * Real-time driver vehicle beacon with pulsating blue aura dot.
  * Driver-specific map controls: Locate me, Layers switch, and Navigation mode.

### 1.5 5-Stage Interactive Ride Simulation (`RideRequestModal.tsx`)
Replaced the basic popup with a complete multi-step ride execution lifecycle:
1. **Stage 1 (Incoming Ride Offer)**: 20-second animated circular countdown timer, pickup/dropoff locations (*M B Hostel → Mar Athanasius College*), fare estimate (*₹120*), and Accept / Decline actions.
2. **Stage 2 (Arriving at Pickup)**: Turn-by-turn navigation banner (*"Turn left onto MACE Hostels Rd"*), route polyline, rider card (*Devarth*), and `<SwipeButton label="Arrived at Pickup" />`.
3. **Stage 3 (Pickup Passenger)**: Waiting indicator with pulsating radar rings around vehicle, rider call/chat shortcuts, and `<SwipeButton label="Start Trip" />`.
4. **Stage 4 (On Trip)**: Active trip navigation banner, destination route, live ETA and trip fare stats, with red `<SwipeButton label="End Trip" />`.
5. **Stage 5 (Trip Completed)**: Celebration screen with confetti, final earnings calculation (`Base Fare ₹100 + Distance ₹20 = ₹120`), 5-star customer rating selector, and feedback comments.

---

## 2. Authentication, RBAC & Backend Integration

### 2.1 Backend Django Accounts System (`backend/accounts/`)
* **Custom Serializers (`serializers.py`)**:
  * `UserSerializer`: Serializes user ID, phone, name, role (`USER`, `DRIVER`, `ADMIN`), rating, verification status, and default payment method.
  * `OTPRequestSerializer` & `OTPVerifySerializer`: Validates phone formats and 6-digit OTP codes.
* **Authentication Views (`views.py`)**:
  * `request_otp`: Generates phone-based OTP (mocked to `123456` in dev mode for testing).
  * `verify_otp`: Validates OTP, creates user if new, assigns requested role, and returns user session profile.
  * `get_profile` / `update_profile`: Fetches and updates authenticated user details.
* **Accounts API Routes (`urls.py`)**:
  * `/api/auth/otp/request/`
  * `/api/auth/otp/verify/`
  * `/api/auth/profile/`
  * `/api/auth/profile/update/`

### 2.2 Dual Database Support & Seeding (`backend/`)
* **Flexible Database Switch (`backend/config/settings.py`)**:
  * Added `USE_POSTGRES` toggle via environment variables.
  * Automatically falls back to SQLite (`db.sqlite3`) with zero config needed, or connects to PostgreSQL when credentials are provided.
* **Database Seed Command (`backend/rides/management/commands/seed_db.py`)**:
  * Seeds demo accounts:
    * Customer: `+91 98470 12345` (Arun Kumar)
    * Driver: `+91 98470 54321` (Suresh Pillai, Auto)
    * Admin: `+91 98470 99999` (KeralaGo Admin)
  * Pre-populates mock vehicles and active trip routes.

### 2.3 Frontend API Layer (`app/src/services/`)
* **`apiClient.ts`**: Centralized HTTP fetch wrapper handling base URLs (`http://localhost:8000` or local network IP), header formatting, JSON serialization, and normalized error responses.
* **`authApi.ts`**: Service functions for `requestOtp`, `verifyOtp`, `fetchProfile`, and `updateProfile`.
* **`tripService.ts`**: Service module for booking trips, accepting rides, and status polling.

### 2.4 Dynamic Auth Context & RBAC Guard
* **`AuthContext.tsx`**:
  * Centralized authentication state managing `user`, `token`, `isAuthenticated`, and loading flags.
  * Exposes `loginWithOtp`, `logout`, `toggleRole`, and `updateProfile`.
  * Synchronizes user updates to both local React state and the backend database.
* **Role-Based Gatekeeper (`AppNavigator.tsx`)**:
  * Strict conditional rendering based on active database role:
    * `!user` ➔ [AuthNavigator](file:///d:/KeralaGo/KeralaGo/app/src/navigation/AuthNavigator.tsx)
    * `user.role === 'USER'` ➔ [UserNavigator](file:///d:/KeralaGo/KeralaGo/app/src/navigation/UserNavigator.tsx)
    * `user.role === 'DRIVER'` ➔ [DriverNavigator](file:///d:/KeralaGo/KeralaGo/app/src/navigation/DriverNavigator.tsx)
    * `user.role === 'ADMIN'` ➔ [AdminNavigator](file:///d:/KeralaGo/KeralaGo/app/src/navigation/AdminNavigator.tsx)

### 2.5 Auth & Profile Screens
* **`AuthScreen.tsx`**:
  * Clean Kerala Forest themed authentication UI.
  * Role selection tabs (*Customer*, *Driver*, *Admin*).
  * Quick-fill seed user chips for instant 1-tap dev testing.
  * 6-digit OTP verification input with dev helper banner.
* **`CustomerProfileView.tsx`**:
  * Dynamically connected to `useAuth()` to load real user data from the database.
  * Inline profile editing modal allowing users to update their name and phone with live backend sync.

---

## 3. Component & File Map

| Component / File | Location | Primary Purpose |
| :--- | :--- | :--- |
| **`DriverNavigator.tsx`** | `app/src/navigation/` | Stateful tab navigation for all driver screens |
| **`DriverHomePage.tsx`** | `app/src/pages/driver/` | Main driver dashboard with Swift Dzire card & stats |
| **`DriverEarningsPage.tsx`**| `app/src/pages/driver/` | Driver earnings, payout requests, and stats |
| **`DriverTripsPage.tsx`** | `app/src/pages/driver/` | Booking history and completed ride log |
| **`DriverProfilePage.tsx`** | `app/src/pages/driver/` | Driver documents, rating, and profile |
| **`DriverVehicleDetailsPage.tsx`** | `app/src/pages/driver/` | Vehicle RC, permit, and insurance details |
| **`SwipeButton.tsx`** | `app/src/components/molecules/` | Horizontal drag gesture slider for trip state transitions |
| **`RideRequestModal.tsx`**| `app/src/components/organisms/` | Complete 5-stage ride lifecycle simulation |
| **`AuthContext.tsx`** | `app/src/features/auth/` | Auth state provider with role switching & DB sync |
| **`AppNavigator.tsx`** | `app/src/navigation/` | Role-Based Access Control gatekeeper |
| **`apiClient.ts`** | `app/src/services/` | Centralized fetch client for Django API |
| **`seed_db.py`** | `backend/rides/management/commands/` | Django command to seed test users, drivers & rides |
| **`settings.py`** | `backend/config/` | Dual database switch (SQLite / PostgreSQL) |

---

## 4. Git Synchronization Note
* **`main` Branch**: Now fast-forwarded to `origin/main` (`2d13bc7 MVP`).
* **`initial-ui-setup` Branch**: Has merged `main` (`2d13bc7`), so it contains all of the new Driver App features above.
* **Uncommitted Changes**: Your local authentication & database changes are actively preserved in your working tree ready to be committed when you wish.
