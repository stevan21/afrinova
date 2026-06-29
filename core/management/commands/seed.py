from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from core.models import Member, Expertise

MEMBERS = [
    ("jean", "Jean Mbarga", "BTP", "+237 6 11 11 11 11"),
    ("marie", "Marie Nkomo", "Informatique", "+237 6 22 22 22 22"),
]

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
    help = "Crée le superuser admin, des membres de démo et les expertises."

    def handle(self, *args, **opts):
        # Superuser admin
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@afrinova.com", "afrinova2025")
            self.stdout.write(self.style.SUCCESS("Superuser 'admin' créé (mot de passe: afrinova2025)"))
        else:
            self.stdout.write("Superuser 'admin' déjà présent.")

        # Membres de démo (comptes + profils)
        for username, name, pole, phone in MEMBERS:
            if not User.objects.filter(username=username).exists():
                u = User.objects.create_user(username=username, password="afrinova2025",
                                             first_name=name, email=f"{username}@afrinova.com")
                Member.objects.create(user=u, poste="Chef de projet", pole=pole, phone=phone)
                self.stdout.write(self.style.SUCCESS(f"Membre '{name}' créé (login: {username} / afrinova2025)"))

        # Expertises
        for name, desc, color in EXPERTISES:
            obj, created = Expertise.objects.get_or_create(name=name, defaults={"description": desc, "color": color})
            if created:
                self.stdout.write(self.style.SUCCESS(f"Expertise '{name}' créée"))

        self.stdout.write(self.style.SUCCESS("Seed terminé."))
