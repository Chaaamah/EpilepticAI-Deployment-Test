# Guide de Déploiement - EpilepticAI

## Informations du Serveur

- **Team**: AiVora
- **Domain**: aivora.fojas.ai
- **Port interne**: 3101
- **URL**: http://aivora.fojas.ai (HTTPS peut être ajouté plus tard)

---

## Prérequis

Avant de déployer, assurez-vous d'avoir:

1. **Accès SSH au serveur Linux**
2. **Docker installé** (version 20.10 ou supérieure)
3. **Docker Compose installé** (version 2.0 ou supérieure)
4. **Git installé** (pour cloner le projet)

---

## Installation de Docker et Docker Compose

Si Docker n'est pas encore installé sur votre serveur:

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter votre utilisateur au groupe docker (pour éviter sudo)
sudo usermod -aG docker $USER

# Installation de Docker Compose
sudo apt install docker-compose-plugin -y

# Vérification des installations
docker --version
docker compose version
```

**Note**: Déconnectez-vous et reconnectez-vous pour que les changements de groupe prennent effet.

---

## Étape 1: Cloner le Projet sur le Serveur

```bash
# Se connecter au serveur
ssh votre_utilisateur@aivora.fojas.ai

# Cloner le projet (remplacez par votre URL Git)
git clone <URL_DE_VOTRE_REPO> EpilepticAI
cd EpilepticAI
```

---

## Étape 2: Configuration des Variables d'Environnement

### 2.1 Copier le fichier template

```bash
cp .env.production .env.production.local
```

### 2.2 Modifier le fichier avec vos vraies valeurs

```bash
nano .env.production.local
```

### 2.3 Valeurs IMPORTANTES à modifier:

```bash
# 1. Mot de passe PostgreSQL (choisissez un mot de passe fort)
POSTGRES_PASSWORD=VotreMdpSecurise123!

# 2. SECRET_KEY - Générez une clé secrète forte
# Utilisez cette commande pour en générer une:
openssl rand -hex 32
# Ensuite, collez le résultat dans:
SECRET_KEY=la_cle_generee_par_openssl

# 3. Mettez à jour DATABASE_URL avec le nouveau mot de passe
DATABASE_URL=postgresql+psycopg2://postgres:VotreMdpSecurise123!@postgres:5432/epileptic_ai
```

### 2.4 Renommer le fichier pour le déploiement

```bash
mv .env.production.local .env.production
```

### 2.5 Sécuriser les permissions du fichier

```bash
chmod 600 .env.production
```

---

## Étape 3: Déploiement

### Méthode 1: Utiliser le script automatique (Recommandé)

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh
```

Le script va:
- Vérifier que Docker est installé
- Vérifier que vous avez modifié les mots de passe
- Arrêter les conteneurs existants
- Construire les images Docker
- Démarrer tous les services
- Afficher les logs

### Méthode 2: Commandes manuelles

```bash
# Arrêter les conteneurs existants (si ils existent)
docker compose -f docker-compose.deploy.yml --env-file .env.production down

# Construire et démarrer les conteneurs
docker compose -f docker-compose.deploy.yml --env-file .env.production up -d --build

# Vérifier que tout fonctionne
docker compose -f docker-compose.deploy.yml --env-file .env.production ps
```

---

## Étape 4: Vérification du Déploiement

### 4.1 Vérifier que les conteneurs tournent

```bash
docker ps
```

Vous devriez voir:
- `epileptic_postgres`
- `epileptic_redis`
- `epileptic_backend`
- `epileptic_frontend`
- `epileptic_worker`

### 4.2 Vérifier les logs

```bash
# Tous les services
docker compose -f docker-compose.deploy.yml --env-file .env.production logs -f

# Backend uniquement
docker logs epileptic_backend -f

# Frontend uniquement
docker logs epileptic_frontend -f
```

### 4.3 Tester l'application

Ouvrez votre navigateur et accédez à:
- **Frontend**: http://aivora.fojas.ai
- **API Backend**: http://aivora.fojas.ai/api/docs (Swagger UI)
- **Health Check Backend**: http://aivora.fojas.ai/api/health

---

## Étape 5: Initialisation de la Base de Données

Si c'est la première fois que vous déployez, vous devrez peut-être initialiser la base de données:

```bash
# Se connecter au conteneur backend
docker exec -it epileptic_backend bash

# Lancer les migrations (si vous utilisez Alembic)
alembic upgrade head

# Ou créer les tables directement (selon votre configuration)
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"

# Sortir du conteneur
exit
```

---

## Configuration HTTPS (Optionnel mais Recommandé)

Pour sécuriser votre application avec HTTPS, vous pouvez utiliser **Let's Encrypt** avec **Certbot**:

### Option 1: Utiliser un reverse proxy Nginx sur l'hôte

```bash
# Installer Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Créer la configuration Nginx
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
# Activer le site
sudo ln -s /etc/nginx/sites-available/aivora.fojas.ai /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d aivora.fojas.ai
```

### Option 2: Utiliser Traefik (plus avancé)

Traefik peut gérer automatiquement les certificats SSL. Si vous êtes intéressé, consultez la documentation officielle de Traefik.

---

## Commandes Utiles

### Gestion des conteneurs

```bash
# Voir le statut des conteneurs
docker compose -f docker-compose.deploy.yml --env-file .env.production ps

# Arrêter tous les services
docker compose -f docker-compose.deploy.yml --env-file .env.production down

# Redémarrer tous les services
docker compose -f docker-compose.deploy.yml --env-file .env.production restart

# Redémarrer un service spécifique
docker compose -f docker-compose.deploy.yml --env-file .env.production restart backend

# Reconstruire et redémarrer
docker compose -f docker-compose.deploy.yml --env-file .env.production up -d --build
```

