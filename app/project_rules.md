# KeralaGo Frontend — Project Rules

## CRITICAL

These rules are mandatory and non-negotiable.

Before modifying ANY code, the agent MUST:
1. Read this file (`project_rules.md`).
2. Read `work.md`.
3. Read `architecture.md`.
4. Inspect the existing implementation.
5. Understand the impact of the requested change.
6. Check for reusable existing components in `component_registry.md`.
7. Ask for clarification if requirements are ambiguous.
8. Never guess about critical architecture, data models, or business logic.

After modifying code, the agent MUST:
1. Review the changed code.
2. Check for errors and stability.
3. Run lint/type checks (`npx tsc --noEmit`, `npx expo lint`).
4. Run relevant tests.
5. Verify the application builds / runs without runtime crashes.
6. Remove unused code and imports.
7. Check for duplicated logic.
8. Update `work.md` with every change.
9. Update `architecture.md` if an architectural decision changed.
10. Update `component_registry.md` if components were added or changed.
11. Clearly report what was changed and any remaining issues.

---

## 1. Strict "Before Coding" Protocol

Every single time the agent receives a coding request:
1. **Read `project_rules.md`**: Understand the constraints and requirements.
2. **Read `work.md`**: Track previous progress, context, and decisions.
3. **Read `architecture.md`**: Confirm architectural layering and boundaries.
4. **Inspect existing files**: Check active implementations and patterns.
5. **Identify affected files**: Map out all dependencies and consumers.
6. **Check reusable components**: Always consult `component_registry.md` before creating new UI elements.
7. **Explain proposed change**: State clearly what will be implemented and why.
8. **Clarify ambiguities**: If requirements affect architecture, authentication, authorization, API contracts, routing, or state, ask before implementing.
9. **Implement with precision**: Write modular, typed, clean code.
10. **Type & Lint Checks**: Execute `npx tsc --noEmit` and lint checks.
11. **Review implementation**: Verify backward compatibility and correctness.
12. **Dead-Code Cleanup**: Eliminate orphaned variables, functions, components, hooks, imports, or files.
13. **Update `work.md`**: Record timestamped work log.
14. **Update `architecture.md` & `component_registry.md`**: Keep architecture docs current.

---

## 2. "Do Not Break Existing Work" Rule

- Never modify working functionality merely to make a new feature easier to implement.
- Before changing any existing component:
  - Determine all consumer components and screens.
  - Determine what state, props, or behavior depends on it.
  - Ensure the change is fully backward-compatible.
  - Prefer extending reusable components (via props/variants) over duplicating them or rewriting them from scratch.
  - Refactor only when there is a clear, documented benefit.

---

## 3. Atomic Design Hierarchy & Boundaries

We adhere to a strict Atomic Design methodology combined with feature-based encapsulation.

### Hierarchy & Dependency Flow
```
Pages / Screens
      ↓
  Templates
      ↓
  Organisms
      ↓
  Molecules
      ↓
    Atoms
      ↓
Hooks / Services / Utilities / Constants
```

### Dependency Direction Rules
- **Atoms**: Smallest reusable elements (`Button`, `Input`, `Typography`, `Icon`, `Badge`, `Avatar`, `Divider`, `Spinner`).
  - Must NEVER depend on Molecules, Organisms, Templates, Pages, or Feature business logic.
  - An `Input` knows nothing about rides. A `Button` knows nothing about drivers.
- **Molecules**: Compositions of atoms (`SearchBar`, `LocationInput`, `PriceBadge`, `DriverStatus`, `RideOption`, `FormField`).
  - May depend only on Atoms and utility helpers. Must not depend on Organisms or Pages.
- **Organisms**: Complex reusable UI sections (`RideCard`, `DriverCard`, `BookingCard`, `MapPanel`, `PaymentSection`, `NavigationHeader`).
  - Composed of Molecules and Atoms. Can connect to feature domain models, but remain decoupled from full-page orchestration.
