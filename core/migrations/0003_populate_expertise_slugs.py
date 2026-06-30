from django.db import migrations
from django.utils.text import slugify


def populate_slugs(apps, schema_editor):
    Expertise = apps.get_model("core", "Expertise")
    used = set()
    for exp in Expertise.objects.all():
        if exp.slug:
            used.add(exp.slug)
            continue
        base = slugify(exp.name) or "pole"
        slug = base
        i = 2
        while slug in used or Expertise.objects.filter(slug=slug).exists():
            slug = f"{base}-{i}"
            i += 1
        exp.slug = slug
        exp.save(update_fields=["slug"])
        used.add(slug)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_expertise_slug_expertise_tagline_member_expertise_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_slugs, noop),
    ]
