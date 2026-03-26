from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('profile', views.UserProfileViewSet, basename='profile')

router.register('employee', views.EmployeeCreateModelViewSet, basename='employee')

urlpatterns = [
    path('login/', views.login_view),
    path('refresh/', views.refresh_view),
    path('logout/', views.logout_view),
    path('csrf/', views.csrf_view),

] + router.urls
