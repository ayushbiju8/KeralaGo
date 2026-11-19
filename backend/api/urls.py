from django.urls import path, include
from .views import (
    health_check,
    auth_login,
    switch_user_role,
    customer_dashboard,
    customer_profile_detail,
    customer_trips,
    update_customer_profile,
    wallet_top_up,
    saved_locations_view,
    saved_location_detail,
    customer_payment_methods,
    customer_payment_method_detail,
    customer_emergency_contacts,
    customer_emergency_contact_detail,
    estimate_fare,
    apply_coupon,
    list_coupons,
    request_ride,
    ride_detail,
    cancel_ride,
    submit_review,
    driver_dashboard,
    driver_profile_detail,
    update_driver_profile,
    update_driver_vehicle,
    toggle_driver_duty,
    driver_trips,
    driver_earnings,
    driver_vehicle_details,
    update_driver_location,
    driver_categories,
    register_driver_partner,
    submit_sos,
    submit_support_ticket,
    update_ride_status,
    get_active_ride,
)

urlpatterns = [
    # System
    path('health/', health_check, name='health_check'),

    # Auth & Sessions
    path('auth/', include('accounts.urls')),
    path('auth/login/', auth_login, name='auth_login'),
    path('auth/switch-role/', switch_user_role, name='switch_user_role'),

    # Customer App Suite
    path('customer/dashboard/', customer_dashboard, name='customer_dashboard'),
    path('customer/profile/', customer_profile_detail, name='customer_profile_detail'),
    path('customer/profile/update/', update_customer_profile, name='update_customer_profile'),
    path('customer/trips/', customer_trips, name='customer_trips'),
    path('customer/wallet/topup/', wallet_top_up, name='wallet_top_up'),
    path('customer/locations/', saved_locations_view, name='saved_locations'),
    path('customer/locations/<uuid:location_id>/', saved_location_detail, name='saved_location_detail'),
    path('customer/payment-methods/', customer_payment_methods, name='customer_payment_methods'),
    path('customer/payment-methods/<uuid:method_id>/', customer_payment_method_detail, name='customer_payment_method_detail'),
    path('customer/emergency-contacts/', customer_emergency_contacts, name='customer_emergency_contacts'),
    path('customer/emergency-contacts/<uuid:contact_id>/', customer_emergency_contact_detail, name='customer_emergency_contact_detail'),

    # Rides & Fare Engine
    path('rides/estimate-fare/', estimate_fare, name='estimate_fare'),
    path('rides/apply-coupon/', apply_coupon, name='apply_coupon'),
    path('rides/request/', request_ride, name='request_ride'),
    path('rides/active/', get_active_ride, name='active_ride'),
    path('rides/<str:ride_id>/', ride_detail, name='ride_detail'),
    path('rides/<str:ride_id>/update-status/', update_ride_status, name='update_ride_status'),
    path('rides/<str:ride_id>/cancel/', cancel_ride, name='cancel_ride'),
    path('coupons/', list_coupons, name='list_coupons'),

    # Reviews & Feedback
    path('reviews/submit/', submit_review, name='submit_review'),

    # Driver Partner Suite
    path('driver/profile/', driver_profile_detail, name='driver_profile_detail'),
    path('driver/profile/update/', update_driver_profile, name='update_driver_profile'),
    path('driver/vehicle/update/', update_driver_vehicle, name='update_driver_vehicle'),
    path('driver/categories/', driver_categories, name='driver_categories'),
    path('driver/register/', register_driver_partner, name='register_driver_partner'),
    path('driver/dashboard/', driver_dashboard, name='driver_dashboard'),
    path('driver/duty/toggle/', toggle_driver_duty, name='toggle_driver_duty'),
    path('driver/trips/', driver_trips, name='driver_trips'),
    path('driver/earnings/', driver_earnings, name='driver_earnings'),
    path('driver/vehicle/', driver_vehicle_details, name='driver_vehicle_details'),
    path('driver/location/update/', update_driver_location, name='update_driver_location'),

    # Safety & Incident Support
    path('support/sos/', submit_sos, name='submit_sos'),
    path('support/ticket/', submit_support_ticket, name='submit_support_ticket'),
]
