# Fix rapide pour l'erreur "failed to stat parent"
# Cette erreur indique un cache Docker corrompu

Write-Host "🔧 Fix Rapide - Cache Docker Corrompu" -ForegroundColor Cyan
Write-Host ""

# Solution 1: Nettoyer complètement le cache
Write-Host "1️⃣  Nettoyage complet du cache Docker..." -ForegroundColor Yellow
docker builder prune -a -f
docker system prune -a -f

Write-Host "✅ Cache nettoyé" -ForegroundColor Green
Write-Host ""

# Solution 2: Build sans cache
Write-Host "2️⃣  Build frontend sans cache..." -ForegroundColor Yellow
docker compose build --no-cache frontend

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build réussi!" -ForegroundColor Green
    Write-Host ""

    # Démarrer
    Write-Host "3️⃣  Démarrage des services..." -ForegroundColor Yellow
    docker compose up -d

    Write-Host ""
    Write-Host "✅ TERMINÉ!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Frontend: http://localhost" -ForegroundColor Cyan
    Write-Host "📚 API Docs: http://localhost/api/v1/docs" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Build échoué" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solution alternative:" -ForegroundColor Yellow
    Write-Host "1. Redémarrer Docker Desktop" -ForegroundColor White
    Write-Host "2. Réessayer ce script" -ForegroundColor White
}
