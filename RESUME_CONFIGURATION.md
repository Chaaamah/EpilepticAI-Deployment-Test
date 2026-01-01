# ✅ Résumé de la Configuration - Epileptic AI

## 🎯 Ce Qui a Été Fait

### 1. Configuration Docker ✅

**Fichiers modifiés:**
- [docker-compose.yml](docker-compose.yml)
  - ✅ Port 8000 exposé pour accès direct au backend
  - ✅ pgAdmin activé par défaut (port 5050)
  - ✅ Mode DEBUG activé pour développement
  - ✅ CORS configuré pour localhost:8000

**Services disponibles:**
- ✅ Frontend (Nginx + React) - Port 80
- ✅ Backend (FastAPI) - Port 8000
- ✅ PostgreSQL - Port 5432
- ✅ Redis - Port 6379
- ✅ Worker (Celery) - Background
- ✅ pgAdmin - Port 5050

### 2. Correction Dockerfile Frontend ✅

**Fichier modifié:**
- [EpilepticAI-web/Dockerfile](EpilepticAI-web/Dockerfile)
  - ✅ Changé `npm ci` → `npm install --legacy-peer-deps`
  - ✅ Résout le problème de package-lock.json manquant

### 3. Scripts Créés ✅

| Script | Fonction |
|--------|----------|
| [start.ps1](start.ps1) | Démarrer l'application |
| [open-services.ps1](open-services.ps1) | Ouvrir tous les services dans le navigateur |
| [init-database.ps1](init-database.ps1) | **NOUVEAU** - Initialiser les tables PostgreSQL |
| [test-communication.ps1](test-communication.ps1) | Tester Frontend ↔ Backend ↔ Database |
| [fix-docker-build.ps1](fix-docker-build.ps1) | Corriger problèmes de build |
| [quick-fix.ps1](quick-fix.ps1) | Fix rapide cache Docker |

### 4. Documentation Créée ✅

| Document | Contenu |
|----------|---------|
| [GUIDE_ACCES_BDD_SWAGGER.md](GUIDE_ACCES_BDD_SWAGGER.md) | **NOUVEAU** - Guide complet pgAdmin + Swagger + Test communication |
| [TEST_API.md](TEST_API.md) | **NOUVEAU** - Guide de test de l'API avec exemples PowerShell |
| [ACCES_RAPIDE.md](ACCES_RAPIDE.md) | Référence rapide URLs + identifiants + commandes |
| [START_HERE.md](START_HERE.md) | Point de départ mis à jour |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Résolution de problèmes |

---

## 🚀 Pour Commencer (IMPORTANT)

### Étape 1: Arrêter les Services Actuels

```powershell
docker compose down
```

### Étape 2: Redémarrer avec la Nouvelle Configuration

```powershell
docker compose up -d
```

### Étape 3: Initialiser la Base de Données

```powershell
.\init-database.ps1
```

Ce script va:
- ✅ Créer toutes les tables (users, doctors, patients, seizures, etc.)
- ✅ Vérifier que tout fonctionne
- ✅ Afficher la liste des tables créées

### Étape 4: Ouvrir les Services

```powershell
.\open-services.ps1
```

Cela va ouvrir automatiquement:
- Frontend: <http://localhost>
- Swagger Direct: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- Swagger via Nginx: <http://localhost/api/v1/docs>
- pgAdmin: <http://localhost:5050>

---

## 🌐 Accès aux Services

### Frontend
- **URL:** <http://localhost>
- **Fonction:** Interface utilisateur React
- **Créer compte:** Via bouton "Register"

### Swagger (Port 8000 - Direct)
- **URL:** <http://localhost:8000/docs>
- **Fonction:** Documentation API interactive directe
- **Avantage:** Accès direct au backend, meilleur pour le debug

### ReDoc (Port 8000)
- **URL:** <http://localhost:8000/redoc>
- **Fonction:** Documentation API alternative
- **Avantage:** Vue plus claire de la structure API

### Swagger (Via Nginx)
- **URL:** <http://localhost/api/v1/docs>
- **Fonction:** Documentation via reverse proxy
- **Avantage:** Même URL que le frontend utilise

### pgAdmin
- **URL:** <http://localhost:5050>
- **Login:** `admin@epileptic.ai` / `admin123`
- **Fonction:** Interface de gestion PostgreSQL

