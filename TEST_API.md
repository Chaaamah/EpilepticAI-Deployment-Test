# 🧪 Guide de Test de l'API

## 🚀 Accès Direct à l'API Backend

Après avoir redémarré les services, vous aurez accès à:

| Service | URL | Description |
|---------|-----|-------------|
| **Swagger UI** | <http://localhost:8000/docs> | Interface interactive principale |
| **ReDoc** | <http://localhost:8000/redoc> | Documentation alternative |
| **Health Check** | <http://localhost:8000/health> | Vérifier que le backend fonctionne |
| **Swagger via Nginx** | <http://localhost/api/v1/docs> | Via reverse proxy |

---

## ⚡ Redémarrer les Services

```powershell
# Arrêter
docker compose down

# Redémarrer avec la nouvelle configuration
docker compose up -d

# Vérifier que tout fonctionne
docker compose ps
```

---

## 🔧 Test 1: Vérifier que le Backend Répond

### Via PowerShell
```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8000/health"

# Devrait retourner: {"status": "ok"}
```

### Via Navigateur
Ouvrir: <http://localhost:8000/health>

---

## 📚 Test 2: Créer un Docteur via Swagger (Port 8000)

### Étape 1: Ouvrir Swagger
<http://localhost:8000/docs>

### Étape 2: Tester l'endpoint POST /api/v1/auth/register/doctor

1. Cliquer sur **POST /api/v1/auth/register/doctor**
2. Cliquer sur **Try it out**
3. Modifier le JSON:

```json
{
  "email": "docteur@test.com",
  "password": "SecurePass123!",
  "full_name": "Dr. Jean Dupont",
  "specialization": "Neurologie",
  "license_number": "NEU-12345",
  "phone": "0612345678",
  "hospital": "CHU Paris"
}
```

4. Cliquer **Execute**
5. Vérifier la réponse **200 OK**

### Étape 3: Vérifier dans pgAdmin

```sql
-- Voir dans la table users
SELECT * FROM users WHERE email = 'docteur@test.com';

-- Voir dans la table doctors
SELECT * FROM doctors WHERE email = 'docteur@test.com';
```

✅ **Attendu:** Vous devriez voir l'utilisateur dans les deux tables.

---

## 🔐 Test 3: Se Connecter

### Via Swagger (Port 8000)

1. POST **/api/v1/auth/login**
2. Try it out
3. Body:

```json
{
  "email": "docteur@test.com",
  "password": "SecurePass123!"
}
```

4. Execute
5. Copier le `access_token` de la réponse

### Via PowerShell (Postman Alternative)

```powershell
# Créer le compte
$registerBody = @{
    email = "docteur@test.com"
    password = "SecurePass123!"
    full_name = "Dr. Jean Dupont"
    specialization = "Neurologie"
    license_number = "NEU-12345"
    phone = "0612345678"
    hospital = "CHU Paris"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/auth/register/doctor" `
    -Method Post `
    -Body $registerBody `
    -ContentType "application/json"

