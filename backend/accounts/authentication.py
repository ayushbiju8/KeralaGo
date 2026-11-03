"""
JWT Bearer Token Authentication Class for KeralaGO REST APIs.
Follows standard RFC 6750: Authorization: Bearer <token>
"""

import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from .models import User


def generate_jwt_token(user: User, expiry_days: int = 30) -> str:
    """
    Generates signed HS256 JWT access token containing user identity and role.
    """
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': str(user.id),
        'mobile_number': user.mobile_number or '',
        'email': user.email or '',
        'role': user.role,
        'full_name': user.full_name,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(days=expiry_days)).timestamp()),
    }
    secret = getattr(settings, 'SECRET_KEY', 'keralago-secret-key-2026')
    return jwt.encode(payload, secret, algorithm='HS256')


def decode_jwt_token(token_str: str) -> dict:
    """
    Decodes and validates JWT token expiration and cryptographic signature.
    """
    secret = getattr(settings, 'SECRET_KEY', 'keralago-secret-key-2026')
    try:
        return jwt.decode(token_str, secret, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Authentication token has expired. Please log in again.')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Invalid authentication token.')


class JWTAuthentication(BaseAuthentication):
    """
    Custom DRF authentication scheme extracting and verifying JWT bearer tokens:
    Authorization: Bearer <token>
    """

    def authenticate(self, request):
        auth_header = get_authorization_header(request).decode('utf-8').strip()
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() not in ['bearer', 'token']:
            # Non-standard or unrecognized header; ignore for AllowAny or fail
            return None

        token = parts[1]
        payload = decode_jwt_token(token)

        user_id = payload.get('user_id')
        if not user_id:
            raise AuthenticationFailed('Token payload missing user identifier.')

        user = User.objects.filter(id=user_id, is_active=True).first()
        if not user:
            raise AuthenticationFailed('User corresponding to token was not found or is deactivated.')

        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'
