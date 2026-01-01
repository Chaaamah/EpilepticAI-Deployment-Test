#!/bin/bash

# EpilepticAI Docker Startup Script
# Usage: ./start.sh

set -e

echo "🚀 Starting EpilepticAI with Docker..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Building Docker images...${NC}"
docker compose build

echo ""
echo -e "${BLUE}🔧 Starting services...${NC}"
docker compose up -d

echo ""
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if backend is healthy
echo -e "${BLUE}🏥 Checking backend health...${NC}"
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is starting... (may take a few more seconds)${NC}"
fi

# Run migrations
echo ""
echo -e "${BLUE}📊 Running database migrations...${NC}"
docker compose exec -T backend alembic upgrade head

echo ""
echo -e "${GREEN}✅ All services are running!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📱 Access Points:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  🌐 Frontend:        ${GREEN}http://localhost${NC}"
echo -e "  📚 API Docs:        ${GREEN}http://localhost/api/v1/docs${NC}"
echo -e "  🔧 Backend Direct:  ${GREEN}http://localhost:8000${NC}"
echo -e "  🗄️  pgAdmin:        ${YELLOW}docker compose --profile tools up -d pgadmin${NC}"
echo -e "                      ${GREEN}http://localhost:5050${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo "  docker compose logs -f          # View logs"
echo "  docker compose ps               # Check status"
echo "  docker compose down             # Stop all services"
echo "  docker compose restart          # Restart services"
echo ""
echo -e "${BLUE}📖 Full documentation:${NC} DOCKER_GUIDE.md"
echo ""
