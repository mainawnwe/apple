from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Profile, PendingSignup
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta
from .utils import generate_code
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
    pending = serializer.save()

    send_verification_email(
        email=pending.email,
        username=pending.username,
        code=pending.code,
        purpose='signup',
    )

    return Response(
        {'detail': 'Verification code sent.', 'email': pending.email},
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
        pending = PendingSignup.objects.get(email__iexact=email)
    except PendingSignup.DoesNotExist:
        return Response(
            {'detail': 'Invalid email or code.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not pending.is_code_valid(code):
        return Response(
            {'detail': 'Invalid or expired code.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ⚠️ Race condition: တစ်ခြားလူက ဒီ username ကို ယူသွားပြီးလား?
    if User.objects.filter(username__iexact=pending.username).exists():
        pending.delete()
        return Response(
            {
                'detail': (
                    f'Sorry, the username "{pending.username}" was just taken '
                    'by someone else. Please sign up again with a different username.'
                ),
                'code': 'username_taken',
            },
            status=status.HTTP_409_CONFLICT,
        )

    # Email ကို တစ်ခြားလူ မှတ်ပုံတင်ပြီးလား? (rare)
    if User.objects.filter(email__iexact=pending.email).exists():
        pending.delete()
        return Response(
            {
                'detail': 'This email was just registered. Please try logging in.',
                'code': 'email_taken',
            },
            status=status.HTTP_409_CONFLICT,
        )

    # NOW create the real User
    user = User(
        username=pending.username,
        email=pending.email,
        is_active=True,
    )
    user.password = pending.password_hash   # already hashed
    user.save()

    # Mark profile as verified
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.email_verified = True
    profile.save(update_fields=['email_verified'])

    # Delete pending signup
    pending.delete()

    # Issue token
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

    if purpose == 'signup':
        try:
            pending = PendingSignup.objects.get(email__iexact=email)
        except PendingSignup.DoesNotExist:
            return Response({'detail': 'If the account exists, a code was sent.'})

        pending.code = generate_code()
        pending.code_expires = timezone.now() + timedelta(minutes=10)
        pending.save(update_fields=['code', 'code_expires'])

        send_verification_email(
            email=pending.email,
            username=pending.username,
            code=pending.code,
            purpose='signup',
        )
        return Response({'detail': 'If the account exists, a code was sent.'})

    # password_reset — existing user
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'detail': 'If the account exists, a code was sent.'})

    code = issue_code(user.profile, 'password_reset')
    send_verification_email(
        email=user.email,
        username=user.username,
        code=code,
        purpose='password_reset',
    )
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
    send_verification_email(
        email=user.email,
        username=user.username,
        code=code,
        purpose='password_reset',
    )
    return Response({'detail': 'If the account exists, a code was sent.'})

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