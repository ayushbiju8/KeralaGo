import os
import django
import json
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from accounts.models import User
from accounts.authentication import generate_jwt_token

client = APIClient()

print("--- Testing KeralaGO API Endpoints (Postman Suite Validation) ---")
results = []

# Pre-authenticate client with JWT Token
user = User.objects.filter(mobile_number='+919847012345').first()
jwt_token = generate_jwt_token(user) if user else ""
if jwt_token:
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {jwt_token}')

def test_endpoint(name, method, url, data=None):
    try:
        if method == 'GET':
            res = client.get(url)
        elif method == 'POST':
            res = client.post(url, data=data, format='json')
        elif method == 'PATCH':
            res = client.patch(url, data=data, format='json')
        elif method == 'DELETE':
            res = client.delete(url)
        
        status_code = res.status_code
        is_ok = 200 <= status_code < 300
        content = res.content.decode('utf-8')[:150]
        results.append({
            'name': name,
            'method': method,
            'url': url,
            'status': status_code,
            'working': is_ok,
            'content': content
        })
        print(f"[{'PASS' if is_ok else 'FAIL'}] {method} {url} -> {status_code}")
        if not is_ok:
            print(f"   Response: {content}")
    except Exception as e:
        results.append({
            'name': name,
            'method': method,
            'url': url,
            'status': 'EXCEPTION',
            'working': False,
            'content': str(e)
        })
        print(f"[FAIL] {method} {url} -> EXCEPTION: {e}")

# 1. Health check
test_endpoint('Health Check', 'GET', '/api/health/')

# 2. Direct Register Endpoint
reg_mobile = f'+9199{random.randint(10000000, 99999999)}'
test_endpoint('Direct Register', 'POST', '/api/auth/register/', {
    'full_name': 'Test New Rider',
    'mobile_number': reg_mobile,
    'role': 'USER'
})

# 3. Direct Login Endpoint
test_endpoint('Direct Login', 'POST', '/api/auth/login/', {
    'mobile_number': '+919847012345',
    'role': 'USER'
})

# 4. Auth Send OTP (Login - MSG91 Demo Account)
test_endpoint('Send OTP - Login Mobile', 'POST', '/api/auth/send-otp/', {
    'mode': 'LOGIN',
    'mobile_number': '+919999999999',
    'role': 'USER'
})

# 3. Auth Verify OTP (Login - Returns JWT)
test_endpoint('Verify OTP - Login Mobile', 'POST', '/api/auth/verify-otp/', {
    'mode': 'LOGIN',
    'mobile_number': '+919999999999',
    'otp': '9999',
    'role': 'USER'
})

# 4. Auth Send OTP (Email Login - Live SMTP)
test_endpoint('Send OTP - Email Login', 'POST', '/api/auth/send-otp/', {
    'mode': 'LOGIN',
    'email': 'couplespaceofficial@gmail.com',
    'role': 'USER'
})

# 5. Auth Profile (JWT Bearer)
test_endpoint('Get User Profile', 'GET', '/api/auth/profile/')

# 6. Auth Profile Update
test_endpoint('Update Profile', 'PATCH', '/api/auth/profile/', {'full_name': 'Arun Kumar', 'default_payment_method': 'UPI'})

# 7. Quick Login (Demo Switching)
test_endpoint('Quick Login', 'POST', '/api/auth/login/', {'phone': '9847012345', 'role': 'USER'})

# 8. Customer Dashboard
test_endpoint('Customer Dashboard', 'GET', '/api/customer/dashboard/')

# 9. Customer Trips
test_endpoint('Customer Trips', 'GET', '/api/customer/trips/?status=all')

# 10. Customer Profile Update (Suite)
test_endpoint('Update Customer Profile Suite', 'PATCH', '/api/customer/profile/update/', {'name': 'Arun Kumar', 'email': 'arun@example.com', 'quietRide': True})

# 11. Customer Wallet Topup
test_endpoint('Wallet Top-up', 'POST', '/api/customer/wallet/topup/', {'amount': 250})

