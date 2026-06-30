from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from django.shortcuts import render

from rest_framework import viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import Member, Expertise, Prestation, Realisation, Note, Report, Message, Devis
from .serializers import (
    MemberSerializer, ExpertiseSerializer, ExpertiseDetailSerializer,
    PrestationSerializer, RealisationSerializer,
    NoteSerializer, ReportSerializer, MessageSerializer, DevisSerializer, UserSerializer,
)


def user_can_edit_expertise(user, expertise):
    """Admin, ou l'expert affecté à ce pôle."""
    if user and user.is_staff:
        return True
    member = getattr(user, "member", None)
    return bool(member and expertise and member.expertise_id == expertise.id)


# ===================== Authentification =====================
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""
    user = authenticate(username=username, password=password)
    if not user:
        return Response({"detail": "Identifiants invalides."}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user, context={"request": request}).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"ok": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user, context={"request": request}).data)


# ===================== Membres (chefs de projet) =====================
class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.select_related("user").all()
    serializer_class = MemberSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def create(self, request, *args, **kwargs):
        data = request.data
        name = (data.get("name") or "").strip()
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""
        email = (data.get("email") or "").strip()
        if not username or not password:
            return Response({"detail": "Nom d'utilisateur et mot de passe requis."}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({"detail": "Ce nom d'utilisateur existe déjà."}, status=400)
        user = User.objects.create_user(username=username, password=password, email=email, first_name=name)
        member = Member.objects.create(
            user=user,
            poste=(data.get("poste") or "Chef de projet"),
            pole=(data.get("pole") or ""),
            phone=(data.get("phone") or ""),
        )
        exp_id = data.get("expertise")
        if exp_id:
            exp = Expertise.objects.filter(pk=exp_id).first()
            if exp:
                member.expertise = exp
                if not data.get("pole"):
                    member.pole = exp.name
        if data.get("photo"):
            member.photo = data.get("photo")
        member.save()
        return Response(MemberSerializer(member, context={"request": request}).data, status=201)

    def update(self, request, *args, **kwargs):
        member = self.get_object()
        data = request.data
        if "name" in data:
            member.user.first_name = data.get("name") or ""
        if "email" in data:
            member.user.email = data.get("email") or ""
        if data.get("password"):
            member.user.set_password(data.get("password"))
        member.user.save()
        for f in ("poste", "pole", "phone"):
            if f in data:
                setattr(member, f, data.get(f) or "")
        if "expertise" in data:
            exp_id = data.get("expertise")
            exp = Expertise.objects.filter(pk=exp_id).first() if exp_id else None
            member.expertise = exp
            if exp:
                member.pole = exp.name
        if data.get("photo"):
            member.photo = data.get("photo")
        member.save()
        return Response(MemberSerializer(member, context={"request": request}).data)

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        user.delete()


# ===================== Expertises (pôles / pages service) =====================
class ExpertiseViewSet(viewsets.ModelViewSet):
    queryset = Expertise.objects.all()
    serializer_class = ExpertiseSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        if self.action in ("create", "destroy"):
            return [IsAdminUser()]            # seul l'admin crée/supprime un pôle
        return [IsAuthenticated()]            # update : vérifié ci-dessous (admin ou expert affecté)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    def update(self, request, *args, **kwargs):
        expertise = self.get_object()
        if not user_can_edit_expertise(request.user, expertise):
            raise PermissionDenied("Vous ne gérez pas ce pôle.")
        return super().update(request, *args, **kwargs)


# Détail public d'un service (par slug) : description + prestations + réalisations
@api_view(["GET"])
@permission_classes([AllowAny])
def service_detail(request, slug):
    try:
        exp = Expertise.objects.get(slug=slug)
    except Expertise.DoesNotExist:
        return Response({"detail": "Service introuvable."}, status=404)
    return Response(ExpertiseDetailSerializer(exp, context={"request": request}).data)


# La page service de l'expert connecté (son pôle affecté)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_service(request):
    member = getattr(request.user, "member", None)
    exp = member.expertise if member else None
    if not exp:
        return Response({"detail": "Aucun pôle affecté."}, status=404)
    return Response(ExpertiseDetailSerializer(exp, context={"request": request}).data)


class _PoleScopedViewSet(viewsets.ModelViewSet):
    """CRUD limité au pôle de l'expert (ou tout pour l'admin)."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = self.model.objects.all()
        user = self.request.user
        exp_id = self.request.query_params.get("expertise")
        if exp_id:
            qs = qs.filter(expertise_id=exp_id)
        if not user.is_staff:
            member = getattr(user, "member", None)
            qs = qs.filter(expertise=member.expertise) if (member and member.expertise_id) else qs.none()
        return qs

    def _check(self, expertise):
        if not user_can_edit_expertise(self.request.user, expertise):
            raise PermissionDenied("Vous ne gérez pas ce pôle.")

    def perform_create(self, serializer):
        self._check(serializer.validated_data.get("expertise"))
        serializer.save()

    def perform_update(self, serializer):
        self._check(serializer.instance.expertise)
        serializer.save()

    def perform_destroy(self, instance):
        self._check(instance.expertise)
        instance.delete()


class PrestationViewSet(_PoleScopedViewSet):
    model = Prestation
    serializer_class = PrestationSerializer


class RealisationViewSet(_PoleScopedViewSet):
    model = Realisation
    serializer_class = RealisationSerializer


# ===================== Notes (personnelles) =====================
class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# ===================== Rapports =====================
class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ===================== Messages =====================
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        return Message.objects.filter(Q(sender=u) | Q(recipient=u))

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=["post"])
    def mark_read(self, request):
        contact = request.data.get("contact")
        Message.objects.filter(sender_id=contact, recipient=request.user, read=False).update(read=True)
        return Response({"ok": True})


# ===================== Devis =====================
class DevisViewSet(viewsets.ModelViewSet):
    queryset = Devis.objects.all()
    serializer_class = DevisSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAdminUser()]


# ===================== Pages (templates Django) =====================
def index(request):
    return render(request, "index.html")


def service(request):
    return render(request, "service.html")


def admin_page(request):
    return render(request, "admin.html")


def expert_page(request):
    return render(request, "expert.html")


def connexion(request):
    return render(request, "connexion.html")
