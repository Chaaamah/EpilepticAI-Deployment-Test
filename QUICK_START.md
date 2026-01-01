# ⚡ EpilepticAI - Quick Start Guide

> Démarrer le projet complet en **2 minutes** avec Docker ou **5 minutes** sans Docker

---

## 🐳 Option 1: Docker (Recommandé - 2 minutes)

### Prérequis
- [ ] Docker Desktop installé et en cours d'exécution

### Démarrage en 3 Commandes

```bash
# 1. Naviguer vers le projet
cd "New folder (2)"

# 2. Lancer le script (Windows)
.\start.ps1

# OU (Linux/Mac)
chmod +x start.sh
./start.sh

# OU directement Docker Compose
docker compose up -d
```

**✅ C'est tout!** L'application est sur http://localhost

📚 **Voir [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) pour plus de détails**

---

## 💻 Option 2: Installation Manuelle (5 minutes)

### Prérequis
- [ ] Python 3.11+ installé
- [ ] Node.js 18+ installé
- [ ] PostgreSQL 15+ installé et **EN COURS D'EXÉCUTION**

---

## 🚀 Étape 1: Backend (2 min)

```bash
# Naviguer vers le dossier backend
cd EPILEPTIC-AI-BACKEND

# Créer environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows PowerShell:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Installer dépendances
pip install -r requirements.txt

# Créer base de données
alembic upgrade head

# Lancer le serveur
uvicorn app.main:app --reload --port 8000
```

**✅ Backend prêt:** http://localhost:8000

**⚠️ Problème?**
- PostgreSQL pas lancé → Démarrer PostgreSQL
- Erreur migration → Vérifier DATABASE_URL dans config.py

---

## 💻 Étape 2: Frontend (1 min)

**Ouvrir un NOUVEAU terminal** (laissez le backend tourner)

```bash
# Naviguer vers le dossier frontend
cd EpilepticAI-web

# Installer dépendances
npm install

# Lancer le serveur
npm run dev
```

**✅ Frontend prêt:** http://localhost:8080

---

## 🧪 Étape 3: Tester (1 min)

**Ouvrir un NOUVEAU terminal**

### Windows:
```powershell
.\test_backend.ps1
```

### Linux/Mac:
```bash
chmod +x test_backend.sh
./test_backend.sh
```

**✅ Résultat attendu:**
```
✅ Health check passed
✅ Root endpoint passed
✅ API docs accessible
✅ Login successful
✅ Dashboard stats endpoint working
✅ All tests passed!
```

---

## 🔍 Étape 4: Explorer (1 min)

### 1. API Documentation Interactive
Ouvrir: **http://localhost:8000/docs**

Tester un endpoint:
1. Cliquer sur `POST /api/v1/auth/login`
2. Cliquer "Try it out"
3. Entrer:
   ```json
   {
     "email": "admin@gmail.com",
     "password": "admin"
   }
   ```
4. Cliquer "Execute"
5. Copier le `access_token` dans la réponse

### 2. Frontend Web
Ouvrir: **http://localhost:8080**

Credentials par défaut:
- **Email:** `admin@gmail.com`
- **Password:** `admin`

---

## ✅ Checklist de Validation

- [ ] Backend répond sur http://localhost:8000
- [ ] Frontend accessible sur http://localhost:8080
- [ ] API docs visible sur http://localhost:8000/docs
- [ ] Test script passe tous les tests
- [ ] Login fonctionne dans le frontend

---

## 🎉 Félicitations!

Votre environnement est prêt!

### 📚 Prochaines Étapes:

1. **Explorer l'API:**
   - http://localhost:8000/docs
   - Tester les endpoints dashboard, patients, etc.

2. **Comprendre l'architecture:**
   - Lire [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
   - Voir [SUMMARY.md](./SUMMARY.md)

3. **Intégrer React Query:**
   - Suivre [REACT_QUERY_INTEGRATION.md](./REACT_QUERY_INTEGRATION.md)

---

## 🐛 Problèmes Courants

### Backend ne démarre pas

**Erreur: "Could not connect to database"**
```bash
# Vérifier PostgreSQL
psql -U postgres -l

# Si erreur, démarrer PostgreSQL:
# Windows: Services → PostgreSQL → Start
# Linux: sudo systemctl start postgresql
# Mac: brew services start postgresql
```

**Erreur: "Port 8000 already in use"**
```bash
# Tuer le processus sur le port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8000 | xargs kill -9
```

### Frontend ne démarre pas

**Erreur: "Module not found"**
```bash
# Supprimer et réinstaller
rm -rf node_modules
npm install
```

**Erreur: "Port 8080 already in use"**
```bash
# Modifier le port dans vite.config.ts
# ou tuer le processus
lsof -ti:8080 | xargs kill -9  # Linux/Mac
```

### CORS Error

**Erreur dans la console: "Access-Control-Allow-Origin"**
- Vérifier que le backend est sur port **8000**
- Vérifier dans `app/core/config.py`:
  ```python
  BACKEND_CORS_ORIGINS = ["http://localhost:8080"]
  ```

---

## 📞 Besoin d'Aide?

1. **Documentation complète:**
   - [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Guide détaillé
   - [README.md](./README.md) - Vue d'ensemble

2. **Vérifier les logs:**
   - Backend: Terminal où tourne uvicorn
   - Frontend: Console navigateur (F12)

3. **Reset complet:**
   ```bash
   # Backend
   alembic downgrade base
   alembic upgrade head

   # Frontend
   rm -rf node_modules
   npm install
   ```

---

## 🎯 Résumé des Commandes

| Action | Commande |
|--------|----------|
| **Démarrer Backend** | `cd EPILEPTIC-AI-BACKEND && uvicorn app.main:app --reload` |
| **Démarrer Frontend** | `cd EpilepticAI-web && npm run dev` |
| **Tester Backend** | `./test_backend.ps1` (Win) ou `./test_backend.sh` (Linux/Mac) |
| **API Docs** | Ouvrir http://localhost:8000/docs |
| **App Web** | Ouvrir http://localhost:8080 |

---

## 📋 URLs Importantes

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:8000 | API REST |
| **API Docs (Swagger)** | http://localhost:8000/docs | Documentation interactive |
| **API Docs (ReDoc)** | http://localhost:8000/redoc | Documentation alternative |
| **Frontend** | http://localhost:8080 | Application web |
| **Health Check** | http://localhost:8000/health | Statut backend |

---

**Temps total écoulé:** ~5 minutes ⏱️
**Statut:** ✅ Prêt pour le développement!

---

**Prochaine étape:** Lire [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) pour comprendre comment connecter le frontend au backend.
