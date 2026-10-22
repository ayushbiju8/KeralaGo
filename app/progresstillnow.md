# KeralaGO — Frontend Progress & Architecture Report

> **Last Updated:** 2026-10-08  
> **Platform:** React Native (Expo Router v4 / File-Based Routing)  
> **Styling & Tokens:** Strict Kerala Forest Theme (`src/constants/theme.ts`)  
> **Architecture Pattern:** Atomic Design + Feature-Based Modular Architecture  

---

## 1. Architecture & Navigation Pattern

The frontend implements a clean separation between route resolution, business domains, and presentational UI components.

```
                   ┌────────────────────────────┐
                   │    Root Layout & State     │
                   │    (src/app/_layout.tsx)   │
                   └─────────────┬──────────────┘
                                 │
                   ┌─────────────▼──────────────┐
                   │        AppNavigator        │
                   │ (src/navigation/AppNav...) │
                   └─────────────┬──────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
 ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
 │!user / Auth  │         │  role: USER  │         │ role: DRIVER │
 │ AuthNavigator│         │ UserNavigator│         │DriverNavigat.│
 └──────────────┘         └──────────────┘         └──────────────┘
```

### Role-Based Gatekeeper — `src/navigation/AppNavigator.tsx`
Dynamic rendering based on active session authentication and role:

```tsx
function AppNavigator() {
  const { user } = useAuth();

  if (!user) {
    return <AuthNavigator />;
  }

  switch (user.role) {
    case "USER":
      return <UserNavigator />;

    case "DRIVER":
      return <DriverNavigator />;

    default:
      return <AuthNavigator />;
  }
}
```

---

## 2. Implemented Screens & Personas

### A. Customer (User) Homepage — `src/pages/customer/CustomerHomePage.tsx`
*Active when `user.role === 'USER'`*

- **Header & Profile Bar**:
  - Greeting: *"Namaskaram, Arun! 👋"* with verified avatar and customer badge.
  - Quick action icons: Emergency SOS distress broadcast and notification alerts.
- **Mode Toggle Banner**:
  - Interactive switch allowing instant switching between **Customer (USER)** and **Driver (DRIVER)** modes directly in the UI.
- **Interactive Kerala Map Backdrop (`KeralaMapBackground`)**:
  - Stylized Kerala map showing the Vembanad Lake backwaters, NH-66 bypass, Seaport-Airport Road, and Kochi Metro viaduct.
  - Real-time location marker with pulsing radar aura.
  - Live nearby vehicles: Kerala Auto (2m away), KeralaGO Car (4m away), Pink Ride (5m away), and Moto Bike (1m away).
- **Floating Search & Time Bar (`FloatingSearchBar`)**:
  - Prominent search pill: *"Where do you want to go?"* with quick schedule pill (*"Now ▼"*).
- **Suggestions & Ride Modes Grid (`ServiceCategoryCard`)**:
  - **Auto**: Kerala Auto Rickshaw (₹45 base, 2m away).
  - **Comfort**: Air-conditioned Sedan (₹120 base, 4m away).
  - **Pink Ride**: Women-only driver initiative with safety badge (₹110 base, 5m away).
  - **Moto**: Express bike taxi for solo commutes (₹30 base, 1m away).
- **Recent Destinations List (`LocationListItem`)**:
  - Lulu Mall, Edappally (4.2 km).
  - Ernakulam South Railway Station (2.8 km).
  - Cochin International Airport - COK (24.5 km).
  - Marine Drive Walkway, Ernakulam (3.5 km).
- **Interactive Booking Bottom Sheet (`BottomSheet`)**:
  - Slides up when a category or destination is chosen.
  - Vehicle option list (`RideSelectionList`) with live price bands in ₹.
  - Payment method toggle: Cash / UPI on arrival.
  - CTA button: *"Confirm & Request Ride"* with instant confirmation.
- **Bottom Navigation Bar (`BottomTabBar`)**:
  - Four customer tabs: `Home`, `Trips`, `Wallet`, and `Profile`.

---

### B. Driver Partner Duty Dashboard — `src/pages/driver/DriverHomePage.tsx`
*Active when `user.role === 'DRIVER'`*

- **Header Bar**:
  - Left hamburger menu icon `☰` (opens driver actions & persona switch drawer).
  - Center brand logo: `🌴 KeralaGo` in emerald green with `Driver` subtitle.
  - Right notification bell `🔔` with red indicator dot.
- **Hero Car Banner (`DriverHeroCarBanner`)**:
  - Soft pastel Kerala rolling hills background with coconut palm silhouettes.
  - Centered modern white sedan illustration in perspective with subtle ground shadow.
  - Prominent floating **"✔ Online" / "Offline"** duty pill with emerald toggle switch (`Switch`).
- **Summary Metrics Card (`Card`)**:
  - 3-column split card with vertical dividers:
    - **12** Trips today
    - **₹1,240** Earnings
    - **4.8** Rating
- **Today's Progress Card**:
  - Header: *"Today's Progress"* on the left with milestone gift box icon (`🎁`).
  - Animated progress bar (`ProgressBar`) filled in Kerala emerald green.
