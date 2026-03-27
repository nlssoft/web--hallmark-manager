from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSerializer, UserProfileUpdateSerializer
from rest_framework.viewsets import ModelViewSet
from django.core.exceptions import PermissionDenied
from .serializers import *
from rest_framework import status

from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware.csrf import get_token
from .models import User
from history.pagination import NormalPagination


class UserProfileViewSet(ViewSet):
    """
    ViewSet for current user profile management
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Update current user profile"""

        if self.request.user.parent:
            raise PermissionDenied('Only Admin can update employee.')
        
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(UserSerializer(request.user).data)


class EmployeeModelViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EmployeeCreateSerializer
    pagination_class= NormalPagination

    def get_queryset(self):
        if self.request.user.parent:
            raise PermissionDenied('Unauthorized access.')
        return User.objects.filter(parent=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        return EmployeeUpdateSerializer
    
    def perform_create(self, serializer):
        if self.request.user.parent:
            raise PermissionDenied('Only Admin can create employee.')

        serializer.save(parent=self.request.user)

    def destroy(self, request, *args, **kwargs):
        if self.request.user.parent:
            raise PermissionDenied('Only Admin can delete employee.')
        user= self.get_object()
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
        
    def update(self, request, *args, **kwargs):
        if self.request.user.parent:
            raise PermissionDenied('Only Admin can update employee.')
        user = self.get_object()
        serializer =self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self.get_serializer(user).data, status=status.HTTP_200_OK)
        


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):

    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({'error': 'invalid credentials'},
                        status=status.HTTP_400_BAD_REQUEST)

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    response = Response({'message': 'Login successful'})

    response.set_cookie(
        key='access',
        value=access_token,
        httponly=True,
        secure=False,
        samesite='Lax'
    )

    response.set_cookie(
        key='refresh',
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite='Lax'
    )

    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_view(request):
    refresh_token = request.COOKIES.get('refresh')

    if not refresh_token:
        return Response({'error': 'No refresh token'},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        refresh = RefreshToken(refresh_token)
        refresh.blacklist()
        user_id = refresh['user_id']
        user = User.objects.get(id=user_id)
        new_refresh = RefreshToken.for_user(user) 

        access_token = str(new_refresh.access_token)
        new_refresh_token = str(new_refresh) 

    except Exception:
        return Response({'error': 'Invalid refresh token'},
                        status=status.HTTP_401_UNAUTHORIZED)

    response = Response({'message': 'token refreshed'})

    response.set_cookie(
        key='access',
        value=access_token,
        httponly=True,
        secure=False,
        samesite='Lax'
    )

    response.set_cookie(
        key='refresh',
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite='Lax'
    )


    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    response = Response({'message': 'Logged out'})
    refresh_token = request.COOKIES.get('refresh')

    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass


    response.delete_cookie('access')
    response.delete_cookie('refresh')

    return response



@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_view(request):
    get_token(request)
    return Response({'message' : 'csrf cookie set'})