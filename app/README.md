# KeralaGo — Mobile & Web Frontend

Welcome to the **KeralaGo** mobile and web frontend application, built with React Native and Expo Router.

KeralaGo is a unified multi-modal transportation platform tailored for Kerala, connecting commuters (Auto-rickshaws, Taxis, Bikes) with verified drivers, backed by real-time dispatch, fair pricing, and regional administrative controls.

---

## 📚 Essential Control Documents

Every developer and AI agent working on this repository **MUST** consult these control documents before writing or modifying any code:

1. [**`project_rules.md`**](./project_rules.md) — Non-negotiable development rules, Atomic Design standards, security constraints, performance guidelines, Git discipline, and Definition of Done.
2. [**`work.md`**](./work.md) — Living development log and history of decisions, implementations, and pending milestones.
3. [**`architecture.md`**](./architecture.md) — System architecture, layering, API separation, state management, and role-based access control (RBAC).
4. [**`feature_plan.md`**](./feature_plan.md) — Detailed feature inventory across Customer, Driver, and Admin personas with screen roadmaps.
5. [**`component_registry.md`**](./component_registry.md) — Comprehensive catalog of reusable Atoms, Molecules, Organisms, and Templates.

---

## 🏗️ Architecture & Folder Structure

We follow a hybrid **Atomic Design + Feature-Based Encapsulation** pattern:

```
app/
├── project_rules.md          # Engineering rules & Definition of Done
├── work.md                   # Living development log
├── architecture.md          # Architecture guide & system layers
├── feature_plan.md           # Roadmap and screen inventory
├── component_registry.md     # Catalog of Atoms, Molecules, Organisms
├── README.md                 # Project orientation & running guide
│
├── assets/                   # App icons, splash screens, vector assets
└── src/
    ├── app/                  # Expo Router pages and route definitions
    │   ├── routes/           # Typed route constants
    │   ├── providers/        # Global context providers (Auth, Theme)
    │   └── config/           # App configuration and environment variables
    │
    ├── components/           # Atomic Design UI library
    │   ├── atoms/            # Smallest building blocks (Button, Input, Typography)
    │   ├── molecules/        # Compositions of atoms (LocationInput, FormField)
    │   ├── organisms/        # Domain UI sections (RideCard, DriverCard, MapPanel)
    │   └── templates/        # Structural layout frames (ScreenTemplate)
    │
    ├── features/             # Domain feature logic
    │   ├── auth/             # OTP login & session management
    │   ├── booking/          # Pickup/drop selection, fare estimation
    │   ├── rides/            # Active trip tracking, driver ETA, OTP
    │   ├── drivers/          # Driver onboarding & availability
    │   ├── payments/         # UPI, cash, and digital receipts
    │   ├── profile/          # User preferences & emergency contacts
    │   └── admin/            # Fleet management & driver verification
    │
    ├── pages/                # Screen views assembled for each persona
    │   ├── customer/         # Rider screens
    │   ├── driver/           # Driver partner screens
    │   └── admin/            # Administrative screens
    │
    ├── hooks/                # Cross-cutting custom hooks
    ├── services/             # API client, HTTP services & WebSockets
    ├── store/                # Shared application & authentication state
    ├── utils/                # Pure formatting, validation, math utilities
    ├── constants/            # Design tokens (colors, spacing, typography)
    ├── types/                # Domain TypeScript interfaces
    ├── assets/               # Bundled SVG and image assets
    └── styles/               # Shared styling utilities
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npx expo start
```

From the interactive CLI, you can launch:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for Web preview
- Scan the QR code using Expo Go on a physical device

---

## 🧪 Code Quality & Verification

Before committing any changes or marking tasks as complete, run:

```bash
# 1. Typecheck (zero errors permitted)
npx tsc --noEmit

# 2. Lint check
npx expo lint

# 3. Diagnose dependency and configuration health
npx expo-doctor
```

---

## 🔒 Security Principles

- **Zero Secrets in Frontend**: Never commit API secret keys, database credentials, or private tokens to this repository.
- **Client Security**: Frontend authorization is purely cosmetic; all business logic and permissions are strictly enforced on the backend.
- **Tokens**: Auth tokens are stored exclusively in native secure storage (`expo-secure-store`).
