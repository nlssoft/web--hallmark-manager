from django.urls import path
from rest_framework_nested import routers
from . import views


router = routers.DefaultRouter()
router.register('party-list', views.PartyViewSet, basename='party')
router.register('work-rate', views.Work_RateViewSet, basename='work')
router.register('service-type', views.Service_TypeViewSet,
                basename='service-type')
router.register('record', views.RecordViewSet, basename='record')
router.register('payment', views.PaymentViewSet, basename='payment')
router.register('allocation', views.AllocationViewSet, basename='allocation')
router.register('advance-ledger', views.AdvanceLedgerViewSet,
                basename='advance-ledger')


record_router = routers.NestedDefaultRouter(router, 'record', lookup='record')
record_router.register('note', views.NoteViewSet,
                       basename='record-note')

urlpatterns = router.urls + record_router.urls