**Configuration PostgreSQL dans pgAdmin:**
```
Host:     postgres
Port:     5432
Database: epileptic_ai
User:     postgres
Password: password
```

---

## 🧪 Test Complet de Communication

### Option 1: Script Automatique

```powershell
.\test-communication.ps1
```

Ce script va:
1. ✅ Vérifier que Docker fonctionne
2. ✅ Créer un compte docteur de test
3. ✅ Se connecter et récupérer un token
4. ✅ Créer un patient
5. ✅ Créer une crise
6. ✅ Vérifier les statistiques
7. ✅ Afficher les identifiants pour tester manuellement

### Option 2: Test Manuel

#### 1. Créer un Docteur (Swagger)

**Ouvrir:** <http://localhost:8000/docs>

**Endpoint:** POST `/api/v1/auth/register/doctor`

**Body:**
```json
{
  "email": "test@doctor.com",
  "password": "Test123!",
  "full_name": "Dr. Test",
  "specialization": "Neurologie",
  "license_number": "TEST-001",
  "phone": "0612345678",
  "hospital": "CHU Test"
}
```

**Résultat attendu:** Status 200, compte créé

#### 2. Vérifier dans pgAdmin

**Ouvrir:** <http://localhost:5050>

**SQL:**
```sql
-- Voir dans table users
SELECT * FROM users WHERE email = 'test@doctor.com';

-- Voir dans table doctors
SELECT * FROM doctors WHERE email = 'test@doctor.com';
```

**Résultat attendu:** 1 ligne dans chaque table

#### 3. Se Connecter (Swagger)

**Endpoint:** POST `/api/v1/auth/login`

**Body:**
```json
{
  "email": "test@doctor.com",
  "password": "Test123!"
}
```

**Copier le `access_token`**

#### 4. Autoriser dans Swagger

1. Cliquer sur 🔓 **Authorize**
2. Entrer: `Bearer VOTRE_TOKEN`
3. Cliquer **Authorize**

#### 5. Créer un Patient

**Endpoint:** POST `/api/v1/patients/`

**Body:**
```json
{
  "first_name": "Jean",
  "last_name": "Test",
  "date_of_birth": "1990-01-01",
  "gender": "M",
  "blood_type": "A+",
  "phone": "0623456789",
  "emergency_contact": "0698765432"
}
```

#### 6. Vérifier dans pgAdmin

```sql
SELECT
    p.*,
    d.full_name as doctor_name
FROM patients p
JOIN doctors d ON p.doctor_id = d.id
WHERE p.last_name = 'Test';
```

**Résultat attendu:** Patient créé, lié au docteur

#### 7. Tester dans le Frontend

**Ouvrir:** <http://localhost>

1. Se connecter avec `test@doctor.com` / `Test123!`
2. Voir le patient dans la liste
3. DevTools → Network → Vérifier les requêtes API

---

## 🐛 Si Ça Ne Marche Pas

### Problème 1: Les Tables N'Existent Pas

**Symptôme:** Erreur "table does not exist"

**Solution:**
```powershell
.\init-database.ps1
```

### Problème 2: Backend Ne Répond Pas

**Vérifier:**
```powershell
# Voir les logs
docker compose logs backend

# Vérifier le statut
docker compose ps backend

# Tester health check
curl http://localhost:8000/health
```

**Solution:**
```powershell
docker compose restart backend
```

### Problème 3: Le Compte Docteur Ne Se Crée Pas

**Vérifier dans les logs:**
```powershell
docker compose logs -f backend
```

