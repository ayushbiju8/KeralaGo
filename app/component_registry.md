# KeralaGo Frontend — Component Registry

This catalog maintains all reusable UI components structured according to Atomic Design.
Every new component must be registered here upon implementation.

**Rule 15 — Component Reuse Protocol:**
Before creating ANY new component:
1. Search this registry to see if a component already handles the requirement.
2. Extend existing components with variants or optional props rather than duplicating.
3. Keep Atoms domain-agnostic and presentational.
4. If a new component is genuinely needed, ask the user explicitly before creating it.

Import components only from barrel files:
- `import { Button, Typography } from '@/components/atoms'`
- `import { FloatingSearchBar } from '@/components/molecules'`
- `import { NavigationHeader } from '@/components/organisms'`
- `import { MapScreenTemplate } from '@/components/templates'`

---

## Design System Tokens — `src/constants/theme.ts`

| Export | Description | Status |
| :--- | :--- | :--- |
| `Colors` | Full Kerala emerald palette + status + neutrals | ✅ Implemented |
| `FontSize` | xs → display type scale | ✅ Implemented |
| `FontWeight` | regular → extraBold | ✅ Implemented |
| `Spacing` | 4pt grid: none → 5xl | ✅ Implemented |
| `Radii` | none → full (9999) | ✅ Implemented |
| `Shadows` | none → xl + card + float | ✅ Implemented |
| `ZIndex` | base → tooltip | ✅ Implemented |
| `Duration` | instant → verySlow | ✅ Implemented |
| `IconSize` | xs (12) → 2xl (32) | ✅ Implemented |
| `AvatarSize` | xs (24) → xl (88) | ✅ Implemented |
| `Theme` | Consolidated object | ✅ Implemented |

---

## Global Styles — `src/styles/globalStyles.ts`

Utility StyleSheet with flex, layout, background, padding, margin, border, and text helpers.
Import as `gs` for quick utility classes.

---

## 1. Atoms — `src/components/atoms/`

Smallest foundational building blocks. Must never depend on domain models, features, or complex state.
**Always import from `@/components/atoms` (barrel index).**

| Component | File | Key Props / Variants | Status |
| :--- | :--- | :--- | :--- |
| `Button` | `atoms/Button.tsx` | `variant`: primary, secondary, outline, ghost, danger, fab; `size`: sm, md, lg; `loading`, `disabled`, `leftIcon`, `rightIcon`, `fullWidth` | ✅ Implemented |
| `Typography` | `atoms/Typography.tsx` | `variant`: h1, h2, h3, h4, body1, body2, caption, label, xs; `weight`, `color`, `align`, `numberOfLines` | ✅ Implemented |
| `Icon` | `atoms/Icon.tsx` | `library`: Ionicons, MaterialIcons, MaterialCommunityIcons, Feather; `name`, `size` (IconSizeKey or number), `color` | ✅ Implemented |
| `Badge` | `atoms/Badge.tsx` | `variant`: success, warning, danger, info, neutral, pink, primary; `size`: sm, md; `dot` | ✅ Implemented |
| `Avatar` | `atoms/Avatar.tsx` | `src`, `name` (initials fallback), `size`: xs, sm, md, lg, xl; `online`, `verified` | ✅ Implemented |
| `Divider` | `atoms/Divider.tsx` | `orientation`: horizontal, vertical; `color`, `spacing` | ✅ Implemented |
| `Switch` | `atoms/Switch.tsx` | `value`, `onValueChange`, `disabled`, `variant`: `default`, `glass` (liquid glass glassmorphism with 3D specular bead & animated spring) | ✅ Implemented |
| `RatingStar` | `atoms/RatingStar.tsx` | `value`, `max`, `size`, `showScore`, `tripCount`, `interactive`, `onRate` | ✅ Implemented |
| `Radio` | `atoms/Radio.tsx` | `selected`, `label`, `onSelect`, `disabled` | ✅ Implemented |
| `Card` | `atoms/Card.tsx` | `shadow`: ShadowKey; `radius`: RadiusKey; `backgroundColor`, `onPress`, `bordered`, `borderColor` | ✅ Implemented |

