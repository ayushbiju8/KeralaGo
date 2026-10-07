# KeralaGo Frontend — Architecture Guide

## 1. Architectural Pattern Overview

KeralaGo Frontend combines **Atomic Design** with **Feature-Based Modular Organization** built on React Native & Expo Router.

```
                    ┌─────────────────────────┐
                    │      Routing Layer      │
                    │       (src/app/)        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       Pages Layer       │
                    │       (src/pages/)      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Templates Layer     │
                    │(src/components/templates)│
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Organisms Layer     │
                    │(src/components/organisms)│
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Molecules Layer     │
                    │(src/components/molecules│
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       Atoms Layer       │
                    │ (src/components/atoms)  │
                    └────────────┬────────────┘
                                 │
   ┌─────────────────────────────┼─────────────────────────────┐
   │                             │                             │
┌──▼──────────┐           ┌──────▼──────┐               ┌──────▼──────┐
│ Custom Hooks│           │   Services  │               │ Design Tokens│
│(src/hooks/) │           │(src/services│               │/ Constants  │
└──────┬──────┘           └──────┬──────┘               └─────────────┘
       │                         │
       └───────────┬─────────────┘
                   │
            ┌──────▼──────┐
            │ Backend API │
            └─────────────┘
```

---

## 2. Directory Structure & Responsibilities

```
app/
├── project_rules.md            # Non-negotiable engineering rules & DoD
├── work.md                     # Living development log & change history
├── architecture.md            # System architecture, boundaries & design decisions
├── feature_plan.md             # Feature roadmap, screen inventory, implementation status
├── component_registry.md       # Catalog of reusable Atoms, Molecules, Organisms
├── README.md                   # Setup, running instructions, and project orientation
│
├── assets/                     # Static icons, splash screens, vector images
└── src/
    ├── app/                    # Expo Router route definitions only
    │   ├── _layout.tsx         # Root layout with providers & auth gate
    │   ├── index.tsx           # Route splash / entry point
    │   ├── routes/             # Route path constants & typed navigation helpers
    │   ├── providers/          # Global application context providers (Theme, Auth, Query)
    │   └── config/             # Environment, feature flags, app constants
    │
    ├── components/             # Global Atomic Design UI components
    │   ├── atoms/              # Smallest building blocks: Button, Input, Icon, Badge, Spinner
    │   ├── molecules/          # Reusable compositions: SearchBar, FormField, PriceBadge
    │   ├── organisms/          # Complex multi-molecule components: RideCard, DriverCard, MapPanel
    │   └── templates/          # Structural page layouts: DashboardTemplate, BookingTemplate
    │
    ├── features/               # Domain-driven feature modules
    │   ├── auth/               # OTP login, session restore, role verification
    │   ├── booking/            # Pickup/drop selection, fare estimation, ride confirmation
    │   ├── rides/              # Active ride tracking, ETA, live status, OTP verification
    │   ├── drivers/            # Driver onboarding, vehicle registration, active availability
    │   ├── payments/           # UPI, cash, wallet management, payment verification
    │   ├── profile/            # User profile, history, emergency contacts, preferences
    │   └── admin/              # Fleet oversight, driver approvals, dispute handling
    │
    ├── pages/                  # Full-screen assemblies for each user persona
    │   ├── customer/           # Customer views: Home, SelectRide, ActiveRide, RideReceipt
    │   ├── driver/             # Driver views: DutyToggle, IncomingRequest, Navigation, Earnings
    │   └── admin/              # Admin views: DriverVerification, LiveFleet, Reports
    │
    ├── hooks/                  # Reusable custom React hooks (lifecycle, state, devices)
    ├── services/               # API clients, HTTP wrappers, WebSocket connections
    ├── store/                  # Client state stores (Auth, active ride session)
    ├── utils/                  # Pure helper functions (formatters, validators, calculations)
    ├── constants/              # Design tokens (colors, typography, spacing) and configs
    ├── types/                  # TypeScript interfaces and domain type definitions
    ├── assets/                 # App-specific bundled SVGs and assets
    └── styles/                 # Shared styling utilities and animations
```

---

## 3. Strict Layering & Separation of Concerns

