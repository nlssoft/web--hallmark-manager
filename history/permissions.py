from rest_framework import permissions
from django.utils.timezone import now, timedelta
from django.utils.timezone import localdate


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user


class PaymentSaftyNet(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in ['DELETE', 'PUT', 'PATCH']:
            return (localdate() - obj.payment_date) <= timedelta(days=7)
        return True


class PaymentRequestSaftyNet(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if view.action in ['approve', 'reject']:
            return not request.user.parent

        if self.status in ['A', 'R']:
            return False

        return True