---

## 2. Molecules — `src/components/molecules/`

Combinations of two or more atoms performing a focused UI function.
**Always import from `@/components/molecules` (barrel index).**

| Component | File | Key Composed Atoms | Used In | Status |
| :--- | :--- | :--- | :--- | :--- |
| `FloatingSearchBar` | `molecules/FloatingSearchBar.tsx` | `Icon` + `Typography` + time pill `Button` | Customer Home | ✅ Implemented |
| `FloatingMapButton` | `molecules/FloatingMapButton.tsx` | `Icon` + badge counter | All map screens (bell, location, SOS, back) | ✅ Implemented |
| `ServiceCategoryCard` | `molecules/ServiceCategoryCard.tsx` | `Icon` + `Typography` + optional `Badge` | Customer Home grid | ✅ Implemented |
| `LocationListItem` | `molecules/LocationListItem.tsx` | icon circle + `Typography` + `Divider` + chevron | Customer Home Recent list | ✅ Implemented |
| `RoutePointRow` | `molecules/RoutePointRow.tsx` | pickup dot + connector line + dropoff pin + `Typography` | Booking, Driver request, Active ride | ✅ Implemented |
| `StatCard` | `molecules/StatCard.tsx` | `Icon` + `Typography` + `Badge` (trend) + `Card` | Admin Dashboard, Driver Home | ✅ Implemented |
| `FilterPillBar` | `molecules/FilterPillBar.tsx` | scrollable `Badge`-style pills | Admin list screens, Driver Bookings | ✅ Implemented |
| `SegmentTabs` | `molecules/SegmentTabs.tsx` | pill tab switcher with `default`, `green`, and `mint` visual variants | Driver Earnings/Trips, Customer Bookings, Admin Analytics | ✅ Implemented |
| `InfoRow` | `molecules/InfoRow.tsx` | `Icon` + `Typography` + `Switch`/chevron/text right content | Profile, Settings, Vehicle Details | ✅ Implemented |
| `UserListItem` | `molecules/UserListItem.tsx` | `Avatar` + `Typography` + `RatingStar` + `Badge` + chevron | Admin Drivers/Customers lists | ✅ Implemented |
| `PaymentOptionItem` | `molecules/PaymentOptionItem.tsx` | `Icon` + `Typography` + `Radio` | Customer Payment Methods | ✅ Implemented |
| `ProgressBar` | `molecules/ProgressBar.tsx` | Animated fill bar + `Typography` label | Driver Home progress, Customer trip tracker | ✅ Implemented |
| `KeralaMapBackground` | `molecules/KeralaMapBackground.tsx` | Customer Kochi map & Driver NH-85 Kothamangalam Near MACE map with live car marker, floating controls, dynamic `offsetY` positioning, and extended lower landmarks for full-map view | Customer Home, Driver Home | ✅ Implemented |
| `DriverHeroCarBanner` | `molecules/DriverHeroCarBanner.tsx` | Kerala landscape hills, palm silhouettes, floating white duty capsule (`landscape`), and dark green floating pill (`floating-dark`) | Driver Home | ✅ Implemented |
| `SwipeButton` | `molecules/SwipeButton.tsx` | Gesture-driven horizontal slider with PanResponder, spring snap physics, animated fill trail, customizable height & knob icon, and completion threshold | Driver active ride simulation stages (Arrived at Pickup, Start Trip, End Trip) | ✅ Implemented |


---

## 3. Organisms — `src/components/organisms/`

Complex UI modules composed of atoms and molecules. Can bind to typed domain data structures.
**Always import from `@/components/organisms` (barrel index).**

