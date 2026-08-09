"""Nouveau modèle tarifaire du parc.

« Marque + Modèle » devient un simple nom, les tarifs jour/semaine/mois
laissent place à un prix en ville et un prix hors ville, et la remise sur
plusieurs jours est un texte libre. L'option chauffeur n'est plus portée par
le véhicule : le client la choisit dans le formulaire de réservation.
"""

from django.db import migrations, models


def fusionner_noms(apps, schema_editor):
    """Reprend les véhicules existants dans les nouveaux champs."""
    Vehicule = apps.get_model("core", "Vehicule")
    for v in Vehicule.objects.all():
        v.name = f"{v.brand} {v.model}".strip() or "Véhicule"
        # L'ancien tarif journalier correspond au tarif en ville ;
        # le tarif hors ville reste à saisir (0 = « sur demande »).
        v.price_ville = v.price_day
        v.save(update_fields=["name", "price_ville"])


def separer_noms(apps, schema_editor):
    """Retour arrière : le premier mot fait la marque, le reste le modèle."""
    Vehicule = apps.get_model("core", "Vehicule")
    for v in Vehicule.objects.all():
        marque, _, modele = (v.name or "").partition(" ")
        v.brand, v.model, v.price_day = marque, modele, v.price_ville
        v.save(update_fields=["brand", "model", "price_day"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_vehicule_reservation_vehiculephoto"),
    ]

    operations = [
        migrations.AddField(
            model_name="vehicule",
            name="name",
            field=models.CharField(default="", max_length=160, verbose_name="Nom du véhicule"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="vehicule",
            name="price_ville",
            field=models.PositiveIntegerField(default=0, verbose_name="Prix en ville / jour"),
        ),
        migrations.AddField(
            model_name="vehicule",
            name="price_hors_ville",
            field=models.PositiveIntegerField(default=0, verbose_name="Prix hors ville / jour"),
        ),
        migrations.AddField(
            model_name="vehicule",
            name="remise",
            field=models.CharField(blank=True, default="", max_length=200,
                                   verbose_name="Remise sur plusieurs jours"),
        ),
        migrations.RunPython(fusionner_noms, separer_noms),
        migrations.RemoveField(model_name="vehicule", name="brand"),
        migrations.RemoveField(model_name="vehicule", name="model"),
        migrations.RemoveField(model_name="vehicule", name="price_day"),
        migrations.RemoveField(model_name="vehicule", name="price_week"),
        migrations.RemoveField(model_name="vehicule", name="price_month"),
        migrations.RemoveField(model_name="vehicule", name="chauffeur"),
        migrations.AddField(
            model_name="reservation",
            name="zone",
            field=models.CharField(choices=[("ville", "En ville"), ("hors_ville", "Hors ville")],
                                   default="ville", max_length=12, verbose_name="Trajet"),
        ),
    ]
