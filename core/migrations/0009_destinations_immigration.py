from django.db import migrations

# Reprend les clés de static/js/immigration-bareme.js : c'est ce qui relie
# une destination à son barème côté navigateur.
DESTINATIONS = [
    ("canada", "Canada"),
    ("france", "France"),
    ("belgique", "Belgique"),
    ("allemagne", "Allemagne"),
    ("royaume_uni", "Royaume-Uni"),
    ("etats_unis", "États-Unis"),
    ("autre_europe", "Autre pays d'Europe"),
]


def creer(apps, schema_editor):
    Pays = apps.get_model("core", "PaysImmigration")
    for i, (cle, nom) in enumerate(DESTINATIONS):
        # get_or_create : rejouer la migration ne rouvre pas une destination fermée
        Pays.objects.get_or_create(cle=cle, defaults={"nom": nom, "order": i})


def supprimer(apps, schema_editor):
    Pays = apps.get_model("core", "PaysImmigration")
    Pays.objects.filter(cle__in=[c for c, _ in DESTINATIONS]).delete()


class Migration(migrations.Migration):

    dependencies = [("core", "0008_paysimmigration")]

    operations = [migrations.RunPython(creer, supprimer)]
