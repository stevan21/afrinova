"""
Point d'entrée WSGI pour Hostinger (Phusion Passenger).
À placer à la racine de l'application Python configurée dans le hPanel.
"""
import os
import sys

# La racine du projet (où se trouvent manage.py et config/) doit être sur le chemin
sys.path.insert(0, os.path.dirname(__file__))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from config.wsgi import application  # noqa: E402
