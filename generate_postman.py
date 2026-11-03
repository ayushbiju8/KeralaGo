import json
import os

default_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZWMzNTgxNjMtZDUxNi00NmJjLWI4ZTAtNzY2NTVmOTZjNzkxIiwibW9iaWxlX251bWJlciI6Iis5MTk4NDcwMTIzNDUiLCJlbWFpbCI6ImFydW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImZ1bGxfbmFtZSI6IkFydW4gS3VtYXIiLCJpYXQiOjE3OTMwMzYwMDgsImV4cCI6MTc5NTYyODAwOH0.RGBMEIm_s7hiwctX8GPPGx05hqDDk26XnbE0FMHrt44"

def make_test_script(status_code=200, save_token=False):
    lines = [
        f'pm.test("Status code is {status_code}", function () {{',
        f'    pm.response.to.have.status({status_code});',
        '});'
    ]
    if save_token:
        lines.extend([
            'var jsonData = pm.response.json();',
            'if (jsonData.token) {',
            '    pm.collectionVariables.set("jwtToken", jsonData.token);',
            '    console.log("Updated jwtToken:", jsonData.token);',
            '}'
        ])
    return {
        "listen": "test",
        "script": {
            "exec": lines,
            "type": "text/javascript"
        }
    }

def auth_headers(is_json=True):
    h = [{"key": "Accept", "value": "application/json"}]
    if is_json:
        h.append({"key": "Content-Type", "value": "application/json"})
    h.append({"key": "Authorization", "value": "Bearer {{jwtToken}}"})
    return h

