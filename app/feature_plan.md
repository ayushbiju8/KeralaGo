# KeralaGo Frontend — Feature & Screen Plan

This document tracks all user flows, screens, and features across the KeralaGo platform.

---

## 1. User Personas & Permissions

| Role | Description | Primary Route Prefix |
| :--- | :--- | :--- |
| `CUSTOMER` | Commuter booking auto-rickshaws, cabs, or bike taxis across Kerala | `/customer/` |
| `DRIVER` | Verified auto/cab driver accepting rides, navigating, viewing earnings | `/driver/` |
| `ADMIN` | Regional operations manager approving drivers and viewing fleet data | `/admin/` |
| `SUPER_ADMIN`| Platform administrator managing platform rules, rates, and analytics | `/admin/` |

---

## 2. Feature & Screen Breakdown

### A. Authentication & Onboarding (`src/features/auth/`)
| Screen / Feature | Description | Status |
| :--- | :--- | :--- |
| Phone Number Entry | Phone input with Kerala/India formatting (+91) | Planned |
| OTP Verification | 6-digit auto-advancing OTP input with resend timer | Planned |
| Role Selection | Selection between Passenger (Customer) and Partner (Driver) | Planned |
| Profile Setup | Name, email, language preference (Malayalam / English) | Planned |

### B. Customer Experience (`src/pages/customer/`)
| Screen / Feature | Description | Status |
| :--- | :--- | :--- |
| Home / Map Overview | Current location detection, recent destinations, quick ride shortcuts | Planned |
| Location Search | Pickup and drop-off autocomplete with landmark suggestions | Planned |
| Ride Tier Selection | Vehicle types (Auto, Mini, Sedan, Bike) with dynamic fare estimates | Planned |
| Driver Matching | Searching radar animation, nearby driver broadcast, cancellation option | Planned |
| Active Trip Tracker | Real-time map route, driver ETA, vehicle number, driver phone, OTP display | Planned |
| Payment & Fare Breakdown | UPI, cash, or wallet selection; breakdown of base fare, distance, tax | Planned |
| Rating & Feedback | Driver rating (1-5 stars) and feedback tags | Planned |
| Trip History | List of completed rides with digital receipts and invoice downloads | Planned |

### C. Driver Experience (`src/pages/driver/`)
| Screen / Feature | Description | Status |
| :--- | :--- | :--- |
| Driver Dashboard | Online/Offline duty switch, daily earnings widget, acceptance rate | Planned |
| Incoming Ride Alert | Full-screen incoming request with countdown timer, fare, pickup distance | Planned |
| Pickup Navigation | Route to pickup point, call customer, start trip OTP verification | Planned |
| On-Trip Navigation | Turn-by-turn route to destination, toll/route adjustment, emergency SOS | Planned |
| Collect Payment | Fare summary, cash received confirmation or UPI QR presentation | Planned |
| Earnings & Payouts | Daily, weekly, and monthly earnings breakdown with bank payout requests | Planned |
| Vehicle & Document Vault| Driving license, RC book, insurance, permit upload & verification status | Planned |

### D. Admin Experience (`src/pages/admin/`)
| Screen / Feature | Description | Status |
| :--- | :--- | :--- |
| Operations Overview | Active drivers online, rides in progress, completion rate, daily revenue | Planned |
| Driver Verification Queue| Review submitted licenses, permits, vehicle inspection photos with approve/reject | Planned |
| Live Fleet Map | Real-time map displaying driver positions, hot zones, and demand surges | Planned |
| Dispute & Support Desk | Rider/Driver trip complaints, fare corrections, cancellation disputes | Planned |
| Fare & Surge Management | District-level minimum fare configuration and peak hours surge multiplier | Planned |

---

## 3. Implementation Phases

```
┌────────────────────────────────────────────────────────┐
│ Phase 0: Architecture & Foundation (Current)           │
│ - Directory skeleton & Control Documents               │
│ - Design Tokens & TypeScript Contracts                 │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 1: Core Atomic UI Library                        │
│ - Atoms (Button, Input, Typography, Icon, Badge)       │
│ - Molecules (LocationInput, FormField, SearchBar)      │
│ - Base Layout Templates                                │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 2: Authentication & RBAC                         │
│ - Phone + OTP Auth flow                                │
│ - Token Vault & Session Gate                           │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 3: Customer Ride Booking                         │
│ - Search -> Ride Selection -> Matching -> Tracking     │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 4: Driver Workflow & Dispatch                    │
│ - Duty Toggle -> Ride Acceptance -> Trip -> Earnings   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 5: Admin Portal & Document Verification          │
│ - Document Approval Queue -> Live Fleet -> Disputes    │
└────────────────────────────────────────────────────────┘
```
