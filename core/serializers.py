from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from djoser.serializers import UserSerializer as BaseUserSerializer
from rest_framework import serializers
from .models import User


class UserCreateSerializer(BaseUserCreateSerializer):
    """Serializer for user registration"""
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ['id', 'username', 'first_name', 'last_name',
                  'email', 'password', 'number', 'address']


class UserSerializer(BaseUserSerializer):
    """Serializer for user profile (read/update)"""
    joined_at = serializers.DateField(read_only=True)

    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ['id', 'username', 'email', 'number',
                  'address', 'joined_at', 'first_name', 'last_name']
        read_only_fields = ['id', 'username',
                            'joined_at']  # Can't change username


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    class Meta:
        model = User
        fields = ['email', 'number', 'address', 'first_name', 'last_name']


class EmployCreateView(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'number', 'address']
        extra_kwargs = {

            'password' : {'write_only': True}
        }

        def create(self, validated_data):
            main_user = self.context['request'].user

        if main_user.