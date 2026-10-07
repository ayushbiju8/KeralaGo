# KeralaGo Frontend — Component Registry

This catalog maintains all reusable UI components structured according to Atomic Design. Every new component must be registered here upon implementation.

Before creating ANY new component:
1. Search this registry to see if a component already handles the requirement.
2. Extend existing components with variants or optional props rather than duplicating.
3. Keep Atoms domain-agnostic and presentational.

---

## 1. Atoms (`src/components/atoms/`)

Smallest foundational building blocks. Must never have dependencies on domain models, features, or complex state.

| Component | Path | Key Props / Variants | Status |
| :--- | :--- | :--- | :--- |
| `Button` | `src/components/atoms/Button.tsx` | `variant`: primary, secondary, outline, ghost, danger; `size`: sm, md, lg; `loading`, `disabled`, `icon` | Planned |
| `Typography` | `src/components/atoms/Typography.tsx` | `variant`: h1, h2, h3, body1, body2, caption, label; `color`, `weight`, `align` | Planned |
| `Input` | `src/components/atoms/Input.tsx` | `type`: text, phone, password, number; `error`, `disabled`, `leftIcon`, `rightIcon` | Planned |
| `Icon` | `src/components/atoms/Icon.tsx` | `name`: symbol name; `size`, `color` | Planned |
| `Badge` | `src/components/atoms/Badge.tsx` | `variant`: success, warning, danger, neutral, primary; `size`, `label`, `dot` | Planned |
| `Avatar` | `src/components/atoms/Avatar.tsx` | `src`, `name`, `size`: sm, md, lg, xl; `badge` | Planned |
| `Divider` | `src/components/atoms/Divider.tsx` | `orientation`: horizontal, vertical; `spacing`, `color` | Planned |
| `Spinner` | `src/components/atoms/Spinner.tsx` | `size`: sm, md, lg; `color` | Planned |

---

## 2. Molecules (`src/components/molecules/`)

Combinations of two or more atoms performing a focused UI function.

| Component | Path | Key Composed Atoms | Status |
| :--- | :--- | :--- | :--- |
| `FormField` | `src/components/molecules/FormField.tsx` | `Typography` (label/error) + `Input` + helper text | Planned |
| `SearchBar` | `src/components/molecules/SearchBar.tsx` | `Input` + `Icon` + clear `Button` | Planned |
| `LocationInput` | `src/components/molecules/LocationInput.tsx` | `Icon` + `Input` + geolocation trigger button | Planned |
| `PriceBadge` | `src/components/molecules/PriceBadge.tsx` | `Typography` (currency + amount) + `Badge` (discount/surge) | Planned |
| `DriverStatus` | `src/components/molecules/DriverStatus.tsx` | `Badge` + `Avatar` + `Typography` (status indicator) | Planned |
| `RideOption` | `src/components/molecules/RideOption.tsx` | `Icon` (vehicle) + `Typography` (title, ETA) + `PriceBadge` | Planned |
| `OTPInput` | `src/components/molecules/OTPInput.tsx` | Multiple coordinated single-digit `Input` atoms | Planned |

---

## 3. Organisms (`src/components/organisms/`)

Complex UI modules composed of atoms and molecules. Can bind to typed domain data structures.

| Component | Path | Key Composition | Status |
| :--- | :--- | :--- | :--- |
| `NavigationHeader` | `src/components/organisms/NavigationHeader.tsx` | Back `Button` + `Typography` (title) + Action `Button` | Planned |
| `RideCard` | `src/components/organisms/RideCard.tsx` | `RideOption` list + fare breakdown + CTA `Button` | Planned |
| `DriverCard` | `src/components/organisms/DriverCard.tsx` | `Avatar` + `Typography` (rating) + vehicle details + contact `Button` | Planned |
| `BookingCard` | `src/components/organisms/BookingCard.tsx` | `LocationInput` (pickup & drop) + ride tier selection | Planned |
| `MapPanel` | `src/components/organisms/MapPanel.tsx` | Native map view + custom vehicle markers + route polyline | Planned |
| `PaymentSection` | `src/components/organisms/PaymentSection.tsx` | Payment method picker + fare summary + pay `Button` | Planned |
| `IncomingRideModal`| `src/components/organisms/IncomingRideModal.tsx` | Countdown circular timer + trip distance + Accept/Decline `Button`s | Planned |

---

## 4. Templates (`src/components/templates/`)

Page-level structure skeletons. Focus on layout slots, responsive containers, and safe-area margins.

| Template | Path | Layout Slots | Status |
| :--- | :--- | :--- | :--- |
| `ScreenTemplate` | `src/components/templates/ScreenTemplate.tsx` | `header`, `children`, `footer`, `scrollable`, `safeArea` | Planned |
| `AuthTemplate` | `src/components/templates/AuthTemplate.tsx` | Hero banner / illustration, form slot, footer links | Planned |
| `BookingTemplate` | `src/components/templates/BookingTemplate.tsx` | Full-screen map background + bottom sliding sheet slot | Planned |
| `DashboardTemplate`| `src/components/templates/DashboardTemplate.tsx` | Top stats header, main grid/feed slot, bottom navigation | Planned |
| `ManagementTemplate`| `src/components/templates/ManagementTemplate.tsx` | Data table / list view, filter drawer, pagination bar | Planned |
