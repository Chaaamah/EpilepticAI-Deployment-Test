# Guide de Dépannage - Déploiement

## 🔴 Erreur: "parent snapshot does not exist: not found"

### Symptôme
```
ERROR [frontend] exporting to image
failed to prepare extraction snapshot
parent snapshot sha256:... does not exist: not found
```

### Cause
Cache Docker corrompu ou incomplet.

### Solution Rapide

```bash
# Option 1: Script de correction automatique
chmod +x fix-docker-deploy.sh
./fix-docker-deploy.sh
```

### Solution Manuelle

```bash
# 1. Arrêter tout
docker compose -f docker-compose.deploy.yml down -v

# 2. Nettoyer Docker complètement
docker system prune -a -f
docker builder prune -a -f

# 3. Redémarrer Docker (optionnel mais recommandé)
sudo systemctl restart docker

# 4. Reconstruire sans cache
docker compose -f docker-compose.deploy.yml build --no-cache

# 5. Démarrer
docker compose -f docker-compose.deploy.yml up -d
```

---

## 🔴 Erreur: "version is obsolete"

### Symptôme
```
WARN: the attribute `version` is obsolete
```

### Cause
Docker Compose v2 n'utilise plus `version:` dans les fichiers compose.

### Solution
C'est juste un avertissement, pas une erreur. Vous pouvez l'ignorer ou modifier le fichier:

```bash
# Supprimer la première ligne de docker-compose.deploy.yml
sed -i '1d' docker-compose.deploy.yml
```

---

## 🔴 Erreur: Conteneurs ne démarrent pas

### Symptôme
```bash
docker compose -f docker-compose.deploy.yml ps
# Affiche: STATUS = Exited ou Restarting
```

### Solution

#### 1. Voir les logs
```bash
docker compose -f docker-compose.deploy.yml logs
```

#### 2. Vérifier chaque service individuellement

**Backend:**
```bash
docker logs epileptic_backend
```

Erreurs communes:
- `Connection refused` → PostgreSQL pas prêt
- `ImportError` → Dépendances manquantes
- `SECRET_KEY` → Vérifier `.env`

**Frontend:**
```bash
docker logs epileptic_frontend
```

**PostgreSQL:**
```bash
docker logs epileptic_postgres
```

Erreur commune:
- `FATAL: password authentication failed` → Mot de passe incorrect dans `.env`

#### 3. Redémarrer dans l'ordre
```bash
# D'abord la base de données
docker compose -f docker-compose.deploy.yml up -d postgres redis

# Attendre 10 secondes
sleep 10

# Puis le backend
docker compose -f docker-compose.deploy.yml up -d backend worker

# Attendre 10 secondes
sleep 10

# Enfin le frontend
docker compose -f docker-compose.deploy.yml up -d frontend
```

---

## 🔴 Erreur: Port 3101 déjà utilisé

### Symptôme
```
Error: bind: address already in use
```

### Solution

```bash
# Voir ce qui utilise le port
sudo netstat -tulpn | grep 3101
# ou
sudo lsof -i :3101

# Tuer le processus (remplacez PID)
sudo kill -9 PID

# Ou changer le port dans docker-compose.deploy.yml
# Modifier: "3101:80" en "3102:80" par exemple
```

---

## 🔴 Erreur: Permission denied

### Symptôme
```
permission denied while trying to connect to the Docker daemon socket
```

### Solution

```bash
# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Déconnectez-vous et reconnectez-vous
exit

# Ou redémarrez le shell
newgrp docker
```

---

## 🔴 Erreur: Out of disk space

### Symptôme
```
no space left on device
```

### Solution

```bash
# Voir l'espace utilisé
df -h
docker system df

# Nettoyer Docker
docker system prune -a --volumes -f

# Supprimer les vieilles images
docker image prune -a -f
```

---

## 🔴 Erreur: Database connection failed

### Symptôme
Backend logs montrent:
```
sqlalchemy.exc.OperationalError: could not connect to server
```

### Solution

