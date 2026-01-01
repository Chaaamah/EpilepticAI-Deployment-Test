#!/bin/bash

# Deployment script for EpilepticAI on Linux server
# Domain: aivora.fojas.ai
# Port: 3101

set -e  # Exit on error

echo "================================"
echo "EpilepticAI Deployment Script"
echo "Team: AiVora"
echo "Domain: aivora.fojas.ai"
echo "Port: 3101"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}ℹ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi
print_success "Docker est installé"

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi
print_success "Docker Compose est installé"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error "Le fichier .env.production n'existe pas!"
    print_info "Veuillez créer le fichier .env.production avec vos configurations."
    exit 1
fi
print_success "Fichier .env.production trouvé"

# Warning about default passwords
print_warning "ATTENTION: Assurez-vous d'avoir changé les mots de passe par défaut dans .env.production!"
echo ""
read -p "Avez-vous modifié les mots de passe dans .env.production? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Veuillez modifier les mots de passe dans .env.production avant de continuer."
    exit 1
fi

# Stop existing containers
print_info "Arrêt des conteneurs existants..."
docker compose -f docker-compose.deploy.yml --env-file .env.production down 2>/dev/null || true
print_success "Conteneurs arrêtés"

# Remove old images (optional, uncomment if needed)
# print_info "Suppression des anciennes images..."
# docker compose -f docker-compose.deploy.yml --env-file .env.production down --rmi all --volumes

# Build and start containers
print_info "Construction et démarrage des conteneurs..."
docker compose -f docker-compose.deploy.yml --env-file .env.production up -d --build

# Wait for services to be healthy
print_info "Attente du démarrage des services..."
sleep 10

# Check service status
print_info "Vérification du statut des services..."
docker compose -f docker-compose.deploy.yml --env-file .env.production ps

# Display logs
echo ""
print_info "Derniers logs du backend:"
docker logs epileptic_backend --tail 20

echo ""
print_info "Derniers logs du frontend:"
docker logs epileptic_frontend --tail 20

echo ""
echo "================================"
print_success "Déploiement terminé!"
echo "================================"
echo ""
print_info "Votre application est maintenant accessible à:"
echo "  → http://aivora.fojas.ai"
echo "  → Port interne: 3101"
echo ""
print_info "Commandes utiles:"
echo "  • Voir les logs: docker compose -f docker-compose.deploy.yml --env-file .env.production logs -f"
echo "  • Arrêter: docker compose -f docker-compose.deploy.yml --env-file .env.production down"
echo "  • Redémarrer: docker compose -f docker-compose.deploy.yml --env-file .env.production restart"
echo "  • Voir le statut: docker compose -f docker-compose.deploy.yml --env-file .env.production ps"
echo ""
print_warning "N'oubliez pas de configurer HTTPS plus tard pour sécuriser votre application!"
echo ""