postman_collection = {
    "info": {
        "_postman_id": "keralago-api-suite-v3",
        "name": "KeralaGO API Collection (Dual Auth & Production Ready)",
        "description": "Comprehensive Postman Collection covering 100% of KeralaGO APIs.\n\nIncludes:\n- Dual Authentication (MSG91 SMS/Widget + Gmail SMTP Email)\n- Explicit Sign In (`mode: LOGIN`) vs Registration (`mode: REGISTER`)\n- Automatic JWT Bearer Token Extraction & Propagation (`{{jwtToken}}`)\n- Customer Aggregated Dashboard, Wallet & Saved Places\n- Fare Estimation Engine & Dynamic Coupons\n- Complete 4-Stage Ride Lifecycle\n- Driver Partner Suite (GPS Beacon, Duty Toggle, Vehicle Documents, Earnings)\n- Safety, Emergency SOS & Grievance Tickets\n- PostgreSQL & HTML DB Visualizer",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {"key": "baseUrl", "value": "http://127.0.0.1:8000/api", "type": "string"},
        {"key": "hostUrl", "value": "http://127.0.0.1:8000", "type": "string"},
        {"key": "jwtToken", "value": default_jwt, "type": "string"},
        {"key": "customerMobile", "value": "+919847012345", "type": "string"},
        {"key": "driverMobile", "value": "+919447198765", "type": "string"},
        {"key": "demoMobile", "value": "+919999999999", "type": "string"},
        {"key": "demoOtp", "value": "9999", "type": "string"},
        {"key": "devOtp", "value": "1234", "type": "string"},
        {"key": "testEmail", "value": "couplespaceofficial@gmail.com", "type": "string"},
        {"key": "rideId", "value": "latest", "type": "string"},
        {"key": "locationId", "value": "00000000-0000-0000-0000-000000000000", "type": "string"}
    ],
    "item": [
        {
            "name": "01. System & Health",
            "item": [
                {
                    "name": "Health Check",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": [{"key": "Accept", "value": "application/json"}],
                        "url": {"raw": "{{baseUrl}}/health/", "host": ["{{baseUrl}}"], "path": ["health", ""]},
                        "description": "Checks backend connectivity and returns database status and engine version."
                    }
                },
                {
                    "name": "HTML Database Visualizer Dashboard",
                    "request": {
                        "method": "GET",
                        "header": [],
                        "url": {"raw": "{{hostUrl}}/db-dashboard/", "host": ["{{hostUrl}}"], "path": ["db-dashboard", ""]},
                        "description": "Interactive HTML dashboard to inspect all users, drivers, vehicles, rides, and wallets."
                    }
                }
            ]
        },
        {
            "name": "02. Authentication & User Management (Login / Register)",
            "item": [
                {
                    "name": "1. Login (Direct - Mobile / Email)",
                    "event": [make_test_script(200, save_token=True)],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"mobile_number": "{{customerMobile}}", "role": "USER"}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/auth/login/", "host": ["{{baseUrl}}"], "path": ["auth", "login", ""]},
                        "description": "Authenticates user by mobile number or email. Returns JWT Bearer token and automatically updates {{jwtToken}}."
                    }
                },
                {
                    "name": "2. Register New Account (Direct)",
                    "event": [make_test_script(201, save_token=True)],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "full_name": "Kavya Nair",
                                "mobile_number": "+919447222333",
                                "email": "kavya@keralago.in",
                                "role": "USER"
                            }, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/auth/register/", "host": ["{{baseUrl}}"], "path": ["auth", "register", ""]},
                        "description": "Directly registers a new user into PostgreSQL, creates UserProfile, and automatically sets {{jwtToken}}."
                    }
                },
                {
                    "name": "3. Send OTP - Login (Mobile)",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"mode": "LOGIN", "mobile_number": "{{demoMobile}}", "role": "USER"}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/auth/send-otp/", "host": ["{{baseUrl}}"], "path": ["auth", "send-otp", ""]},
                        "description": "Sends login OTP to existing mobile user. Returns 404 if user is not registered."
                    }
                },
                {
                    "name": "Send OTP - Sign In (Email / Gmail SMTP)",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"mode": "LOGIN", "email": "{{testEmail}}", "role": "USER"}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/auth/send-otp/", "host": ["{{baseUrl}}"], "path": ["auth", "send-otp", ""]},
                        "description": "Sends live 4-digit login verification email to inbox via Gmail SMTP."
                    }
                },
                {
                    "name": "Send OTP - Register New User (Mobile)",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"mode": "REGISTER", "full_name": "Ayush Biju", "mobile_number": "{{demoMobile}}", "role": "USER"}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/auth/send-otp/", "host": ["{{baseUrl}}"], "path": ["auth", "send-otp", ""]},
                        "description": "Registers new user with Full Name and Mobile Number. Dispatches challenge code."
                    }
                },
                {
                    "name": "Send OTP - Register New User (Email)",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"mode": "REGISTER", "full_name": "Kavya Nair", "email": "kavya.nair.kerala@example.com", "role": "USER"}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/auth/send-otp/", "host": ["{{baseUrl}}"], "path": ["auth", "send-otp", ""]},
                        "description": "Sends new account registration code to email address via Gmail SMTP."
                    }
                },
                {
                    "name": "Verify OTP & Auto-Save JWT Bearer Token",
                    "event": [make_test_script(200, save_token=True)],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"mode": "LOGIN", "mobile_number": "{{customerMobile}}", "otp": "{{devOtp}}", "role": "USER"}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/auth/verify-otp/", "host": ["{{baseUrl}}"], "path": ["auth", "verify-otp", ""]},
                        "description": "Verifies entered OTP and returns user profile session and JWT token. Automatically saves {{jwtToken}} to collection variables!"
                    }
                },
                {
                    "name": "Verify OTP - Register User",
                    "event": [make_test_script(200, save_token=True)],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"mode": "REGISTER", "full_name": "Ayush Biju", "mobile_number": "{{demoMobile}}", "otp": "{{demoOtp}}", "role": "USER"}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/auth/verify-otp/", "host": ["{{baseUrl}}"], "path": ["auth", "verify-otp", ""]},
                        "description": "Completes registration and creates User and Profile in PostgreSQL."
                    }
                },
                {
                    "name": "Get Authenticated User Profile",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/auth/profile/", "host": ["{{baseUrl}}"], "path": ["auth", "profile", ""]},
                        "description": "Fetches profile directly using the JWT Bearer token in Authorization header."
                    }
                },
                {
                    "name": "Update User Profile & Preferences",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "PATCH",
                        "header": auth_headers(is_json=True),
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"full_name": "Arun Kumar", "email": "arun.kerala@example.com", "default_payment_method": "UPI"}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/auth/profile/", "host": ["{{baseUrl}}"], "path": ["auth", "profile", ""]},
                        "description": "Updates full name, email, and payment preferences in PostgreSQL database."
                    }
                },
                {
                    "name": "Quick Login (Demo Role Switching)",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": [{"key": "Content-Type", "value": "application/json"}],
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"phone": "9847012345", "role": "USER"}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/auth/login/", "host": ["{{baseUrl}}"], "path": ["auth", "login", ""]},
                        "description": "Fast 1-tap login endpoint for testing demo accounts without OTP challenge."
                    }
                }
            ]
        },
        {
            "name": "03. Customer Suite",
            "item": [
                {
                    "name": "Customer Aggregated Dashboard",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/customer/dashboard/", "host": ["{{baseUrl}}"], "path": ["customer", "dashboard", ""]},
                        "description": "Returns full aggregated data for customer app: profile, wallet balance, saved places, vehicle categories, and recent trips."
                    }
                },
                {
                    "name": "Customer Trips History",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/customer/trips/?status=all", "host": ["{{baseUrl}}"], "path": ["customer", "trips", ""], "query": [{"key": "status", "value": "all"}]},
                        "description": "Retrieves trip history with stops, vehicle details, fares, and ratings."
                    }
                },
                {
                    "name": "Update Customer Preferences",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "PATCH",
                        "header": auth_headers(is_json=True),
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"name": "Arun Kumar", "email": "arun.kerala@example.com", "quietRide": True, "acPreferred": True, "cashlessOnly": True}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/customer/profile/update/", "host": ["{{baseUrl}}"], "path": ["customer", "profile", "update", ""]},
                        "description": "Updates customer preferences (quiet ride, AC preferred, cashless only)."
                    }
                },
                {
                    "name": "Wallet Top-up",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {"mode": "raw", "raw": json.dumps({"amount": 500}, indent=2)},
                        "url": {"raw": "{{baseUrl}}/customer/wallet/topup/", "host": ["{{baseUrl}}"], "path": ["customer", "wallet", "topup", ""]},
                        "description": "Credits amount to customer in-app wallet and generates transaction ledger entry."
                    }
                },
                {
                    "name": "List Saved Locations",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/customer/locations/", "host": ["{{baseUrl}}"], "path": ["customer", "locations", ""]},
                        "description": "Fetches customer's saved favorite addresses (Home, Work, Gym, College)."
                    }
                },
                {
                    "name": "Create Saved Location",
                    "event": [make_test_script(201)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "label": "College",
                                "title": "MACE Engineering College",
                                "address": "College Junction, Kothamangalam",
                                "icon": "school-outline",
                                "latitude": 10.0542,
                                "longitude": 76.6185
                            }, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/customer/locations/", "host": ["{{baseUrl}}"], "path": ["customer", "locations", ""]},
                        "description": "Saves a new custom address for quick 1-tap navigation."
                    }
                },
                {
                    "name": "Delete Saved Location",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "DELETE",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/customer/locations/{{locationId}}/", "host": ["{{baseUrl}}"], "path": ["customer", "locations", "{{locationId}}", ""]},
                        "description": "Deletes a saved location bookmark by UUID."
                    }
                }
            ]
        },
        {
            "name": "04. Rides, Fares & Coupons",
            "item": [
                {
                    "name": "Estimate Fares",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "pickup_lat": 10.054,
                                "pickup_lng": 76.618,
                                "dest_lat": 10.027,
                                "dest_lng": 76.308
                            }, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/rides/estimate-fare/", "host": ["{{baseUrl}}"], "path": ["rides", "estimate-fare", ""]},
                        "description": "Uses Haversine distance and FareConfig to calculate prices across Auto, Hatchback, Sedan, SUV, EV."
                    }
                },
                {
                    "name": "List Available Coupons",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/coupons/", "host": ["{{baseUrl}}"], "path": ["coupons", ""]},
                        "description": "Returns active promotional coupons with discount limits."
                    }
                },
                {
                    "name": "Apply Coupon",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {"mode": "raw", "raw": json.dumps({"code": "KERALAGO50", "fare": 140}, indent=2)},
                        "url": {"raw": "{{baseUrl}}/rides/apply-coupon/", "host": ["{{baseUrl}}"], "path": ["rides", "apply-coupon", ""]},
                        "description": "Validates promo code and calculates discount amount and final fare."
                    }
                },
                {
                    "name": "Request / Book Ride",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({
                                "category": "auto",
                                "pickup": {
                                    "title": "MACE Hostels",
                                    "address": "M B Hostel, Kothamangalam",
                                    "lat": 10.0542,
                                    "lng": 76.6185
                                },
                                "destination": {
                                    "title": "Mar Athanasius College",
                                    "address": "College Junction, Kothamangalam",
                                    "lat": 10.0512,
                                    "lng": 76.6231
                                },
                                "fare": 120
                            }, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/rides/request/", "host": ["{{baseUrl}}"], "path": ["rides", "request", ""]},
                        "description": "Creates ride in database, assigns vehicle/driver, and generates 4-digit OTP PIN."
                    }
                },
                {
                    "name": "Get Active In-Flight Ride",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/rides/active/", "host": ["{{baseUrl}}"], "path": ["rides", "active", ""]},
                        "description": "Returns currently ongoing ride (REQUESTED, ACCEPTED, DRIVER_ARRIVED, IN_PROGRESS)."
                    }
                },
                {
                    "name": "Get Ride Detail",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/rides/{{rideId}}/", "host": ["{{baseUrl}}"], "path": ["rides", "{{rideId}}", ""]},
                        "description": "Returns full details of a specific ride by ID or 'latest'."
                    }
                },
                {
                    "name": "Cancel Ride",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"reason": "Driver arrived late", "cancelled_by": "USER"}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/rides/{{rideId}}/cancel/", "host": ["{{baseUrl}}"], "path": ["rides", "{{rideId}}", "cancel", ""]},
                        "description": "Cancels active ride with reason and logs cancellation record."
                    }
                }
            ]
        },
        {
            "name": "05. Ride Lifecycle Progression (Driver Simulation)",
            "item": [
                {
                    "name": "Stage 2: Driver Arrived at Pickup",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {"mode": "raw", "raw": json.dumps({"status": "DRIVER_ARRIVED"}, indent=2)},
                        "url": {"raw": "{{baseUrl}}/rides/{{rideId}}/update-status/", "host": ["{{baseUrl}}"], "path": ["rides", "{{rideId}}", "update-status", ""]},
                        "description": "Transitions trip status to DRIVER_ARRIVED when driver reaches pickup point."
                    }
                },
                {
                    "name": "Stage 3: Start Trip with OTP PIN",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {"mode": "raw", "raw": json.dumps({"status": "IN_PROGRESS", "pin": "4821"}, indent=2)},
                        "url": {"raw": "{{baseUrl}}/rides/{{rideId}}/update-status/", "host": ["{{baseUrl}}"], "path": ["rides", "{{rideId}}", "update-status", ""]},
                        "description": "Verifies passenger 4-digit PIN, starts trip, and marks status IN_PROGRESS."
                    }
                },
                {
                    "name": "Stage 4: End Trip & Settle Fare",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {"mode": "raw", "raw": json.dumps({"status": "COMPLETED", "distance_km": 6.8, "duration_minutes": 20}, indent=2)},
                        "url": {"raw": "{{baseUrl}}/rides/{{rideId}}/update-status/", "host": ["{{baseUrl}}"], "path": ["rides", "{{rideId}}", "update-status", ""]},
                        "description": "Completes trip, generates RideSettlement (15% platform / 85% driver net), and credits DriverLedgerEntry."
                    }
                }
            ]
        },
        {
            "name": "06. Driver Partner Suite",
            "item": [
                {
                    "name": "Driver Dashboard",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/driver/dashboard/", "host": ["{{baseUrl}}"], "path": ["driver", "dashboard", ""]},
                        "description": "Driver duty metrics, vehicle status card, earnings summary, and GPS position."
                    }
                },
                {
                    "name": "Toggle Duty (Online / Offline)",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {"mode": "raw", "raw": "{}"},
                        "url": {"raw": "{{baseUrl}}/driver/duty/toggle/", "host": ["{{baseUrl}}"], "path": ["driver", "duty", "toggle", ""]},
                        "description": "Switches driver availability between ONLINE and OFFLINE in the database."
                    }
                },
                {
                    "name": "Driver Ride Bookings History",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/driver/trips/", "host": ["{{baseUrl}}"], "path": ["driver", "trips", ""]},
                        "description": "Fetches driver's completed and assigned rides with customer names and earnings."
                    }
                },
                {
                    "name": "Driver Earnings & Analytics",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/driver/earnings/", "host": ["{{baseUrl}}"], "path": ["driver", "earnings", ""]},
                        "description": "Returns today's earnings, 7-day weekly breakdown, and recent ledger entries."
                    }
                },
                {
                    "name": "Driver Vehicle Details & Documents",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "GET",
                        "header": auth_headers(is_json=False),
                        "url": {"raw": "{{baseUrl}}/driver/vehicle/", "host": ["{{baseUrl}}"], "path": ["driver", "vehicle", ""]},
                        "description": "Returns vehicle make, model, registration plate, RC validity, commercial permit, and insurance validity."
                    }
                },
                {
                    "name": "Driver Location Update (GPS Beacon)",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {"mode": "raw", "raw": json.dumps({"latitude": 10.0542, "longitude": 76.6185, "accuracy": 4.5}, indent=2)},
                        "url": {"raw": "{{baseUrl}}/driver/location/update/", "host": ["{{baseUrl}}"], "path": ["driver", "location", "update", ""]},
                        "description": "Sends driver's live GPS coordinates to DriverCurrentLocation table."
                    }
                }
            ]
        },
        {
            "name": "07. Safety, Reviews & Support",
            "item": [
                {
                    "name": "Submit 5-Star Ride Review",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {"mode": "raw", "raw": json.dumps({"rating": 5, "comment": "Excellent and safe driving! Very clean vehicle."}, indent=2)},
                        "url": {"raw": "{{baseUrl}}/reviews/submit/", "host": ["{{baseUrl}}"], "path": ["reviews", "submit", ""]},
                        "description": "Submits bilateral review score and comment into support_review table."
                    }
                },
                {
                    "name": "Trigger Emergency SOS Alert",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {"mode": "raw", "raw": json.dumps({"latitude": 10.0542, "longitude": 76.6185, "message": "Emergency SOS triggered from passenger app"}, indent=2)},
                        "url": {"raw": "{{baseUrl}}/support/sos/", "host": ["{{baseUrl}}"], "path": ["support", "sos", ""]},
                        "description": "Logs distress beacon in support_sosalert with live GPS coordinates for Police & Emergency contacts."
                    }
                },
                {
                    "name": "Submit Support Ticket",
                    "event": [make_test_script(200)],
                    "request": {
                        "method": "POST",
                        "header": auth_headers(is_json=True),
                        "body": {
                            "mode": "raw",
                            "raw": json.dumps({"subject": "AC Refusal Complaint", "category": "VEHICLE_CONDITION", "description": "Driver refused to turn on AC during daytime heat."}, indent=2)
                        },
                        "url": {"raw": "{{baseUrl}}/support/ticket/", "host": ["{{baseUrl}}"], "path": ["support", "ticket", ""]},
                        "description": "Creates customer grievance ticket in support_supportticket table."
                    }
                }
            ]
        }
    ]
}

# Write collection to root and backend directories
root_path = os.path.join(os.path.dirname(__file__), 'KeralaGO_Postman_Collection.json')
backend_path = os.path.join(os.path.dirname(__file__), 'backend', 'KeralaGO_Postman_Collection.json')

with open(root_path, 'w', encoding='utf-8') as f:
    json.dump(postman_collection, f, indent=2)

with open(backend_path, 'w', encoding='utf-8') as f:
    json.dump(postman_collection, f, indent=2)

print(f"Generated Updated Postman Collection at {root_path} and {backend_path}")
