# Test de Connexion Frontend ↔ Backend en Production

## ✅ Configuration Corrigée

J'ai corrigé la configuration pour que le frontend se connecte automatiquement au backend en production.

### Ce qui a été modifié:

#### 1. [EpilepticAI-web/.env.production](EpilepticAI-web/.env.production)
```env
# Production Environment Variables (Docker)
# Empty string means relative URL - Nginx will proxy /api/ to backend
VITE_API_BASE_URL=
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000
VITE_ENV=production
```

**Pourquoi `VITE_API_BASE_URL=` (vide)?**
- En production, le frontend fait des requêtes relatives: `/api/v1/...`
- Nginx intercepte ces requêtes `/api/` et les redirige vers le backend

#### 2. [EpilepticAI-web/src/lib/api.ts](EpilepticAI-web/src/lib/api.ts:4-14)
```typescript
// API configuration
// In production (Docker), VITE_API_BASE_URL is empty string for relative URLs
// Nginx will proxy /api/ requests to the backend container
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api/${API_VERSION}` : `/api/${API_VERSION}`,
  // ...
});
```

**Ce qui se passe maintenant:**
- En développement local: utilise `http://localhost:8000/api/v1`
- En production (Docker): utilise `/api/v1` (URL relative)

---

## 🔄 Comment ça fonctionne en Production

```
┌─────────────────────────────────────────┐
│  Navigateur du Client                  │
│  (http://aivora.fojas.ai)              │
└────────────┬────────────────────────────┘
             │
             │ GET /api/v1/auth/me
             │ (URL relative)
             ▼
┌─────────────────────────────────────────┐
│  Nginx (Frontend Container)             │
│  Port 3101 (exposé)                     │
│                                         │
│  Règle dans nginx.conf:                 │
│  location /api/ {                       │
│    proxy_pass http://backend:8000/api/ │
│  }                                      │
└────────────┬────────────────────────────┘
             │
             │ Proxy vers backend:8000
             ▼
┌─────────────────────────────────────────┐
│  Backend (FastAPI Container)            │
│  Port 8000 (interne)                    │
│                                         │
│  Reçoit: GET /api/v1/auth/me           │
│  Répond avec les données JSON           │
└─────────────────────────────────────────┘
```

---

## 🧪 Tests à Effectuer Après Déploiement

### 1. Test de Base (Frontend accessible)

```bash
# Sur le serveur
curl http://localhost:3101

# Depuis votre navigateur
http://aivora.fojas.ai
```

**Résultat attendu:** Page HTML du frontend React

---

### 2. Test Backend Direct

```bash
# Sur le serveur
curl http://localhost:3101/api/health

# Ou
curl http://localhost:3101/api/v1/health
```

**Résultat attendu:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-01T..."
}
```

---

### 3. Test Swagger (Documentation API)

Ouvrez dans votre navigateur:
```
http://aivora.fojas.ai/api/docs
```

**Résultat attendu:** Interface Swagger UI avec tous les endpoints

---

### 4. Test de Connexion (Login)

#### Dans le navigateur:

1. Allez sur `http://aivora.fojas.ai`
2. Cliquez sur "Login" ou "Register"
3. Ouvrez la Console du navigateur (F12)
4. Essayez de vous connecter

**Dans la console, vous devriez voir:**
```
🔵 API REQUEST: POST /auth/login
Full URL: /api/v1/auth/login
Headers: {...}
Data: {email: "...", password: "..."}

🟢 API RESPONSE: POST /auth/login
Status: 200 OK
Data: {access_token: "...", user: {...}}
```

**Si vous voyez une erreur:**
```
🔴 API ERROR: POST /auth/login
Status: 404
```
→ Problème de configuration Nginx ou backend non démarré

---

### 5. Test des Logs Backend

```bash
# Voir les logs du backend
docker logs epileptic_backend -f

# Vous devriez voir les requêtes arriver:
# INFO:     127.0.0.1:36252 - "POST /api/v1/auth/login HTTP/1.1" 200 OK
```

---

## 🐛 Dépannage

### Problème: Frontend s'affiche mais API ne répond pas

**Symptômes:**
- Page React charge correctement
- Mais les requêtes API échouent (404, timeout)

**Solutions:**

1. **Vérifier que le backend tourne:**
```bash
docker ps | grep backend
docker logs epileptic_backend --tail 50
```

2. **Vérifier la config Nginx:**
```bash
docker exec epileptic_frontend cat /etc/nginx/conf.d/default.conf
```

Devrait contenir:
```nginx
location /api/ {
    proxy_pass http://backend:8000/api/;
    # ...
}
```

3. **Tester directement depuis le conteneur frontend:**
```bash
docker exec epileptic_frontend wget -O- http://backend:8000/api/health
```

---

### Problème: CORS Errors

**Symptômes:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

1. **Vérifier les CORS dans le backend (.env):**
```env
BACKEND_CORS_ORIGINS=["https://aivora.fojas.ai", "http://aivora.fojas.ai"]
```

2. **Redémarrer le backend:**
```bash
docker compose -f docker-compose.deploy.yml restart backend
```

---

### Problème: 401 Unauthorized

**Symptômes:**
- Login ne fonctionne pas
- Toutes les requêtes retournent 401

**Solutions:**

1. **Vérifier le SECRET_KEY dans .env:**
```bash
cat .env | grep SECRET_KEY
```

2. **Initialiser la base de données:**
```bash
docker exec -it epileptic_backend bash
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
exit
```

3. **Créer un utilisateur de test:**
```bash
# Utiliser Swagger UI: http://aivora.fojas.ai/api/docs
# POST /api/v1/auth/register
```

---

## ✅ Checklist de Vérification

Après déploiement, vérifiez:

- [ ] Frontend accessible: `http://aivora.fojas.ai`
- [ ] Swagger accessible: `http://aivora.fojas.ai/api/docs`
- [ ] Health check OK: `http://aivora.fojas.ai/api/health`
- [ ] Console navigateur: Aucune erreur CORS
- [ ] Console navigateur: Requêtes API en `/api/v1/...`
- [ ] Login fonctionne
- [ ] Token JWT stocké dans localStorage
- [ ] Dashboard accessible après login

---

## 📊 Monitoring de la Connexion

### Voir toutes les requêtes en temps réel:

```bash
# Logs du frontend (Nginx access logs)
docker logs epileptic_frontend -f

# Logs du backend (FastAPI requests)
docker logs epileptic_backend -f

# Voir les deux en même temps
docker compose -f docker-compose.deploy.yml logs -f frontend backend
```

---

## 🎯 URLs Importantes

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://aivora.fojas.ai | Application React |
| API Docs | http://aivora.fojas.ai/api/docs | Swagger UI |
| API Health | http://aivora.fojas.ai/api/health | Status du backend |
| Login | http://aivora.fojas.ai/login | Page de connexion |
| Dashboard | http://aivora.fojas.ai/dashboard | Tableau de bord (après login) |

---

## 🔐 Première Connexion

Si c'est le premier déploiement, créez un compte admin:

1. Allez sur: http://aivora.fojas.ai/api/docs
2. Cliquez sur `POST /api/v1/auth/register`
3. Cliquez sur "Try it out"
4. Remplissez:
```json
{
  "email": "admin@aivora.ai",
  "password": "Admin123!",
  "full_name": "Administrator",
  "role": "doctor"
}
```
5. Cliquez "Execute"
6. Vous pouvez maintenant vous connecter avec ces identifiants!

---

**La connexion frontend ↔ backend est maintenant automatique!** 🎉
