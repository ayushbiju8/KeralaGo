# KeralaGO — Mobile Frontend Routing & Authorization Specification

> **Platform:** React Native (Expo Router v4 / File-Based Routing)  
> **Target App Directory:** `app/src/app`  
> **Auth Architecture:** JWT Bearer Token stored in `expo-secure-store`  
> **RBAC Roles:** `USER` (Customer), `DRIVER` (Driver Partner), `ADMIN`  

---

## 1. Authentication & Role-Based Access Control (RBAC) Architecture

The application implements a two-tier route protection system:
1. **Authentication Guard**: Determines if a valid JWT access token exists in `expo-secure-store`. If expired, uses refresh token; if invalid, forces redirect to `/(auth)/welcome`.
2. **Role-Based Guard (RBAC)**: Once authenticated, inspects `user.role`:
   * `USER`: Restricted exclusively to `/(customer)/*` routes.
   * `DRIVER`: Inspected for `approval_status`. If `PENDING` or `REJECTED`, restricted to `/(driver)/onboarding/*`. If `APPROVED`, granted access to `/(driver)/*` operational routes.
   * `ADMIN`: Directs to the Web Admin Portal.

---

## 2. Complete Frontend Routes & Authorization Matrix

| Route Path (Expo Router) | Screen Name | Auth Required? | Role Guard | Purpose & UX Details |
| :--- | :--- | :--- | :--- | :--- |
| **`/(auth)` GROUP (Public)** | | | | |
| `/index` | Splash / Gatekeeper | ❌ Public | None | Token validation & role-based auto-redirect |
| `/(auth)/welcome` | Welcome / Onboarding | ❌ Public | None | Carousel explaining KeralaGO (Malayalam / English) |
| `/(auth)/login` | Mobile Phone Entry | ❌ Public | None | Enter 10-digit mobile number, request OTP |
| `/(auth)/otp-verify` | OTP Verification | ❌ Public | None | 4-digit OTP input with countdown resend timer |
| `/(auth)/register-profile` | Complete Profile | 🟡 Post-OTP | None | Collects `full_name` and role selection for new accounts |
| | | | | |
| **`/(customer)` GROUP (Protected)** | | | | |
| `/(customer)/(tabs)/home` | Map & Booking Home | ✅ Yes | `USER` | Map view, pickup location, recent destinations, "Where to?" |
| `/(customer)/search-location` | Search & Destination | ✅ Yes | `USER` | Google Places / Mapbox search autocomplete |
| `/(customer)/select-vehicle` | Ride & Fare Selection | ✅ Yes | `USER` | Vehicle categories (`AUTO`, `SEDAN`, `SUV`), estimated fares & ETA |
| `/(customer)/confirm-pickup` | Confirm Pickup & Payment | ✅ Yes | `USER` | Pin adjuster, payment method toggle (`CASH` / `UPI`), booking CTA |
| `/(customer)/searching-driver` | Radar Search Overlay | ✅ Yes | `USER` | Ripple radar animation, nearby driver broadcast, cancellation button |
| `/(customer)/active-ride` | Live Ride Tracking | ✅ Yes | `USER` | Live map, driver & car details, **4-digit Trip PIN**, live ETA, SOS |
| `/(customer)/ride-completed` | Receipt & Rate Driver | ✅ Yes | `USER` | Historical fare breakdown, payment status, bilateral 1–5★ review |
| `/(customer)/(tabs)/activity` | Trip History | ✅ Yes | `USER` | List of past completed and cancelled rides |
| `/(customer)/trip-details/[id]` | Trip Receipt | ✅ Yes | `USER` | In-depth breakdown for a past ride with download receipt |
| `/(customer)/(tabs)/profile` | Customer Profile | ✅ Yes | `USER` | Personal info, saved addresses, app settings |
| `/(customer)/emergency-contacts`| Safety & Contacts | ✅ Yes | `USER` | Add/manage primary and secondary emergency contacts |
| `/(customer)/support-tickets` | Help & Support | ✅ Yes | `USER` | View open tickets and initiate new complaints |
| | | | | |
| **`/(driver)` GROUP (Protected)** | | | | |
| `/(driver)/onboarding/license` | DL Upload | ✅ Yes | `DRIVER` | License number input + front/back photo upload |
| `/(driver)/onboarding/vehicle` | Vehicle Registration | ✅ Yes | `DRIVER` | Registration plate, make, model, capacity, category |
| `/(driver)/onboarding/rc-doc` | RC & Insurance Upload | ✅ Yes | `DRIVER` | RC book and Insurance certificate photo uploads |
| `/(driver)/onboarding/status` | Verification Status | ✅ Yes | `DRIVER` | "Under Review", "Approved", or "Rejected" with reason |
| `/(driver)/(tabs)/dashboard` | Driver Duty Screen | ✅ Yes | `DRIVER` (Approved) | **Online/Offline Switch**, heatmap of demand, today's earnings |
| `/(driver)/incoming-request` | Ride Offer Popup | ✅ Yes | `DRIVER` (Approved) | Full-screen incoming modal: 15-second timer, pickup distance, fare |
| `/(driver)/navigate-pickup` | En-route to Pickup | ✅ Yes | `DRIVER` (Approved) | Turn-by-turn map, "Arrived at Pickup" CTA, call passenger |
| `/(driver)/verify-pin` | Start Trip PIN Modal | ✅ Yes | `DRIVER` (Approved) | Prompt to enter passenger's 4-digit PIN before ride starts |
| `/(driver)/in-trip` | Ongoing Trip Navigation | ✅ Yes | `DRIVER` (Approved) | Route to destination, live speed, "Complete Ride" slider |
| `/(driver)/trip-summary` | Settlement & Cash Receipt | ✅ Yes | `DRIVER` (Approved) | Gross fare, platform fee, driver net earnings, collect cash confirm |
| `/(driver)/(tabs)/earnings` | Earnings & Ledger | ✅ Yes | `DRIVER` (Approved) | Daily/weekly earnings graph, ledger audit history, payout request |
| `/(driver)/payout-request` | Bank Withdrawal | ✅ Yes | `DRIVER` (Approved) | Instant/weekly bank transfer request |
| `/(driver)/(tabs)/profile` | Driver Profile & Vehicle | ✅ Yes | `DRIVER` (Approved) | Active vehicle details, document expiry alerts, rating score |
| | | | | |
| **`/(shared-modals)` GROUP** | | | | |
| `/modal/sos` | Emergency Distress | ✅ Yes | Any Authenticated | **One-tap SOS**: broadcasts GPS, alerts backend & emergency contacts |
| `/modal/chat/[rideId]` | In-Ride Chat Thread | ✅ Yes | Ride Participants | In-app WebSocket chat between passenger and assigned driver |
| `/modal/cancel-ride/[rideId]` | Cancel Ride Dialog | ✅ Yes | Ride Participants | Reason selection list (`Driver too far`, `Changed mind`, etc.) |
| `/modal/ticket/[ticketId]` | Support Chat Thread | ✅ Yes | Owner or Admin | Discussion thread for support tickets |

