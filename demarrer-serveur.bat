@echo off
REM ============================================================
REM  AFRINOVA - Lancement du serveur (backend Django + site)
REM ============================================================
cd /d "%~dp0"
echo Demarrage du serveur AFRINOVA...
echo Ouvrez ensuite : http://127.0.0.1:8000/
echo (Ctrl+C pour arreter)
python manage.py runserver
pause
