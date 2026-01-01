# EpilepticAI Docker Startup Script (Windows PowerShell)
# Usage: .\start.ps1

Write-Host "🚀 Starting EpilepticAI with Docker..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "⚠️  Docker is not running. Please start Docker Desktop first." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Building Docker images..." -ForegroundColor Blue
docker compose build

Write-Host ""
Write-Host "🔧 Starting services..." -ForegroundColor Blue
docker compose up -d

Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Blue
Start-Sleep -Seconds 10

# Check if backend is healthy
Write-Host "🏥 Checking backend health..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend is starting... (may take a few more seconds)" -ForegroundColor Yellow
}

# Run migrations
Write-Host ""
Write-Host "📊 Running database migrations..." -ForegroundColor Blue
docker compose exec -T backend alembic upgrade head

Write-Host ""
Write-Host "✅ All services are running!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "📱 Access Points:" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "  🌐 Frontend:        " -NoNewline; Write-Host "http://localhost" -ForegroundColor Green
Write-Host "  📚 API Docs:        " -NoNewline; Write-Host "http://localhost/api/v1/docs" -ForegroundColor Green
Write-Host "  🔧 Backend Direct:  " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Green
Write-Host "  🗄️  pgAdmin:        " -NoNewline; Write-Host "docker compose --profile tools up -d pgadmin" -ForegroundColor Yellow
Write-Host "                      " -NoNewline; Write-Host "http://localhost:5050" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""
Write-Host "📝 Useful Commands:" -ForegroundColor Blue
Write-Host "  docker compose logs -f          # View logs"
Write-Host "  docker compose ps               # Check status"
Write-Host "  docker compose down             # Stop all services"
Write-Host "  docker compose restart          # Restart services"
Write-Host ""
Write-Host "📖 Full documentation: DOCKER_GUIDE.md" -ForegroundColor Blue
Write-Host ""
