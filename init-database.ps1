# Script d'initialisation de la base de données
# Crée les tables si elles n'existent pas

Write-Host "🗄️  Initialisation de la Base de Données" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est en cours d'exécution
Write-Host "🔍 Vérification de Docker..." -ForegroundColor Yellow
try {
    docker compose ps | Out-Null
    Write-Host "✅ Docker est opérationnel" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "   → Démarrer avec: docker compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Vérifier que le backend est démarré
Write-Host "🔍 Vérification du backend..." -ForegroundColor Yellow
$backendStatus = docker compose ps backend --format json | ConvertFrom-Json
if ($backendStatus.State -ne "running") {
    Write-Host "❌ Le backend n'est pas démarré" -ForegroundColor Red
    Write-Host "   → Démarrer avec: docker compose up -d backend" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Backend opérationnel" -ForegroundColor Green
Write-Host ""

# Attendre que le backend soit prêt
Write-Host "⏳ Attente que le backend soit prêt..." -ForegroundColor Yellow
$maxWait = 30
$waited = 0
$ready = $false

while (-not $ready -and $waited -lt $maxWait) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.status -eq "ok") {
            $ready = $true
        }
    } catch {
        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "   ⏳ Attente... ($waited/$maxWait s)" -ForegroundColor DarkGray
    }
}

if (-not $ready) {
    Write-Host "❌ Le backend ne répond pas" -ForegroundColor Red
    Write-Host "   → Vérifier: docker compose logs backend" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Backend prêt" -ForegroundColor Green
Write-Host ""

# Créer les tables
Write-Host "🔨 Création des tables dans PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

$initScript = @"
from app.core.database import engine, Base
from app.models.user import User
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.seizure import Seizure
from app.models.medication import Medication
from app.models.alert import Alert

# Importer clinical_note si existe
try:
    from app.models.clinical_note import ClinicalNote
except ImportError:
    print('Note: clinical_note model not found, skipping...')

print('Création des tables...')
Base.metadata.create_all(bind=engine)
print('✓ Tables créées avec succès!')

# Afficher les tables créées
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f'Tables disponibles ({len(tables)}):')
for table in sorted(tables):
    print(f'  - {table}')
"@

# Sauvegarder le script temporaire
$tempScript = "temp_init.py"
$initScript | Out-File -FilePath $tempScript -Encoding UTF8

# Copier dans le container
docker cp $tempScript epileptic_backend:/app/temp_init.py

# Exécuter le script
Write-Host "📊 Exécution du script d'initialisation..." -ForegroundColor Cyan
docker exec epileptic_backend python /app/temp_init.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Tables créées avec succès!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la création des tables" -ForegroundColor Red
    Write-Host "   → Vérifier: docker compose logs backend" -ForegroundColor Yellow
    Remove-Item $tempScript -ErrorAction SilentlyContinue
    exit 1
}

# Nettoyer
docker exec epileptic_backend rm /app/temp_init.py
Remove-Item $tempScript -ErrorAction SilentlyContinue

Write-Host ""

# Vérifier dans PostgreSQL
Write-Host "🔍 Vérification dans PostgreSQL..." -ForegroundColor Yellow

$verifyQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

Write-Host ""
Write-Host "Tables dans la base de données:" -ForegroundColor Cyan
docker exec epileptic_postgres psql -U postgres -d epileptic_ai -c "$verifyQuery"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ INITIALISATION TERMINÉE!                           ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  La base de données est prête à l'emploi!              ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  Vous pouvez maintenant:                               ║" -ForegroundColor Green
Write-Host "║  1. Créer des comptes docteurs                         ║" -ForegroundColor Green
Write-Host "║  2. Tester l'API dans Swagger                          ║" -ForegroundColor Green
Write-Host "║  3. Utiliser le frontend                               ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 Accès aux services:" -ForegroundColor Cyan
Write-Host "   Frontend:        http://localhost" -ForegroundColor White
Write-Host "   Swagger Direct:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "   ReDoc:           http://localhost:8000/redoc" -ForegroundColor White
Write-Host "   pgAdmin:         http://localhost:5050" -ForegroundColor White
Write-Host ""

Write-Host "📖 Guide de test: TEST_API.md" -ForegroundColor Cyan
Write-Host ""