| Component | File | Key Composition | Used In | Status |
| :--- | :--- | :--- | :--- | :--- |
| `NavigationHeader` | `organisms/NavigationHeader.tsx` | Back `Button` + `Typography` title + right actions slot | All detail & list screens | ✅ Implemented |
| `BottomSheet` | `organisms/BottomSheet.tsx` | Modal/inline slide-up panel & interactive gesture-driven collapsible bottom drawer (`variant="drawer"` with pull-down/pull-up pan physics) | All booking flow steps, Driver active ride, Driver Home collapsible drawer | ✅ Implemented |
| `RideSelectionList` | `organisms/RideSelectionList.tsx` | Vehicle option rows (Car, Bike, Auto, Share Taxi, Pink Ride) with ETA/price | Customer Choose a Ride | ✅ Implemented |
| `RideRequestModal` | `organisms/RideRequestModal.tsx` | 5-stage interactive driver ride simulator: 'request' (countdown ring & metrics), 'arriving' (navigation banner, route polyline, 'Arrived at Pickup'), 'arrived' (radar aura, 'Start Trip'), 'on_trip' (destination route, 'End Trip'), and 'completed' (confetti, breakdown, rating, 'Done') | Driver incoming request & full ride lifecycle | ✅ Implemented |
| `DriverActiveRideCard` | `organisms/DriverActiveRideCard.tsx` | `Avatar` + `RatingStar` + call/message buttons + stage-aware CTA | Driver Arriving/OnTrip screens | ✅ Implemented |
| `TripCompletedCard` | `organisms/TripCompletedCard.tsx` | Checkmark + fare + breakdown + `RatingStar` interactive | Customer & Driver post-trip | ✅ Implemented |
| `TripHistoryItem` | `organisms/TripHistoryItem.tsx` | Route + fare + status badge row with `default` (card style) and `compact` (timeline dot format) | Customer Bookings, Driver Trips, Admin Dashboard | ✅ Implemented |
| `DocumentVerificationRow` | `organisms/DocumentVerificationRow.tsx` | `Icon` + doc name + `Badge` (Verified/Pending/Rejected) | Driver Profile, Admin Driver Profile | ✅ Implemented |
| `BottomTabBar` | `organisms/BottomTabBar.tsx` | Tab items with active underline indicator, clean/pill icon highlight, supports Home, Earnings, Rides, Profile | All apps (Customer, Driver, Admin) | ✅ Implemented |

---

## 4. Templates — `src/components/templates/`

Page-level structural skeletons. Focus on layout slots, safe-area margins, and scroll containers.
**Always import from `@/components/templates` (barrel index).**

| Template | File | Layout Slots | Used In | Status |
| :--- | :--- | :--- | :--- | :--- |
| `MapScreenTemplate` | `templates/MapScreenTemplate.tsx` | `mapContent` (full-screen), `topContent` (floating bar), `rightButtons`, `bottomContent` (sheet) | Customer Home, Customer active ride, Driver navigation | ✅ Implemented |
| `ListScreenTemplate` | `templates/ListScreenTemplate.tsx` | `header`, `filters`, `children` (scrollable), `footer` | Admin Management, Driver Trips/Earnings, Customer Bookings | ✅ Implemented |
| `DetailScreenTemplate` | `templates/DetailScreenTemplate.tsx` | `headerOverlay`, `avatarBlock`, `statsRow`, `children` (scroll), `footer` | All Profile screens (Customer, Driver, Admin) | ✅ Implemented |
| `ModalTemplate` | `templates/ModalTemplate.tsx` | Backdrop scrim + centered card `children` | Confirmation dialogs (Suspend, Block, Blacklist) | ✅ Implemented |

---

## Component Creation Decision Flow

```
Need UI element?
       ↓
Is it in this registry?
   YES → Use it. Done.
       ↓ NO
Can existing component be extended with a new prop/variant?
   YES → Extend it. Update registry. Done.
       ↓ NO
Ask user: "Should I create a new component [Name] for this?"
   APPROVED → Create → Register here → Update work.md
   REJECTED → Find alternative
```
