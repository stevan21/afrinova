from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from django.shortcuts import render

from rest_framework import viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import Member, Expertise, Note, Report, Message, Devis
from .serializers import (
    MemberSerializer, ExpertiseSerializer, NoteSerializer, ReportSerializer,
    MessageSerializer, DevisSerializer, UserSerializer,
)


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
        if data.get("photo"):
            member.photo = data.get("photo")
        member.save()
        return Response(MemberSerializer(member, context={"request": request}).data)

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        user.delete()


# ===================== Expertises =====================
class ExpertiseViewSet(viewsets.ModelViewSet):
    queryset = Expertise.objects.all()
    serializer_class = ExpertiseSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


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
