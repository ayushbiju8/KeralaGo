import uuid
from rest_framework import serializers
from .models import User, UserProfile, OTPChallenge, UserRole, OTPPurpose


class UserSerializer(serializers.ModelSerializer):
    profile_photo = serializers.SerializerMethodField()
    default_payment_method = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'mobile_number',
            'full_name',
            'role',
            'is_active',
            'is_staff',
            'profile_photo',
            'default_payment_method',
            'created_at',
        ]

    def get_profile_photo(self, obj):
        if hasattr(obj, 'profile') and obj.profile.profile_photo:
            return obj.profile.profile_photo
        return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"

    def get_default_payment_method(self, obj):
        if hasattr(obj, 'profile') and obj.profile.default_payment_method:
            return obj.profile.default_payment_method
        return "UPI"


class SendOTPSerializer(serializers.Serializer):
    mobile_number = serializers.CharField(max_length=20)
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.USER)


class VerifyOTPSerializer(serializers.Serializer):
    mobile_number = serializers.CharField(max_length=20)
    otp = serializers.CharField(max_length=10)
    role = serializers.ChoiceField(choices=UserRole.choices, required=False)
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)


class UpdateProfileSerializer(serializers.Serializer):
    mobile_number = serializers.CharField(max_length=20, required=False)
    full_name = serializers.CharField(max_length=150, required=False)
    default_payment_method = serializers.CharField(max_length=30, required=False)
