# Script pour ouvrir tous les services dans le navigateur
# Usage: .\open-services.ps1

Write-Host "🌐 Ouverture des Services Epileptic AI" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est en cours d'exécution
Write-Host "🔍 Vérification des services Docker..." -ForegroundColor Yellow
try {
    $services = docker compose ps --format json | ConvertFrom-Json
    Write-Host "✅ Docker est opérationnel" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "   → Démarrer les services avec: docker compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Fonction pour vérifier si un service répond
function Test-ServiceAvailable {
    param($url, $name)
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $name est accessible" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "⚠️  $name n'est pas encore prêt" -ForegroundColor Yellow
        return $false
    }
    return $false
}

# Vérifier les services
Write-Host "🔍 Vérification de la disponibilité des services..." -ForegroundColor Yellow
Write-Host ""

$frontendReady = Test-ServiceAvailable "http://localhost" "Frontend"
$backendReady = Test-ServiceAvailable "http://localhost:8000/health" "Backend"
$swaggerReady = Test-ServiceAvailable "http://localhost/api/v1/docs" "Swagger"
$pgAdminReady = Test-ServiceAvailable "http://localhost:5050" "pgAdmin"

Write-Host ""

# Si services pas prêts, attendre
if (-not ($frontendReady -and $backendReady)) {
    Write-Host "⏳ Certains services ne sont pas encore prêts..." -ForegroundColor Yellow
    Write-Host "   Attente de 10 secondes..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "🌐 Ouverture des services dans le navigateur..." -ForegroundColor Cyan
Write-Host ""

# Ouvrir les URLs
$urls = @(
    @{
        Name = "Frontend (Application Web)"
        Url = "http://localhost"
        Description = "Interface utilisateur principale"
    },
    @{
        Name = "Backend Swagger (Port 8000)"
        Url = "http://localhost:8000/docs"
        Description = "Documentation API directe"
    },
    @{
        Name = "Backend ReDoc (Port 8000)"
        Url = "http://localhost:8000/redoc"
        Description = "Documentation API alternative"
    },
    @{
        Name = "Swagger via Nginx"
        Url = "http://localhost/api/v1/docs"
        Description = "Documentation API via reverse proxy"
    },
    @{
        Name = "pgAdmin (Base de Données)"
        Url = "http://localhost:5050"
        Description = "Interface de gestion PostgreSQL"
    }
)

foreach ($service in $urls) {
    Write-Host "🔗 Ouverture: $($service.Name)" -ForegroundColor Cyan
    Write-Host "   URL: $($service.Url)" -ForegroundColor White
    Write-Host "   $($service.Description)" -ForegroundColor DarkGray
    Start-Process $service.Url
    Start-Sleep -Seconds 1
    Write-Host ""
}

Write-Host "✅ Tous les services ont été ouverts!" -ForegroundColor Green
Write-Host ""

# Afficher les informations de connexion
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  📋 INFORMATIONS DE CONNEXION                          ║" -ForegroundColor Yellow
Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Yellow
Write-Host "║                                                        ║" -ForegroundColor Yellow
Write-Host "║  📱 FRONTEND                                           ║" -ForegroundColor Yellow
Write-Host "║     → Créer un compte via le bouton Register           ║" -ForegroundColor Yellow
Write-Host "║                                                        ║" -ForegroundColor Yellow
Write-Host "║  📚 SWAGGER API                                        ║" -ForegroundColor Yellow
Write-Host "║     1. POST /auth/register → Créer un docteur          ║" -ForegroundColor Yellow
Write-Host "║     2. POST /auth/login → Récupérer le token           ║" -ForegroundColor Yellow
Write-Host "║     3. Cliquer 'Authorize' → Entrer: Bearer TOKEN      ║" -ForegroundColor Yellow
Write-Host "║     4. Tester les endpoints protégés                   ║" -ForegroundColor Yellow
Write-Host "║                                                        ║" -ForegroundColor Yellow
Write-Host "║  🗄️  PGADMIN                                           ║" -ForegroundColor Yellow
Write-Host "║     Email:    admin@epileptic.ai                       ║" -ForegroundColor Yellow
Write-Host "║     Password: admin123                                 ║" -ForegroundColor Yellow
Write-Host "║                                                        ║" -ForegroundColor Yellow
Write-Host "║     Configuration serveur PostgreSQL:                  ║" -ForegroundColor Yellow
Write-Host "║     Host:     postgres                                 ║" -ForegroundColor Yellow
Write-Host "║     Port:     5432                                     ║" -ForegroundColor Yellow
Write-Host "║     Database: epileptic_ai                             ║" -ForegroundColor Yellow
Write-Host "║     User:     postgres                                 ║" -ForegroundColor Yellow
Write-Host "║     Password: password                                 ║" -ForegroundColor Yellow
Write-Host "║                                                        ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Write-Host "📖 Pour plus de détails, consultez:" -ForegroundColor Cyan
Write-Host "   → GUIDE_ACCES_BDD_SWAGGER.md" -ForegroundColor White
Write-Host ""

Write-Host "🛠️  Commandes utiles:" -ForegroundColor Cyan
Write-Host "   docker compose logs -f            # Voir tous les logs" -ForegroundColor White
Write-Host "   docker compose logs -f backend    # Logs backend uniquement" -ForegroundColor White
Write-Host "   docker compose ps                 # Statut des services" -ForegroundColor White
Write-Host "   docker compose restart            # Redémarrer tous les services" -ForegroundColor White
Write-Host ""

Write-Host "✨ Bon développement!" -ForegroundColor Green
Write-Host ""