# 12. Customer Saved Locations GET & POST
test_endpoint('List Saved Locations', 'GET', '/api/customer/locations/')
test_endpoint('Create Saved Location', 'POST', '/api/customer/locations/', {'label': 'Gym', 'title': 'Gold Gym Kothamangalam', 'address': 'College Junction', 'icon': 'fitness-outline', 'latitude': 10.05, 'longitude': 76.62})

# 13. Estimate Fare
test_endpoint('Estimate Fare', 'POST', '/api/rides/estimate-fare/', {'pickup_lat': 10.054, 'pickup_lng': 76.618, 'dest_lat': 10.027, 'dest_lng': 76.308})

# 14. List Coupons
test_endpoint('List Coupons', 'GET', '/api/coupons/')

# 15. Apply Coupon
test_endpoint('Apply Coupon', 'POST', '/api/rides/apply-coupon/', {'code': 'KERALAGO50', 'fare': 120})

# 16. Request Ride
test_endpoint('Request Ride', 'POST', '/api/rides/request/', {
    'category': 'auto',
    'pickup': {'title': 'MACE Hostels', 'address': 'MACE, Kothamangalam', 'lat': 10.054, 'lng': 76.618},
    'destination': {'title': 'Lulu Mall', 'address': 'Lulu Mall, Edappally', 'lat': 10.027, 'lng': 76.308},
    'fare': 120
})

# 17. Ride Detail
test_endpoint('Ride Detail (Latest)', 'GET', '/api/rides/latest/')

# 18. Cancel Ride
test_endpoint('Cancel Ride', 'POST', '/api/rides/latest/cancel/', {'reason': 'Changed plans', 'cancelled_by': 'USER'})

# 19. Reviews Submit
test_endpoint('Submit Review', 'POST', '/api/reviews/submit/', {'rating': 5, 'comment': 'Smooth ride and polite driver'})

# 20. Driver Dashboard
test_endpoint('Driver Dashboard', 'GET', '/api/driver/dashboard/')

# 21. Driver Toggle Duty
test_endpoint('Toggle Driver Duty', 'POST', '/api/driver/duty/toggle/', {})

# 22. Submit SOS
test_endpoint('Submit SOS', 'POST', '/api/support/sos/', {'latitude': 10.054, 'longitude': 76.618, 'message': 'Test SOS Alert'})

# 23. Submit Support Ticket
test_endpoint('Submit Support Ticket', 'POST', '/api/support/ticket/', {'subject': 'AC Not Working', 'category': 'VEHICLE_CONDITION', 'description': 'The AC was broken'})

# 24. Active Ride Lookup
test_endpoint('Get Active Ride', 'GET', '/api/rides/active/')

# 25. Update Ride Status (Lifecycle Progression)
test_endpoint('Update Ride Status -> DRIVER_ARRIVED', 'POST', '/api/rides/latest/update-status/', {'status': 'DRIVER_ARRIVED'})
test_endpoint('Update Ride Status -> IN_PROGRESS', 'POST', '/api/rides/latest/update-status/', {'status': 'IN_PROGRESS', 'pin': '4821'})
test_endpoint('Update Ride Status -> COMPLETED', 'POST', '/api/rides/latest/update-status/', {'status': 'COMPLETED', 'distance_km': 6.8, 'duration_minutes': 20})

# 26. Driver Trips History
test_endpoint('Driver Trips History', 'GET', '/api/driver/trips/')

# 27. Driver Earnings Analytics
test_endpoint('Driver Earnings Analytics', 'GET', '/api/driver/earnings/')

# 28. Driver Vehicle Details
test_endpoint('Driver Vehicle Details', 'GET', '/api/driver/vehicle/')

# 29. Driver Location Update
test_endpoint('Driver Location Update', 'POST', '/api/driver/location/update/', {'latitude': 10.0542, 'longitude': 76.6185, 'accuracy': 4.2})

# 30. DB Dashboard (HTML)
test_endpoint('DB Dashboard HTML', 'GET', '/db-dashboard/')

print("\n--- Summary of tests ---")
working_count = sum(1 for r in results if r['working'])
print(f"Total: {len(results)}, Working: {working_count}, Broken: {len(results) - working_count}")
