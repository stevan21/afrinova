import os
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from core.models import Expertise

EXPERTISES = [
    ("BTP", "Construction, rénovation, génie civil et suivi de chantier.", "#1B2A63"),
    ("Informatique", "Développement web & mobile, infrastructure et cybersécurité.", "#F47920"),
    ("Santé numérique", "Téléconsultation, dossiers patients et e-santé.", "#1AAA5E"),
    ("Immigration", "Visa, études, travail et installation à l'étranger.", "#6B3FA0"),
    ("Échange de devises", "Change multi-devises, transfert et conseil financier.", "#1B8A6B"),
    ("Location de voitures", "Courte/longue durée, avec ou sans chauffeur.", "#2563C9"),
    ("Multiservices", "Solutions intégrées et sur mesure, clés en main.", "#243375"),
]


class Command(BaseCommand):
    help = "Initialise la base pour la PRODUCTION : compte admin + expertises (sans données de démo)."

    def handle(self, *args, **opts):
        username = os.environ.get("DJANGO_ADMIN_USERNAME", "admin")
        password = os.environ.get("DJANGO_ADMIN_PASSWORD", "afrinova2025")
        email = os.environ.get("DJANGO_ADMIN_EMAIL", "admin@afrinova.com")

        u, created = User.objects.get_or_create(
            username=username, defaults={"email": email, "is_staff": True, "is_superuser": True})
        u.is_staff = True
        u.is_superuser = True
        if email:
            u.email = email
        u.set_password(password)
        u.save()
        self.stdout.write(self.style.SUCCESS(("Admin créé" if created else "Admin mis à jour") + f" : {username}"))

        for name, desc, color in EXPERTISES:
            obj, c = Expertise.objects.get_or_create(name=name, defaults={"description": desc, "color": color})
            if c:
                self.stdout.write(self.style.SUCCESS(f"Expertise '{name}' créée"))

        self.stdout.write(self.style.SUCCESS("Initialisation production terminée."))
