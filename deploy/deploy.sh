#!/usr/bin/env bash
# ============================================================
#  AFRINOVA — Déploiement sur VPS Ubuntu (root)
#  Stack : gunicorn + nginx + systemd (SQLite).
#  Usage :  bash deploy/deploy.sh  afrinovagroupe.com
#  (sans argument : le site répond sur l'IP du serveur)
# ============================================================
set -e

DOMAIN="${1:-_}"
# Racine du projet = dossier parent de ce script (fonctionne depuis n'importe où)
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IP="$(hostname -I | awk '{print $1}')"

echo "==> Domaine : $DOMAIN   |   IP : $IP   |   Dossier : $APP_DIR"

# 1) Paquets système
apt update
apt install -y python3 python3-venv python3-pip nginx

# 2) Se placer dans le dossier du projet
cd "$APP_DIR"

# 3) Environnement Python
python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 4) Fichier .env — généré automatiquement (clé secrète unique, jamais sur GitHub)
if [ ! -f .env ]; then
  echo "==> Génération du fichier .env (production)"
  SECRET="$(python -c 'from django.core.management.utils import get_random_secret_key as g; print(g())')"
  if [ "$DOMAIN" = "_" ]; then
    ALLOWED="$IP"
    CSRF="http://$IP"
  else
    ALLOWED="$DOMAIN,www.$DOMAIN,$IP"
    CSRF="https://$DOMAIN,https://www.$DOMAIN,http://$IP"
  fi
  cat > .env <<EOF
DJANGO_SECRET_KEY='$SECRET'
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=$ALLOWED
DJANGO_CSRF_TRUSTED_ORIGINS=$CSRF
DATABASE_URL=
DJANGO_SSL_REDIRECT=False
DJANGO_HSTS_SECONDS=0
EOF
fi

# 5) Django : statiques, base, admin + expertises
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py prodinit

# 6) Droits (www-data doit pouvoir écrire la base SQLite et les médias)
chown -R www-data:www-data "$APP_DIR"

# 7) Service systemd (gunicorn)
cp deploy/afrinova.service /etc/systemd/system/afrinova.service
systemctl daemon-reload
systemctl enable --now afrinova
systemctl restart afrinova

# 8) Nginx (reverse proxy) — vhost ISOLÉ, on ne touche à aucune autre config
if [ "$DOMAIN" = "_" ]; then SN="_"; else SN="$DOMAIN www.$DOMAIN"; fi
sed "s/SERVER_NAME/$SN/" deploy/afrinova-nginx.conf > /etc/nginx/sites-available/afrinova
ln -sf /etc/nginx/sites-available/afrinova /etc/nginx/sites-enabled/afrinova
# (On NE supprime PAS le site par défaut ni les autres vhosts éventuels.)
nginx -t
systemctl reload nginx

echo ""
echo "============================================================"
echo " ✅ Déploiement terminé."
if [ "$DOMAIN" = "_" ]; then echo " Site en ligne : http://$IP"; else echo " Site en ligne : http://$DOMAIN  (et http://$IP)"; fi
echo ""
echo " Admin : /admin.html  (admin / afrinova2025 — à changer)"
echo ""
echo " HTTPS (après que le DNS pointe vers $IP) :"
echo "   apt install -y certbot python3-certbot-nginx"
echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "   puis dans .env : DJANGO_SSL_REDIRECT=True  &&  systemctl restart afrinova"
echo "============================================================"
