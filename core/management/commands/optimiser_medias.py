"""Recompresse les photos déjà envoyées avant la mise en place de l'optimisation.

Les fichiers sont réécrits sur place, sous le même nom : aucune référence en
base n'est touchée. Le format d'origine est conservé, pour que l'extension
reste cohérente avec le contenu.

    python manage.py optimiser_medias --dry-run   # simulation, n'écrit rien
    python manage.py optimiser_medias             # applique
"""
import os
from io import BytesIO

from django.core.management.base import BaseCommand
from PIL import Image, ImageOps

from core.models import Expertise, Member, Vehicule, VehiculePhoto

COTE_MAX = 1200
QUALITE = 80


def alleger(chemin, ecrire):
    """Renvoie (octets avant, octets après, description). N'écrit que si demandé."""
    avant = os.path.getsize(chemin)
    try:
        image = Image.open(chemin)
        image = ImageOps.exif_transpose(image)   # orientation des photos de téléphone
        image.load()
    except Exception as e:
        return avant, avant, f"ignorée ({type(e).__name__})"

    formt = (image.format or "JPEG").upper()
    trop_grande = image.width > COTE_MAX or image.height > COTE_MAX
    if not trop_grande and avant <= 350 * 1024:
        return avant, avant, "déjà légère"

    if trop_grande:
        image.thumbnail((COTE_MAX, COTE_MAX), Image.LANCZOS)

    tampon = BytesIO()
    if formt == "PNG":
        image.save(tampon, format="PNG", optimize=True)
    else:
        if image.mode in ("RGBA", "LA", "P"):
            fond = Image.new("RGB", image.size, (255, 255, 255))
            rgba = image.convert("RGBA")
            fond.paste(rgba, mask=rgba.split()[-1])
            image = fond
        elif image.mode != "RGB":
            image = image.convert("RGB")
        image.save(tampon, format="JPEG", quality=QUALITE,
                   optimize=True, progressive=True)

    donnees = tampon.getvalue()
    if len(donnees) >= avant:
        return avant, avant, "recompression sans gain"

    if ecrire:
        # Écriture atomique : le fichier servi n'est jamais tronqué
        provisoire = chemin + ".tmp"
        with open(provisoire, "wb") as f:
            f.write(donnees)
        os.replace(provisoire, chemin)
    return avant, len(donnees), f"{image.width}x{image.height}"


class Command(BaseCommand):
    help = "Réduit le poids des photos déjà présentes dans media/."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true",
                            help="affiche ce qui serait fait, sans rien modifier")

    def handle(self, *args, **opts):
        simulation = opts["dry_run"]
        if simulation:
            self.stdout.write(self.style.WARNING("SIMULATION — aucun fichier modifié\n"))

        sources = [
            ("véhicule", Vehicule.objects.exclude(photo="").exclude(photo=None), "photo"),
            ("photo véhicule", VehiculePhoto.objects.exclude(image="").exclude(image=None), "image"),
            ("pôle", Expertise.objects.exclude(photo="").exclude(photo=None), "photo"),
            ("membre", Member.objects.exclude(photo="").exclude(photo=None), "photo"),
        ]

        total_avant = total_apres = 0
        for libelle, lot, nom_champ in sources:
            for objet in lot:
                champ = getattr(objet, nom_champ)
                try:
                    chemin = champ.path
                except Exception:
                    continue
                if not os.path.exists(chemin):
                    self.stdout.write(f"  {libelle:<15} {champ.name[:44]:<46} fichier absent")
                    continue

                avant, apres, note = alleger(chemin, ecrire=not simulation)
                total_avant += avant
                total_apres += apres
                gain = f"-{(1 - apres / avant) * 100:.0f}%" if apres < avant else "—"
                self.stdout.write(
                    f"  {libelle:<15} {champ.name[:44]:<46} "
                    f"{avant / 1024:7.0f} Ko -> {apres / 1024:7.0f} Ko  {gain:>5}  {note}")

        if not total_avant:
            self.stdout.write("Aucune photo à traiter.")
            return

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"Total : {total_avant / 1024 / 1024:.1f} Mo -> {total_apres / 1024 / 1024:.1f} Mo "
            f"({(1 - total_apres / total_avant) * 100:.0f} % de moins)"))
        if simulation:
            self.stdout.write(self.style.WARNING(
                "Relancez sans --dry-run pour appliquer."))