### Logs et debugging

```bash
# Voir tous les logs
docker compose -f docker-compose.deploy.yml --env-file .env.production logs -f

# Logs d'un service spécifique
docker logs epileptic_backend -f
docker logs epileptic_frontend -f
docker logs epileptic_worker -f
docker logs epileptic_postgres -f

# Logs des 100 dernières lignes
docker logs epileptic_backend --tail 100
```

### Accès aux conteneurs

```bash
# Se connecter au backend
docker exec -it epileptic_backend bash

# Se connecter à PostgreSQL
docker exec -it epileptic_postgres psql -U postgres -d epileptic_ai

# Se connecter à Redis
docker exec -it epileptic_redis redis-cli
```

### Nettoyage

```bash
# Supprimer tous les conteneurs et volumes (ATTENTION: perte de données!)
docker compose -f docker-compose.deploy.yml --env-file .env.production down -v

# Nettoyer les images Docker inutilisées
docker system prune -a
```

---

## Mise à Jour de l'Application

Quand vous voulez déployer une nouvelle version:

```bash
# 1. Récupérer les derniers changements
git pull origin main

# 2. Reconstruire et redémarrer
docker compose -f docker-compose.deploy.yml --env-file .env.production up -d --build

# 3. Vérifier les logs
docker compose -f docker-compose.deploy.yml --env-file .env.production logs -f
```

---

## Sauvegarde de la Base de Données

### Backup manuel

```bash
# Créer un backup
docker exec epileptic_postgres pg_dump -U postgres epileptic_ai > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer un backup
docker exec -i epileptic_postgres psql -U postgres epileptic_ai < backup_20260101_120000.sql
```

### Backup automatique (avec cron)

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour un backup quotidien à 2h du matin
0 2 * * * docker exec epileptic_postgres pg_dump -U postgres epileptic_ai > /home/votre_utilisateur/backups/backup_$(date +\%Y\%m\%d).sql
```

---

## Monitoring et Performance

### Surveiller l'utilisation des ressources

```bash
# Voir l'utilisation CPU/RAM de chaque conteneur
docker stats

# Voir l'espace disque utilisé
docker system df
```

### Limites de ressources

Les limites sont déjà configurées dans [docker-compose.deploy.yml](docker-compose.deploy.yml):
- Backend: Max 1GB RAM
- Frontend: Max 256MB RAM
- Database: Max 1GB RAM
- Worker: Max 512MB RAM

---

## Dépannage (Troubleshooting)

### Problème: Les conteneurs ne démarrent pas

```bash
# Vérifier les logs d'erreur
docker compose -f docker-compose.deploy.yml --env-file .env.production logs

# Vérifier que le port 3101 est libre
sudo netstat -tulpn | grep 3101
```

### Problème: Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est bien démarré
docker logs epileptic_postgres

# Tester la connexion
docker exec epileptic_postgres pg_isready -U postgres
```

### Problème: L'application ne répond pas

```bash
# Redémarrer tous les services
docker compose -f docker-compose.deploy.yml --env-file .env.production restart

# Si ça ne fonctionne pas, reconstruire tout
docker compose -f docker-compose.deploy.yml --env-file .env.production down
docker compose -f docker-compose.deploy.yml --env-file .env.production up -d --build
```

### Problème: Espace disque plein

```bash
# Nettoyer les ressources Docker inutilisées
docker system prune -a --volumes

# ATTENTION: Cela supprimera aussi les volumes non utilisés!
```

---

## Architecture de Déploiement

```
┌─────────────────────────────────────────┐
│  Internet (aivora.fojas.ai)             │
└───────────────┬─────────────────────────┘
                │
                │ Port 80 (HTTP)
                ▼
┌─────────────────────────────────────────┐
│  Reverse Proxy (Nginx - Optionnel)     │
└───────────────┬─────────────────────────┘
                │
                │ Port 3101
                ▼
┌─────────────────────────────────────────┐
│  Docker Host (Serveur Linux)            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Frontend (Nginx)               │   │
│  │  Port: 3101 → 80                │   │
│  └────────┬────────────────────────┘   │
│           │                             │
│           │ Proxy /api/ →               │
│           ▼                             │
│  ┌─────────────────────────────────┐   │
│  │  Backend (FastAPI)              │   │
│  │  Port: 8000                     │   │
│  └────┬──────────────┬─────────────┘   │
│       │              │                  │
│       ▼              ▼                  │
│  ┌─────────┐   ┌─────────┐            │
│  │ PostgreSQL   │ Redis   │            │
│  │ Port: 5432   │ Port: 6379           │
│  └─────────┘   └─────────┘            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Celery Worker                  │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Sécurité - Checklist

- [x] Utiliser des mots de passe forts pour PostgreSQL
- [x] Générer une SECRET_KEY unique et forte
- [x] Désactiver DEBUG en production
- [x] Configurer les limites de ressources Docker
- [ ] Activer HTTPS avec Let's Encrypt
- [ ] Configurer un pare-feu (UFW)
- [ ] Mettre en place des sauvegardes régulières
- [ ] Surveiller les logs régulièrement
- [ ] Mettre à jour Docker et les images régulièrement

---

## Support

Pour toute question ou problème:
1. Vérifiez d'abord les logs
2. Consultez ce guide
3. Contactez l'équipe AiVora

---

**Bon déploiement!** 🚀
