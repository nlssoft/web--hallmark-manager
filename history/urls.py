from django.urls import path
from rest_framework_nested import routers
from . import views


router = routers.DefaultRouter()
router.register('party', views.PartyViewSet, basename='party')
router.register('work-rate', views.Work_RateViewSet, basename='work')
router.register('service-type', views.Service_TypeViewSet,
                basename='service-type')
router.register('record', views.RecordViewSet, basename='record')
router.register('payment', views.PaymentViewSet, basename='payment')
router.register('allocation', views.AllocationViewSet, basename='allocation')
router.register('advance-ledger', views.AdvanceLedgerViewSet,
                basename='advance-ledger')
router.register('audit-log', views.AuditLogViewSet, basename='audit=log')


urlpatterns = router.urls 