- **Templates**: Page-level layout skeletons (`DashboardTemplate`, `BookingTemplate`, `ProfileTemplate`, `ManagementTemplate`).
  - Define wireframe layout structure; receive content via slots/props.
- **Pages**: Actual navigable screens inside `src/pages/` or route wrappers in `src/app/`.
  - Connect store, hooks, and services to templates and organisms.
- **Pragmatic Creation Rule**: Do not create an atom/molecule merely to satisfy Atomic Design. Create a reusable component only when reuse or separation of responsibility justifies it. Avoid over-fragmentation into hundreds of unnecessary files.

---

## 4. API & Service Separation

- **Zero Inline API Calls**: Components must NEVER directly call `fetch()`, `axios`, or backend endpoints.
  ```
  UI Component (e.g., DriverList)
        ↓
  Custom Hook (e.g., useDrivers())
        ↓
  Service Layer (e.g., driverService.getDrivers())
        ↓
  API Client (e.g., apiClient.get('/drivers'))
  ```
- Services handle endpoint paths, headers, payload serialization, and response parsing.
- Hooks handle component lifecycle, loading, error, caching, and state binding.
- UI components strictly consume data and callbacks provided by hooks.

---

## 5. TypeScript & Type Safety Standards

- **Strict Mode**: TypeScript strict mode is enabled and enforced.
- **No `any`**: The use of `any` is forbidden unless explicitly approved and documented with a valid technical reason. Use `unknown`, generic parameters, or explicit interfaces.
- **Shared Domain Models**: All core models reside in `src/types/`:
  - `user.ts`
  - `driver.ts`
  - `vehicle.ts`
  - `ride.ts`
  - `booking.ts`
  - `payment.ts`
  - `api.ts`
- Props interfaces must be exported alongside components.

---

## 6. Strict Error Handling & Async States

Every asynchronous UI flow and data-fetching operation must explicitly account for the 5 states:
1. **Loading State**: Skeletons, spinners, or disabled interaction states.
2. **Success State**: Clean rendering of data.
3. **Empty State**: Friendly, actionable message when data arrays are empty (e.g., "No drivers available near you").
4. **Error State**: User-friendly error message (never raw stack traces or internal codes).
5. **Retry Action**: An accessible button or pull-to-refresh to retry the failed operation.
- **No Blank Screens**: An unhandled rejection or missing UI state must never result in a blank white screen.

---

## 7. Production Security Rules

- **Zero Secrets on Client**:
  - NEVER store API secrets, database credentials, private keys, payment secret keys, JWT signing keys, or admin passcodes in frontend code or environment variables.
  - Only public/publishable keys (e.g., `EXPO_PUBLIC_API_URL`, publishable map keys) belong in client env files.
- **Client-Side Authorization Is Cosmetic**:
  - The client hides/shows UI for user convenience, but the backend must enforce all permissions and access control.
  - Never trust data coming from client storage without server validation.
- **Sanitize User Content**: Sanitize and escape all user-generated strings before display.
- **Safe Error Messaging**: Mask internal server errors (500, database exceptions) into safe, generic messages.
- **Secure Token Storage**: Store authentication tokens using secure storage mechanisms (`expo-secure-store` or equivalent secure native vaults).

---

## 8. Role-Based Access Control (RBAC)

Supported Roles:
- `CUSTOMER`
- `DRIVER`
- `ADMIN`
- `SUPER_ADMIN`

Rules:
- Never sprinkle arbitrary inline boolean checks throughout components.
- Use explicit role and permission definitions from `src/types/auth.ts` or RBAC helper functions (e.g., `hasPermission(user, 'drivers.manage')`).
- Guard routes and screens at the layout / navigator level.

---

## 9. Performance & Memory Discipline

- **Smallest Viable Footprint**:
  - Optimize bundle size, dependencies, duplicated logic, assets, and runtime work.
  - Do NOT install an npm package for something achievable with clean, native TypeScript/React Native code.
