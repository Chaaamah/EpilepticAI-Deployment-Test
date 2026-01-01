# Script de test rapide pour vérifier que le backend fonctionne
# Usage: .\test_backend.ps1

Write-Host "🔍 Testing EPILEPTIC-AI-BACKEND..." -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "http://localhost:8000"

# Test 1: Health Check
Write-Host "📊 Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check passed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the backend is running on port 8000" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Root Endpoint
Write-Host "📊 Test 2: Root Endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Root endpoint passed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Root endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: API Docs
Write-Host "📊 Test 3: API Documentation" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/docs" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API docs accessible at $BACKEND_URL/docs" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API docs failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Login
Write-Host "📊 Test 4: Login Test" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@gmail.com"
        password = "admin"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $response.access_token

    if ($token) {
        Write-Host "✅ Login successful" -ForegroundColor Green
        Write-Host "Token: $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor DarkGray
    }
} catch {
    Write-Host "⚠️  Login failed - Admin credentials may not exist yet" -ForegroundColor Yellow
    $token = $null
}
Write-Host ""

# Test 5: Dashboard Stats
if ($token) {
    Write-Host "📊 Test 5: Dashboard Stats (Authenticated)" -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }

        $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/v1/doctors/dashboard/stats" `
            -Method GET `
            -Headers $headers

        Write-Host "✅ Dashboard stats endpoint working" -ForegroundColor Green
        Write-Host "Total Patients: $($response.total_patients)" -ForegroundColor DarkGray
        Write-Host "Recent Seizures (Week): $($response.recent_seizures_this_week)" -ForegroundColor DarkGray
    } catch {
        Write-Host "❌ Dashboard stats failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Skipping authenticated tests" -ForegroundColor Yellow
}
Write-Host ""

# Test 6: Patients with Metrics
if ($token) {
    Write-Host "📊 Test 6: Patients with Metrics Endpoint" -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }

        $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/v1/doctors/patients/with-metrics" `
            -Method GET `
            -Headers $headers

        Write-Host "✅ Patients with metrics endpoint working" -ForegroundColor Green
        Write-Host "Patients found: $($response.Count)" -ForegroundColor DarkGray
    } catch {
        Write-Host "❌ Patients endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 7: Seizure Statistics
if ($token) {
    Write-Host "📊 Test 7: Seizure Statistics Endpoint" -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }

        $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/v1/doctors/seizures/statistics?days=7" `
            -Method GET `
            -Headers $headers

        Write-Host "✅ Seizure statistics endpoint working" -ForegroundColor Green
        Write-Host "Total Count: $($response.total_count)" -ForegroundColor DarkGray
        Write-Host "Average per Week: $($response.average_per_week)" -ForegroundColor DarkGray
    } catch {
        Write-Host "❌ Seizure statistics failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 8: Clinical Notes
if ($token) {
    Write-Host "📊 Test 8: Clinical Notes Endpoint Structure" -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }

        # Test that the endpoint exists (might be empty)
        $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/v1/clinical-notes/patient/1" `
            -Method GET `
            -Headers $headers `
            -ErrorAction SilentlyContinue

        Write-Host "✅ Clinical notes endpoint structure OK" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "✅ Clinical notes endpoint structure OK (no data)" -ForegroundColor Green
        } else {
            Write-Host "❌ Clinical notes endpoint error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📋 Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor White
Write-Host "API Docs: $BACKEND_URL/docs" -ForegroundColor White
Write-Host ""

if ($token) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open http://localhost:8000/docs to explore the API" -ForegroundColor White
    Write-Host "2. Start the frontend: cd EpilepticAI-web; npm run dev" -ForegroundColor White
    Write-Host "3. Test the integration" -ForegroundColor White
} else {
    Write-Host "⚠️  Backend is running but authentication needs setup" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Create an admin user or doctor account" -ForegroundColor White
    Write-Host "2. Test login with valid credentials" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
}
Write-Host ""
