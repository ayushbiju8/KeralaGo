from django.urls import path, include
from .views import (
    health_check,
    auth_login,
    customer_dashboard,
    customer_trips,
    update_customer_profile,
    wallet_top_up,
    saved_locations_view,
    delete_saved_location,
    estimate_fare,
    apply_coupon,
    list_coupons,
    request_ride,
    ride_detail,
    cancel_ride,
    submit_review,
    driver_dashboard,
    toggle_driver_duty,
    submit_sos,
    submit_support_ticket,
    update_ride_status,
    get_active_ride,
    driver_trips,
    driver_earnings,
    driver_vehicle_details,
    update_driver_location,
)

urlpatterns = [
    # System
    path('health/', health_check, name='health_check'),

    # Auth & Sessions
    path('auth/', include('accounts.urls')),
    path('auth/login/', auth_login, name='auth_login'),

    # Customer App Suite
    path('customer/dashboard/', customer_dashboard, name='customer_dashboard'),
    path('customer/trips/', customer_trips, name='customer_trips'),
    path('customer/profile/update/', update_customer_profile, name='update_customer_profile'),
    path('customer/wallet/topup/', wallet_top_up, name='wallet_top_up'),
    path('customer/locations/', saved_locations_view, name='saved_locations'),
    path('customer/locations/<uuid:location_id>/', delete_saved_location, name='delete_saved_location'),

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