- **Asset Optimization**:
  - Compress all images. Prefer WebP/vector SVGs over massive PNG/JPEG files.
  - Never ship unnecessarily high-resolution assets for small icons or thumbnails.
- **Rendering & Memory**:
  - Memoize expensive calculations (`useMemo`) and callbacks (`useCallback`) where appropriate.
  - Avoid unnecessary re-renders, inline objects in render loops, and memory leaks in event listeners/timers.
- **List Virtualization**:
  - Use `FlatList`, `SectionList`, or virtualized lists for large feeds (drivers, rides, transactions). Never map massive arrays inside a basic `ScrollView`.
- **Code Splitting & Lazy Loading**:
  - Lazy-load heavy administrative modules, complex charts, or deep secondary screens.

---

## 10. Dead-Code Cleanup & Dependency Discipline

- **Mandatory Dead-Code Sweeps**: Whenever a feature, component, hook, or utility is replaced or refactored:
  - Search for and delete all orphaned files, imports, styles, and assets.
  - Never leave dead files (`OldRideCard.tsx`, `useOldRide.ts`, etc.) lingering in the repository.
- **Dependency Vetting**:
  - No new npm package may be added without evaluating:
    1. Can existing packages or native APIs solve this?
    2. Is the package actively maintained and compatible with Expo SDK 57 / React 19?
    3. What is its impact on the JavaScript bundle and native app binary?
    4. Does it introduce security or licensing vulnerabilities?

---

## 11. Design System & Token Uniformity

- **Token Discipline**: All styling must use design tokens from `src/constants/tokens.ts`:
  - `colors`
  - `spacing`
  - `radius`
  - `typography`
  - `shadows`
  - `layout`
- **No Hardcoded Magic Numbers**:
  - Do NOT use hardcoded colors (`#10b981`) or arbitrary margins (`margin: 17`) across components.
  - Use token variables (`colors.primary`, `spacing.md`, `radius.lg`).
- Maintain consistent visual aesthetics: clean, modern, accessible typography, sufficient color contrast, and refined micro-interactions.

---

## 12. Accessibility (a11y) & Responsive UI

- **Accessibility**:
  - Provide `accessibilityLabel`, `accessibilityRole`, and `accessibilityHint` for interactive elements.
  - Ensure minimum touch target size (at least 44x44 points) for mobile buttons and hit slops.
  - Maintain WCAG AA color contrast standards.
- **Responsive Layout**:
  - Mobile-first approach that gracefully scales to tablets and web viewports.
  - Use `SafeAreaView` from `react-native-safe-area-context` to respect notches, dynamic islands, and system navigation bars.

---

## 13. Git & Change Management Standards

- Meaningful Conventional Commits:
  - `feat: add ride selection UI`
  - `fix: resolve booking state persistence issue`
  - `refactor: extract atomic ride card component`
  - `test: add booking flow unit tests`
  - `chore: remove unused dependencies`
- **Never Commit**:
  - `.env`, `.env.local`
  - Credentials, secrets, private keys
  - `node_modules`
  - Build artifacts (`.expo`, `dist`, `build`, `android/app/build`, etc.)
  - Temporary files, test scratch files, and debug logs.

---

## 14. Definition of Done (DoD)

A feature or task is NOT complete merely because it renders. It is complete only when:
- [ ] Requirement is fully implemented matching specification.
- [ ] Existing functionality verified and unbroken.
- [ ] Responsive behavior tested on mobile viewports.
- [ ] All 5 async states handled (Loading, Success, Empty, Error, Retry).
- [ ] Accessibility labels and roles verified.
- [ ] TypeScript check passes (`npx tsc --noEmit`) with zero errors.
- [ ] Lint check passes (`npx expo lint`) with zero warnings/errors.
- [ ] Console logs and debug statements removed.
- [ ] Unused imports, variables, and files completely deleted.
- [ ] No duplicate code or redundant abstractions introduced.
- [ ] `component_registry.md` updated if new components were created.
- [ ] `work.md` updated with chronological log.
- [ ] `architecture.md` updated if architectural decisions were made.
