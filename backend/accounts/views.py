import uuid
from datetime import timedelta
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import User, UserProfile, OTPChallenge, UserRole, OTPPurpose
from .serializers import (
    UserSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
    UpdateProfileSerializer,
)


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
    Generates and stores an OTPChallenge for mobile authentication.
    In local development / demo mode, returns dev_otp='1234'.
    """
    serializer = SendOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    mobile = normalize_mobile(serializer.validated_data['mobile_number'])
    requested_role = serializer.validated_data.get('role', UserRole.USER)

    # Standard OTP for local dev/demo
    otp_code = "1234"
    expires_at = timezone.now() + timedelta(minutes=10)

    challenge = OTPChallenge(
        mobile_number=mobile,
        purpose=OTPPurpose.LOGIN,
        expires_at=expires_at,
    )
    challenge.set_code(otp_code)
    challenge.save()

    # Check if user already exists
    user = User.objects.filter(mobile_number=mobile).first()

    return Response({
        'success': True,
        'message': f'OTP sent to {mobile}',
        'mobile_number': mobile,
        'dev_otp': otp_code,
        'user_exists': user is not None,
        'role': user.role if user else requested_role,
        'full_name': user.full_name if user else '',
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verifies OTPChallenge code and authenticates the user.
    Creates user and UserProfile if account is new.
    """
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    mobile = normalize_mobile(serializer.validated_data['mobile_number'])
    otp = serializer.validated_data['otp'].strip()
    role = serializer.validated_data.get('role', UserRole.USER)
    full_name = serializer.validated_data.get('full_name', '').strip()

    # Find recent challenge
    challenge = OTPChallenge.objects.filter(
        mobile_number=mobile,
        consumed_at__isnull=True
    ).order_by('-created_at').first()

    is_valid_otp = False
    if challenge and challenge.verify_code(otp):
        is_valid_otp = True
    elif otp == "1234":  # Development / demo universal OTP fallback
        is_valid_otp = True

    if not is_valid_otp:
        return Response({
            'success': False,
            'message': 'Invalid or expired OTP. Please use 1234 for testing.',
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get or create user
    user = User.objects.filter(mobile_number=mobile).first()
    if not user:
        user = User.objects.create(
            mobile_number=mobile,
            full_name=full_name or ('KeralaGO Driver' if role == UserRole.DRIVER else 'KeralaGO User'),
            role=role,
            is_active=True,
        )
    elif role and user.role != role:
        # Update role if explicitly selected during login
        user.role = role
        user.save(update_fields=['role'])

    # Ensure UserProfile exists
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'default_payment_method': 'UPI',
            'profile_photo': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        }
    )

    # If driver, ensure DriverProfile exists
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

    # Generate a lightweight session token
    auth_token = f"kgo_{user.id}_{int(timezone.now().timestamp())}"

    serialized_user = UserSerializer(user).data

    return Response({
        'success': True,
        'token': auth_token,
        'user': {
            'id': str(user.id),
            'name': user.full_name or 'KeralaGO User',
            'phone': user.mobile_number,
            'email': getattr(user, 'email', ''),
            'role': user.role,
            'avatar': serialized_user.get('profile_photo'),
            'rating': 4.90,
            'totalRides': 12,
            'isOnline': True if user.role == UserRole.DRIVER else None,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def user_profile(request):
    """
    GET: Retrieve authenticated user profile from DB.
    PATCH: Update user full_name and preferences in DB.
    """
    mobile = request.query_params.get('mobile_number') or request.data.get('mobile_number')
    user_id = request.query_params.get('user_id') or request.data.get('user_id')

    user = None
    if user_id:
        try:
            user = User.objects.filter(id=uuid.UUID(str(user_id))).first()
        except (ValueError, TypeError):
            pass

    if not user and mobile:
        norm = normalize_mobile(mobile)
        user = User.objects.filter(mobile_number=norm).first()

    if not user:
        # Fallback to the first customer in DB
        user = User.objects.filter(role=UserRole.USER).first()

    if not user:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        serializer = UpdateProfileSerializer(data=request.data)
        if serializer.is_valid():
            if 'full_name' in serializer.validated_data and serializer.validated_data['full_name']:
                user.full_name = serializer.validated_data['full_name'].strip()
                user.save(update_fields=['full_name', 'updated_at'])

            if hasattr(user, 'profile') and 'default_payment_method' in serializer.validated_data:
                user.profile.default_payment_method = serializer.validated_data['default_payment_method']
                user.profile.save(update_fields=['default_payment_method', 'updated_at'])

    profile_photo = None
    default_pm = 'UPI'
    if hasattr(user, 'profile'):
        profile_photo = user.profile.profile_photo
        default_pm = user.profile.default_payment_method or 'UPI'

    return Response({
        'id': str(user.id),
        'name': user.full_name or 'KeralaGO User',
        'phone': user.mobile_number,
        'role': user.role,
        'avatar': profile_photo or 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        'default_payment_method': default_pm,
        'is_driver': user.is_driver,
        'is_customer': user.is_customer,
    }, status=status.HTTP_200_OK)
