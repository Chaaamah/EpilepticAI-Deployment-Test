@echo off
REM Script de démarrage rapide pour Epileptic-AI-Backend
REM Pour Windows PowerShell

setlocal enabledelayedexpansion

echo.
echo =========================================
echo EPILEPTIC-AI-BACKEND - Démarrage Rapide
echo =========================================
echo.

REM Vérifier Python
echo [1/4] Vérification de Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python non trouvé!
    echo Télécharger Python 3.13+: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo OK: Python installé

REM Vérifier Docker
echo [2/4] Vérification de Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker non trouvé!
    echo Télécharger Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo OK: Docker installé

REM Installer dépendances
echo [3/4] Installation des dépendances Python...
python -m pip install --upgrade pip setuptools wheel >nul 2>&1
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo ERROR: Impossible d'installer les dépendances
    echo Vérifiez requirements.txt
    pause
    exit /b 1
)
echo OK: Dépendances installées

REM Démarrer Docker
echo [4/4] Démarrage des services Docker...
docker-compose up -d >nul 2>&1
if errorlevel 1 (
    echo ERROR: Impossible de démarrer Docker
    docker-compose ps
    pause
    exit /b 1
)
echo OK: Services Docker actifs

echo.
echo =========================================
echo SETUP TERMINÉ ✓
echo =========================================
echo.
echo Prochaines étapes:
echo 1. Lancer le serveur:
echo    python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
echo.
echo 2. Tester l'API:
echo    http://127.0.0.1:8000/docs
echo.
echo 3. Exécuter les tests:
echo    python test_api.py
echo.
pause
