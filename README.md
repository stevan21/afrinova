# AFRINOVA — Site + Backend Django

Site vitrine AFRINOVA avec un **backend Django REST** qui rend tout fonctionnel
(devis, chefs de projet, expertises, notes, rapports, messagerie) avec de **vrais
comptes** et une **base de données partagée**.

## 🚀 Démarrer

1. Double-cliquez sur **`demarrer-serveur.bat`** (ou en ligne de commande) :
   ```bash
   python manage.py runserver
   ```
2. Ouvrez le navigateur sur **http://127.0.0.1:8000/**

> ⚠️ Important : il faut passer par **http://127.0.0.1:8000/**, plus en ouvrant
> directement les fichiers `.html` (le site dialogue avec l'API `/api/...`).

## 🔑 Connexion

| Espace | URL | Identifiant | Mot de passe |
|--------|-----|-------------|--------------|
| Administration | `/admin.html` | `admin` | `afrinova2025` |
| Admin Django (avancé) | `/django-admin/` | `admin` | `afrinova2025` |

> Les identifiants ne sont **plus affichés** sur les pages de connexion.

Les **chefs de projet** (membres) sont créés depuis l'espace Admin → onglet
« Chefs de projet ». Chacun reçoit alors un compte (identifiant + mot de passe)
pour se connecter à l'**Espace Expert** (`/expert.html`).

## 🧱 Architecture (structure Django classique)

```
afrinova/
├─ manage.py         ← commande Django
├─ config/           ← projet : settings.py, urls.py, wsgi.py
├─ core/             ← app : models, views (API + pages), serializers, urls, migrations
├─ templates/        ← pages HTML rendues par Django (index, service, admin, expert)
├─ static/           ← css/ js/ assets/  (référencés via {% static %})
├─ db.sqlite3        ← base de données
├─ media/            ← photos uploadées
├─ passenger_wsgi.py ← point d'entrée Hostinger
└─ requirements.txt
```

- **Pages** : `core/views.py` → `index`, `service`, `admin_page`, `expert_page`
  rendent les templates avec `render()`. Le HTML utilise `{% load static %}` +
  `{% static '…' %}`. Le JavaScript (`static/js/api.js`) dialogue avec l'**API REST**.
- **API** : Django REST Framework (token auth) sous `/api/...`.
- **Statiques** : servis par Django (`STATICFILES_DIRS = static/`) en dev, par
  **WhiteNoise** en prod après `collectstatic`.

## 🔌 Principales routes API

- `POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/logout`
- `GET/POST /api/expertises/` (lecture publique)
- `GET/POST /api/members/` · `GET/POST /api/devis/` (création publique)
- `GET/POST /api/notes/` (privées par membre) · `GET/POST /api/reports/`
- `GET/POST /api/messages/` + `POST /api/messages/mark_read/`

## 🛠️ (Ré)initialiser la base pour la production

Crée le compte **admin** + les **7 expertises**, sans aucune donnée de démo :

```bash
python manage.py migrate
python manage.py prodinit
```

Mot de passe admin personnalisable via variables d'environnement
(`DJANGO_ADMIN_USERNAME`, `DJANGO_ADMIN_PASSWORD`, `DJANGO_ADMIN_EMAIL`).

## 🌐 Mise en ligne sur Hostinger (SQLite)

Le projet est **prêt pour la production** (config par variables d'environnement,
voir `.env.example`). La base `db.sqlite3` est déjà préparée (admin +
expertises) — il suffit de l'envoyer avec le projet.

### 1) Préparer le fichier `.env`
Créez **`.env`** (à la racine, à côté de `manage.py`) avec :
```env
DJANGO_SECRET_KEY=une-longue-chaine-aleatoire-unique
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
```

### 2) Créer l'application Python (hPanel Hostinger)
- hPanel → **Avancé → Setup Python App** (ou « Python »).
- **Application root** : le dossier où vous envoyez le projet (contenant
  `passenger_wsgi.py`, `manage.py`, `config/`, `core/`, `templates/`, `static/`…).
- **Application startup file** : `passenger_wsgi.py` (déjà fourni à la racine).
- Version Python : 3.11/3.12.

### 3) Installer et initialiser (terminal hPanel / SSH)
```bash
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate           # si nouvelle base
# (la base db.sqlite3 fournie contient déjà l'admin et les expertises)
```
Puis **Restart** de l'application Python dans le hPanel.

### Notes importantes
- Mettez bien `DJANGO_DEBUG=False` et une vraie `DJANGO_SECRET_KEY`.
- **SQLite** : le fichier `db.sqlite3` doit être **inscriptible** par
  l'application. Les **photos uploadées** vont dans `media/` (à conserver
  lors des mises à jour, ne pas écraser).
- Pour basculer plus tard sur **MySQL** (Hostinger) : créez la base dans le hPanel
  et définissez `DATABASE_URL=mysql://user:pass@host:3306/dbname` (driver MySQL à
  ajouter). Je peux le configurer si besoin.

> Une config alternative VPS (gunicorn + `Procfile`) et Render (`render.yaml`)
> sont aussi fournies si vous changez d'hébergement.

## 🖥️ Mise en ligne sur un VPS (root SSH — gunicorn + nginx)

Fichiers fournis dans `deploy/` : `deploy.sh`, `afrinova.service`, `afrinova-nginx.conf`.

1. **Envoyer le code** sur le VPS dans `/opt/afrinova` (SFTP type FileZilla, ou `git clone`).
2. **Renseigner le domaine** dans `.env.production` (`DJANGO_ALLOWED_HOSTS`,
   `DJANGO_CSRF_TRUSTED_ORIGINS`). L'IP du VPS y est déjà pour un test immédiat.
3. **Lancer le déploiement** (en root, sur le VPS) :
   ```bash
   cd /opt/afrinova
   bash deploy/deploy.sh votre-domaine.com      # ou sans argument pour l'IP
   ```
   Le script installe Python/nginx, crée le venv, installe les dépendances,
   `collectstatic` + `migrate` + `prodinit`, configure le service systemd (gunicorn)
   et nginx. Le site répond ensuite sur `http://votre-domaine.com` (ou l'IP).
4. **HTTPS** :
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
   ```
   Puis dans `.env` : `DJANGO_SSL_REDIRECT=True` et `systemctl restart afrinova`.

Commandes utiles : `systemctl status afrinova` · `journalctl -u afrinova -f` ·
`systemctl restart afrinova`.

## 📦 Dépendances

Voir `requirements.txt` : Django, djangorestframework, django-cors-headers,
Pillow, whitenoise, gunicorn, dj-database-url, python-dotenv, psycopg.
