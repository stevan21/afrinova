from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Member(models.Model):
    """Chef de projet / membre. Lié à un compte utilisateur Django (auth)."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="member")
    poste = models.CharField(max_length=120, blank=True, default="Chef de projet")
    pole = models.CharField(max_length=120, blank=True, default="")
    # Pôle (page service) géré par ce chef de projet
    expertise = models.ForeignKey("Expertise", on_delete=models.SET_NULL, null=True, blank=True, related_name="managers")
    phone = models.CharField(max_length=40, blank=True, default="")
    photo = models.ImageField(upload_to="membres/", blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["user__first_name", "user__username"]

    @property
    def name(self):
        full = self.user.get_full_name().strip()
        return full or self.user.username

    def __str__(self):
        return self.name


class Expertise(models.Model):
    """Un pôle / service. Sa page de détail est gérée par l'expert affecté."""
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, null=True, blank=True)
    tagline = models.CharField(max_length=200, blank=True, default="")
    description = models.TextField(blank=True, default="")
    color = models.CharField(max_length=20, blank=True, default="#1B2A63")
    photo = models.ImageField(upload_to="expertises/", blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "pole"
            slug = base
            i = 2
            while Expertise.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Prestation(models.Model):
    """Service proposé, affiché sur la page de détail du pôle."""
    expertise = models.ForeignKey(Expertise, on_delete=models.CASCADE, related_name="prestations")
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class Realisation(models.Model):
    """Travail réalisé, affiché sur la page de détail du pôle."""
    expertise = models.ForeignKey(Expertise, on_delete=models.CASCADE, related_name="realisations")
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True, default="")
    lieu = models.CharField(max_length=120, blank=True, default="")
    year = models.CharField(max_length=20, blank=True, default="")
    photo = models.ImageField(upload_to="realisations/", blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "-id"]

    def __str__(self):
        return self.title


class Vehicule(models.Model):
    """Véhicule du parc de location, affiché sur la page /location.html.

    Le tarif dépend du trajet : en ville ou hors ville. Le chauffeur n'est pas
    une caractéristique du véhicule — c'est le client qui le demande ou non
    dans le formulaire de réservation.
    """
    # Rattaché à un pôle : l'expert de ce pôle peut gérer le parc (comme les prestations).
    expertise = models.ForeignKey(Expertise, on_delete=models.CASCADE, related_name="vehicules")
    name = models.CharField("Nom du véhicule", max_length=160)
    year = models.CharField("Année", max_length=10, blank=True, default="")
    # Tarifs journaliers en FCFA — 0 signifie « non communiqué »
    price_ville = models.PositiveIntegerField("Prix en ville / jour", default=0)
    price_hors_ville = models.PositiveIntegerField("Prix hors ville / jour", default=0)
    # Texte libre affiché au client : la remise se négocie, elle n'est pas calculée.
    remise = models.CharField("Remise sur plusieurs jours", max_length=200, blank=True, default="")
    available = models.BooleanField("Disponible", default=True)
    photo = models.ImageField("Photo principale", upload_to="vehicules/", blank=True, null=True)
    description = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-id"]
        verbose_name = "Véhicule"

    def __str__(self):
        return self.name


class VehiculePhoto(models.Model):
    """Photo supplémentaire d'un véhicule (galerie)."""
    vehicule = models.ForeignKey(Vehicule, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="vehicules/")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Photo {self.vehicule}"


class Reservation(models.Model):
    """Demande de réservation envoyée depuis la page de location."""
    STATUS = [
        ("nouvelle", "Nouvelle"),
        ("confirmée", "Confirmée"),
        ("terminée", "Terminée"),
        ("annulée", "Annulée"),
    ]
    # Détermine lequel des deux tarifs du véhicule s'applique
    ZONE = [
        ("ville", "En ville"),
        ("hors_ville", "Hors ville"),
    ]
    vehicule = models.ForeignKey(Vehicule, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name="reservations")
    name = models.CharField(max_length=160)
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=40, blank=True, default="")
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    zone = models.CharField("Trajet", max_length=12, choices=ZONE, default="ville")
    avec_chauffeur = models.BooleanField(default=False)
    message = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS, default="nouvelle")
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return f"{self.name} - {self.vehicule or 'véhicule supprimé'}"


class Note(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes")
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default="")
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated"]

    def __str__(self):
        return self.title


class Report(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=120, blank=True, default="")
    date = models.DateField(null=True, blank=True)
    body = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return self.title


class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_messages")
    text = models.TextField()
    read = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created"]

    def __str__(self):
        return f"{self.sender} -> {self.recipient}"


class Devis(models.Model):
    STATUS = [("nouveau", "Nouveau"), ("en cours", "En cours"), ("traité", "Traité")]
    name = models.CharField(max_length=160)
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=40, blank=True, default="")
    service = models.CharField(max_length=120, blank=True, default="")
    message = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS, default="nouveau")
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]
        verbose_name = "Devis"
        verbose_name_plural = "Devis"

    def __str__(self):
        return f"{self.name} - {self.service}"