---

## 3. Expo Router File Directory Blueprint

```text
app/src/app/
├── _layout.tsx                          # Root Provider (AuthContext, React Query, Theme)
├── index.tsx                            # Gatekeeper & initial route redirector
│
├── (auth)/                              # Unauthenticated Group
│   ├── _layout.tsx                      # Stack layout for auth flow
│   ├── welcome.tsx
│   ├── login.tsx
│   ├── otp-verify.tsx
│   └── register-profile.tsx
│
├── (customer)/                          # Customer Protected Group (role: USER)
│   ├── _layout.tsx                      # AuthGuard protecting customer routes
│   ├── (tabs)/                          # Bottom Tab Navigation
│   │   ├── _layout.tsx
│   │   ├── home.tsx                     # Map & Search
│   │   ├── activity.tsx                 # Ride history
│   │   └── profile.tsx                  # Profile & settings
│   ├── search-location.tsx
│   ├── select-vehicle.tsx
│   ├── confirm-pickup.tsx
│   ├── searching-driver.tsx
│   ├── active-ride.tsx
│   ├── ride-completed.tsx
│   ├── trip-details/
│   │   └── [id].tsx
│   ├── emergency-contacts.tsx
│   └── support-tickets.tsx
│
├── (driver)/                            # Driver Protected Group (role: DRIVER)
│   ├── _layout.tsx                      # AuthGuard & KYC verification guard
│   ├── onboarding/                      # KYC Upload Flow
│   │   ├── _layout.tsx
│   │   ├── license.tsx
│   │   ├── vehicle.tsx
│   │   ├── rc-doc.tsx
│   │   └── status.tsx
│   ├── (tabs)/                          # Driver Bottom Tab Navigation
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx                # Online/Offline switch & heat map
│   │   ├── earnings.tsx                 # Ledger & payout
│   │   └── profile.tsx                  # Vehicle & documents
│   ├── incoming-request.tsx
│   ├── navigate-pickup.tsx
│   ├── verify-pin.tsx
│   ├── in-trip.tsx
│   ├── trip-summary.tsx
│   └── payout-request.tsx
│
└── (modals)/                            # Global Overlay Modals
    ├── _layout.tsx                      # presentation: 'modal' stack
    ├── sos.tsx
    ├── chat/
    │   └── [rideId].tsx
    └── cancel-ride/
        └── [rideId].tsx
```

---

## 4. Key Production Frontend Requirements

1. **Secure Storage**: JWT Access and Refresh tokens stored in `expo-secure-store`.
2. **WebSocket Client**: Persistent channel subscription for driver tracking and ride events.
3. **Background GPS Tracking**: `expo-location` with `expo-task-manager` for background driver location broadcasts.
4. **Push Notifications**: Firebase Cloud Messaging (FCM) integration with deep link routing.
5. **Offline & Network Resilience**: React Query offline caching and automatic reconnect with exponential backoff.
