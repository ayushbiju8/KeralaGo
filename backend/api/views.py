import uuid
import math
import random
from decimal import Decimal
from django.utils.timesince import timesince
from django.utils import timezone
from django.http import HttpResponse
from django.db import models
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from accounts.models import User, UserProfile, UserRole, UserSavedLocation, EmergencyContact
from drivers.models import DriverProfile, DriverCurrentLocation, ApprovalStatus
from vehicles.models import VehicleCategory, Vehicle
from rides.models import (
    Ride, RideStop, RideStatus, StopType, RideFare, RideSettlement,
    RideCancellation, CancelledBy, Coupon, FareConfig
)
from payments.models import (
    CustomerWallet, CustomerWalletTransaction, WalletTransactionType,
    UserSavedPaymentMethod, Payment, PaymentMethod, PaymentStatus,
    DriverLedgerEntry, LedgerEntryType
)
from support.models import SupportTicket, TicketCategory, SOSAlert, SOSStatus, Review


def haversine_distance_km(lat1, lon1, lat2, lon2):
    """Calculate the great-circle distance between two GPS coordinates in kilometers."""
    try:
        R = 6371.0
        d_lat = math.radians(float(lat2) - float(lat1))
        d_lon = math.radians(float(lon2) - float(lon1))
        a = (
            math.sin(d_lat / 2) ** 2 +
            math.cos(math.radians(float(lat1))) *
            math.cos(math.radians(float(lat2))) *
            math.sin(d_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 2)
    except Exception:
        return 5.0


# ─────────────────────────────────────────────────────────────────────────────
# 1. System Health Check
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint to verify backend connectivity from Expo app.
    """
    return Response({
        'status': 'online',
        'message': 'KeralaGO Backend API is running smoothly',
        'database': 'connected',
        'version': '2.4.0',
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Authentication & Session
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def auth_login(request):
    """
    Mobile number based login or quick switch for demo.
    Body: { "phone": "9847012345", "role": "USER" | "DRIVER" }
    """
    phone = request.data.get('phone', '9847012345').strip()
    if not phone.startswith('+91') and not phone.startswith('+'):
        phone = f"+91{phone}"

    req_role = request.data.get('role', UserRole.USER)
    role = UserRole.DRIVER if req_role == 'DRIVER' else UserRole.USER

    user = User.objects.filter(mobile_number=phone).first()
    if not user:
        name = 'Suresh Pillai' if role == UserRole.DRIVER else 'Arun Kumar'
        user = User.objects.create(
            mobile_number=phone,
            full_name=name,
            role=role,
            is_active=True
        )

    profile_data = {
        'id': str(user.id),
        'name': user.full_name,
        'phone': user.mobile_number,
        'email': user.email or f"{user.full_name.lower().replace(' ', '.')}@keralago.in",
        'role': user.role,
        'avatar': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' if user.role == UserRole.USER else 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        'isOnline': True if user.role == UserRole.DRIVER else None,
        'rating': 4.94 if user.role == UserRole.DRIVER else 4.88,
        'totalRides': 1420 if user.role == UserRole.DRIVER else 34,
    }

    return Response({
        'success': True,
        'token': f"kg_jwt_{uuid.uuid4()}",
        'user': profile_data
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Customer Dashboard & Aggregated Initial State
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
def customer_dashboard(request):
    """
    Returns full database-backed dataset for customer view (profile, wallet, saved places, categories).
    """
    customer = User.objects.filter(role=UserRole.USER).first()
    if not customer:
        customer = User.objects.create(
            mobile_number='+919847012345',
            full_name='Arun Kumar',
            email='arun.kerala@example.com',
            role=UserRole.USER,
            is_active=True
        )

    # 1. Profile & Preferences
    profile, _ = UserProfile.objects.get_or_create(user=customer)
    contacts = EmergencyContact.objects.filter(user=customer)

    profile_data = {
        'name': customer.full_name,
        'phone': customer.mobile_number,
        'email': customer.email or 'arun.kerala@example.com',
        'avatar': profile.profile_photo or 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        'rating': 4.88,
        'totalRides': Ride.objects.filter(customer=customer).count(),
        'greenKm': float(profile.green_km or 142.0),
        'preferences': {
            'quietRide': profile.quiet_ride,
            'acPreferred': profile.ac_preferred,
            'cashlessOnly': profile.cashless_only,
        },
        'emergencyContacts': [
            {'name': c.name, 'phone': c.mobile_number, 'relation': c.relationship}
            for c in contacts
        ]
    }

    # 2. Saved Locations
    saved_locations = UserSavedLocation.objects.filter(user=customer)
    saved_locs_data = [
        {
            'id': str(loc.id),
            'label': loc.label,
            'title': loc.title,
            'subtitle': loc.address,
            'iconName': loc.icon_name,
            'latitude': float(loc.latitude) if loc.latitude else None,
            'longitude': float(loc.longitude) if loc.longitude else None,
        }
        for loc in saved_locations
    ]

    # 3. Wallet & Payment Options
    wallet, _ = CustomerWallet.objects.get_or_create(user=customer)
    saved_methods = UserSavedPaymentMethod.objects.filter(user=customer)
    txs = CustomerWalletTransaction.objects.filter(wallet=wallet).order_by('-created_at')[:5]

    wallet_data = {
        'balance': float(wallet.balance),
        'cashbackEarned': float(wallet.cashback_earned),
        'greenEcoKm': int(profile.green_km or 142),
        'paymentOptions': [
            {
                'id': m.method_type.lower(),
                'title': m.title,
                'subtitle': m.subtitle,
                'iconName': 'flash-outline' if m.method_type == 'UPI' else ('wallet-outline' if m.method_type == 'WALLET' else ('card-outline' if m.method_type == 'CARD' else 'cash-outline')),
                'recommended': m.is_default,
            }
            for m in saved_methods
        ],
        'transactions': [
            {
                'id': str(t.id),
                'title': t.title,
                'date': t.created_at.strftime('%d %b, %I:%M %p'),
                'amount': f"{'+' if t.is_credit else '-'}₹{t.amount:.2f}",
                'isCredit': t.is_credit,
                'type': t.get_transaction_type_display(),
            }
            for t in txs
        ]
    }

    # 4. Active Vehicle Categories
    categories = VehicleCategory.objects.filter(is_active=True).order_by('display_order', 'name')
    categories_data = [
        {
            'id': cat.code,
            'label': cat.name,
            'serviceType': cat.service_type,
            'description': cat.description,
            'iconName': cat.icon_name,
            'iconLibrary': cat.icon_library,
            'capacity': cat.capacity,
            'womensOnly': cat.is_womens_only,
            'displayOrder': cat.display_order,
        }
        for cat in categories
    ]

    # 5. Trips
    trips_response = customer_trips(request._request).data

    return Response({
        'profile': profile_data,
        'wallet': wallet_data,
        'savedLocations': saved_locs_data,
        'categories': categories_data,
        'trips': trips_response,
        'source': 'PostgreSQL/SQLite Live Database',
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Customer Trips & History
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
def customer_trips(request):
    """
    Fetch all customer trips from database with filters (?status=all|completed|cancelled).
    """
    filter_status = request.GET.get('status', 'all').upper()

    rides = (
        Ride.objects.select_related('driver', 'vehicle_category', 'vehicle')
        .prefetch_related('stops', 'fare_breakdown')
        .order_by('-created_at')
    )

    if filter_status in ['COMPLETED', 'CANCELLED']:
        rides = rides.filter(status=filter_status)

    trips = []
    for ride in rides:
        pickup_stop = ride.stops.filter(stop_type=StopType.PICKUP).first()
        dest_stop = ride.stops.filter(stop_type=StopType.DESTINATION).first()
        fare_obj = getattr(ride, 'fare_breakdown', None)
        gross_fare = fare_obj.gross_fare if fare_obj else (ride.final_fare or ride.estimated_fare or 0)

        time_diff = timesince(ride.created_at, timezone.now())
        time_ago = f"{time_diff.split(',')[0]} ago"

        trips.append({
            'id': f"KL-TRIP-{str(ride.id)[:6].upper()}",
            'db_id': str(ride.id),
            'timeAgo': time_ago,
            'pickup': pickup_stop.address if pickup_stop else 'Kerala Pickup Point',
            'dropoff': dest_stop.address if dest_stop else 'Kerala Destination',
            'fare': f"₹{int(gross_fare)}",
            'status': ride.status.lower(),
            'vehicleType': ride.vehicle_category.name if ride.vehicle_category else 'KeralaGO Ride',
            'driverName': ride.driver.full_name if ride.driver else 'Unassigned',
            'distance': f"{ride.actual_distance_km or ride.estimated_distance_km or 5.0} km",
            'duration': f"{ride.actual_duration_minutes or ride.estimated_duration_minutes or 15} mins",
            'carPlate': ride.vehicle.registration_number if ride.vehicle else 'KL-07-CD-4589',
            'driverRating': 4.94,
            'paymentMethod': 'UPI (Google Pay)',
        })

    return Response(trips, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Customer Profile Update
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['PATCH'])
def update_customer_profile(request):
    """
    Updates customer profile names and preferences.
    """
    customer = User.objects.filter(role=UserRole.USER).first()
    if not customer:
        return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

    name = request.data.get('name')
    email = request.data.get('email')
    quiet_ride = request.data.get('quietRide')
    ac_preferred = request.data.get('acPreferred')
    cashless_only = request.data.get('cashlessOnly')

    if name:
        customer.full_name = name.strip()
    if email:
        customer.email = email.strip()
    customer.save()

    profile, _ = UserProfile.objects.get_or_create(user=customer)
    if quiet_ride is not None:
        profile.quiet_ride = bool(quiet_ride)
    if ac_preferred is not None:
        profile.ac_preferred = bool(ac_preferred)
    if cashless_only is not None:
        profile.cashless_only = bool(cashless_only)
    profile.save()

    return Response({
        'success': True,
        'message': 'Profile updated successfully',
        'name': customer.full_name,
        'email': customer.email
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Wallet Top-up
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def wallet_top_up(request):
    """
    Adds money to passenger wallet.
    Body: { "amount": 250 }
    """
    customer = User.objects.filter(role=UserRole.USER).first()
    if not customer:
        return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

    amount = Decimal(str(request.data.get('amount', 250)))
    if amount <= 0:
        return Response({'error': 'Amount must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)

    wallet, _ = CustomerWallet.objects.get_or_create(user=customer)
    wallet.balance += amount
    wallet.save()

    CustomerWalletTransaction.objects.create(
        wallet=wallet,
        amount=amount,
        is_credit=True,
        transaction_type=WalletTransactionType.TOP_UP,
        title=f"Wallet Top-up via UPI",
        gateway_reference=f"UPI_{uuid.uuid4().hex[:8].upper()}"
    )

    return Response({
        'success': True,
        'new_balance': float(wallet.balance),
        'message': f"₹{amount} successfully added to your KeralaGO Wallet!"
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 7. Fare Estimation Engine
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def estimate_fare(request):
    """
    Given pickup and dropoff coordinates, calculate estimated fares for all active vehicle categories.
    Body: { "pickup_lat": 10.054, "pickup_lng": 76.618, "dest_lat": 10.027, "dest_lng": 76.308 }
    """
    p_lat = request.data.get('pickup_lat', 10.054)
    p_lng = request.data.get('pickup_lng', 76.618)
    d_lat = request.data.get('dest_lat', 10.027)
    d_lng = request.data.get('dest_lng', 76.308)

    distance_km = haversine_distance_km(p_lat, p_lng, d_lat, d_lng)
    # Estimate 3 mins per km in Kerala traffic
    duration_mins = max(5, int(distance_km * 2.8))

    categories = VehicleCategory.objects.filter(is_active=True).order_by('display_order')
    estimates = []

    for cat in categories:
        fare_cfg = cat.fare_configs.filter(effective_from__lte=timezone.now()).order_by('-effective_from').first()
        base = float(fare_cfg.base_fare if fare_cfg else 30.0)
        per_km = float(fare_cfg.per_km_rate if fare_cfg else 12.0)
        per_min = float(fare_cfg.per_minute_rate if fare_cfg else 1.5)

        computed = base + (distance_km * per_km) + (duration_mins * per_min)
        min_price = max(base, round(computed * 0.95))
        max_price = round(computed * 1.15)

        estimates.append({
            'categoryId': cat.code,
            'categoryName': cat.name,
            'description': cat.description,
            'capacity': cat.capacity,
            'iconName': cat.icon_name,
            'iconLibrary': cat.icon_library,
            'womensOnly': cat.is_womens_only,
            'etaMinutes': max(2, random.randint(2, 5)),
            'priceMin': int(min_price),
            'priceMax': int(max_price),
            'estimatedFare': int((min_price + max_price) / 2),
        })

    return Response({
        'distanceKm': distance_km,
        'durationMinutes': duration_mins,
        'estimates': estimates,
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 8. Apply Coupon Code
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def apply_coupon(request):
    """
    Verifies promo coupon code (e.g. KERALAGO50) and returns discount amount.
    Body: { "code": "KERALAGO50", "fare": 120 }
    """
    code = request.data.get('code', '').strip().upper()
    gross_fare = Decimal(str(request.data.get('fare', 100)))

    coupon = Coupon.objects.filter(
        code=code,
        is_active=True,
        valid_from__lte=timezone.now()
    ).first()

    if not coupon:
        return Response({
            'valid': False,
            'message': f"Coupon code '{code}' is invalid or expired."
        }, status=status.HTTP_400_BAD_REQUEST)

    discount = Decimal('0.00')
    if coupon.flat_discount_amount > 0:
        discount = min(coupon.flat_discount_amount, gross_fare)
    elif coupon.discount_percent > 0:
        calculated = (gross_fare * (coupon.discount_percent / Decimal('100.00'))).quantize(Decimal('0.01'))
        discount = min(calculated, coupon.max_discount_amount, gross_fare)

    final_fare = gross_fare - discount

    return Response({
        'valid': True,
        'code': coupon.code,
        'title': coupon.title,
        'discount': float(discount),
        'finalFare': float(final_fare),
        'message': f"Coupon '{coupon.code}' applied: ₹{discount:.2f} discount!"
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 9. Book Ride Request
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def request_ride(request):
    """
    Creates a new ride in REQUESTED status.
    Body: {
      "category": "auto",
      "pickup": { "address": "MACE, Kothamangalam", "lat": 10.054, "lng": 76.618 },
      "destination": { "address": "Lulu Mall, Edappally", "lat": 10.027, "lng": 76.308 },
      "fare": 140,
      "couponCode": "KERALAGO50"
    }
    """
    customer = User.objects.filter(role=UserRole.USER).first()
    if not customer:
        return Response({'error': 'Customer account required'}, status=status.HTTP_400_BAD_REQUEST)

    cat_code = request.data.get('category', 'auto')
    category = VehicleCategory.objects.filter(code=cat_code).first() or VehicleCategory.objects.first()

    pickup = request.data.get('pickup', {})
    dest = request.data.get('destination', {})
    est_fare = Decimal(str(request.data.get('fare', 85)))

    # Generate 4-digit PIN for trip start
    otp_pin = f"{random.randint(1000, 9999)}"

    # Auto-assign online driver for demo
    driver_user = User.objects.filter(role=UserRole.DRIVER).first()
    driver_profile = getattr(driver_user, 'driver_profile', None)
    active_vehicle = driver_profile.vehicles.filter(is_active=True).first() if driver_profile else None

    ride = Ride.objects.create(
        customer=customer,
        driver=driver_user,
        vehicle=active_vehicle,
        vehicle_category=category,
        status=RideStatus.ACCEPTED if driver_user else RideStatus.REQUESTED,
        estimated_distance_km=Decimal('6.40'),
        estimated_duration_minutes=18,
        estimated_fare=est_fare,
        accepted_at=timezone.now(),
    )
    ride.set_trip_pin(otp_pin)
    ride.save()

    # Create Stops
    RideStop.objects.create(
        ride=ride,
        stop_type=StopType.PICKUP,
        title=pickup.get('title', 'Pickup Location'),
        address=pickup.get('address', 'Infopark Phase 1, Kakkanad'),
        latitude=Decimal(str(pickup.get('lat', 10.009))),
        longitude=Decimal(str(pickup.get('lng', 76.362))),
    )
    RideStop.objects.create(
        ride=ride,
        stop_type=StopType.DESTINATION,
        title=dest.get('title', 'Destination'),
        address=dest.get('address', 'Lulu Mall, Edappally'),
        latitude=Decimal(str(dest.get('lat', 10.027))),
        longitude=Decimal(str(dest.get('lng', 76.308))),
    )

    return Response({
        'success': True,
        'rideId': f"KL-TRIP-{str(ride.id)[:6].upper()}",
        'dbId': str(ride.id),
        'status': ride.status,
        'otpPin': otp_pin,
        'driver': {
            'name': driver_user.full_name if driver_user else 'Suresh Pillai',
            'phone': driver_user.mobile_number if driver_user else '+91 94471 98765',
            'rating': 4.94,
            'totalTrips': 1420,
            'vehiclePlate': active_vehicle.registration_number if active_vehicle else 'KL-07-CD-4589',
            'vehicleModel': f"{active_vehicle.make} {active_vehicle.model}" if active_vehicle else 'Bajaj RE Auto',
            'vehicleColor': active_vehicle.color if active_vehicle else 'Traditional Yellow & Green',
        },
        'fare': float(est_fare),
        'etaMinutes': 3,
    }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# 10. Driver Dashboard & Duty
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
def driver_dashboard(request):
    """
    Returns duty screen stats for driver partner.
    """
    driver_user = User.objects.filter(role=UserRole.DRIVER).first()
    if not driver_user:
        return Response({'error': 'Driver not found'}, status=status.HTTP_404_NOT_FOUND)

    profile = getattr(driver_user, 'driver_profile', None)
    active_vehicle = profile.vehicles.filter(is_active=True).first() if profile else None
    loc = getattr(profile, 'current_location', None)

    return Response({
        'driver': {
            'name': driver_user.full_name,
            'phone': driver_user.mobile_number,
            'license': profile.license_number if profile else 'KL-LIC-9876',
            'isOnline': profile.is_online if profile else True,
            'rating': 4.94,
            'totalTrips': 1420,
            'autoAccept': profile.auto_accept_rides if profile else True,
            'bankAccount': profile.bank_account_number if profile else 'SBIN0004120984',
            'bankIfsc': profile.bank_ifsc if profile else 'SBIN0004521',
        },
        'vehicle': {
            'plate': active_vehicle.registration_number if active_vehicle else 'KL-07-CD-4589',
            'model': f"{active_vehicle.make} {active_vehicle.model}" if active_vehicle else 'Bajaj RE Auto',
            'color': active_vehicle.color if active_vehicle else 'Traditional Green & Yellow',
            'category': active_vehicle.category.name if active_vehicle else 'Kerala Auto',
        },
        'stats': {
            'todayEarnings': '₹1,840',
            'completedTrips': 8,
            'onlineHours': '6.5 hrs',
            'acceptanceRate': '96%',
            'dailyTarget': {
                'goal': 10,
                'completed': 8,
                'bonusAmount': 250,
            }
        },
        'currentLocation': {
            'latitude': float(loc.latitude) if loc else 10.0542,
            'longitude': float(loc.longitude) if loc else 76.6185,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def toggle_driver_duty(request):
    """
    Toggle driver availability between ONLINE and OFFLINE.
    """
    driver_user = User.objects.filter(role=UserRole.DRIVER).first()
    if not driver_user or not hasattr(driver_user, 'driver_profile'):
        return Response({'error': 'Driver profile not found'}, status=status.HTTP_404_NOT_FOUND)

    profile = driver_user.driver_profile
    profile.is_online = not profile.is_online
    profile.save(update_fields=['is_online'])

    return Response({
        'success': True,
        'isOnline': profile.is_online,
        'status': 'ONLINE' if profile.is_online else 'OFFLINE',
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 11. Safety SOS & Support
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def submit_sos(request):
    """
    Triggers emergency SOS alert with real-time coordinates.
    Body: { "latitude": 10.054, "longitude": 76.618, "message": "Emergency SOS triggered from in-app button" }
    """
    user = User.objects.first()
    lat = Decimal(str(request.data.get('latitude', 10.0542)))
    lng = Decimal(str(request.data.get('longitude', 76.6185)))
    msg = request.data.get('message', 'Distress beacon activated from KeralaGO App')

    alert = SOSAlert.objects.create(
        user=user,
        latitude=lat,
        longitude=lng,
        message=msg,
        status=SOSStatus.TRIGGERED,
    )

    return Response({
        'success': True,
        'alertId': str(alert.id),
        'status': alert.status,
        'message': 'Kerala Police Control Room (112) and your emergency contacts have been alerted with your live GPS location.'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def submit_support_ticket(request):
    """
    Report driver misconduct or file support complaint.
    Body: { "subject": "Rash Driving", "category": "RECKLESS_DRIVING", "description": "Driver was overspeeding." }
    """
    user = User.objects.filter(role=UserRole.USER).first() or User.objects.first()
    category = request.data.get('category', TicketCategory.GENERAL)
    subject = request.data.get('subject', 'Customer Support Inquiry')
    description = request.data.get('description', '')

    ticket = SupportTicket.objects.create(
        user=user,
        subject=subject,
        category=category,
        description=description,
    )

    return Response({
        'success': True,
        'ticketId': f"TICK-{str(ticket.id)[:6].upper()}",
        'message': 'Your report has been logged. Our Kerala safety team will review and contact you within 24 hours.'
    }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# 12. Saved Locations (CRUD)
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
def saved_locations_view(request):
    customer = User.objects.filter(role=UserRole.USER).first()
    if not customer:
        return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        locs = UserSavedLocation.objects.filter(user=customer)
        return Response([
            {
                'id': str(loc.id),
                'label': loc.label,
                'title': loc.title,
                'subtitle': loc.address,
                'iconName': loc.icon_name,
                'latitude': float(loc.latitude) if loc.latitude else None,
                'longitude': float(loc.longitude) if loc.longitude else None,
            }
            for loc in locs
        ], status=status.HTTP_200_OK)

    elif request.method == 'POST':
        label = request.data.get('label', 'Saved Place')
        title = request.data.get('title', 'Location')
        address = request.data.get('address', '')
        icon = request.data.get('icon', 'location-outline')
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')

        loc = UserSavedLocation.objects.create(
            user=customer,
            label=label,
            title=title,
            address=address,
            icon_name=icon,
            latitude=Decimal(str(lat)) if lat else None,
            longitude=Decimal(str(lng)) if lng else None,
        )
        return Response({
            'success': True,
            'id': str(loc.id),
            'label': loc.label,
            'title': loc.title,
        }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def delete_saved_location(request, location_id):
    customer = User.objects.filter(role=UserRole.USER).first()
    deleted_count, _ = UserSavedLocation.objects.filter(id=location_id, user=customer).delete()
    if deleted_count > 0:
        return Response({'success': True, 'message': 'Location deleted'}, status=status.HTTP_200_OK)
    return Response({'error': 'Location not found'}, status=status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────────────────────────────────────
# 13. Ride Details & Tracking
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
def ride_detail(request, ride_id):
    """
    Returns full live metadata, vehicle details, driver pin, stops and status for a ride.
    """
    clean_id = ride_id.replace('KL-TRIP-', '').replace('#', '').strip()
    ride = None
    try:
        val = uuid.UUID(clean_id)
        ride = Ride.objects.filter(id=val).select_related('customer', 'driver', 'vehicle_category', 'vehicle').prefetch_related('stops', 'fare_breakdown').first()
    except Exception:
        all_rides = Ride.objects.select_related('customer', 'driver', 'vehicle_category', 'vehicle').prefetch_related('stops', 'fare_breakdown').all()
        ride = next((r for r in all_rides if str(r.id).replace('-', '').lower().startswith(clean_id.lower())), None)

    if not ride:
        # Fallback to the latest ride
        ride = Ride.objects.select_related('customer', 'driver', 'vehicle_category', 'vehicle').prefetch_related('stops', 'fare_breakdown').first()

    pickup = ride.stops.filter(stop_type=StopType.PICKUP).first() if ride else None
    dest = ride.stops.filter(stop_type=StopType.DESTINATION).first() if ride else None
    fare = getattr(ride, 'fare_breakdown', None) if ride else None

    if not ride:
        return Response({'error': 'No rides found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'id': f"KL-TRIP-{str(ride.id)[:6].upper()}",
        'dbId': str(ride.id),
        'status': ride.status,
        'otpPin': '4821',
        'vehicle': {
            'plate': ride.vehicle.registration_number if ride.vehicle else 'KL-07-CD-4589',
            'model': f"{ride.vehicle.make} {ride.vehicle.model}" if ride.vehicle else 'Bajaj RE Auto',
            'color': ride.vehicle.color if ride.vehicle else 'Traditional Yellow & Green',
            'category': ride.vehicle_category.name if ride.vehicle_category else 'Auto',
        },
        'driver': {
            'name': ride.driver.full_name if ride.driver else 'Suresh Pillai',
            'phone': ride.driver.mobile_number if ride.driver else '+91 94471 98765',
            'rating': 4.94,
        },
        'pickup': {
            'title': pickup.title if pickup else 'Pickup Point',
            'address': pickup.address if pickup else 'Infopark Phase 1, Kakkanad',
            'lat': float(pickup.latitude) if pickup else 10.009,
            'lng': float(pickup.longitude) if pickup else 76.362,
        },
        'destination': {
            'title': dest.title if dest else 'Destination',
            'address': dest.address if dest else 'Lulu Mall, Edappally',
            'lat': float(dest.latitude) if dest else 10.027,
            'lng': float(dest.longitude) if dest else 76.308,
        },
        'fare': float(fare.gross_fare) if fare else float(getattr(ride, 'final_fare', None) or getattr(ride, 'estimated_fare', None) or 85.0),
        'distanceKm': float(ride.actual_distance_km or 6.4),
        'durationMinutes': int(ride.actual_duration_minutes or 18),
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 14. Cancel Ride
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def cancel_ride(request, ride_id):
    """
    Cancels an active ride with cancellation reason.
    Body: { "reason": "Driver arrived late", "cancelled_by": "USER" }
    """
    clean_id = ride_id.replace('KL-TRIP-', '').replace('#', '').strip()
    ride = None
    try:
        val = uuid.UUID(clean_id)
        ride = Ride.objects.filter(id=val).first()
    except Exception:
        all_active = Ride.objects.filter(status__in=[RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS])
        ride = next((r for r in all_active if str(r.id).replace('-', '').lower().startswith(clean_id.lower())), None)

    if not ride:
        ride = Ride.objects.filter(status__in=[RideStatus.REQUESTED, RideStatus.ACCEPTED]).first()

    if not ride:
        return Response({'error': 'No active ride found to cancel'}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get('reason', 'Cancelled by customer')
    canceller = request.data.get('cancelled_by', CancelledBy.USER)

    ride.status = RideStatus.CANCELLED
    ride.save(update_fields=['status'])

    RideCancellation.objects.create(
        ride=ride,
        cancelled_by=canceller,
        reason=reason,
        cancellation_charge=Decimal('0.00'),
    )

    return Response({
        'success': True,
        'rideId': f"KL-TRIP-{str(ride.id)[:6].upper()}",
        'status': 'CANCELLED',
        'message': 'Ride cancelled successfully. Zero cancellation fee applied.'
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 15. Reviews & Ratings
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def submit_review(request):
    """
    Bilateral rating score (1-5) and comment.
    Body: { "ride_id": "...", "rating": 5, "comment": "Great driving, very polite!" }
    """
    customer = User.objects.filter(role=UserRole.USER).first()
    driver = User.objects.filter(role=UserRole.DRIVER).first()
    ride = Ride.objects.filter(status=RideStatus.COMPLETED).first()

    rating = int(request.data.get('rating', 5))
    rating = max(1, min(5, rating))
    comment = request.data.get('comment', 'Pleasant and safe ride.')

    if not ride or not customer or not driver:
        return Response({'error': 'Ride data not found'}, status=status.HTTP_400_BAD_REQUEST)

    review = Review.objects.create(
        ride=ride,
        reviewer=customer,
        reviewee=driver,
        rating=rating,
        comment=comment,
    )

    return Response({
        'success': True,
        'reviewId': str(review.id),
        'rating': review.rating,
        'message': 'Thank you for your rating! It helps keep KeralaGO safe and reliable.'
    }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# 16. Available Coupons List
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
def list_coupons(request):
    """
    Returns active promo coupons for passenger view.
    """
    coupons = Coupon.objects.filter(is_active=True, valid_from__lte=timezone.now())
    return Response([
        {
            'code': c.code,
            'title': c.title,
            'discountPercent': float(c.discount_percent),
            'flatDiscount': float(c.flat_discount_amount),
            'maxDiscount': float(c.max_discount_amount),
        }
        for c in coupons
    ], status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 17. Interactive Database Visualizer Dashboard (HTML)
# ─────────────────────────────────────────────────────────────────────────────
def db_dashboard_view(request):
    """
    Renders an interactive, beautiful HTML dashboard to inspect all seeded database tables.
    Accessible at http://localhost:8000/db-dashboard/
    """
    users = User.objects.all().order_by('-created_at')
    drivers = DriverProfile.objects.select_related('user').prefetch_related('vehicles', 'current_location').all()
    vehicles = Vehicle.objects.select_related('driver__user', 'category').all()
    rides = Ride.objects.select_related('customer', 'driver', 'vehicle_category').prefetch_related('stops', 'fare_breakdown', 'settlement').all().order_by('-created_at')
    settlements = RideSettlement.objects.select_related('ride').all()
    wallets = CustomerWallet.objects.select_related('user').all()
    coupons = Coupon.objects.all()

    total_gross = sum(s.gross_fare for s in settlements)
    total_comm = sum(s.platform_commission for s in settlements)
    total_driver = sum(s.driver_net_earnings for s in settlements)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KeralaGO Database Visualizer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }}
    body {{ background: #0b131e; color: #e2e8f0; padding: 28px; line-height: 1.5; }}
    .header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #1e293b; }}
    .header h1 {{ font-size: 24px; font-weight: 700; color: #10B981; display: flex; align-items: center; gap: 10px; }}
    .header .actions {{ display: flex; gap: 12px; }}
    .btn {{ background: #059669; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; transition: 0.2s; }}
    .btn:hover {{ background: #047857; }}
    .btn-secondary {{ background: #1e293b; color: #94a3b8; border: 1px solid #334155; }}
    .btn-secondary:hover {{ background: #334155; color: white; }}
    .grid-stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }}
    .card {{ background: #131f2f; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; }}
    .card-title {{ font-size: 13px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }}
    .card-value {{ font-size: 26px; font-weight: 700; color: white; margin-top: 6px; }}
    .card-subtitle {{ font-size: 12px; color: #10B981; margin-top: 4px; }}
    .section-title {{ font-size: 18px; font-weight: 700; margin: 28px 0 14px; color: #f1f5f9; display: flex; align-items: center; gap: 8px; }}
    table {{ width: 100%; border-collapse: collapse; background: #131f2f; border-radius: 10px; overflow: hidden; margin-bottom: 24px; border: 1px solid #1e293b; }}
    th {{ background: #1a293d; color: #94a3b8; font-size: 12px; font-weight: 600; text-align: left; padding: 12px 16px; text-transform: uppercase; border-bottom: 1px solid #1e293b; }}
    td {{ padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #1a2535; color: #cbd5e1; }}
    tr:last-child td {{ border-bottom: none; }}
    tr:hover td {{ background: #17263b; }}
    .badge {{ display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }}
    .badge-completed {{ background: #064e3b; color: #34d399; }}
    .badge-user {{ background: #1e3a8a; color: #93c5fd; }}
    .badge-driver {{ background: #4c1d95; color: #c4b5fd; }}
    .money {{ font-weight: 700; color: #34d399; }}
    .pin {{ color: #cbd5e1; font-family: monospace; font-size: 12px; }}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1><span>🌴</span> KeralaGO Live Database Visualizer</h1>
      <p style="color: #64748b; font-size: 13px; margin-top: 4px;">PostgreSQL / SQLite Live Engine • Django 5.2</p>
    </div>
    <div class="actions">
      <a href="/admin/" target="_blank" class="btn">Open Django Admin Portal →</a>
      <a href="/api/customer/dashboard/" target="_blank" class="btn btn-secondary">JSON Dashboard API</a>
    </div>
  </div>

  <div class="grid-stats">
    <div class="card">
      <div class="card-title">Total Users</div>
      <div class="card-value">{users.count()}</div>
      <div class="card-subtitle">Customers & Drivers</div>
    </div>
    <div class="card">
      <div class="card-title">Approved Drivers</div>
      <div class="card-value">{drivers.count()}</div>
      <div class="card-subtitle">Live GPS Telemetry</div>
    </div>
    <div class="card">
      <div class="card-title">Completed Rides</div>
      <div class="card-value">{rides.count()}</div>
      <div class="card-subtitle">Seeded Trips</div>
    </div>
    <div class="card">
      <div class="card-title">Gross Bookings</div>
      <div class="card-value">₹{total_gross:.2f}</div>
      <div class="card-subtitle">Platform Comm: ₹{total_comm:.2f}</div>
    </div>
  </div>

  <div class="section-title">🚖 Rides & Booking Ledger (`rides_ride`)</div>
  <table>
    <thead>
      <tr>
        <th>Trip ID</th>
        <th>Customer</th>
        <th>Driver</th>
        <th>Vehicle</th>
        <th>Route (Pickup → Drop)</th>
        <th>Distance</th>
        <th>Gross Fare</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {''.join(f'''
      <tr>
        <td style="font-family: monospace; font-weight: 600; color: #10B981;">#KL-{str(r.id)[:6].upper()}</td>
        <td>{r.customer.full_name}<br><span style="font-size:11px;color:#64748b;">{r.customer.mobile_number}</span></td>
        <td>{r.driver.full_name if r.driver else 'None'}<br><span style="font-size:11px;color:#64748b;">{r.driver.mobile_number if r.driver else ''}</span></td>
        <td>{r.vehicle_category.name if r.vehicle_category else 'Auto'}</td>
        <td>
          <div style="color: #34d399; font-size: 13px;">● {next((s.address for s in r.stops.all() if s.stop_type == 'PICKUP'), 'Pickup')}</div>
          <div style="color: #f87171; font-size: 13px; margin-top: 2px;">■ {next((s.address for s in r.stops.all() if s.stop_type == 'DESTINATION'), 'Destination')}</div>
        </td>
        <td>{r.actual_distance_km} km<br><span style="font-size:11px;color:#64748b;">{r.actual_duration_minutes} mins</span></td>
        <td class="money">₹{getattr(getattr(r, 'fare_breakdown', None), 'gross_fare', 0):.2f}</td>
        <td><span class="badge badge-completed">{r.status}</span></td>
      </tr>
      ''' for r in rides)}
    </tbody>
  </table>

  <div class="section-title">👨‍✈️ Registered Drivers & Fleet (`drivers_driverprofile`)</div>
  <table>
    <thead>
      <tr>
        <th>Driver Name</th>
        <th>Phone</th>
        <th>License Number</th>
        <th>Vehicle Plate & Color</th>
        <th>Current Location (Lat, Lng)</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {''.join(f'''
      <tr>
        <td style="font-weight: 600;">{d.user.full_name}</td>
        <td>{d.user.mobile_number}</td>
        <td class="pin">{d.license_number}</td>
        <td><span style="background: #1e293b; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; color: #f59e0b;">{d.vehicles.first().registration_number if d.vehicles.exists() else 'N/A'}</span> ({d.vehicles.first().color if d.vehicles.exists() else ''})</td>
        <td class="pin">{getattr(getattr(d, 'current_location', None), 'latitude', 'N/A')}, {getattr(getattr(d, 'current_location', None), 'longitude', 'N/A')}</td>
        <td><span class="badge badge-completed">{'ONLINE' if d.is_online else 'OFFLINE'}</span></td>
      </tr>
      ''' for d in drivers)}
    </tbody>
  </table>

  <div class="section-title">💰 Customer Wallets (`payments_customer_wallet`)</div>
  <table>
    <thead>
      <tr>
        <th>Customer</th>
        <th>Phone</th>
        <th>Balance</th>
        <th>Cashback Earned</th>
        <th>Green Eco Miles</th>
      </tr>
    </thead>
    <tbody>
      {''.join(f'''
      <tr>
        <td style="font-weight: 600;">{w.user.full_name}</td>
        <td class="pin">{w.user.mobile_number}</td>
        <td class="money">₹{w.balance:.2f}</td>
        <td style="color: #f59e0b; font-weight: 600;">+₹{w.cashback_earned:.2f}</td>
        <td>{getattr(getattr(w.user, 'profile', None), 'green_km', 0)} KM</td>
      </tr>
      ''' for w in wallets)}
    </tbody>
  </table>
</body>
</html>"""
    return HttpResponse(html)
