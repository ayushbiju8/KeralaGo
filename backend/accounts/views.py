import uuid
import random
from datetime import timedelta
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import User, UserProfile, OTPChallenge, UserRole, OTPPurpose
from .serializers import (
    UserSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
    UpdateProfileSerializer,
)
from .authentication import generate_jwt_token
from .services.msg91_service import (
    send_msg91_otp,
    verify_msg91_otp,
    is_msg91_configured,
    clean_mobile_for_msg91,
)
from .services.email_service import send_email_otp


def normalize_mobile(raw_number: str) -> str:
    cleaned = raw_number.strip().replace(" ", "").replace("-", "")
    if cleaned.startswith("+91"):
        return cleaned
    if cleaned.startswith("91") and len(cleaned) == 12:
        return f"+{cleaned}"
    if len(cleaned) == 10:
        return f"+91{cleaned}"
    return cleaned


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """
    Sends OTP challenge for LOGIN or REGISTER.
    - LOGIN: verifies user already exists.
    - REGISTER: verifies user does not already exist and full_name is provided.
    Dispatches via MSG91 (mobile) or Gmail SMTP (email). Returns REAL errors on failure.
    """
    serializer = SendOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    mode = data.get('mode', 'LOGIN')
    raw_mobile = data.get('mobile_number', '').strip()
    raw_email = data.get('email', '').strip().lower()
    requested_role = data.get('role', UserRole.USER)
    full_name = data.get('full_name', '').strip()

    expires_at = timezone.now() + timedelta(minutes=10)

    # 1. Existence check based on mode
    if raw_email:
        existing_user = User.objects.filter(email=raw_email).first()
        target_display = raw_email
    else:
        mobile_normalized = normalize_mobile(raw_mobile)
        existing_user = User.objects.filter(mobile_number=mobile_normalized).first()
        target_display = f"+{clean_mobile_for_msg91(mobile_normalized)}"

    if mode == 'LOGIN':
        if not existing_user:
            return Response({
                'success': False,
                'message': f"No account found with {target_display}. Please switch to the Register tab to create an account."
            }, status=status.HTTP_404_NOT_FOUND)
    elif mode == 'REGISTER':
        if existing_user:
            return Response({
                'success': False,
                'message': f"An account already exists with {target_display}. Please switch to the Sign In tab."
            }, status=status.HTTP_400_BAD_REQUEST)
        if not full_name:
            return Response({
                'success': False,
                'message': "Full Name is required to register a new account."
            }, status=status.HTTP_400_BAD_REQUEST)

    # ─────────────────────────────────────────────────────────────────────────
    # A. EMAIL AUTHENTICATION (Gmail SMTP)
    # ─────────────────────────────────────────────────────────────────────────
    if raw_email:
        otp_code = str(random.randint(1000, 9999))

        challenge = OTPChallenge.objects.create(
            email=raw_email,
            purpose=OTPPurpose.LOGIN if mode == 'LOGIN' else OTPPurpose.REGISTRATION,
            expires_at=expires_at,
        )
        challenge.set_code(otp_code)
        challenge.save()

        # Dispatch real email via Gmail SMTP
        recipient_name = full_name or (existing_user.full_name if existing_user else "Traveler")
        email_res = send_email_otp(recipient_email=raw_email, otp_code=otp_code, user_name=recipient_name)

        if not email_res.get('success'):
            return Response({
                'success': False,
                'message': email_res.get('message', 'Failed to dispatch verification email.')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'success': True,
            'channel': 'EMAIL',
            'message': f"Verification code sent to {raw_email}. Please check your inbox.",
            'identifier': raw_email,
            'email': raw_email,
            'mode': mode,
            'user_exists': existing_user is not None,
            'role': existing_user.role if existing_user else requested_role,
            'full_name': existing_user.full_name if existing_user else full_name,
        }, status=status.HTTP_200_OK)

    # ─────────────────────────────────────────────────────────────────────────
    # B. MOBILE PHONE AUTHENTICATION (MSG91)
    # ─────────────────────────────────────────────────────────────────────────
    mobile = normalize_mobile(raw_mobile)

    # Check for configured widget demo phone (Ayush Biju 919999999999)
    if '9999999999' in mobile:
        challenge = OTPChallenge.objects.create(
            mobile_number=mobile,
            purpose=OTPPurpose.LOGIN if mode == 'LOGIN' else OTPPurpose.REGISTRATION,
            expires_at=expires_at,
        )
        challenge.set_code("9999")
        challenge.save()
        return Response({
            'success': True,
            'channel': 'MOBILE',
            'message': f"MSG91 Demo account active (+{clean_mobile_for_msg91(mobile)}). Demo Code: 9999",
            'identifier': mobile,
            'mobile_number': mobile,
            'dev_otp': '9999',
            'mode': mode,
            'user_exists': existing_user is not None,
            'role': existing_user.role if existing_user else requested_role,
            'full_name': existing_user.full_name if existing_user else full_name,
        }, status=status.HTTP_200_OK)

    # Dispatch via MSG91
    msg91_res = send_msg91_otp(mobile)

    if not msg91_res.get('success'):
        # Return REAL error from MSG91 without fake fallback
        return Response({
            'success': False,
            'message': msg91_res.get('message', 'Failed to send OTP via MSG91.')
        }, status=status.HTTP_400_BAD_REQUEST)

    req_id = msg91_res.get('request_id', '') or ''

    # MSG91 accepted and sent OTP
    challenge = OTPChallenge.objects.create(
        mobile_number=mobile,
        purpose=OTPPurpose.LOGIN if mode == 'LOGIN' else OTPPurpose.REGISTRATION,
        request_id=req_id,
        expires_at=expires_at,
    )

    return Response({
        'success': True,
        'channel': 'MOBILE',
        'message': msg91_res.get('message', f'OTP sent successfully to {mobile}'),
        'identifier': mobile,
        'mobile_number': mobile,
        'request_id': req_id,
        'mode': mode,
        'user_exists': existing_user is not None,
        'role': existing_user.role if existing_user else requested_role,
        'full_name': existing_user.full_name if existing_user else full_name,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verifies OTP code and signs JWT bearer token.
    Enforces mode:
    - LOGIN: verifies existing user
    - REGISTER: creates new user in database
    """
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    mode = data.get('mode', 'LOGIN')
    raw_mobile = data.get('mobile_number', '').strip()
    raw_email = data.get('email', '').strip().lower()
    otp = data['otp'].strip()
    role = data.get('role', UserRole.USER)
    full_name = data.get('full_name', '').strip()

    is_valid = False
    challenge = None

    if raw_email:
        # Verify Email OTP
        challenge = OTPChallenge.objects.filter(
            email=raw_email,
            consumed_at__isnull=True,
            expires_at__gte=timezone.now()
        ).order_by('-created_at').first()

        if challenge and challenge.verify_code(otp):
            is_valid = True
    else:
        # Verify Mobile OTP (MSG91 gateway or challenge)
        mobile = normalize_mobile(raw_mobile)
        if '9999999999' in mobile and otp == '9999':
            is_valid = True
        else:
            challenge = OTPChallenge.objects.filter(
                mobile_number=mobile,
                consumed_at__isnull=True,
                expires_at__gte=timezone.now()
            ).order_by('-created_at').first()

            req_id = data.get('request_id') or (challenge.request_id if challenge else None)

            msg91_check = None
            if is_msg91_configured():
                msg91_check = verify_msg91_otp(mobile, otp, req_id=req_id)
                is_valid = msg91_check.get('success', False)

            if not is_valid:
                if challenge and challenge.verify_code(otp):
                    is_valid = True

    if not is_valid:
        error_msg = 'Invalid or expired verification code. Please enter the correct code received.'
        if 'msg91_check' in locals() and msg91_check and msg91_check.get('message') and 'authkey' not in msg91_check.get('message').lower():
            error_msg = msg91_check.get('message')
        return Response({
            'success': False,
            'message': error_msg,
        }, status=status.HTTP_400_BAD_REQUEST)

    # Mark challenge consumed
    if challenge:
        challenge.consumed_at = timezone.now()
        challenge.save(update_fields=['consumed_at', 'updated_at'])

    # User resolution / creation based on mode
    user = None
    if raw_email:
        user = User.objects.filter(email=raw_email).first()
        if mode == 'REGISTER':
            if user:
                return Response({'success': False, 'message': 'Account already registered with this email.'}, status=status.HTTP_400_BAD_REQUEST)
            user = User.objects.create(
                email=raw_email,
                full_name=full_name or raw_email.split('@')[0].capitalize(),
                role=role or UserRole.USER,
                is_active=True,
            )
        elif mode == 'LOGIN':
            if not user:
                return Response({'success': False, 'message': 'No account exists with this email. Please register first.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        mobile = normalize_mobile(raw_mobile)
        user = User.objects.filter(mobile_number=mobile).first()
        if mode == 'REGISTER':
            if user:
                return Response({'success': False, 'message': 'Account already registered with this mobile number.'}, status=status.HTTP_400_BAD_REQUEST)
            user = User.objects.create(
                mobile_number=mobile,
                full_name=full_name or 'KeralaGO User',
                role=role or UserRole.USER,
                is_active=True,
            )
        elif mode == 'LOGIN':
            if not user:
                return Response({'success': False, 'message': 'No account exists with this mobile number. Please register first.'}, status=status.HTTP_404_NOT_FOUND)

    # Ensure profile exists
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'default_payment_method': 'UPI',
            'profile_photo': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        }
    )

    # If driver, ensure driver profile exists
    if user.role == UserRole.DRIVER:
        from drivers.models import DriverProfile, ApprovalStatus
        DriverProfile.objects.get_or_create(
            user=user,
            defaults={
                'license_number': f'KL-LIC-{str(uuid.uuid4())[:8].upper()}',
                'approval_status': ApprovalStatus.APPROVED,
                'is_online': True,
            }
        )

    # Generate cryptographic HS256 JWT Bearer token
    jwt_token = generate_jwt_token(user)

    return Response({
        'success': True,
        'token': jwt_token,
        'token_type': 'Bearer',
        'mode': mode,
        'user': format_user_payload(user)
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def user_profile(request):
    """
    GET: Retrieve authenticated user profile (via JWT token or query params).
    PATCH: Update user full_name, email, and preferences in DB.
    """
    # 1. Check if authenticated via JWT Bearer Token
    user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None

    # 2. Fallback to query params or body
    if not user:
        mobile = request.query_params.get('mobile_number') or request.data.get('mobile_number')
        email = request.query_params.get('email') or request.data.get('email')
        user_id = request.query_params.get('user_id') or request.data.get('user_id')

        if user_id:
            try:
                user = User.objects.filter(id=uuid.UUID(str(user_id))).first()
            except (ValueError, TypeError):
                pass
        if not user and email:
            user = User.objects.filter(email=email.strip().lower()).first()
        if not user and mobile:
            user = User.objects.filter(mobile_number=normalize_mobile(mobile)).first()

    if not user:
        # Fallback to customer for demo
        user = User.objects.filter(role=UserRole.USER).first()

    if not user:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        serializer = UpdateProfileSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data.get('full_name'):
                user.full_name = serializer.validated_data['full_name'].strip()
            if serializer.validated_data.get('email'):
                user.email = serializer.validated_data['email'].strip().lower()
            user.save(update_fields=['full_name', 'email', 'updated_at'])

            if hasattr(user, 'profile') and serializer.validated_data.get('default_payment_method'):
                user.profile.default_payment_method = serializer.validated_data['default_payment_method']
                user.profile.save(update_fields=['default_payment_method', 'updated_at'])

    return Response(format_user_payload(user), status=status.HTTP_200_OK)


def format_user_payload(user):
    from django.db import models
    from support.models import Review
    from rides.models import Ride

    profile_photo = None
    default_pm = 'UPI'
    if hasattr(user, 'profile'):
        profile_photo = user.profile.profile_photo
        default_pm = user.profile.default_payment_method or 'UPI'

    # Compute real rating from reviews
    revs = Review.objects.filter(reviewee=user)
    avg_r = revs.aggregate(models.Avg('rating'))['rating__avg']
    real_rating = round(float(avg_r), 1) if avg_r else None

    # Compute real total rides
    if user.role == UserRole.DRIVER:
        real_total_rides = Ride.objects.filter(driver=user).count()
        is_online = user.driver_profile.is_online if hasattr(user, 'driver_profile') else False
    else:
        real_total_rides = Ride.objects.filter(customer=user).count()
        is_online = None

    return {
        'id': str(user.id),
        'name': user.full_name or 'KeralaGO User',
        'phone': user.mobile_number,
        'email': user.email or '',
        'role': user.role,
        'avatar': profile_photo,
        'isOnline': is_online,
        'rating': real_rating,
        'totalRides': real_total_rides,
        'defaultPaymentMethod': default_pm,
        'is_driver': user.is_driver,
        'is_customer': user.is_customer,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Direct User Registration endpoint: POST /api/auth/register/
    Accepts:
      - full_name (required)
      - mobile_number or phone (or email)
      - email (optional)
      - role (optional, default USER)
      - password (optional)
    """
    full_name = request.data.get('full_name', '').strip()
    raw_mobile = request.data.get('mobile_number') or request.data.get('phone') or ''
    email = request.data.get('email', '').strip().lower()
    req_role = request.data.get('role', UserRole.USER)
    role = UserRole.DRIVER if req_role == 'DRIVER' else (UserRole.ADMIN if req_role == 'ADMIN' else UserRole.USER)

    if not full_name:
        return Response({
            'success': False,
            'message': 'Full name is required to register.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not raw_mobile and not email:
        return Response({
            'success': False,
            'message': 'Mobile number or email is required to register.'
        }, status=status.HTTP_400_BAD_REQUEST)

    mobile = normalize_mobile(raw_mobile) if raw_mobile else None

    # Check for existing user
    if mobile and User.objects.filter(mobile_number=mobile).exists():
        return Response({
            'success': False,
            'message': f'An account with mobile number {mobile} already exists. Please login instead.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if email and User.objects.filter(email=email).exists():
        return Response({
            'success': False,
            'message': f'An account with email {email} already exists. Please login instead.'
        }, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create(
        full_name=full_name,
        mobile_number=mobile or '',
        email=email or None,
        role=role,
        is_active=True,
    )
    if request.data.get('password'):
        user.set_password(request.data['password'])
        user.save()

    UserProfile.objects.get_or_create(user=user)

    token = generate_jwt_token(user)
    return Response({
        'success': True,
        'message': 'Account registered successfully.',
        'token': token,
        'token_type': 'Bearer',
        'user': format_user_payload(user)
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """
    Direct User Login endpoint: POST /api/auth/login/
    Accepts:
      - mobile_number or phone or email
      - role (optional)
      - password (optional)
    """
    raw_mobile = request.data.get('mobile_number') or request.data.get('phone') or ''
    email = request.data.get('email', '').strip().lower()

    user = None
    if email:
        user = User.objects.filter(email=email).first()
    if not user and raw_mobile:
        mobile = normalize_mobile(raw_mobile)
        user = User.objects.filter(mobile_number=mobile).first()

    if not user:
        return Response({
            'success': False,
            'message': 'Account not found. Please register first.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not user.is_active:
        return Response({
            'success': False,
            'message': 'Account is inactive. Please contact support.'
        }, status=status.HTTP_403_FORBIDDEN)

    token = generate_jwt_token(user)
    return Response({
        'success': True,
        'message': 'Logged in successfully.',
        'token': token,
        'token_type': 'Bearer',
        'user': format_user_payload(user)
    }, status=status.HTTP_200_OK)