# Se connecter
$loginBody = @{
    email = "docteur@test.com"
    password = "SecurePass123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/auth/login" `
    -Method Post `
    -Body $loginBody `
    -ContentType "application/json"

# Afficher le token
$token = $loginResponse.access_token
Write-Host "Token: $token"
```

---

## 🔓 Test 4: Autoriser dans Swagger

1. Cliquer sur le bouton **🔓 Authorize** en haut à droite de Swagger
2. Dans le champ `value`, entrer:
   ```
   Bearer VOTRE_TOKEN_ICI
   ```
   (Remplacer `VOTRE_TOKEN_ICI` par le token obtenu)
3. Cliquer **Authorize**
4. Cliquer **Close**

✅ Maintenant vous pouvez tester tous les endpoints protégés!

---

## 👤 Test 5: Créer un Patient

### Via Swagger (avec autorisation)

1. POST **/api/v1/patients/**
2. Try it out
3. Body:

```json
{
  "first_name": "Marie",
  "last_name": "Martin",
  "date_of_birth": "1990-05-15",
  "gender": "F",
  "blood_type": "O+",
  "phone": "0623456789",
  "emergency_contact": "0698765432",
  "address": "123 Rue de Paris",
  "medical_history": "Aucun antécédent particulier"
}
```

4. Execute
5. Vérifier **200 OK**

### Via PowerShell

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$patientBody = @{
    first_name = "Marie"
    last_name = "Martin"
    date_of_birth = "1990-05-15"
    gender = "F"
    blood_type = "O+"
    phone = "0623456789"
    emergency_contact = "0698765432"
} | ConvertTo-Json

$patient = Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/patients/" `
    -Method Post `
    -Headers $headers `
    -Body $patientBody

Write-Host "Patient créé avec ID: $($patient.id)"
```

### Vérifier dans pgAdmin

```sql
SELECT
    p.*,
    d.full_name as doctor_name
FROM patients p
JOIN doctors d ON p.doctor_id = d.id
WHERE p.last_name = 'Martin';
```

---

## 📊 Test 6: Voir le Dashboard

### Via Swagger

1. GET **/api/v1/doctors/dashboard/stats**
2. Try it out
3. Execute

### Via PowerShell

```powershell
$stats = Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/doctors/dashboard/stats" `
    -Method Get `
    -Headers $headers

Write-Host "Total patients: $($stats.total_patients)"
Write-Host "Crises cette semaine: $($stats.recent_seizures_this_week)"
```

---

## 🩺 Test 7: Créer une Crise

### Via Swagger

1. POST **/api/v1/seizures/**
2. Try it out
3. Body:

```json
{
  "patient_id": 1,
  "seizure_datetime": "2025-12-30T14:30:00",
  "severity": "moderate",
  "duration_seconds": 120,
  "notes": "Crise généralisée tonique-clonique",
  "witnessed": true,
  "trigger": "Stress"
}
```

### Via PowerShell

```powershell
$seizureBody = @{
    patient_id = $patient.id
    seizure_datetime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    severity = "moderate"
    duration_seconds = 120
    notes = "Crise de test"
    witnessed = $true
} | ConvertTo-Json

$seizure = Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/seizures/" `
    -Method Post `
    -Headers $headers `
    -Body $seizureBody

Write-Host "Crise créée avec ID: $($seizure.id)"
```

### Vérifier dans pgAdmin

```sql
SELECT
    s.*,
    p.first_name || ' ' || p.last_name as patient_name
FROM seizures s
JOIN patients p ON s.patient_id = p.id
ORDER BY s.seizure_datetime DESC;
```

---

## 🔍 Debugging: Si Ça Ne Marche Toujours Pas

### 1. Vérifier les Logs Backend

```powershell
docker compose logs -f backend
```

Chercher des erreurs comme:
- `Database connection failed`
- `Table does not exist`
- `CORS error`

### 2. Vérifier la Connexion Database

```powershell
docker compose logs backend | Select-String "database"
```

### 3. Tester la Connexion PostgreSQL

```powershell
docker exec -it epileptic_postgres psql -U postgres -d epileptic_ai -c "\dt"
```

Vous devriez voir les tables:
- users
- doctors
- patients
- seizures
- medications
- alerts
- clinical_notes

### 4. Vérifier CORS

Dans les logs backend, chercher:
```
CORS: Access-Control-Allow-Origin
```

Si vous voyez des erreurs CORS, vérifier que `BACKEND_CORS_ORIGINS` dans docker-compose.yml inclut votre origine.

### 5. Recréer les Tables (Si nécessaire)

Si les tables n'existent pas:

```powershell
# Se connecter au backend
docker exec -it epileptic_backend sh

# Lancer Python
python

# Créer les tables
from app.core.database import engine, Base
from app.models import user, doctor, patient, seizure, medication, alert, clinical_note
Base.metadata.create_all(bind=engine)
exit()
```

---

## 📋 Checklist de Troubleshooting

- [ ] Backend démarre sans erreur: `docker compose logs backend`
- [ ] Port 8000 est accessible: `curl http://localhost:8000/health`
- [ ] Swagger charge: <http://localhost:8000/docs>
- [ ] PostgreSQL est connecté (voir logs backend)
- [ ] Les tables existent: `docker exec -it epileptic_postgres psql -U postgres -d epileptic_ai -c "\dt"`
- [ ] CORS configuré correctement
- [ ] Compte docteur se crée sans erreur
- [ ] Token JWT est retourné
- [ ] Données apparaissent dans pgAdmin

---

## 🆘 Erreurs Courantes

### Erreur: "Table 'users' does not exist"

**Solution:** Créer les tables

```powershell
docker exec -it epileptic_backend python -c "
from app.core.database import engine, Base
from app.models import user, doctor, patient, seizure, medication, alert, clinical_note
Base.metadata.create_all(bind=engine)
print('Tables créées!')
"
```

### Erreur: "CORS policy blocked"

**Solution:** Ajouter votre origine dans docker-compose.yml

```yaml
- BACKEND_CORS_ORIGINS=["http://localhost", "http://localhost:8000", "http://localhost:3000"]
```

### Erreur: "Unauthorized" (401)

**Solution:**
1. Vérifier que le token est valide
2. Vérifier que vous avez cliqué "Authorize" dans Swagger
3. Vérifier le format: `Bearer TOKEN` (avec espace)

### Erreur: "Email already registered"

**Solution:** Utiliser un autre email ou supprimer l'utilisateur existant

```sql
-- Dans pgAdmin
DELETE FROM doctors WHERE email = 'docteur@test.com';
DELETE FROM users WHERE email = 'docteur@test.com';
```

---

## ✅ Test Complet en une Commande

```powershell
# Script complet de test
.\test-communication.ps1
```

Ce script va:
1. ✅ Vérifier Docker
2. ✅ Tester le backend
3. ✅ Créer un docteur
4. ✅ Se connecter
5. ✅ Créer un patient
6. ✅ Créer une crise
7. ✅ Vérifier les statistiques

---

**Dernière mise à jour:** 30 Décembre 2025
