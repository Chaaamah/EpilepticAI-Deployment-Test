#!/bin/bash

# Script pour corriger les problèmes Docker et redéployer

echo "=========================================="
echo "   Correction et Redéploiement"
echo "=========================================="
echo ""

# 1. Nettoyer Docker
echo "🧹 Nettoyage de Docker..."
docker compose -f docker-compose.deploy.yml down -v 2>/dev/null || true
docker system prune -f

# 2. Nettoyer le cache de build
echo "🧹 Nettoyage du cache de build Docker..."
docker builder prune -f

# 3. Reconstruire et redémarrer
echo "🚀 Reconstruction et démarrage..."
docker compose -f docker-compose.deploy.yml build --no-cache
docker compose -f docker-compose.deploy.yml up -d

# 4. Attendre
echo "⏳ Attente du démarrage (30 secondes)..."
sleep 30

# 5. Vérifier le statut
echo ""
echo "📊 Statut des conteneurs:"
docker compose -f docker-compose.deploy.yml ps

echo ""
echo "=========================================="
echo "✅ Terminé!"
echo "=========================================="
