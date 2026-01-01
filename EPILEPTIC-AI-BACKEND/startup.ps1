#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de démarrage automatisé pour Epileptic-AI-Backend
.DESCRIPTION
    Installe les dépendances, démarre Docker et lance le serveur
.EXAMPLE
    .\startup.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host "
╔════════════════════════════════════════════╗
║  EPILEPTIC-AI-BACKEND - Démarrage Rapide  ║
╚════════════════════════════════════════════╝
" -ForegroundColor Cyan

# Étape 1: Vérifier Python
Write-Host "[1/5] Vérification de Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python non trouvé!" -ForegroundColor Red
    Write-Host "Télécharger: https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# Étape 2: Vérifier Docker
Write-Host "[2/5] Vérification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✓ $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker non trouvé!" -ForegroundColor Red
    Write-Host "Télécharger: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Étape 3: Installer dépendances
Write-Host "[3/5] Installation des dépendances Python..." -ForegroundColor Yellow
Write-Host "      (Cela peut prendre 3-5 minutes)" -ForegroundColor Gray

python -m pip install --upgrade pip setuptools wheel 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors de la mise à jour de pip" -ForegroundColor Red
    exit 1
}

pip install -r requirements.txt 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors de l'installation des packages" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dépendances installées" -ForegroundColor Green

# Étape 4: Démarrer Docker
Write-Host "[4/5] Démarrage des services Docker..." -ForegroundColor Yellow
docker-compose up -d 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors du démarrage de Docker" -ForegroundColor Red
    docker-compose ps
    exit 1
}

Start-Sleep -Seconds 3
$services = docker-compose ps --format json | ConvertFrom-Json
$postgres = $services | Where-Object { $_.Service -eq "postgres" }
$redis = $services | Where-Object { $_.Service -eq "redis" }

if ($postgres.State -match "Up" -and $redis.State -match "Up") {
    Write-Host "✓ PostgreSQL: $($postgres.State)" -ForegroundColor Green
    Write-Host "✓ Redis: $($redis.State)" -ForegroundColor Green
} else {
    Write-Host "⚠ Services Docker:" -ForegroundColor Yellow
    docker-compose ps
}

# Étape 5: Prêt à démarrer
Write-Host "[5/5] Préparation terminée!" -ForegroundColor Yellow
Write-Host "✓ Tous les services sont prêts" -ForegroundColor Green

Write-Host "
╔════════════════════════════════════════════╗
║         PROCHAINES ÉTAPES                  ║
╚════════════════════════════════════════════╝
" -ForegroundColor Cyan

Write-Host "
📌 OPTION 1: Démarrer le serveur FastAPI
   Commande: python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   Accès: http://127.0.0.1:8000/docs

📌 OPTION 2: Exécuter les tests automatiques
   Commande: python test_api.py

📌 OPTION 3: Lancer les tests unitaires
   Commande: pytest tests/ -v

📌 Pour plus d'infos:
   - Voir: SETUP.md
   - Checklist: TESTING_CHECKLIST.md

" -ForegroundColor Cyan

Write-Host "✅ Setup terminé! Bon codage! 🚀" -ForegroundColor Green
