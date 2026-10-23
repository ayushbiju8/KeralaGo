"""
Django Management Command to seed the complete KeralaGO database
Usage: python manage.py seed_db
"""

from decimal import Decimal
import uuid
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User, UserProfile, EmergencyContact, UserRole, UserSavedLocation
from drivers.models import DriverProfile, DriverCurrentLocation, DriverDocument, DocumentType, ApprovalStatus
from vehicles.models import VehicleCategory, Vehicle, ServiceType
from rides.models import FareConfig, Ride, RideStop, RideFare, RideSettlement, RideStatus, StopType, Coupon
from payments.models import (
    Payment, DriverLedgerEntry, PaymentMethod, PaymentStatus, LedgerEntryType,
    CustomerWallet, CustomerWalletTransaction, WalletTransactionType,
    UserSavedPaymentMethod, SavedMethodType
)


class Command(BaseCommand):
    help = 'Seeds initial demonstration data into KeralaGO database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting KeralaGO database seeding...'))

        # 1. Create Passenger User
        customer, created = User.objects.get_or_create(
            mobile_number='+919847012345',
            defaults={
                'full_name': 'Arun Kumar',
                'email': 'arun.kerala@example.com',
                'role': UserRole.USER,
                'is_active': True,
            }
        )
        if not created and not customer.email:
            customer.email = 'arun.kerala@example.com'
            customer.save(update_fields=['email'])

        user_profile, _ = UserProfile.objects.update_or_create(
            user=customer,
            defaults={
                'default_payment_method': 'UPI',
                'quiet_ride': True,
                'ac_preferred': True,
                'cashless_only': False,
                'green_km': Decimal('142.00'),
            }
        )

        EmergencyContact.objects.get_or_create(
            user=customer,
            mobile_number='112',
            defaults={
                'name': 'Kerala Police SOS',
                'relationship': 'State Emergency Control',
                'is_primary': True,
            }
        )
        EmergencyContact.objects.get_or_create(
            user=customer,
            mobile_number='+919847255667',
            defaults={
                'name': 'Deepa Kumar',
                'relationship': 'Spouse',
                'is_primary': False,
            }
        )

        # Saved Locations for Passenger
        saved_locs = [
            ('Home', 'Jawahar Nagar, Kadavanthra', 'Near Rajiv Gandhi Indoor Stadium, Kochi', Decimal('9.965000'), Decimal('76.301000'), 'home-outline'),
            ('Work', 'Carnival Infopark Phase 2', 'Kusumagiri PO, Kakkanad, Kochi', Decimal('10.009000'), Decimal('76.362000'), 'briefcase-outline'),
            ('Campus', 'Mar Athanasius College of Engineering', 'MACE College Junction, Kothamangalam', Decimal('10.054000'), Decimal('76.618000'), 'school-outline'),
        ]
        for label, title, addr, lat, lng, icon in saved_locs:
            UserSavedLocation.objects.get_or_create(
                user=customer,
                label=label,
                defaults={
                    'title': title,
                    'address': addr,
                    'latitude': lat,
                    'longitude': lng,
                    'icon_name': icon,
                }
            )

        # Passenger Wallet & Transactions
        wallet, _ = CustomerWallet.objects.update_or_create(
            user=customer,
            defaults={
                'balance': Decimal('420.50'),
                'cashback_earned': Decimal('185.00'),
            }
        )

        CustomerWalletTransaction.objects.get_or_create(
            wallet=wallet,
            title='Wallet Top-up via GPay',
            defaults={
                'amount': Decimal('500.00'),
                'is_credit': True,
                'transaction_type': WalletTransactionType.TOP_UP,
                'gateway_reference': 'GPAY_REF_8921',
            }
        )
        CustomerWalletTransaction.objects.get_or_create(
            wallet=wallet,
            title='Ride Fare #KL-TRIP-901',
            defaults={
                'amount': Decimal('142.00'),
                'is_credit': False,
                'transaction_type': WalletTransactionType.RIDE_PAYMENT,
            }
        )
        CustomerWalletTransaction.objects.get_or_create(
            wallet=wallet,
            title='Eco Green Ride Cashback',
            defaults={
                'amount': Decimal('25.00'),
                'is_credit': True,
                'transaction_type': WalletTransactionType.CASHBACK,
            }
        )

        # Saved Payment Methods
        UserSavedPaymentMethod.objects.get_or_create(
            user=customer,
            title='UPI (Google Pay / PhonePe)',
            defaults={
                'method_type': SavedMethodType.UPI,
                'subtitle': 'Linked ID: arun@okaxis',
                'identifier': 'arun@okaxis',
                'is_default': True,
            }
        )
        UserSavedPaymentMethod.objects.get_or_create(
            user=customer,
            title='KeralaGO Wallet',
            defaults={
                'method_type': SavedMethodType.WALLET,
                'subtitle': 'Balance: ₹420.50 available',
                'identifier': 'WALLET',
                'is_default': False,
            }
        )
        UserSavedPaymentMethod.objects.get_or_create(
            user=customer,
            title='HDFC Platinum Debit Card',
            defaults={
                'method_type': SavedMethodType.CARD,
                'subtitle': '•••• •••• •••• 4821',
                'identifier': '4821',
                'is_default': False,
            }
        )
        UserSavedPaymentMethod.objects.get_or_create(
            user=customer,
            title='Cash on Arrival',
            defaults={
                'method_type': SavedMethodType.CASH,
                'subtitle': 'Pay exact change to driver',
                'identifier': 'CASH',
                'is_default': False,
            }
        )

        # Coupons
        Coupon.objects.get_or_create(
            code='KERALAGO50',
            defaults={
                'title': '₹50 Off First Ride',
                'discount_percent': Decimal('50.00'),
                'max_discount_amount': Decimal('50.00'),
                'flat_discount_amount': Decimal('50.00'),
                'is_active': True,
                'valid_from': timezone.now() - timezone.timedelta(days=30),
                'valid_to': timezone.now() + timezone.timedelta(days=365),
            }
        )
        Coupon.objects.get_or_create(
            code='GODSOWNCOUNTRY',
            defaults={
                'title': '20% Off Kerala Transit',
                'discount_percent': Decimal('20.00'),
                'max_discount_amount': Decimal('100.00'),
                'is_active': True,
                'valid_from': timezone.now() - timezone.timedelta(days=10),
                'valid_to': timezone.now() + timezone.timedelta(days=90),
            }
        )

        # 2. Vehicle Categories (8 Services matching Frontend)
        categories_data = [
            ('ride', 'KeralaGO Ride', ServiceType.STANDARD, 'Clean, comfortable hatchback & sedan', 'car', 'Ionicons', 4, False, 1, Decimal('50.00'), Decimal('16.00'), Decimal('2.00')),
            ('bike', 'KeralaGO Bike', ServiceType.BIKE, 'Quick helmet-provided two-wheeler transit', 'bicycle', 'Ionicons', 1, False, 2, Decimal('20.00'), Decimal('8.00'), Decimal('1.00')),
            ('auto', 'Kerala Auto', ServiceType.AUTO, 'Standard meter regulated 3-wheeler auto', 'rickshaw', 'MaterialCommunityIcons', 3, False, 3, Decimal('30.00'), Decimal('12.00'), Decimal('1.50')),
            ('pink', 'Pink Ride (Women)', ServiceType.PINK, 'Verified women drivers for women passengers', 'shield-checkmark', 'Ionicons', 4, True, 4, Decimal('40.00'), Decimal('14.00'), Decimal('1.80')),
            ('package', 'Package Delivery', ServiceType.PACKAGE, 'Reliable intra-city parcel dispatch', 'cube-outline', 'Ionicons', 1, False, 5, Decimal('35.00'), Decimal('10.00'), Decimal('1.20')),
            ('share', 'Share Taxi', ServiceType.SHARE_TAXI, 'Shared route ride along major corridors', 'people', 'Ionicons', 6, False, 6, Decimal('25.00'), Decimal('7.00'), Decimal('1.00')),
            ('rentals', 'Rentals', ServiceType.RENTAL, 'Flexible hourly vehicle packages', 'time', 'Ionicons', 4, False, 7, Decimal('250.00'), Decimal('22.00'), Decimal('3.00')),
            ('schedule', 'Schedule Ride', ServiceType.SCHEDULED, 'Advance reservations for airports & stations', 'calendar', 'Ionicons', 4, False, 8, Decimal('60.00'), Decimal('18.00'), Decimal('2.20')),
        ]
        cat_map = {}
        for code, name, stype, desc, icon, icon_lib, cap, womens, order, base_fare, per_km, per_min in categories_data:
            cat, _ = VehicleCategory.objects.update_or_create(
                code=code,
                defaults={
                    'name': name,
                    'service_type': stype,
                    'description': desc,
                    'icon_name': icon,
                    'icon_library': icon_lib,
                    'capacity': cap,
                    'is_womens_only': womens,
                    'display_order': order,
                    'is_active': True,
                }
            )
            cat_map[code] = cat
            FareConfig.objects.get_or_create(
                category=cat,
                effective_from=timezone.now() - timezone.timedelta(days=365),
                defaults={
                    'base_fare': base_fare,
                    'per_km_rate': per_km,
                    'per_minute_rate': per_min,
                    'minimum_fare': base_fare,
                    'cancellation_fee': Decimal('20.00'),
                    'platform_commission_percent': Decimal('10.00'),
                }
            )

        # 3. Create Drivers & Vehicles
        drivers_data = [
            ('+919447198765', 'Suresh Pillai', 'auto', 'KL 07 CD 4589', 'Bajaj', 'RE Auto (LPG)', 'Traditional Yellow & Green', 2021, Decimal('10.054200'), Decimal('76.618500')),
            ('+919847111002', 'Manoj Kumar', 'auto', 'KL 07 AL 6031', 'Piaggio', 'Ape City', 'Traditional Green & Yellow', 2020, Decimal('9.967400'), Decimal('76.289100')),
            ('+919847111003', 'George Varghese', 'ride', 'KL 07 BV 1994', 'Maruti', 'Dzire', 'Silver Metallic', 2022, Decimal('10.151800'), Decimal('76.393000')),
            ('+919847111004', 'Harikrishnan R.', 'share', 'KL 44 A 1204', 'Force', 'Trax Cruiser', 'White', 2021, Decimal('10.060100'), Decimal('76.634100')),
            ('+919847111005', 'Bindu S.', 'pink', 'KL 01 BK 8890', 'Hyundai', 'Grand i10', 'Pearl White', 2023, Decimal('9.965600'), Decimal('76.242100')),
        ]

        created_drivers = []
        created_vehicles = []
        for mobile, name, cat_code, plate, make, model, color, year, lat, lng in drivers_data:
            drv_user, _ = User.objects.get_or_create(
                mobile_number=mobile,
                defaults={'full_name': name, 'role': UserRole.DRIVER, 'is_active': True}
            )
            driver_profile, _ = DriverProfile.objects.update_or_create(
                user=drv_user,
                defaults={
                    'license_number': f'KL-LIC-{mobile[-4:]}',
                    'approval_status': ApprovalStatus.APPROVED,
                    'is_online': True,
                    'auto_accept_rides': True if mobile == '+919447198765' else False,
                    'navigation_provider': 'Google Maps',
                    'bank_account_number': 'SBIN0004120984',
                    'bank_ifsc': 'SBIN0004521',
                    'bank_account_holder_name': name,
                    'approved_at': timezone.now(),
                }
            )
            veh, _ = Vehicle.objects.update_or_create(
                registration_number=plate,
                defaults={
                    'driver': driver_profile,
                    'category': cat_map[cat_code],
                    'make': make,
                    'model': model,
                    'color': color,
                    'manufacture_year': year,
                    'capacity': cat_map[cat_code].capacity,
                    'is_active': True,
                }
            )
            DriverCurrentLocation.objects.update_or_create(
                driver=driver_profile,
                defaults={'latitude': lat, 'longitude': lng, 'accuracy_meters': Decimal('5.0')}
            )
            created_drivers.append((drv_user, driver_profile))
            created_vehicles.append(veh)

        # 4. Seed Historical Completed Rides
        rides_history_seed = [
            (
                cat_map['ride'], created_drivers[0], created_vehicles[0], 'Infopark Phase 1, Kakkanad', 'Lulu Mall, Edappally',
                Decimal('142.00'), Decimal('8.40'), 22, Decimal('9.998200'), Decimal('76.357800'),
                Decimal('10.027000'), Decimal('76.308000')
            ),
            (
                cat_map['auto'], created_drivers[1], created_vehicles[1], 'Ernakulam South Station', 'Marine Drive Promenade',
                Decimal('55.00'), Decimal('3.10'), 12, Decimal('9.967400'), Decimal('76.289100'),
                Decimal('9.980000'), Decimal('76.275000')
            ),
            (
                cat_map['ride'], created_drivers[2], created_vehicles[2], 'Cochin International Airport (COK)', 'Vyttila Mobility Hub',
                Decimal('680.00'), Decimal('28.50'), 45, Decimal('10.151800'), Decimal('76.393000'),
                Decimal('9.966900'), Decimal('76.318200')
            ),
            (
                cat_map['share'], created_drivers[3], created_vehicles[3], 'MACE Campus, Kothamangalam', 'Aluva Metro Station',
                Decimal('320.00'), Decimal('34.20'), 50, Decimal('10.060100'), Decimal('76.634100'),
                Decimal('10.108200'), Decimal('76.355100')
            ),
            (
                cat_map['pink'], created_drivers[4], created_vehicles[4], 'Fort Kochi Bus Stand', 'Vyttila Mobility Hub',
                Decimal('120.00'), Decimal('12.00'), 35, Decimal('9.965600'), Decimal('76.242100'),
                Decimal('9.966900'), Decimal('76.318200')
            ),
        ]

        for cat, (drv_user, drv_profile), veh, p_name, d_name, fare, dist, dur, p_lat, p_lng, d_lat, d_lng in rides_history_seed:
            # Check if this ride was already seeded
            existing_ride = Ride.objects.filter(
                customer=customer,
                driver=drv_user,
                vehicle=veh,
                status=RideStatus.COMPLETED,
                actual_distance_km=dist
            ).first()

            if not existing_ride:
                ride = Ride.objects.create(
                    customer=customer,
                    driver=drv_user,
                    vehicle=veh,
                    vehicle_category=cat,
                    status=RideStatus.COMPLETED,
                    actual_distance_km=dist,
                    actual_duration_minutes=dur,
                )
                RideStop.objects.create(
                    ride=ride,
                    stop_type=StopType.PICKUP,
                    title=p_name.split(',')[0],
                    address=p_name,
                    latitude=p_lat,
                    longitude=p_lng,
                )
                RideStop.objects.create(
                    ride=ride,
                    stop_type=StopType.DESTINATION,
                    title=d_name.split(',')[0],
                    address=d_name,
                    latitude=d_lat,
                    longitude=d_lng,
                )
                base = Decimal('30.00')
                dist_chg = fare - base
                RideFare.objects.create(
                    ride=ride,
                    base_fare=base,
                    distance_charge=dist_chg,
                    duration_charge=Decimal('0.00'),
                    cancellation_charge=Decimal('0.00'),
                    discount=Decimal('0.00'),
                    gross_fare=fare,
                )
                comm = (fare * Decimal('0.10')).quantize(Decimal('0.01'))
                net = fare - comm
                RideSettlement.objects.create(
                    ride=ride,
                    gross_fare=fare,
                    platform_commission=comm,
                    driver_net_earnings=net,
                )
                Payment.objects.create(
                    ride=ride,
                    amount=fare,
                    payment_method=PaymentMethod.UPI,
                    status=PaymentStatus.SUCCESS,
                    idempotency_key=uuid.uuid4(),
                )
                DriverLedgerEntry.objects.create(
                    driver=drv_profile,
                    ride=ride,
                    entry_type=LedgerEntryType.RIDE_EARNING,
                    amount=net,
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded complete KeralaGO database with all frontend entities!'))
