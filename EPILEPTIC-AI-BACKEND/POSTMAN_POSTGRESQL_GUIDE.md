# Guide Postman - PostgreSQL (Docker)

## ✅ Configuration PostgreSQL avec Docker

Toutes les données sont maintenant sauvegardées dans **PostgreSQL** via Docker Compose.

### 🐳 Serveurs Docker actifs

```bash
docker ps
```

- **PostgreSQL** (port 5432): Base de données principale
- **Redis** (port 6379): Cache et queues
- **Backend** (port 8000): API FastAPI
- **PgAdmin** (port 5050): Interface d'administration PostgreSQL

---

## 🚀 Accès rapide

### Backend API
- **URL**: `http://localhost:8000`
- **Documentation**: `http://localhost:8000/docs`

### PgAdmin (Interface PostgreSQL)
- **URL**: `http://localhost:5050`
- **Email**: `admin@epileptic.ai`
- **Password**: `admin123`

**Connexion PostgreSQL dans PgAdmin:**
- Host: `postgres`
- Port: `5432`
- Database: `epileptic_ai`
- Username: `postgres`
- Password: `password`

---

## 📋 Compte de test créé dans PostgreSQL

- **Email**: `patient@test.com`
- **Password**: `password123`
- **Patient ID**: `1`
- **Contact d'urgence**: Marie Dupont (+33698765432)
- **Données biométriques**: 5 points historiques créés

---

## 🔐 Étape 1: Login (PostgreSQL)

### Request

**Method**: `POST`
**URL**: `http://localhost:8000/api/v1/auth/login/patient`
**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
    "email": "patient@test.com",
    "password": "password123"
}
```

### Response (200 OK)

```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user_type": "patient"
}
```

**⚠️ IMPORTANT**: Copiez le `access_token` et utilisez-le dans toutes les requêtes suivantes!

---

## 🧪 Étape 2: Test de Prédiction (avec Countdown)

### Request

**Method**: `POST`
**URL**: `http://localhost:8000/api/v1/seizure-detection/predict-simple`
**Headers**:
```
Content-Type: application/json
Authorization: Bearer <VOTRE_ACCESS_TOKEN>
```

### Test 1: Valeurs normales

**Body**:
```json
{
    "heart_rate": 75.0,
    "heart_rate_variability": 50.0,
    "spo2": 98.0,
    "temperature": 36.7
}
```

**Response attendue**:
```json
{
    "status": "ok",
    "prediction_id": 1,
    "risk_score": 0.35,
    "confidence": 0.78,
    "message": "Données biométriques normales",
    "biometric_saved": true,
    "input_data": {
        "heart_rate": 75.0,
        "heart_rate_variability": 50.0,
        "spo2": 98.0,
        "temperature": 36.7
    }
}
```

### Test 2: RISQUE ÉLEVÉ (déclenche countdown 30s)

**Body**:
```json
{
    "heart_rate": 125.0,
    "heart_rate_variability": 25.0,
    "spo2": 92.0,
    "temperature": 38.2
}
```

**Response attendue**:
```json
{
    "status": "alert_triggered",
    "alert_id": 1,
    "prediction_id": 2,
    "risk_score": 0.85,
    "confidence": 0.92,
    "countdown_seconds": 30,
    "message": "Risque de crise détecté! Veuillez confirmer que vous allez bien.",
    "biometric_saved": true,
    "input_data": {
        "heart_rate": 125.0,
        "heart_rate_variability": 25.0,
        "spo2": 92.0,
        "temperature": 38.2
    }
}
```

**🚨 Le countdown démarre automatiquement! Vous avez 30 secondes pour confirmer.**

---

## ⏱️ Étape 3: Vérifier le countdown

**Method**: `GET`
**URL**: `http://localhost:8000/api/v1/seizure-detection/countdown-status`
**Headers**:
```
Authorization: Bearer <TOKEN>
```

**Response**:
```json
{
    "has_active_countdown": true,
    "alert_id": 1,
    "risk_score": 0.85,
    "countdown_seconds": 30,
    "elapsed_seconds": 12,
    "remaining_seconds": 18,
    "started_at": "2025-12-29T18:30:00Z"
}
```

---

## ✅ Étape 4: Confirmer la sécurité

**Method**: `POST`
**URL**: `http://localhost:8000/api/v1/seizure-detection/confirm`
**Headers**:
```
Content-Type: application/json
Authorization: Bearer <TOKEN>
```

**Body**:
```json
{
    "alert_id": 1,
    "notes": "Je vais bien"
}
```

**Response**:
```json
{
    "status": "confirmed",
    "message": "Merci de confirmer. Les contacts d'urgence ne seront pas notifiés.",
    "alert_id": 1,
    "confirmed_at": "2025-12-29T18:30:15Z"
}
```

