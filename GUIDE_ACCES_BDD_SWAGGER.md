# 🔍 Guide d'Accès - Base de Données & API Documentation

## 📋 Table des Matières
1. [Accès Swagger (Documentation API)](#swagger)
2. [Accès pgAdmin (Interface PostgreSQL)](#pgadmin)
3. [Connexion Directe PostgreSQL](#postgres-direct)
4. [Tester la Communication Frontend → Backend → Database](#test-communication)

---

## 🚀 Démarrage Rapide

### Démarrer Tous les Services
```powershell
# Windows
docker compose up -d

# Vérifier que tout fonctionne
docker compose ps
```

Vous devriez voir **7 services** actifs:
- ✅ frontend (port 80)
- ✅ backend (interne)
- ✅ postgres (port 5432)
- ✅ redis (port 6379)
- ✅ worker (interne)
- ✅ pgadmin (port 5050)
- ✅ nginx (reverse proxy)

---

## 📚 1. Accès Swagger (Documentation API) {#swagger}

### URL d'Accès
```
http://localhost/api/v1/docs
```

### Fonctionnalités Disponibles

#### 🔐 Authentification
1. **Créer un compte docteur:**
   ```
   POST /api/v1/auth/register
   Body:
   {
     "email": "docteur@example.com",
     "password": "SecurePass123!",
     "full_name": "Dr. Martin Dupont",
     "specialization": "Neurologie",
     "license_number": "NEU-12345"
   }
   ```

2. **Se connecter:**
   ```
   POST /api/v1/auth/login
   Body:
   {
     "username": "docteur@example.com",
     "password": "SecurePass123!"
   }
   ```

   Récupérez le **access_token** dans la réponse.

3. **Autoriser dans Swagger:**
   - Cliquez sur le bouton 🔓 **Authorize** en haut à droite
   - Entrez: `Bearer VOTRE_TOKEN_ICI`
   - Cliquez sur **Authorize**
   - Maintenant vous pouvez tester toutes les routes protégées

#### 📊 Endpoints Disponibles

**Dashboard:**
```
GET /api/v1/doctors/dashboard/stats
GET /api/v1/doctors/seizures/statistics?period=week
GET /api/v1/doctors/history?skip=0&limit=50
```

**Patients:**
```
GET    /api/v1/patients/
POST   /api/v1/patients/
GET    /api/v1/patients/{patient_id}
PUT    /api/v1/patients/{patient_id}
DELETE /api/v1/patients/{patient_id}
PUT    /api/v1/doctors/patients/{patient_id}/transfer
```

**Crises (Seizures):**
```
GET    /api/v1/seizures/
POST   /api/v1/seizures/
GET    /api/v1/seizures/patient/{patient_id}
GET    /api/v1/seizures/{seizure_id}
PUT    /api/v1/seizures/{seizure_id}
DELETE /api/v1/seizures/{seizure_id}
```

**Médicaments:**
```
GET    /api/v1/medications/
POST   /api/v1/medications/
GET    /api/v1/medications/patient/{patient_id}
PUT    /api/v1/medications/{medication_id}
DELETE /api/v1/medications/{medication_id}
```

**Alertes:**
```
GET    /api/v1/alerts/
GET    /api/v1/alerts/patient/{patient_id}
PUT    /api/v1/alerts/{alert_id}/acknowledge
```

**Notes Cliniques:**
```
POST   /api/v1/clinical-notes/
GET    /api/v1/clinical-notes/patient/{patient_id}
GET    /api/v1/clinical-notes/{note_id}
PUT    /api/v1/clinical-notes/{note_id}
DELETE /api/v1/clinical-notes/{note_id}
```

### Exemple de Flux Complet dans Swagger

1. **Créer un docteur** (POST /auth/register)
2. **Se connecter** (POST /auth/login) → Récupérer token
3. **Autoriser avec le token** (bouton Authorize)
4. **Créer un patient** (POST /patients/)
5. **Créer une crise** (POST /seizures/)
6. **Voir le dashboard** (GET /doctors/dashboard/stats)
7. **Vérifier dans pgAdmin** que les données sont bien dans la BDD

---

## 🗄️ 2. Accès pgAdmin (Interface PostgreSQL) {#pgadmin}

### URL d'Accès
```
http://localhost:5050
```

### Identifiants de Connexion
```
Email:    admin@epileptic.ai
Password: admin123
```

### Configuration de la Connexion PostgreSQL

#### Première Connexion

1. **Ouvrir pgAdmin** → http://localhost:5050

2. **Ajouter un nouveau serveur:**
   - Clic droit sur "Servers" → Create → Server

3. **Onglet "General":**
   ```
   Name: Epileptic AI Database
   ```

4. **Onglet "Connection":**
   ```
   Host name/address: postgres
   Port:              5432
   Maintenance database: epileptic_ai
   Username:          postgres
   Password:          password
   ```
   ⚠️ **Important:** Utilisez `postgres` comme hostname (nom du service Docker), pas `localhost`

5. **Sauvegarder la connexion**
   - Cochez "Save password"
   - Cliquez sur "Save"

#### Explorer la Base de Données

```
Servers
  └─ Epileptic AI Database
      └─ Databases
          └─ epileptic_ai
              └─ Schemas
                  └─ public
                      └─ Tables
                          ├─ doctors
                          ├─ patients
                          ├─ seizures
                          ├─ medications
                          ├─ alerts
                          └─ clinical_notes
```

### Requêtes SQL Utiles

#### Voir tous les docteurs
```sql
SELECT * FROM doctors ORDER BY created_at DESC;
```

#### Voir tous les patients avec leur docteur
```sql
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    d.full_name as doctor_name,
    p.created_at
FROM patients p
LEFT JOIN doctors d ON p.doctor_id = d.id
ORDER BY p.created_at DESC;
```

#### Voir toutes les crises avec patient et docteur
```sql
SELECT
    s.id,
    s.seizure_datetime,
    s.severity,
    s.duration_seconds,
    p.first_name || ' ' || p.last_name as patient_name,
    d.full_name as doctor_name
FROM seizures s
JOIN patients p ON s.patient_id = p.id
JOIN doctors d ON p.doctor_id = d.id
ORDER BY s.seizure_datetime DESC;
```

#### Statistiques du dashboard (comme l'API)
```sql
-- Nombre total de patients
SELECT COUNT(*) as total_patients FROM patients WHERE is_active = true;

-- Crises cette semaine
SELECT COUNT(*) as seizures_this_week
FROM seizures
WHERE seizure_datetime >= CURRENT_DATE - INTERVAL '7 days';

-- Patients à haut risque (≥3 crises ce mois)
SELECT
    p.first_name || ' ' || p.last_name as patient_name,
    COUNT(s.id) as seizure_count
FROM patients p
LEFT JOIN seizures s ON p.id = s.patient_id
    AND s.seizure_datetime >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, patient_name
HAVING COUNT(s.id) >= 3
ORDER BY seizure_count DESC;
```

#### Voir les données d'un patient spécifique
```sql
-- Remplacer 1 par l'ID du patient
SELECT
    p.*,
    d.full_name as doctor_name,
    COUNT(DISTINCT s.id) as total_seizures,
    COUNT(DISTINCT m.id) as active_medications,
    COUNT(DISTINCT a.id) as active_alerts
FROM patients p
LEFT JOIN doctors d ON p.doctor_id = d.id
LEFT JOIN seizures s ON p.id = s.patient_id
LEFT JOIN medications m ON p.id = m.patient_id AND m.is_active = true
LEFT JOIN alerts a ON p.id = a.patient_id AND a.is_acknowledged = false
WHERE p.id = 1
GROUP BY p.id, d.full_name;
```

---

## 🔌 3. Connexion Directe PostgreSQL {#postgres-direct}

### Via psql (ligne de commande)

#### Depuis votre machine (si psql installé)
```bash
psql -h localhost -p 5432 -U postgres -d epileptic_ai
# Password: password
```

#### Depuis le container Docker
```powershell
docker exec -it epileptic_postgres psql -U postgres -d epileptic_ai
```

### Via DBeaver / DataGrip / TablePlus

```
Host:     localhost
Port:     5432
Database: epileptic_ai
User:     postgres
Password: password
```

---

## 🧪 4. Tester la Communication Frontend → Backend → Database {#test-communication}

### Scénario de Test Complet

#### Étape 1: Créer un Docteur (via Swagger)

1. Ouvrir http://localhost/api/v1/docs
2. POST /api/v1/auth/register
   ```json
   {
     "email": "test@doctor.com",
     "password": "Test123!",
     "full_name": "Dr. Test",
     "specialization": "Neurology",
     "license_number": "TEST-001"
   }
   ```

#### Étape 2: Vérifier dans pgAdmin

```sql
SELECT * FROM doctors WHERE email = 'test@doctor.com';
```

Vous devriez voir votre docteur avec:
- ✅ ID généré
- ✅ Mot de passe hashé
- ✅ created_at timestamp

#### Étape 3: Se Connecter (via Swagger)

POST /api/v1/auth/login
```json
{
  "username": "test@doctor.com",
  "password": "Test123!"
}
```

Récupérer le **access_token**.

#### Étape 4: Créer un Patient (via Swagger avec token)

1. Cliquer "Authorize" → Entrer `Bearer VOTRE_TOKEN`
2. POST /api/v1/patients/
   ```json
   {
     "first_name": "Jean",
     "last_name": "Dupont",
     "date_of_birth": "1985-03-15",
     "gender": "M",
     "blood_type": "A+",
     "phone": "0612345678",
     "emergency_contact": "0698765432"
   }
   ```

#### Étape 5: Vérifier dans pgAdmin

```sql
SELECT
    p.*,
    d.full_name as doctor_name
FROM patients p
JOIN doctors d ON p.doctor_id = d.id
WHERE p.first_name = 'Jean' AND p.last_name = 'Dupont';
```

Vous devriez voir:
- ✅ Patient créé
- ✅ Lié au bon docteur (doctor_id)
- ✅ Toutes les informations correctes

#### Étape 6: Créer une Crise (via Swagger)

POST /api/v1/seizures/
```json
{
  "patient_id": 1,
  "seizure_datetime": "2025-12-30T10:30:00",
  "severity": "moderate",
  "duration_seconds": 120,
  "notes": "Crise généralisée tonique-clonique"
}
```

#### Étape 7: Vérifier le Dashboard (via Swagger)

GET /api/v1/doctors/dashboard/stats

Réponse attendue:
```json
{
  "total_patients": 1,
  "recent_seizures_this_week": 1,
  "recent_seizures_this_month": 1,
  "critical_patients": 0,
  "high_risk_patients": 0,
  "active_alerts": 0
}
```

#### Étape 8: Vérifier dans pgAdmin

```sql
-- Voir la crise
SELECT * FROM seizures WHERE patient_id = 1;

-- Statistiques comme l'API
SELECT
    (SELECT COUNT(*) FROM patients WHERE is_active = true) as total_patients,
    (SELECT COUNT(*) FROM seizures WHERE seizure_datetime >= CURRENT_DATE - INTERVAL '7 days') as seizures_this_week,
    (SELECT COUNT(*) FROM seizures WHERE seizure_datetime >= CURRENT_DATE - INTERVAL '30 days') as seizures_this_month;
```

#### Étape 9: Tester depuis le Frontend

1. Ouvrir http://localhost
2. Se connecter avec test@doctor.com / Test123!
3. Vérifier le dashboard affiche:
   - ✅ Total patients: 1
   - ✅ Crises cette semaine: 1
4. Cliquer sur "Patients" → Voir Jean Dupont
5. Ouvrir les DevTools → Network → Voir les requêtes API
6. Vérifier que les requêtes passent par `/api/v1/...`

#### Étape 10: Vérifier les Logs Docker

```powershell
# Logs backend (voir les requêtes API)
docker compose logs -f backend

# Logs frontend (voir Nginx)
docker compose logs -f frontend

# Logs PostgreSQL (voir les queries SQL)
docker compose logs -f postgres
```

Vous devriez voir:
- Backend: `POST /api/v1/auth/login` → 200
- Backend: `GET /api/v1/doctors/dashboard/stats` → 200
- PostgreSQL: Connexions établies

---

## 📊 Monitoring en Temps Réel

### Surveiller les Requêtes SQL

Dans pgAdmin:
```
Tools → Query Tool
```

Activer le monitoring:
```sql
-- Voir les connexions actives
SELECT * FROM pg_stat_activity WHERE datname = 'epileptic_ai';

-- Voir les requêtes lentes (> 100ms)
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;
```

### Surveiller les Logs Backend

```powershell
# Toutes les requêtes API en temps réel
docker compose logs -f backend | Select-String "INFO"

# Uniquement les erreurs
docker compose logs -f backend | Select-String "ERROR"
```

---

## ✅ Checklist de Vérification

### Backend ↔ Database
- [ ] Le backend se connecte à PostgreSQL
  ```powershell
  docker compose logs backend | Select-String "Database"
  ```
- [ ] Les tables sont créées (voir pgAdmin)
- [ ] Les requêtes SQL fonctionnent dans pgAdmin

### Frontend ↔ Backend
- [ ] Le frontend charge (http://localhost)
- [ ] Les requêtes API passent par `/api/v1/` (voir DevTools Network)
- [ ] Les requêtes retournent 200 (pas 401/404/500)
- [ ] Le token JWT est envoyé dans les headers

### Frontend ↔ Backend ↔ Database (End-to-End)
- [ ] Créer un compte docteur → Voir dans pgAdmin
- [ ] Se connecter → Recevoir un token
- [ ] Créer un patient → Voir dans pgAdmin
- [ ] Créer une crise → Voir dans dashboard frontend ET pgAdmin
- [ ] Les statistiques correspondent entre API et BDD

---

## 🐛 Troubleshooting

### pgAdmin ne se connecte pas à PostgreSQL

**Erreur:** "could not connect to server"

**Solution:**
```yaml
# Vérifier que postgres est bien démarré
docker compose ps postgres

# Utiliser le nom du service Docker (pas localhost)
Host: postgres  ✅
Host: localhost ❌
```

### Swagger ne charge pas

**Vérifier:**
```powershell
# Backend est accessible
curl http://localhost:8000/health

# Via le proxy Nginx
curl http://localhost/api/v1/docs
```

**Si erreur 502:**
```powershell
docker compose logs backend
docker compose restart backend
```

### Les données ne s'affichent pas dans le frontend

**Étapes de debug:**

1. **Vérifier les requêtes API:**
   - Ouvrir DevTools → Network
   - Filtrer par "XHR"
   - Vérifier les URLs: `http://localhost/api/v1/...`

2. **Vérifier le token JWT:**
   - DevTools → Application → Local Storage
   - Chercher `token`
   - Copier le token et vérifier sur https://jwt.io

3. **Vérifier la réponse API:**
   - Cliquer sur une requête dans Network
   - Onglet "Response"
   - Si 401: Token invalide/expiré
   - Si 404: Route n'existe pas
   - Si 500: Erreur backend (voir logs)

4. **Vérifier les logs:**
   ```powershell
   docker compose logs -f backend | Select-String "ERROR"
   ```

### Les statistiques sont incorrectes

**Vérifier dans pgAdmin:**
```sql
-- Compter manuellement
SELECT COUNT(*) FROM patients WHERE is_active = true;
SELECT COUNT(*) FROM seizures WHERE seizure_datetime >= CURRENT_DATE - INTERVAL '7 days';

-- Comparer avec l'API
-- GET http://localhost/api/v1/doctors/dashboard/stats
```

---

## 📞 URLs de Référence Rapide

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost | Créer via register |
| **Swagger API** | http://localhost/api/v1/docs | Bearer token |
| **pgAdmin** | http://localhost:5050 | admin@epileptic.ai / admin123 |
| **Backend Direct** | http://localhost:8000 | N/A |
| **PostgreSQL** | localhost:5432 | postgres / password |
| **Redis** | localhost:6379 | N/A |

---

## 🎯 Workflow Recommandé

### Pour le Développement

1. **Démarrer les services:**
   ```powershell
   docker compose up -d
   ```

2. **Ouvrir 4 onglets:**
   - Tab 1: http://localhost (Frontend)
   - Tab 2: http://localhost/api/v1/docs (Swagger)
   - Tab 3: http://localhost:5050 (pgAdmin)
   - Tab 4: DevTools ouvert sur Frontend

3. **Workflow de test:**
   - Créer/modifier données dans Frontend
   - Vérifier requête API dans DevTools
   - Vérifier endpoint dans Swagger
   - Vérifier données dans pgAdmin
   - Vérifier logs: `docker compose logs -f backend`

### Pour le Debugging

1. **Problème dans le frontend:**
   ```
   DevTools Console → Voir erreurs JS
   DevTools Network → Voir requêtes API
   ```

2. **Problème API:**
   ```
   Swagger → Tester endpoint directement
   docker compose logs backend → Voir erreurs Python
   ```

3. **Problème Database:**
   ```
   pgAdmin → Exécuter requêtes SQL manuellement
   docker compose logs postgres → Voir erreurs DB
   ```

---

**Mise à jour:** 30 Décembre 2025
**Version:** 1.0
