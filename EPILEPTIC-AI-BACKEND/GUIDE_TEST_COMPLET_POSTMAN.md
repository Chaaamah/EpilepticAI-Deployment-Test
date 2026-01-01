# 🧪 Guide de Test Complet Backend avec Postman/Insomnia

Ce guide vous permet de tester **TOUTE la logique backend** avant de passer au frontend.

---

## 📋 Table des Matières

1. [Configuration Initiale](#1-configuration-initiale)
2. [Test Authentification](#2-test-authentification)
3. [Test Contacts d'Urgence](#3-test-contacts-durgence)
4. [Test Données Biométriques et Prédictions](#4-test-données-biométriques-et-prédictions)
5. [Test Flow Countdown Complet](#5-test-flow-countdown-complet)
6. [Vérification PostgreSQL](#6-vérification-postgresql)

---

## 1. Configuration Initiale

### ✅ Vérifications Préalables

```bash
# 1. Vérifier que Docker tourne
docker ps

# Vous devez voir: epileptic_backend, epileptic_postgres, epileptic_worker, epileptic_redis

# 2. Vérifier qu'aucun serveur local ne tourne
netstat -ano | findstr :8000

# Il ne doit y avoir QUE Docker (pas de processus Python local)

# 3. Si des processus locaux existent, les tuer
taskkill //F //PID <PID>
```

### 🔧 Configuration Postman/Insomnia

**URL de base**: `http://localhost:8000`

**Headers communs** (pour toutes les requêtes sauf login/register):
- `Content-Type`: `application/json`
- `Authorization`: `Bearer <TOKEN>` (après login)

---

## 2. Test Authentification

### 2.1 - Register Doctor ✅

**Requête**:
```http
POST http://localhost:8000/api/v1/auth/register/doctor
Content-Type: application/json

{
  "email": "doctor1@test.com",
  "full_name": "Dr. Jean Dupont",
  "phone": "0612345678",
  "specialization": "Neurologie",
  "hospital": "CHU de Paris",
  "license_number": "DR123456",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!"
}
```

**Réponse attendue** (200 OK):
```json
{
  "id": 1,
  "email": "doctor1@test.com",
  "full_name": "Dr. Jean Dupont",
  "phone": "0612345678",
  "specialization": "Neurologie",
  "hospital": "CHU de Paris",
  "license_number": "DR123456",
  "is_active": true,
  "created_at": "2025-12-29T19:00:00Z"
}
```

✅ **Vérification PostgreSQL**:
```sql
SELECT * FROM doctors ORDER BY created_at DESC LIMIT 1;
SELECT * FROM users WHERE email = 'doctor1@test.com';
```

---

### 2.2 - Login Doctor ✅

**Requête**:
```http
POST http://localhost:8000/api/v1/auth/login/doctor
Content-Type: application/json

{
  "email": "doctor1@test.com",
  "password": "SecurePass123!"
}
```

**Réponse attendue** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_type": "doctor"
}
```

📋 **IMPORTANT**: Copiez le `access_token` - vous en aurez besoin pour toutes les requêtes suivantes!

---

### 2.3 - Login Patient ✅

**Patient de test déjà créé**:
- Email: `patient@test.com`
- Password: `password123`

**Requête**:
```http
POST http://localhost:8000/api/v1/auth/login/patient
Content-Type: application/json

{
  "email": "patient@test.com",
  "password": "password123"
}
```

**Réponse attendue** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_type": "patient"
}
```

📋 **Copiez ce token** - utilisez-le pour les tests patients!

---

### 2.4 - Get Current User Info ✅

**Requête**:
```http
GET http://localhost:8000/api/v1/auth/me
Authorization: Bearer <PATIENT_TOKEN>
```

**Réponse attendue** (200 OK):
```json
{
  "id": 1,
  "email": "patient@test.com",
  "full_name": "Test Patient",
  "phone": "+33612345678",
  "is_active": true,
  "emergency_contacts": [],
  "notification_preferences": {
    "email": true,
    "sms": true,
    "push": true
  }
}
```

---

## 3. Test Contacts d'Urgence

**⚠️ Utilisez le TOKEN PATIENT pour toutes ces requêtes**

### 3.1 - Donner Permission Accès Contacts ✅

**Requête**:
```http
POST http://localhost:8000/api/v1/contacts/permissions
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "permission_granted": true,
  "platform": "ios"
}
```

**Réponse attendue** (200 OK):
```json
{
  "message": "Contacts permission updated successfully",
  "permission_granted": true,
  "platform": "ios"
}
```

✅ **Vérification PostgreSQL**:
```sql
SELECT id, email, notification_preferences
FROM patients
WHERE email = 'patient@test.com';
```

Vous devriez voir:
```json
{
  "email": true,
  "sms": true,
  "push": true,
  "contacts_permission_granted": true,
  "contacts_permission_platform": "ios"
}
```

---

### 3.2 - Vérifier Permission ✅

**Requête**:
```http
GET http://localhost:8000/api/v1/contacts/permissions
Authorization: Bearer <PATIENT_TOKEN>
```

**Réponse attendue** (200 OK):
```json
{
  "permission_granted": true,
  "platform": "ios"
}
```

---

### 3.3 - Ajouter Contact d'Urgence #1 ✅

**Requête**:
```http
POST http://localhost:8000/api/v1/contacts/
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "name": "Marie Dupont",
  "relationship": "Mère",
  "phone": "+33698765432",
  "email": "marie@test.com",
  "priority": 1,
  "notification_method": "sms+call"
}
```

**Réponse attendue** (200 OK):
```json
{
  "message": "Emergency contact added successfully",
  "contact": {
    "name": "Marie Dupont",
    "relationship": "Mère",
    "phone": "+33698765432",
    "email": "marie@test.com",
    "priority": 1,
    "notification_method": "sms+call"
  },
  "total_contacts": 1
}
```

---

### 3.4 - Ajouter Contact d'Urgence #2 ✅

**Requête**:
```http
POST http://localhost:8000/api/v1/contacts/
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "name": "Pierre Dupont",
  "relationship": "Père",
  "phone": "+33687654321",
  "email": "pierre@test.com",
  "priority": 2,
  "notification_method": "sms"
}
```

---

### 3.5 - Liste des Contacts ✅

**Requête**:
```http
GET http://localhost:8000/api/v1/contacts/
Authorization: Bearer <PATIENT_TOKEN>
```

**Réponse attendue** (200 OK):
```json
[
  {
    "name": "Marie Dupont",
    "relationship": "Mère",
    "phone": "+33698765432",
    "email": "marie@test.com",
    "priority": 1,
    "notification_method": "sms+call"
  },
  {
    "name": "Pierre Dupont",
    "relationship": "Père",
    "phone": "+33687654321",
    "email": "pierre@test.com",
    "priority": 2,
    "notification_method": "sms"
  }
]
```

✅ **Vérification PostgreSQL**:
```sql
SELECT id, email, emergency_contacts
FROM patients
WHERE email = 'patient@test.com';
```

---

### 3.6 - Modifier un Contact ✅

**Requête**:
```http
PUT http://localhost:8000/api/v1/contacts/%2B33698765432
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "priority": 1,
  "notification_method": "call"
}
```

> ⚠️ **Note**: Le numéro de téléphone dans l'URL doit être encodé (`+` devient `%2B`)

**Réponse attendue** (200 OK):
```json
{
  "message": "Emergency contact updated successfully",
  "contact": {
    "name": "Marie Dupont",
    "relationship": "Mère",
    "phone": "+33698765432",
    "email": "marie@test.com",
    "priority": 1,
    "notification_method": "call"
  }
}
```

---

### 3.7 - Supprimer un Contact ✅

**Requête**:
```http
DELETE http://localhost:8000/api/v1/contacts/%2B33687654321
Authorization: Bearer <PATIENT_TOKEN>
```

**Réponse attendue** (200 OK):
```json
{
  "message": "Emergency contact deleted successfully",
  "remaining_contacts": 1
}
```

---

## 4. Test Données Biométriques et Prédictions

**⚠️ Utilisez le TOKEN PATIENT**

### 4.1 - Première Prédiction (Données Normales) ✅

**Requête**:
```http
POST http://localhost:8000/api/v1/seizure-detection/predict-simple
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "heart_rate": 75.0,
  "heart_rate_variability": 50.0,
  "spo2": 98.0,
  "temperature": 36.7
}
```

**Réponse attendue** (200 OK):
```json
{
  "status": "insufficient_data",
  "message": "Insufficient biometric data for prediction. Found 1 records, minimum 3 required (15 min).",
  "biometric_saved": true,
  "input_data": {
    "heart_rate": 75.0,
    "heart_rate_variability": 50.0,
    "spo2": 98.0,
    "temperature": 36.7
  }
}
```

✅ **C'est NORMAL!** La donnée est sauvegardée, mais il faut 3+ enregistrements pour prédiction.

✅ **Vérification PostgreSQL**:
```sql
SELECT id, patient_id, heart_rate, heart_rate_variability, recorded_at
FROM biometrics
WHERE patient_id = 1
ORDER BY recorded_at DESC
LIMIT 5;
```

---

### 4.2 - Deuxième Prédiction ✅

**Requête**:
```http
POST http://localhost:8000/api/v1/seizure-detection/predict-simple
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "heart_rate": 78.0,
  "heart_rate_variability": 52.0,
  "spo2": 97.0,
  "temperature": 36.8
}
```

**Réponse attendue** (200 OK):
```json
{
  "status": "insufficient_data",
  "message": "Insufficient biometric data for prediction. Found 2 records, minimum 3 required (15 min).",
  "biometric_saved": true
}
```

---

### 4.3 - Troisième Prédiction - RISQUE NORMAL ✅

**Requête**:
```http
POST http://localhost:8000/api/v1/seizure-detection/predict-simple
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "heart_rate": 82.0,
  "heart_rate_variability": 48.0,
  "spo2": 98.0,
  "temperature": 36.9
}
```

**Réponse attendue** (200 OK):
```json
{
  "status": "ok",
  "prediction_id": 1,
  "risk_score": 0.0012,
  "confidence": 0.995,
  "message": "Données biométriques normales",
  "biometric_saved": true,
  "input_data": { ... }
}
```

✅ **Vérification PostgreSQL**:
```sql
-- Voir les prédictions
SELECT id, patient_id, risk_score, confidence, predicted_at
FROM predictions
WHERE patient_id = 1
ORDER BY predicted_at DESC;

-- Voir les biométrics
SELECT COUNT(*) FROM biometrics WHERE patient_id = 1;
-- Devrait retourner au moins 3
```

---

## 5. Test Flow Countdown Complet

**Objectif**: Déclencher une alerte de risque élevé, tester le countdown 30 secondes et l'envoi de SMS.

### 5.1 - Préparer 3 Enregistrements avec Risque Progressif

**Requête 1** (Valeurs légèrement élevées):
```http
POST http://localhost:8000/api/v1/seizure-detection/predict-simple
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "heart_rate": 95.0,
  "heart_rate_variability": 40.0,
  "spo2": 95.0,
  "temperature": 37.2
}
```

**Attendez 5 secondes**, puis:

**Requête 2** (Valeurs plus élevées):
```http
POST http://localhost:8000/api/v1/seizure-detection/predict-simple
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "heart_rate": 110.0,
  "heart_rate_variability": 32.0,
  "spo2": 93.0,
  "temperature": 37.8
}
```

**Attendez 5 secondes**, puis:

**Requête 3** (Valeurs TRÈS élevées - risque critique):
```http
POST http://localhost:8000/api/v1/seizure-detection/predict-simple
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "heart_rate": 130.0,
  "heart_rate_variability": 22.0,
  "spo2": 91.0,
  "temperature": 38.5
}
```

**Réponse attendue** (si le modèle détecte un risque élevé):
```json
{
  "status": "alert_triggered",
  "alert_id": 1,
  "prediction_id": 4,
  "risk_score": 0.85,
  "confidence": 0.92,
  "countdown_seconds": 30,
  "message": "Risque de crise détecté! Veuillez confirmer que vous allez bien.",
  "biometric_saved": true,
  "input_data": { ... }
}
```

> ⚠️ **Note**: Le modèle AI peut ne PAS déclencher l'alerte selon les patterns détectés. Si `risk_score < 0.7`, vous verrez `"status": "ok"` au lieu de `"alert_triggered"`.

---

### 5.2 - Vérifier le Countdown ✅

**Requête** (à faire IMMÉDIATEMENT après l'alerte):
```http
GET http://localhost:8000/api/v1/seizure-detection/countdown-status
Authorization: Bearer <PATIENT_TOKEN>
```

**Réponse attendue** (200 OK):
```json
{
  "has_active_countdown": true,
  "alert_id": 1,
  "risk_score": 0.85,
  "countdown_seconds": 30,
  "elapsed_seconds": 5,
  "remaining_seconds": 25,
  "started_at": "2025-12-29T19:05:00Z"
}
```

---

### 5.3 - Confirmer la Sécurité (Annuler SMS) ✅

**Option A**: Le patient confirme qu'il va bien (AVANT les 30 secondes):

**Requête**:
```http
POST http://localhost:8000/api/v1/seizure-detection/confirm
Content-Type: application/json
Authorization: Bearer <PATIENT_TOKEN>

{
  "alert_id": 1,
  "notes": "Je vais bien, c'était juste du sport"
}
```

**Réponse attendue** (200 OK):
```json
{
  "status": "confirmed",
  "message": "Merci de confirmer. Les contacts d'urgence ne seront pas notifiés.",
  "alert_id": 1,
  "confirmed_at": "2025-12-29T19:05:15Z"
}
```

✅ **Effet**: Le countdown est annulé, **AUCUN SMS** ne sera envoyé.

✅ **Vérification PostgreSQL**:
```sql
SELECT id, patient_id, alert_type, risk_score,
       user_confirmed, user_confirmed_at,
       emergency_notified, is_active
FROM alerts
WHERE id = 1;
```

Devrait montrer:
- `user_confirmed = true`
- `emergency_notified = false`
- `is_active = false`

---

### 5.4 - OU Attendre le Timeout (Envoi Auto SMS) ⏱️

**Option B**: Ne PAS confirmer et attendre 30 secondes

**Effet après 30 secondes**:
1. ✅ SMS envoyé automatiquement au contact prioritaire (Marie Dupont: +33698765432)
2. ✅ Alerte mise à jour dans la base

✅ **Vérification PostgreSQL** (après 30 secondes):
```sql
SELECT id, patient_id, alert_type, risk_score,
       user_confirmed, emergency_notified,
       emergency_notified_at, notifications_sent
FROM alerts
WHERE id = 1;
```

Devrait montrer:
- `user_confirmed = false`
- `emergency_notified = true`
- `notifications_sent` contient les détails du SMS Twilio

**Vérifier les logs Docker**:
```bash
docker logs epileptic_backend --tail 50
```

Vous verrez:
```
⚠️ NO RESPONSE from patient 1 after 30s! Triggering emergency notifications...
Emergency notifications sent for patient 1: 1 SMS, 0 calls
```

---

## 6. Vérification PostgreSQL

### Via PgAdmin (http://localhost:5050)

**Login**: `admin@epileptic.ai` / `admin123`

**Connexion PostgreSQL**:
- Host: `postgres`
- Port: `5432`
- Database: `epileptic_ai`
- Username: `postgres`
- Password: `password`

### Requêtes SQL de Vérification

```sql
-- 1. Vérifier les patients
SELECT id, email, full_name,
       jsonb_array_length(emergency_contacts) as nb_contacts,
       notification_preferences->>'contacts_permission_granted' as permission
FROM patients;

-- 2. Vérifier les contacts d'urgence
SELECT id, email, emergency_contacts
FROM patients
WHERE email = 'patient@test.com';

-- 3. Vérifier les données biométriques
SELECT id, patient_id, heart_rate, heart_rate_variability,
       stress_level, movement_intensity, source, recorded_at
FROM biometrics
WHERE patient_id = 1
ORDER BY recorded_at DESC
LIMIT 10;

-- 4. Vérifier les prédictions
SELECT id, patient_id, risk_score, confidence,
       model_version, predicted_at
FROM predictions
WHERE patient_id = 1
ORDER BY predicted_at DESC;

-- 5. Vérifier les alertes
SELECT id, patient_id, alert_type, severity, risk_score,
       requires_user_confirmation, user_confirmed, user_confirmed_at,
       emergency_notified, emergency_notified_at,
       is_active, created_at
FROM alerts
WHERE patient_id = 1
ORDER BY created_at DESC;

-- 6. Statistiques globales
SELECT
    (SELECT COUNT(*) FROM patients) as total_patients,
    (SELECT COUNT(*) FROM doctors) as total_doctors,
    (SELECT COUNT(*) FROM biometrics) as total_biometrics,
    (SELECT COUNT(*) FROM predictions) as total_predictions,
    (SELECT COUNT(*) FROM alerts) as total_alerts;
```

---

## 📊 Checklist Complète de Test

### Authentification
- [ ] ✅ Register Doctor → 200 OK + données dans PostgreSQL
- [ ] ✅ Login Doctor → 200 OK + token JWT valide
- [ ] ✅ Login Patient → 200 OK + token JWT valide
- [ ] ✅ Get User Info → 200 OK + données correctes

### Contacts d'Urgence
- [ ] ✅ POST /permissions → 200 OK + `notification_preferences` mise à jour
- [ ] ✅ GET /permissions → Retourne `permission_granted: true`
- [ ] ✅ POST / (ajouter contact #1) → 200 OK + contact dans `emergency_contacts`
- [ ] ✅ POST / (ajouter contact #2) → 200 OK
- [ ] ✅ GET / → Retourne liste de 2 contacts
- [ ] ✅ PUT /{phone} → 200 OK + modifications sauvegardées
- [ ] ✅ DELETE /{phone} → 200 OK + contact supprimé

### Biométrie & Prédictions
- [ ] ✅ POST /predict-simple #1 → `insufficient_data` + `biometric_saved: true`
- [ ] ✅ POST /predict-simple #2 → `insufficient_data` (2 records)
- [ ] ✅ POST /predict-simple #3 → `status: ok` + `prediction_id` + `risk_score`
- [ ] ✅ Vérifier biometrics table → Au moins 3 enregistrements
- [ ] ✅ Vérifier predictions table → Au moins 1 prédiction

### Flow Countdown
- [ ] ✅ 3 requêtes progressives → Déclencher `alert_triggered`
- [ ] ✅ GET /countdown-status → Retourne countdown actif
- [ ] ✅ POST /confirm → Annule countdown + `user_confirmed: true`
- [ ] ✅ OU Attendre 30s → SMS envoyé + `emergency_notified: true`
- [ ] ✅ Vérifier alerts table → Alerte avec bons statuts

### PostgreSQL
- [ ] ✅ Toutes les données sont dans PostgreSQL (pas SQLite)
- [ ] ✅ Les colonnes JSON (emergency_contacts, notification_preferences) se mettent à jour
- [ ] ✅ Les relations (biometrics → patient, predictions → patient) fonctionnent

---

## 🚨 Résolution de Problèmes

### Erreur 401 "Could not validate credentials"
- ❌ Token expiré → Refaire un login
- ❌ Mauvais format header → Vérifier `Bearer <TOKEN>` (avec espace)
- ❌ Token copié incorrectement → Recopier depuis la réponse login

### Erreur 500 "Internal Server Error"
- Vérifier les logs Docker: `docker logs epileptic_backend --tail 50`
- Vérifier que PostgreSQL est actif: `docker ps`

### Données pas sauvegardées
- ❌ Vérifier que vous êtes sur PostgreSQL (pas SQLite local)
- ❌ Rafraîchir la vue PgAdmin (F5)
- ❌ Re-exécuter la requête SQL

### Countdown ne déclenche pas
- Le modèle AI doit détecter un **pattern de risque** (pas juste des seuils)
- Essayer avec des valeurs encore plus extrêmes
- Vérifier dans predictions table que `risk_score > 0.7`

---

## ✅ Succès Final

Quand **TOUS les tests** passent:

1. ✅ Authentification fonctionne (login/register)
2. ✅ Permissions contacts enregistrées
3. ✅ Contacts d'urgence CRUD complet
4. ✅ Données biométriques sauvegardées
5. ✅ Prédictions AI fonctionnent
6. ✅ Countdown déclenché sur risque élevé
7. ✅ Confirmation patient annule SMS
8. ✅ Timeout envoie SMS automatique
9. ✅ **Toutes les données dans PostgreSQL**

**🎉 Votre backend est prêt pour le frontend!**

---

## 🔗 Export Collection Insomnia/Postman

Vous pouvez créer une collection avec tous ces endpoints et l'exporter pour réutilisation.

**Variables d'environnement recommandées**:
```json
{
  "base_url": "http://localhost:8000",
  "patient_token": "",
  "doctor_token": "",
  "alert_id": ""
}
```

Utilisez `{{base_url}}`, `{{patient_token}}` dans vos requêtes pour faciliter les tests.