---

## 📱 Si vous ne confirmez PAS (30 secondes)

**Résultat automatique**:
1. ⏰ Countdown expire
2. 📱 **SMS envoyé automatiquement** à Marie Dupont
3. 🚨 Alerte enregistrée dans PostgreSQL avec `emergency_notified = true`

---

## 🗄️ Vérifier les données dans PostgreSQL

### Via PgAdmin (Interface graphique)

1. Ouvrir `http://localhost:5050`
2. Login: `admin@epileptic.ai` / `admin123`
3. Connecter au serveur PostgreSQL:
   - Host: `postgres`
   - Database: `epileptic_ai`
   - User: `postgres`
   - Password: `password`

### Tables à consulter

```sql
-- Voir les patients
SELECT * FROM patients;

-- Voir les données biométriques
SELECT * FROM biometrics WHERE patient_id = 1 ORDER BY recorded_at DESC;

-- Voir les prédictions
SELECT * FROM predictions WHERE patient_id = 1 ORDER BY predicted_at DESC;

-- Voir les alertes
SELECT * FROM alerts WHERE patient_id = 1 ORDER BY created_at DESC;

-- Voir les utilisateurs
SELECT * FROM users;
```

### Via Docker CLI

```bash
# Accéder à psql
docker exec -it epileptic_postgres psql -U postgres -d epileptic_ai

# Lister les tables
\dt

# Voir les patients
SELECT id, email, full_name, phone FROM patients;

# Quitter
\q
```

---

## 🔄 Redémarrer les services Docker

```bash
# Arrêter tous les services
docker-compose down

# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f backend

# Redémarrer uniquement le backend
docker-compose restart backend
```

---

## 🧹 Nettoyer et recréer la base de données

```bash
# Arrêter et supprimer les volumes
docker-compose down -v

# Redémarrer (va recréer la base vide)
docker-compose up -d

# Recréer le patient de test
docker exec epileptic_backend python -c "
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.core.security import get_password_hash

db = SessionLocal()
user = User(
    email='patient@test.com',
    full_name='Test Patient',
    role=UserRole.PATIENT,
    hashed_password=get_password_hash('password123'),
    is_active=True,
    is_verified=True
)
db.add(user)

patient = Patient(
    email='patient@test.com',
    full_name='Test Patient',
    phone='+33612345678',
    hashed_password=get_password_hash('password123'),
    is_active=True,
    emergency_contacts=[{'name': 'Marie Dupont', 'relationship': 'Mère', 'phone': '+33698765432', 'priority': 1, 'notification_method': 'sms'}]
)
db.add(patient)
db.commit()
print('Patient created')
"
```

---

## 📊 Valeurs de test recommandées

### Normales (OK)
```json
{
  "heart_rate": 70-85,
  "heart_rate_variability": 45-60,
  "spo2": 96-100,
  "temperature": 36.5-37.0
}
```

### Risque MODÉRÉ
```json
{
  "heart_rate": 95-110,
  "heart_rate_variability": 30-40,
  "spo2": 93-95,
  "temperature": 37.5-38.0
}
```

### Risque ÉLEVÉ (Countdown!)
```json
{
  "heart_rate": 115-130,
  "heart_rate_variability": 20-30,
  "spo2": 90-93,
  "temperature": 38.0-38.5
}
```

### Risque CRITIQUE
```json
{
  "heart_rate": 135-150,
  "heart_rate_variability": 10-20,
  "spo2": 85-90,
  "temperature": 38.5-39.5
}
```

---

## ✅ Collection Postman

Créez une collection Postman avec ces variables d'environnement:

```
BASE_URL: http://localhost:8000
TOKEN: <votre_token_après_login>
```

Ensuite créez ces requêtes:

1. **Login** → Sauvegardez automatiquement le token dans `{{TOKEN}}`
2. **Predict Normal** → Test avec valeurs normales
3. **Predict HIGH RISK** → Déclenche le countdown
4. **Check Countdown** → Vérifier le statut
5. **Confirm Safety** → Annuler le countdown

---

## 🎯 Résumé

✅ **PostgreSQL** configuré et fonctionnel via Docker
✅ **Patient de test** créé avec historique biométrique
✅ **Endpoint `/predict-simple`** prêt pour Postman
✅ **Countdown 30 secondes** fonctionnel
✅ **SMS automatique** si pas de confirmation (via Twilio)
✅ **Données persistantes** dans PostgreSQL

**URL du serveur**: `http://localhost:8000`
**Documentation API**: `http://localhost:8000/docs`

Bonne chance avec vos tests! 🚀
