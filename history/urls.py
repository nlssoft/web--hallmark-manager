from django.urls import path
from rest_framework_nested import routers
from . import views


router = routers.DefaultRouter()
router.register('party-list', views.PartyViewSet)
router.register('work-rate', views.Work_RateViewSet)
router.register('record', views.RecordViewSet, basename='record')

record_router = routers.NestedDefaultRouter(router, 'record', lookup='record')
record_router.register('note', views.NoteViewSet,
                       basename='record-note')

urlpatterns = router.urls + record_router.urls
