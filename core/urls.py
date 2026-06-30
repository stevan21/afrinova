from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("members", views.MemberViewSet, basename="member")
router.register("expertises", views.ExpertiseViewSet, basename="expertise")
router.register("notes", views.NoteViewSet, basename="note")
router.register("reports", views.ReportViewSet, basename="report")
router.register("messages", views.MessageViewSet, basename="message")
router.register("devis", views.DevisViewSet, basename="devis")
router.register("prestations", views.PrestationViewSet, basename="prestation")
router.register("realisations", views.RealisationViewSet, basename="realisation")

urlpatterns = [
    path("auth/login", views.login_view),
    path("auth/logout", views.logout_view),
    path("auth/me", views.me_view),
    path("services/<slug:slug>/", views.service_detail),
    path("my-service/", views.my_service),
] + router.urls
