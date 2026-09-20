from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .utils import generate_code
from django.contrib.auth.hashers import make_password
from .models import PendingSignup

from .models import Profile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']





class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_username(self, value):
        # Real User တွေထဲမှာပဲ စစ် — PendingSignup ကို လုံးဝ မစစ်
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def create(self, validated_data):
        email = validated_data['email'].lower()

        # Same email နဲ့ retry — အ�ောင်း pending ဖျက်၊ အသစ် ဖန်တီး
        # (username ကို မထိ — other pending တွေ ဆက်ရှိနိုင်)
        PendingSignup.objects.filter(email__iexact=email).delete()

        code = generate_code()
        pending = PendingSignup.objects.create(
            username=validated_data['username'],
            email=email,
            password_hash=make_password(validated_data['password']),
            code=code,
            code_expires=timezone.now() + timedelta(minutes=10),
        )
        return pending

class VerifySignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)


class ResendCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=['signup', 'password_reset'])


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)