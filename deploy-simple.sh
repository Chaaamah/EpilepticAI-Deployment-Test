#!/bin/bash

# Script de déploiement ULTRA-SIMPLE pour EpilepticAI
# Juste cloner et lancer!

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "   Déploiement EpilepticAI - AiVora"
echo "   Domain: aivora.fojas.ai"
echo "   Port: 3101"
echo "=========================================="
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé!"
    exit 1
fi

# Arrêter les conteneurs existants (si ils existent)
echo "🛑 Arrêt des conteneurs existants..."
docker compose -f docker-compose.deploy.yml down 2>/dev/null || true

# Nettoyer le cache Docker en cas de problème
echo "🧹 Nettoyage du cache Docker..."
docker builder prune -f --filter "until=24h" 2>/dev/null || true

# Construire et démarrer
echo "🚀 Construction et démarrage de l'application..."
if ! docker compose -f docker-compose.deploy.yml up -d --build; then
    echo ""
    echo "❌ Erreur lors de la construction!"
    echo "💡 Essayez de lancer: ./fix-docker-deploy.sh"
    exit 1
fi

# Attendre que les services démarrent
echo "⏳ Attente du démarrage des services (30 secondes)..."
sleep 30

# Afficher le statut
echo ""
echo "📊 Statut des conteneurs:"
docker compose -f docker-compose.deploy.yml ps

echo ""
echo "=========================================="
echo "✅ Déploiement terminé!"
echo "=========================================="
echo ""
echo "🌐 Application accessible à: http://aivora.fojas.ai"
echo ""
echo "📝 Commandes utiles:"
echo "  • Voir les logs:      docker compose -f docker-compose.deploy.yml logs -f"
echo "  • Arrêter:           docker compose -f docker-compose.deploy.yml down"
echo "  • Redémarrer:        docker compose -f docker-compose.deploy.yml restart"
echo ""