- **Peak Hours Alert Card**:
  - Soft mint background with green bar chart icon.
  - Title: *"Peak hours are live!"* + subtitle: *"More ride requests in your area"*.
  - Chevron right trigger.
- **Upcoming Opportunities Section**:
  - High-demand opportunity card: *"Near MACE"*, *"High demand area"*, `+20% earnings`.
  - Action pill button with navigation arrow: *"Navigate"*.
- **Driver Navigation Bar (`BottomTabBar`)**:
  - Four driver tabs matching reference design: `Home`, `Earnings`, `Bookings`, and `Profile`.
- **Drawer / Menu BottomSheet**:
  - Allows quick testing and seamless toggle back to Customer mode (`toggleRole()`).

---

### C. Authentication Screen — `src/pages/auth/AuthScreen.tsx`
*Active when `!user` (unauthenticated)*

- **Brand Presentation**:
  - KeralaGO Emerald branding: *"God's Own Ride-Hailing Experience"*.
  - Coverage badge: *Kochi • Trivandrum • Kozhikode*.
- **Phone Number Authentication**:
  - Mobile phone input with Indian country prefix (`🇮🇳 +91`).
- **Persona Switcher**:
  - Two segmented options: **Customer (User)** and **Driver Partner**.
- **One-Tap Login Action**:
  - Logs into the selected persona and auto-routes to the corresponding dashboard.

---

## 3. State Management & Data Models

### Domain Types — `src/types/user.ts`
```typescript
export type UserRole = 'USER' | 'DRIVER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  rating?: number;
  totalRides?: number;
  isOnline?: boolean;
}
```

### Context & Hooks — `src/features/auth/AuthContext.tsx`
- **`user`**: Current user profile with mock data for both customer and driver.
- **`toggleRole()`**: Toggles active role between `USER` and `DRIVER` dynamically.
- **`setRole(role)`**: Explicitly sets active persona role.
- **`toggleDriverDuty()`**: Toggles driver `isOnline` duty status.
- **`login(role)` / `logout()`**: Manages login/logout session states.
- **`useAuth()`**: Reusable hook exposed from `src/hooks/useAuth.ts`.

---

## 4. UI Component Library (Atomic Design)

Derives all colors, typography, radii, and shadows from `src/constants/theme.ts`:

| Layer | Component | Purpose |
| :--- | :--- | :--- |
| **Atoms** | `Button` | Multi-variant buttons (primary, secondary, outline, danger) with loading & icons |
| | `Typography` | Standardized typography scale (h1–h4, body1–body2, caption, label, xs) |
| | `Icon` | Universal wrapper around `@expo/vector-icons` (Ionicons, MaterialIcons, Feather) |
| | `Badge` | Status badges (success, warning, danger, info, pink, primary) |
| | `Avatar` | Profile photos with initials fallback, online dot, and verified tick |
| | `Switch` | Platform toggle with Kerala Emerald active color |
| | `RatingStar` | Star score renderer with review count support |
| | `Radio` | Circular selector option |
| | `Divider` | Horizontal/vertical layout separator |
| | `Card` | Elevated surface container with configurable shadows |
| **Molecules** | `KeralaMapBackground` | Visual map background with backwaters, roads, landmarks, and live vehicle markers |
| | `FloatingSearchBar` | Elevated search bar with schedule time pill |
| | `FloatingMapButton` | Circular floating action buttons (SOS, Notification bell) |
| | `ServiceCategoryCard` | Service tile for Auto, Comfort, Pink Ride, Moto |
| | `LocationListItem` | Address item with category icon, title, subtitle, and divider |
| | `RoutePointRow` | Visual route row connecting pickup point and dropoff pin |
| | `StatCard` | Metric tile displaying numbers, labels, icons, and trend badges |
| | `FilterPillBar` | Horizontal scrollable category pill filters |
| | `SegmentTabs` | Pill segmented control |
| | `InfoRow` | Key-value settings and details row |
| | `ProgressBar` | Linear progress bar with percentage indicator |
| **Organisms** | `BottomSheet` | Slide-up modal / inline sheet with drag handle and backdrop |
| | `BottomTabBar` | App bottom tab navigation with active indicator |
| | `RideSelectionList` | Vehicle selection list with fare ranges and ETAs |
| | `RideRequestModal` | Full-screen driver dispatch alert with countdown animation |
| | `DriverActiveRideCard`| Passenger details, trip stage CTAs, and communications |
| | `TripCompletedCard` | Post-trip fare settlement and interactive rating card |
| | `TripHistoryItem` | Historical ride item with fare and route info |
| | `NavigationHeader` | Header bar with back button, title, and action icons |
| **Templates** | `MapScreenTemplate` | Layout skeleton with map background, top floating bar, and bottom sheet slots |
| | `ListScreenTemplate`| Layout skeleton for scrollable lists with headers and filters |
| | `DetailScreenTemplate`| Profile and detail screen layout with hero header |
| | `ModalTemplate` | Centered dialog template with backdrop |

---

## 5. Verification & Code Quality

- **TypeScript Typecheck**: `npx tsc --noEmit` passes with **0 errors**.
- **Expo Bundling**: Configured with standard `metro.config.js` and verified module resolution.
- **Documentation**: Synchronized with `work.md`, `component_registry.md`, and `architecture.md`.
