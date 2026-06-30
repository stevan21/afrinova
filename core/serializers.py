from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Member, Expertise, Prestation, Realisation, Note, Report, Message, Devis


class MemberSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    expertise_name = serializers.CharField(source="expertise.name", read_only=True, default="")
    expertise_slug = serializers.CharField(source="expertise.slug", read_only=True, default="")

    class Meta:
        model = Member
        fields = ["id", "user_id", "name", "email", "poste", "pole", "phone", "photo",
                  "expertise", "expertise_name", "expertise_slug"]


class ExpertiseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expertise
        fields = ["id", "name", "slug", "tagline", "description", "color", "photo", "created", "updated"]
        read_only_fields = ["slug", "created", "updated"]


class PrestationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prestation
        fields = ["id", "expertise", "title", "description", "order"]


class RealisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Realisation
        fields = ["id", "expertise", "title", "description", "lieu", "year", "photo", "order"]


class ExpertiseDetailSerializer(serializers.ModelSerializer):
    """Page de détail d'un service (avec prestations et réalisations)."""
    prestations = PrestationSerializer(many=True, read_only=True)
    realisations = RealisationSerializer(many=True, read_only=True)

    class Meta:
        model = Expertise
        fields = ["id", "name", "slug", "tagline", "description", "color", "photo",
                  "prestations", "realisations"]


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "body", "created", "updated"]
        read_only_fields = ["created", "updated"]


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "title", "author", "date", "body", "created", "updated"]
        read_only_fields = ["created", "updated"]


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "sender", "recipient", "text", "read", "created"]
        read_only_fields = ["sender", "read", "created"]


class DevisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Devis
        fields = ["id", "name", "email", "phone", "service", "message", "status", "created"]
        read_only_fields = ["created"]


class UserSerializer(serializers.ModelSerializer):
    """Renvoyé après connexion : infos de l'utilisateur courant."""
    name = serializers.SerializerMethodField()
    member = MemberSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "name", "email", "is_staff", "is_superuser", "member"]

    def get_name(self, obj):
        full = obj.get_full_name().strip()
        return full or obj.username
