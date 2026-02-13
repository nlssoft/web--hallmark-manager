from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSerializer, UserProfileUpdateSerializer
from rest_framework.viewsets import ModelViewSet
from django.core.exceptions import PermissionDenied
from .serializers import *
from rest_framework import status


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
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(UserSerializer(request.user).data)


class EmployeeCreateView(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EmployeeCreateSerializer

    def get_queryset(self):
        if self.request.user.parent:
            return User.objects.none()
        return User.objects.filter(parent=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.parent:
            raise PermissionDenied('Only Admin can create employee.')

        serializer.save(parent=self.request.user)

    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