### A. The Atomic Hierarchy
1. **Atoms** (`src/components/atoms/`):
   - Stateless, purely presentational.
   - Strictly domain-agnostic: No knowledge of rides, bookings, or drivers.
   - Example: `<Button variant="primary" title="Confirm" />`, `<Typography variant="h2" />`.
2. **Molecules** (`src/components/molecules/`):
   - Combine two or more atoms to perform a single UI task.
   - Still largely domain-agnostic or lightweight domain wrappers.
   - Example: `<FormField label="Phone" atom={<Input />} />`, `<LocationInput onSelect={...} />`.
3. **Organisms** (`src/components/organisms/`):
   - Combine molecules and atoms into cohesive functional sections.
   - Can bind to domain models (e.g., `RideCard` binds to `Ride` type), but do not manage data fetching or global routing.
4. **Templates** (`src/components/templates/`):
   - Layout frames with slots (`children`, `header`, `footer`, `floatingAction`).
   - Manage spacing, safe-areas, and responsive grid layouts without hardcoding specific content.
5. **Pages** (`src/pages/`):
   - Connect templates with data hooks, store actions, and navigation handlers.
   - Assembled into the route files within `src/app/`.

### B. API & Data Access Architecture
- **Rule**: No UI component may ever invoke network calls directly.
- **Pattern**:
  ```
  Page / Organism
        │
        ▼ calls
  Custom Hook (`src/hooks/` or `src/features/*/hooks/`)
        │
        ▼ calls
  Service Method (`src/services/` or `src/features/*/services/`)
        │
        ▼ executes
  Centralized HTTP Client (`src/services/apiClient.ts`)
  ```
- **Benefits**:
  - Mocking API calls during testing requires mocking only the service layer.
  - Backend schema migrations and API endpoint changes are localized to services and types without touching UI components.

---

## 4. State Management Architecture

State is divided into three distinct tiers:

1. **Local UI State**:
   - Managed via React's `useState` and `useReducer`.
   - Used for toggles, accordion expansion, input drafts, and local modal visibility.
   - Kept as close to the leaf components as possible.
2. **Shared Application / Auth State**:
   - Managed via React Context / lightweight store in `src/store/`.
   - Used for authenticated user info, active session tokens, theme preferences, and global connectivity status.
3. **Server & Async Cache State**:
   - Managed via specialized query/fetch hooks with loading, error, success, and cache invalidation.
   - Avoid duplicating server responses into global store slices unless actively mutated across multiple disconnected flows.

---

## 5. Security & Authentication Architecture

1. **Role-Based Access Control (RBAC)**:
   - User types: `CUSTOMER`, `DRIVER`, `ADMIN`, `SUPER_ADMIN`.
   - Route level protection: `src/app/_layout.tsx` validates session and role before rendering persona routes.
2. **Secure Token Vault**:
   - JWT access and refresh tokens are stored exclusively in native secure storage (`expo-secure-store`).
   - Web fallbacks use encrypted storage or secure cookies where applicable.
3. **Secret Isolation**:
   - All secret keys remain on the backend.
   - Only public configuration variables prefixed with `EXPO_PUBLIC_` exist in the client.

---

## 6. Performance & Bundle Optimization Strategy

1. **Tree-Shaking & Dead-Code Elimination**:
   - Explicit named exports over wildcard imports (`import * as ...`).
   - Regular verification that deleted features leave zero orphaned files, imports, or assets.
2. **Virtualization**:
   - High-volume data feeds (driver search, ride logs, transaction histories) use virtualized lists with `getItemLayout` optimization.
3. **Asset Discipline**:
   - Vector graphics (SVG / Lucide / Material Symbols) for all icons.
   - Highly compressed WebP images for illustrations.
4. **Re-render Prevention**:
   - Stable references for callbacks passed down to list items via `useCallback`.
   - Pure component memoization via `React.memo` where profiler shows high re-render cost.

---

## 7. Error Handling & Resilience Architecture

1. **5-State Asynchronous Standard**:
   Every async data flow must handle:
   - `Loading` (animated skeleton or spinner)
   - `Success` (rendered data view)
   - `Empty` (friendly empty-state illustration and guidance)
   - `Error` (sanitized message preventing technical detail leakage)
   - `Retry` (one-tap retry trigger)
2. **React Error Boundaries**:
   - Top-level and section-level error boundaries isolate crashes in specific components (e.g., map panel) from bringing down the entire application.