**Tester directement:**
```powershell
$body = @{
    email = "test@doctor.com"
    password = "Test123!"
    full_name = "Dr. Test"
    specialization = "Test"
    license_number = "TEST-001"
    phone = "0612345678"
    hospital = "Test"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/auth/register/doctor" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Problème 4: CORS Error

**Symptôme:** "CORS policy blocked" dans le navigateur

**Vérifier:** [docker-compose.yml](docker-compose.yml) ligne 60
```yaml
BACKEND_CORS_ORIGINS=["http://localhost", "http://localhost:80", "http://localhost:3000", "http://localhost:8000"]
```

**Solution:** Redémarrer le backend
```powershell
docker compose restart backend
```

### Problème 5: pgAdmin Ne Se Connecte Pas

**Configuration correcte:**
- Host: `postgres` (PAS localhost)
- Port: `5432`
- Database: `epileptic_ai`
- User: `postgres`
- Password: `password`

### Problème 6: Port 8000 Déjà Utilisé

**Trouver le processus:**
```powershell
netstat -ano | findstr "8000"
```

**Arrêter le processus:**
```powershell
# Remplacer PID par le numéro affiché
Stop-Process -Id PID -Force
```

---

## ✅ Checklist Finale

- [ ] Docker Desktop est démarré
- [ ] `docker compose down` exécuté
- [ ] `docker compose up -d` exécuté
- [ ] Tous les services sont "Up": `docker compose ps`
- [ ] `.\init-database.ps1` exécuté avec succès
- [ ] Tables créées (visible dans pgAdmin)
- [ ] Swagger accessible: <http://localhost:8000/docs>
- [ ] pgAdmin accessible: <http://localhost:5050>
- [ ] Frontend accessible: <http://localhost>
- [ ] Health check OK: `curl http://localhost:8000/health`
- [ ] Compte docteur créé via Swagger
- [ ] Compte visible dans pgAdmin (tables users + doctors)
- [ ] Login fonctionne, token reçu
- [ ] Patient créé via API
- [ ] Patient visible dans pgAdmin
- [ ] Dashboard affiche les statistiques
- [ ] Frontend se connecte au backend (DevTools Network)

---

## 📊 Architecture Finale

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEUR                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │                                      │
        │   http://localhost (Port 80)         │
        │   Frontend (React + Nginx)           │
        │                                      │
        └──────────────────┬───────────────────┘
                           │
        ┌──────────────────┴───────────────────┐
        │                                      │
        ▼                                      ▼
┌──────────────────┐              ┌──────────────────────┐
│   /api/v1/*      │              │   / (SPA)            │
│   → backend:8000 │              │   → React App        │
│   (Proxy)        │              │                      │
└─────┬────────────┘              └──────────────────────┘
      │
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│    http://localhost:8000 (Direct Access)                │
│    Backend (FastAPI)                                    │
│    - /docs (Swagger)                                    │
│    - /redoc (ReDoc)                                     │
│    - /api/v1/* (Endpoints)                              │
└─────┬───────────────────────────────────────────────────┘
      │
      ├──────────────────┬────────────────────┐
      │                  │                    │
      ▼                  ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ PostgreSQL   │  │ Redis        │  │ Celery Worker    │
│ Port: 5432   │  │ Port: 6379   │  │ (Background)     │
│              │  │              │  │                  │
└──────────────┘  └──────────────┘  └──────────────────┘
      │
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│    http://localhost:5050                                │
│    pgAdmin (PostgreSQL UI)                              │
│    - Voir/Modifier données                              │
│    - Exécuter requêtes SQL                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📞 Ressources

| Ressource | Lien |
|-----------|------|
| Guide Accès BDD/Swagger | [GUIDE_ACCES_BDD_SWAGGER.md](GUIDE_ACCES_BDD_SWAGGER.md) |
| Guide Test API | [TEST_API.md](TEST_API.md) |
| Accès Rapide | [ACCES_RAPIDE.md](ACCES_RAPIDE.md) |
| Troubleshooting | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Guide Docker | [DOCKER_GUIDE.md](DOCKER_GUIDE.md) |

---

## 🎉 Prochaines Étapes

Une fois que tout fonctionne:

1. **Tester toutes les fonctionnalités:**
   - Créer plusieurs patients
   - Enregistrer des crises
   - Ajouter des médicaments
   - Consulter le dashboard

2. **Intégrer React Query:**
   - Lire [REACT_QUERY_INTEGRATION.md](REACT_QUERY_INTEGRATION.md)
   - Implémenter les hooks
   - Remplacer les appels API directs

3. **Améliorer le Frontend:**
   - Ajouter les graphiques
   - Implémenter les filtres
   - Améliorer l'UX

4. **Production:**
   - Changer les secrets dans docker-compose.yml
   - Désactiver DEBUG
   - Configurer HTTPS

---

**Dernière mise à jour:** 30 Décembre 2025
**Version:** 2.0 - Configuration complète avec accès direct backend
