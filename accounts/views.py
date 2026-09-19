from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Profile
from .serializers import (
    UserSerializer,
    SignupSerializer,
    VerifySignupSerializer,
    ResendCodeSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ChangePasswordSerializer,
)
from .utils import issue_code, send_verification_email


# ---------- Signup + verification ----------

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    code = issue_code(user.profile, 'signup')
    send_verification_email(user, code, 'signup')

    return Response(
        {'detail': 'Verification code sent.', 'email': user.email},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_signup(request):
    serializer = VerifySignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email'].lower()
    code = serializer.validated_data['code']

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Invalid email or code.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    profile = user.profile
    if profile.verification_purpose != 'signup' or not profile.is_code_valid(code):
        return Response(
            {'detail': 'Invalid or expired code.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Activate and issue token
    user.is_active = True
    user.save(update_fields=['is_active'])
    profile.email_verified = True
    profile.clear_code()

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_code(request):
    serializer = ResendCodeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email'].lower()
    purpose = serializer.validated_data['purpose']

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        # Don't leak whether the email exists
        return Response({'detail': 'If the account exists, a code was sent.'})

    code = issue_code(user.profile, purpose)
    send_verification_email(user, code, purpose)
    return Response({'detail': 'If the account exists, a code was sent.'})


# ---------- Login / Logout / Me ----------

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = authenticate(
        username=serializer.validated_data['username'],
        password=serializer.validated_data['password'],
    )

    if user is None:
        return Response(
            {'detail': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {'detail': 'Account not verified. Check your email for the code.',
             'code': 'not_verified',
             'email': user.email},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({'detail': 'Logged out.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# ---------- Forgot / Reset password ----------

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email'].lower()

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'detail': 'If the account exists, a code was sent.'})

    code = issue_code(user.profile, 'password_reset')
    send_verification_email(user, code, 'password_reset')
    return Response({'detail': 'If the account exists, a code was sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email'].lower()
    code = serializer.validated_data['code']
    new_password = serializer.validated_data['new_password']

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid email or code.'},
                        status=status.HTTP_400_BAD_REQUEST)

    profile = user.profile
    if profile.verification_purpose != 'password_reset' or not profile.is_code_valid(code):
        return Response({'detail': 'Invalid or expired code.'},
                        status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save(update_fields=['password'])
    profile.clear_code()

    # Invalidate old tokens
    Token.objects.filter(user=user).delete()

    return Response({'detail': 'Password reset. You can now log in.'})

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_code(request):
    """Verify a password-reset code WITHOUT consuming it.
    Returns success if valid so the frontend can reveal password fields.
    """
    serializer = VerifySignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email'].lower()
    code = serializer.validated_data['code']

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Invalid email or code.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    profile = user.profile
    if profile.verification_purpose != 'password_reset' or not profile.is_code_valid(code):
        return Response(
            {'detail': 'Invalid or expired code.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({'detail': 'Code verified.'})

# ---------- Change password (authenticated) ----------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = request.user
    if not user.check_password(serializer.validated_data['old_password']):
        return Response(
            {'detail': 'Current password is incorrect.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(serializer.validated_data['new_password'])
    user.save(update_fields=['password'])

    # Rotate token
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)

    return Response({
        'detail': 'Password updated.',
        'token': token.key,
    })