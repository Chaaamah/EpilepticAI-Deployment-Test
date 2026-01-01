# Guide de Déploiement SIMPLIFIÉ - EpilepticAI

## Informations du Serveur

- **Team**: AiVora
- **Domain**: aivora.fojas.ai
- **Port interne**: 3101
- **URL**: http://aivora.fojas.ai

---

## 🚀 Déploiement ULTRA-SIMPLE (3 commandes!)

### Prérequis

Assurez-vous d'avoir Docker et Docker Compose installés sur votre serveur Linux.

### Installation de Docker (si nécessaire)

```bash
# Installation rapide de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation de Docker Compose
sudo apt install docker-compose-plugin -y

# Déconnectez-vous et reconnectez-vous pour appliquer les changements
```

---

## 📦 Déploiement en 3 COMMANDES

Sur votre serveur Linux:

```bash
# 1. Cloner le projet
git clone <URL_DE_VOTRE_REPO> EpilepticAI
cd EpilepticAI

# 2. Rendre le script exécutable
chmod +x deploy-simple.sh

# 3. Lancer le déploiement
./deploy-simple.sh
```

**C'EST TOUT!** 🎉

Votre application sera accessible à: **http://aivora.fojas.ai**

---

## 📝 Ce qui se passe automatiquement

Le script `deploy-simple.sh` fait tout automatiquement:
- ✅ Arrête les anciens conteneurs (si ils existent)
- ✅ Construit les images Docker
- ✅ Démarre tous les services:
  - PostgreSQL (base de données)
  - Redis (cache)
  - Backend API (FastAPI)
  - Frontend (React + Nginx sur port 3101)
  - Celery Worker (tâches d'arrière-plan)
- ✅ Affiche le statut

---

## 🔧 Configuration

### Fichier .env

Le fichier `.env` est déjà configuré et inclus dans le repo! Vous n'avez rien à modifier.

**Configuration par défaut:**
- Base de données: PostgreSQL
- Mot de passe BD: `epileptic_secure_2026`
- Secret Key: Généré automatiquement
- Token expiration: 30 minutes

### ⚠️ IMPORTANT pour la Production

Si vous voulez changer les mots de passe pour plus de sécurité:

```bash
nano .env
```

Modifiez:
- `POSTGRES_PASSWORD`: Changez le mot de passe PostgreSQL
- `SECRET_KEY`: Générez une nouvelle clé avec: `openssl rand -hex 32`
- `DATABASE_URL`: Mettez à jour avec le nouveau mot de passe PostgreSQL

---

## 🛠️ Commandes Utiles

### Gestion des conteneurs

```bash
# Voir le statut
docker compose -f docker-compose.deploy.yml ps

# Voir les logs (tous les services)
docker compose -f docker-compose.deploy.yml logs -f

# Voir les logs d'un service spécifique
docker logs epileptic_backend -f
docker logs epileptic_frontend -f

# Redémarrer tous les services
docker compose -f docker-compose.deploy.yml restart

# Redémarrer un service spécifique
docker compose -f docker-compose.deploy.yml restart backend

# Arrêter tout
docker compose -f docker-compose.deploy.yml down

# Redémarrer le déploiement
./deploy-simple.sh
```

### Mise à jour de l'application

```bash
# Récupérer les derniers changements
git pull origin main

# Redéployer
./deploy-simple.sh
```

---

## 🔍 Vérification

### Vérifier que tout fonctionne

```bash
# Vérifier les conteneurs actifs
docker ps

# Tester le frontend
curl http://localhost:3101

# Tester le backend
curl http://localhost:3101/api/health

# Voir les logs en temps réel
docker compose -f docker-compose.deploy.yml logs -f
```

### Endpoints disponibles

- **Frontend**: http://aivora.fojas.ai
- **API Docs (Swagger)**: http://aivora.fojas.ai/api/docs
- **Health Check**: http://aivora.fojas.ai/api/health

---

## 🗄️ Base de Données

### Accéder à PostgreSQL

```bash
# Se connecter à la base de données
docker exec -it epileptic_postgres psql -U postgres -d epileptic_ai

# Lister les tables
\dt

# Quitter
\q
```

### Backup de la base de données

```bash
# Créer un backup
docker exec epileptic_postgres pg_dump -U postgres epileptic_ai > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer un backup
docker exec -i epileptic_postgres psql -U postgres epileptic_ai < backup_20260101_120000.sql
```

---

## 🔒 Configuration HTTPS (Optionnel)

Pour sécuriser votre application avec HTTPS:

### Méthode 1: Nginx + Let's Encrypt (Recommandé)

```bash
# 1. Installer Nginx et Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# 2. Créer la configuration Nginx
sudo nano /etc/nginx/sites-available/aivora.fojas.ai
```

Contenu du fichier:

```nginx
server {
    listen 80;
    server_name aivora.fojas.ai;

    location / {
        proxy_pass http://localhost:3101;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 3. Activer le site
sudo ln -s /etc/nginx/sites-available/aivora.fojas.ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Obtenir un certificat SSL (HTTPS)
sudo certbot --nginx -d aivora.fojas.ai
```

Certbot configurera automatiquement HTTPS! 🔒

---

## 🐛 Dépannage

### Problème: Les conteneurs ne démarrent pas

```bash
# Voir les erreurs
docker compose -f docker-compose.deploy.yml logs

# Tout supprimer et recommencer
docker compose -f docker-compose.deploy.yml down -v
./deploy-simple.sh
```

### Problème: Le port 3101 est déjà utilisé

```bash
# Voir ce qui utilise le port
sudo netstat -tulpn | grep 3101

# Tuer le processus (remplacez PID par le numéro du processus)
sudo kill -9 PID
```

### Problème: Erreur de connexion à la base de données

```bash
# Redémarrer PostgreSQL
docker compose -f docker-compose.deploy.yml restart postgres

# Vérifier les logs PostgreSQL
docker logs epileptic_postgres
```

### Problème: L'application ne répond pas

```bash
# Redémarrer tout
docker compose -f docker-compose.deploy.yml restart

# Si ça ne marche pas, tout reconstruire
docker compose -f docker-compose.deploy.yml down
./deploy-simple.sh
```

---

## 📊 Monitoring

### Voir l'utilisation des ressources

```bash
# Utilisation CPU/RAM de chaque conteneur
docker stats

# Espace disque utilisé par Docker
docker system df
```

### Nettoyer l'espace disque

```bash
# Supprimer les images et conteneurs inutilisés
docker system prune -a

# ATTENTION: Ne supprime PAS les volumes (vos données sont sauvegardées)
```

---

## 🏗️ Architecture

```
Internet (aivora.fojas.ai)
         │
         │ Port 80/443
         ▼
┌─────────────────────────┐
│  Nginx (Optionnel)      │
│  Reverse Proxy + HTTPS  │
└───────────┬─────────────┘
            │
            │ Port 3101
            ▼
┌─────────────────────────────────┐
│  Serveur Linux (Docker)         │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Frontend (Port 3101)   │   │
│  │  Nginx + React          │   │
│  └──────────┬──────────────┘   │
│             │                   │
│             │ /api/ → Backend   │
│             ▼                   │
│  ┌─────────────────────────┐   │
│  │  Backend (Port 8000)    │   │
│  │  FastAPI                │   │
│  └───┬─────────────┬───────┘   │
│      │             │            │
│      ▼             ▼            │
│  ┌──────────┐ ┌────────┐      │
│  │PostgreSQL│ │ Redis  │      │
│  └──────────┘ └────────┘      │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Celery Worker          │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

---

## 📋 Checklist de Déploiement

- [x] Docker installé
- [x] Docker Compose installé
- [x] Projet cloné
- [x] Script de déploiement exécuté
- [ ] Application accessible via http://aivora.fojas.ai
- [ ] HTTPS configuré (optionnel mais recommandé)
- [ ] Sauvegardes automatiques configurées (optionnel)

---

## 🎯 Commandes de Déploiement - Résumé

**Installation complète (première fois):**
```bash
git clone <URL_DE_VOTRE_REPO> EpilepticAI
cd EpilepticAI
chmod +x deploy-simple.sh
./deploy-simple.sh
```

**Mise à jour:**
```bash
cd EpilepticAI
git pull origin main
./deploy-simple.sh
```

**Redémarrage:**
```bash
cd EpilepticAI
docker compose -f docker-compose.deploy.yml restart
```

**Arrêt:**
```bash
cd EpilepticAI
docker compose -f docker-compose.deploy.yml down
```

---

## 🆘 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs: `docker compose -f docker-compose.deploy.yml logs -f`
2. Vérifiez le statut: `docker compose -f docker-compose.deploy.yml ps`
3. Redémarrez: `./deploy-simple.sh`

**Bon déploiement!** 🚀
