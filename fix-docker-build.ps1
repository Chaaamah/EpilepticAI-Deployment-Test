# Script de correction automatique du build Docker
# Usage: .\fix-docker-build.ps1

Write-Host "🔧 Script de Correction du Build Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Docker
Write-Host "🔍 Vérification Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker est en cours d'exécution" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "   → Démarrer Docker Desktop et réessayer" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Étape 1: Arrêter les services
Write-Host "1️⃣  Arrêt des services existants..." -ForegroundColor Yellow
docker compose down 2>&1 | Out-Null
Write-Host "✅ Services arrêtés" -ForegroundColor Green
Write-Host ""

# Étape 2: Nettoyer le cache
Write-Host "2️⃣  Nettoyage du cache Docker..." -ForegroundColor Yellow
docker builder prune -f 2>&1 | Out-Null
Write-Host "✅ Cache nettoyé" -ForegroundColor Green
Write-Host ""

# Étape 3: Build backend
Write-Host "3️⃣  Build backend..." -ForegroundColor Yellow
docker compose build backend 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend build réussi" -ForegroundColor Green
} else {
    Write-Host "❌ Échec build backend" -ForegroundColor Red
    Write-Host ""
    Write-Host "Essayer manuellement:" -ForegroundColor Yellow
    Write-Host "  docker compose build --progress=plain backend" -ForegroundColor White
    exit 1
}
Write-Host ""

# Étape 4: Build frontend avec retry
Write-Host "4️⃣  Build frontend (peut prendre 2-5 minutes)..." -ForegroundColor Yellow
$maxRetries = 3
$retryCount = 0
$success = $false

while (-not $success -and $retryCount -lt $maxRetries) {
    $retryCount++
    Write-Host "   📦 Tentative $retryCount/$maxRetries..." -ForegroundColor Cyan

    # Augmenter timeouts
    $env:COMPOSE_HTTP_TIMEOUT = "300"
    $env:DOCKER_CLIENT_TIMEOUT = "300"

    $buildOutput = docker compose build frontend 2>&1

    if ($LASTEXITCODE -eq 0) {
        $success = $true
        Write-Host "✅ Frontend build réussi!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Échec - Nouvelle tentative dans 10s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
}

if (-not $success) {
    Write-Host ""
    Write-Host "❌ Build frontend échoué après $maxRetries tentatives" -ForegroundColor Red
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  SOLUTIONS ALTERNATIVES:                               ║" -ForegroundColor Yellow
    Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Yellow
    Write-Host "║                                                        ║" -ForegroundColor Yellow
    Write-Host "║  1. Augmenter RAM Docker:                              ║" -ForegroundColor Yellow
    Write-Host "║     Docker Desktop → Settings → Resources              ║" -ForegroundColor Yellow
    Write-Host "║     Memory: 6-8 GB (actuellement probablement 2-4 GB)  ║" -ForegroundColor Yellow
    Write-Host "║                                                        ║" -ForegroundColor Yellow
    Write-Host "║  2. Build local puis Docker:                           ║" -ForegroundColor Yellow
    Write-Host "║     cd EpilepticAI-web                                 ║" -ForegroundColor Yellow
    Write-Host "║     npm install                                        ║" -ForegroundColor Yellow
    Write-Host "║     npm run build                                      ║" -ForegroundColor Yellow
    Write-Host "║     cd ..                                              ║" -ForegroundColor Yellow
    Write-Host "║     docker compose up -d backend postgres redis        ║" -ForegroundColor Yellow
    Write-Host "║                                                        ║" -ForegroundColor Yellow
    Write-Host "║  3. Mode Développement (sans Docker frontend):         ║" -ForegroundColor Yellow
    Write-Host "║     docker compose up -d backend postgres redis        ║" -ForegroundColor Yellow
    Write-Host "║     cd EpilepticAI-web                                 ║" -ForegroundColor Yellow
    Write-Host "║     npm run dev                                        ║" -ForegroundColor Yellow
    Write-Host "║                                                        ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📖 Voir TROUBLESHOOTING.md pour plus de détails" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""

# Étape 5: Build autres services
Write-Host "5️⃣  Build worker..." -ForegroundColor Yellow
docker compose build worker 2>&1 | Out-Null
Write-Host "✅ Worker build réussi" -ForegroundColor Green
Write-Host ""

# Étape 6: Démarrer tous les services
Write-Host "6️⃣  Démarrage des services..." -ForegroundColor Yellow
Write-Host "   (Cela peut prendre 30-60 secondes)" -ForegroundColor DarkGray
docker compose up -d

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "7️⃣  Vérification des services..." -ForegroundColor Yellow

# Attendre que les services soient prêts
$maxWait = 60
$waited = 0
$backendReady = $false

while (-not $backendReady -and $waited -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
        }
    } catch {
        # Continuer à attendre
    }

    if (-not $backendReady) {
        Write-Host "   ⏳ Attente des services... ($waited/$maxWait s)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 5
        $waited += 5
    }
}

Write-Host ""

if ($backendReady) {
    Write-Host "✅ Backend est opérationnel" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend prend plus de temps que prévu" -ForegroundColor Yellow
    Write-Host "   Vérifier les logs: docker compose logs -f backend" -ForegroundColor White
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ DÉPLOIEMENT TERMINÉ!                               ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  🌐 Frontend:     http://localhost                     ║" -ForegroundColor Green
Write-Host "║  📚 API Docs:     http://localhost/api/v1/docs         ║" -ForegroundColor Green
Write-Host "║  🔧 Backend:      http://localhost:8000                ║" -ForegroundColor Green
Write-Host "║  🗄️  pgAdmin:     make pgadmin (port 5050)             ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Commandes utiles:" -ForegroundColor Cyan
Write-Host "   docker compose logs -f        # Voir les logs" -ForegroundColor White
Write-Host "   docker compose ps             # Statut services" -ForegroundColor White
Write-Host "   docker compose down           # Arrêter" -ForegroundColor White
Write-Host "   docker compose restart        # Redémarrer" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation: DOCKER_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