```bash
# 1. Vérifier que PostgreSQL tourne
docker ps | grep postgres

# 2. Vérifier les logs PostgreSQL
docker logs epileptic_postgres

# 3. Vérifier la connexion depuis le backend
docker exec epileptic_backend ping -c 3 postgres

# 4. Tester la connexion à la DB
docker exec -it epileptic_postgres psql -U postgres -d epileptic_ai -c "SELECT 1;"

# 5. Vérifier le mot de passe dans .env
cat .env | grep DATABASE_URL

# 6. Recréer la base de données (ATTENTION: perte de données!)
docker compose -f docker-compose.deploy.yml down -v
docker compose -f docker-compose.deploy.yml up -d
```

---

## 🔴 Erreur: Frontend affiche "Cannot connect to backend"

### Symptôme
Page React charge mais API ne répond pas

### Solution

```bash
# 1. Vérifier que le backend répond
curl http://localhost:3101/api/health

# 2. Vérifier la config Nginx
docker exec epileptic_frontend cat /etc/nginx/conf.d/default.conf | grep "location /api"

# 3. Tester depuis le conteneur frontend
docker exec epileptic_frontend wget -O- http://backend:8000/api/health

# 4. Vérifier les CORS
docker logs epileptic_backend | grep CORS

# 5. Reconstruire le frontend
docker compose -f docker-compose.deploy.yml up -d --build frontend
```

---

## 🔴 Erreur: CORS Policy Error

### Symptôme
Console navigateur:
```
Access to XMLHttpRequest blocked by CORS policy
```

### Solution

Vérifier `.env`:
```bash
cat .env | grep CORS
```

Devrait contenir:
```
BACKEND_CORS_ORIGINS=["https://aivora.fojas.ai", "http://aivora.fojas.ai"]
```

Modifier si nécessaire et redémarrer:
```bash
nano .env
docker compose -f docker-compose.deploy.yml restart backend
```

---

## 📊 Commandes de Diagnostic

### Voir l'état complet
```bash
# Conteneurs
docker ps -a

# Logs de tous les services
docker compose -f docker-compose.deploy.yml logs

# Utilisation des ressources
docker stats

# Espace disque
docker system df
```

### Tester les connexions réseau

```bash
# Backend vers PostgreSQL
docker exec epileptic_backend ping -c 3 postgres

# Backend vers Redis
docker exec epileptic_backend ping -c 3 redis

# Frontend vers Backend
docker exec epileptic_frontend wget -O- http://backend:8000/api/health
```

### Vérifier les variables d'environnement

```bash
# Backend
docker exec epileptic_backend env | grep -E "DATABASE|REDIS|SECRET"

# Afficher .env
cat .env
```

---

## 🆘 Redémarrage Complet (Last Resort)

Si rien ne fonctionne:

```bash
# 1. Tout arrêter
docker compose -f docker-compose.deploy.yml down -v

# 2. Nettoyer Docker
docker system prune -a --volumes -f

# 3. Redémarrer Docker
sudo systemctl restart docker

# 4. Redéployer avec le script de correction
./fix-docker-deploy.sh
```

---

## 📞 Obtenir de l'Aide

Si le problème persiste:

1. **Collectez les informations:**
```bash
# Sauvegarder les logs
docker compose -f docker-compose.deploy.yml logs > deployment-logs.txt

# Info système
docker version > system-info.txt
docker compose version >> system-info.txt
df -h >> system-info.txt
```

2. **Vérifiez la documentation:**
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [TEST_CONNECTION.md](TEST_CONNECTION.md)

3. **Problèmes connus:**
- Version obsolète → Avertissement seulement, pas critique
- Snapshot error → Utilisez `fix-docker-deploy.sh`
- CORS errors → Vérifiez `.env`

---

## ✅ Checklist de Vérification

Avant de demander de l'aide, vérifiez:

- [ ] Docker est installé et fonctionne: `docker --version`
- [ ] Docker Compose est installé: `docker compose version`
- [ ] Le fichier `.env` existe et contient les bonnes valeurs
- [ ] Les ports 3101, 8000, 5432, 6379 sont libres
- [ ] Vous avez assez d'espace disque: `df -h`
- [ ] Les logs montrent les vraies erreurs: `docker compose logs`
- [ ] Vous avez essayé `./fix-docker-deploy.sh`
- [ ] Vous avez essayé un redémarrage complet
