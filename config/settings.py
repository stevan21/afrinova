"""
Configuration Django — AFRINOVA
API REST (DRF) + service du frontend statique.
Prête pour la production : pilotée par variables d'environnement.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent      # .../afrinova (racine du projet)
FRONTEND_DIR = BASE_DIR                                 # templates/ et static/ sont à la racine

# Charge un fichier .env s'il existe (développement / serveur)
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / ".env")
except Exception:
    pass


def env(key, default=None):
    return os.environ.get(key, default)


def env_bool(key, default=False):
    return str(os.environ.get(key, default)).lower() in ("1", "true", "yes", "on")


def env_list(key, default=""):
    return [x.strip() for x in os.environ.get(key, default).split(",") if x.strip()]


# --- Sécurité / mode ---
SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-afrinova-change-me-en-production")
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "*")
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS", "")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Tiers
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    # Projet
    "core",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [FRONTEND_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# --- Base de données ---
# En production : définir DATABASE_URL (ex. postgres://user:pass@host:5432/db).
# Sinon : SQLite (développement).
if env("DATABASE_URL"):
    import dj_database_url
    DATABASES = {"default": dj_database_url.config(conn_max_age=600, ssl_require=env_bool("DJANGO_DB_SSL", False))}
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 4}},
]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Douala"
USE_I18N = True
USE_TZ = True

# --- Fichiers statiques (css/js/assets + admin Django / DRF) & médias ---
STATIC_URL = "/static/"
STATICFILES_DIRS = [FRONTEND_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    # « Manifest » ajoute une empreinte au nom des fichiers (styles.4f2a1b.css).
    # WhiteNoise peut alors les servir avec un cache d'un an au lieu de 60 s :
    # une nouvelle version change le nom, donc le navigateur la reprend tout
    # seul — plus besoin de vider le cache après un déploiement.
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Django REST Framework ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# --- CORS ---
# Le frontend est servi par Django (même origine) → CORS inutile en prod.
# On l'ouvre uniquement en développement.
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = env_list("DJANGO_CORS_ORIGINS", "")

# --- Durcissement en production ---
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SSL_REDIRECT", False)
    SECURE_HSTS_SECONDS = int(env("DJANGO_HSTS_SECONDS", "0") or 0)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
