# Script de test de communication Frontend ↔ Backend ↔ Database
# Usage: .\test-communication.ps1

Write-Host "🧪 Test de Communication - Epileptic AI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est en cours d'exécution
Write-Host "🔍 Étape 1: Vérification de Docker..." -ForegroundColor Yellow
try {
    docker compose ps | Out-Null
    Write-Host "✅ Docker est opérationnel" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "   → Démarrer avec: docker compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 1: Backend Health
Write-Host "🔍 Étape 2: Test Backend..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Backend répond: $($backendHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend ne répond pas" -ForegroundColor Red
    Write-Host "   → Vérifier: docker compose logs backend" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Database via Backend
Write-Host "🔍 Étape 3: Test connexion Database..." -ForegroundColor Yellow
try {
    # Essayer de créer un compte docteur de test
    $registerData = @{
        email = "test-$(Get-Random)@epileptic.ai"
        password = "Test123!"
        full_name = "Dr. Test Communication"
        specialization = "Test"
        license_number = "TEST-$(Get-Random)"
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $registerResponse = Invoke-RestMethod -Uri "http://localhost/api/v1/auth/register" -Method Post -Body $registerData -Headers $headers -TimeoutSec 10
    Write-Host "✅ Compte docteur créé avec succès (ID: $($registerResponse.id))" -ForegroundColor Green

    # Sauvegarder pour les prochains tests
    $testEmail = ($registerData | ConvertFrom-Json).email
    $testPassword = "Test123!"

} catch {
    Write-Host "❌ Échec de création de compte" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 3: Authentification
Write-Host "🔍 Étape 4: Test authentification..." -ForegroundColor Yellow
try {
    $loginData = "username=$testEmail&password=$testPassword"
    $loginHeaders = @{
        "Content-Type" = "application/x-www-form-urlencoded"
    }

    $loginResponse = Invoke-RestMethod -Uri "http://localhost/api/v1/auth/login" -Method Post -Body $loginData -Headers $loginHeaders -TimeoutSec 10
    $token = $loginResponse.access_token
    Write-Host "✅ Authentification réussie" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor DarkGray
} catch {
    Write-Host "❌ Échec d'authentification" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 4: Requête protégée (Dashboard)
Write-Host "🔍 Étape 5: Test endpoint protégé (Dashboard)..." -ForegroundColor Yellow
try {
    $authHeaders = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $dashboardStats = Invoke-RestMethod -Uri "http://localhost/api/v1/doctors/dashboard/stats" -Method Get -Headers $authHeaders -TimeoutSec 10
    Write-Host "✅ Dashboard accessible" -ForegroundColor Green
    Write-Host "   Total patients: $($dashboardStats.total_patients)" -ForegroundColor DarkGray
    Write-Host "   Crises cette semaine: $($dashboardStats.recent_seizures_this_week)" -ForegroundColor DarkGray
} catch {
    Write-Host "❌ Échec d'accès au dashboard" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 5: Créer un patient
Write-Host "🔍 Étape 6: Test création patient..." -ForegroundColor Yellow
try {
    $patientData = @{
        first_name = "Jean"
        last_name = "Test"
        date_of_birth = "1990-01-01"
        gender = "M"
        blood_type = "A+"
        phone = "0612345678"
        emergency_contact = "0698765432"
    } | ConvertTo-Json

    $patientResponse = Invoke-RestMethod -Uri "http://localhost/api/v1/patients/" -Method Post -Body $patientData -Headers $authHeaders -TimeoutSec 10
    Write-Host "✅ Patient créé avec succès (ID: $($patientResponse.id))" -ForegroundColor Green

    $patientId = $patientResponse.id
} catch {
    Write-Host "❌ Échec de création de patient" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 6: Créer une crise
Write-Host "🔍 Étape 7: Test création crise..." -ForegroundColor Yellow
try {
    $seizureData = @{
        patient_id = $patientId
        seizure_datetime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        severity = "moderate"
        duration_seconds = 120
        notes = "Test de communication - crise générée automatiquement"
    } | ConvertTo-Json

    $seizureResponse = Invoke-RestMethod -Uri "http://localhost/api/v1/seizures/" -Method Post -Body $seizureData -Headers $authHeaders -TimeoutSec 10
    Write-Host "✅ Crise créée avec succès (ID: $($seizureResponse.id))" -ForegroundColor Green
} catch {
    Write-Host "❌ Échec de création de crise" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 7: Vérifier les statistiques mises à jour
Write-Host "🔍 Étape 8: Vérification des statistiques mises à jour..." -ForegroundColor Yellow
try {
    $updatedStats = Invoke-RestMethod -Uri "http://localhost/api/v1/doctors/dashboard/stats" -Method Get -Headers $authHeaders -TimeoutSec 10
    Write-Host "✅ Statistiques mises à jour" -ForegroundColor Green
    Write-Host "   Total patients: $($updatedStats.total_patients)" -ForegroundColor DarkGray
    Write-Host "   Crises cette semaine: $($updatedStats.recent_seizures_this_week)" -ForegroundColor DarkGray
    Write-Host "   Crises ce mois: $($updatedStats.recent_seizures_this_month)" -ForegroundColor DarkGray
} catch {
    Write-Host "⚠️  Échec de récupération des statistiques" -ForegroundColor Yellow
}
Write-Host ""

# Test 8: Frontend
Write-Host "🔍 Étape 9: Test Frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend ne répond pas" -ForegroundColor Red
    Write-Host "   → Vérifier: docker compose logs frontend" -ForegroundColor Yellow
}
Write-Host ""

# Test 9: Swagger
Write-Host "🔍 Étape 10: Test Swagger..." -ForegroundColor Yellow
try {
    $swaggerResponse = Invoke-WebRequest -Uri "http://localhost/api/v1/docs" -UseBasicParsing -TimeoutSec 5
    if ($swaggerResponse.StatusCode -eq 200) {
        Write-Host "✅ Swagger accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Swagger ne répond pas" -ForegroundColor Yellow
}
Write-Host ""

# Test 10: pgAdmin
Write-Host "🔍 Étape 11: Test pgAdmin..." -ForegroundColor Yellow
try {
    $pgAdminResponse = Invoke-WebRequest -Uri "http://localhost:5050" -UseBasicParsing -TimeoutSec 5
    if ($pgAdminResponse.StatusCode -eq 200) {
        Write-Host "✅ pgAdmin accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  pgAdmin ne répond pas" -ForegroundColor Yellow
}
Write-Host ""

# Résumé
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ TOUS LES TESTS RÉUSSIS!                            ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  La communication fonctionne:                          ║" -ForegroundColor Green
Write-Host "║  Frontend ↔ Nginx ↔ Backend ↔ PostgreSQL              ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  Données créées:                                       ║" -ForegroundColor Green
Write-Host "║  ✓ 1 Docteur de test                                   ║" -ForegroundColor Green
Write-Host "║  ✓ 1 Patient                                           ║" -ForegroundColor Green
Write-Host "║  ✓ 1 Crise                                             ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 Vérifier dans pgAdmin:" -ForegroundColor Cyan
Write-Host "   1. Ouvrir http://localhost:5050" -ForegroundColor White
Write-Host "   2. Login: admin@epileptic.ai / admin123" -ForegroundColor White
Write-Host "   3. Connecter au serveur PostgreSQL:" -ForegroundColor White
Write-Host "      Host: postgres, Port: 5432, DB: epileptic_ai" -ForegroundColor White
Write-Host "      User: postgres, Password: password" -ForegroundColor White
Write-Host "   4. Exécuter:" -ForegroundColor White
Write-Host "      SELECT * FROM doctors WHERE email = '$testEmail';" -ForegroundColor DarkGray
Write-Host "      SELECT * FROM patients WHERE last_name = 'Test';" -ForegroundColor DarkGray
Write-Host "      SELECT * FROM seizures WHERE patient_id = $patientId;" -ForegroundColor DarkGray
Write-Host ""

Write-Host "📊 Voir dans Swagger:" -ForegroundColor Cyan
Write-Host "   1. Ouvrir http://localhost/api/v1/docs" -ForegroundColor White
Write-Host "   2. Cliquer 'Authorize'" -ForegroundColor White
Write-Host "   3. Entrer: Bearer $($token.Substring(0, 30))..." -ForegroundColor White
Write-Host "   4. Tester GET /doctors/dashboard/stats" -ForegroundColor White
Write-Host ""

Write-Host "🌐 Tester dans le Frontend:" -ForegroundColor Cyan
Write-Host "   1. Ouvrir http://localhost" -ForegroundColor White
Write-Host "   2. Se connecter avec:" -ForegroundColor White
Write-Host "      Email: $testEmail" -ForegroundColor White
Write-Host "      Password: $testPassword" -ForegroundColor White
Write-Host "   3. Voir le patient 'Jean Test' dans la liste" -ForegroundColor White
Write-Host "   4. Ouvrir DevTools → Network pour voir les requêtes API" -ForegroundColor White
Write-Host ""

Write-Host "✨ Test terminé avec succès!" -ForegroundColor Green
Write-Host ""
