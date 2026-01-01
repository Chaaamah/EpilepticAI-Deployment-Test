# 🎯 Guide TEST Complet - Backend Ready!

## ✅ VOTRE BACKEND FONCTIONNE PARFAITEMENT

Toutes les fonctionnalités sont opérationnelles avec PostgreSQL. Voici comment tout tester avec Insomnia/Postman:

---

## 1️⃣ Authentication ✅

### Login Patient
```http
POST http://localhost:8000/api/v1/auth/login/patient

{
  "email": "patient@test.com",
  "password": "password123"
}
```

**✅ Copiez le `access_token`** → Utilisez-le dans **Authorization: Bearer <TOKEN>**

---

## 2️⃣ Permissions Contacts ✅

```http
POST http://localhost:8000/api/v1/contacts/permissions
Authorization: Bearer <TOKEN>

{
  "permission_granted": true,
  "platform": "ios"
}
```

**Résultat**: Données sauvegardées dans PostgreSQL! ✅

---

## 3️⃣ Ajouter Contact d'Urgence ✅

```http
POST http://localhost:8000/api/v1/contacts/
Authorization: Bearer <TOKEN>

{
  "name": "Marie Dupont",
  "relationship": "Mère",
  "phone": "+33698765432",
  "email": "marie@test.com",
  "priority": 1,
  "notification_method": "sms+call"
}
```

**Résultat**: Contact dans PostgreSQL! ✅

---

## 4️⃣ Prédictions (Envoyez 3 requêtes) ✅

**Requête 1**:
```json
{
  "heart_rate": 75.0,
  "heart_rate_variability": 50.0,
  "spo2": 98.0,
  "temperature": 36.7
}
```

**Requête 2**:
```json
{
  "heart_rate": 78.0,
  "heart_rate_variability": 52.0,
  "spo2": 97.0,
  "temperature": 36.8
}
```

**Requête 3** (Active la prédiction):
```json
{
  "heart_rate": 82.0,
  "heart_rate_variability": 48.0,
  "spo2": 98.0,
  "temperature": 36.9
}
```

**Endpoint**: `POST http://localhost:8000/api/v1/seizure-detection/predict-simple`

**Résultat Requête 3**:
```json
{
  "status": "ok",
  "prediction_id": 1,
  "risk_score": 0.0012,
  "confidence": 0.995,
  "message": "Données biométriques normales",
  "biometric_saved": true
}
```

**Vérification PostgreSQL**:
```sql
SELECT COUNT(*) FROM biometrics WHERE patient_id = 1;  -- Minimum 3
SELECT * FROM predictions ORDER BY predicted_at DESC LIMIT 3;
```

---

## 📊 Vérifier dans PostgreSQL (PgAdmin)

URL: `http://localhost:5050`
- Login: `admin@epileptic.ai` / `admin123`
- Serveur: `postgres` / `password` / DB: `epileptic_ai`

```sql
-- Voir tout
SELECT * FROM patients WHERE email = 'patient@test.com';
SELECT * FROM biometrics WHERE patient_id = 1 ORDER BY recorded_at DESC;
SELECT * FROM predictions WHERE patient_id = 1 ORDER BY predicted_at DESC;
```

---

## ✅ TODO List

- [x] Login fonctionne
- [x] Permissions contacts sauvegardées
- [x] Contacts d'urgence CRUD complet
- [x] Données biométriques dans PostgreSQL
- [x] Prédictions AI actives
- [x] Countdown système (ready)
- [x] **TOUT dans PostgreSQL** (pas SQLite!)

---

## 🎉 Prêt pour le Frontend!

Votre backend est **100% fonctionnel**. Passez au développement frontend!

**Collection Insomnia**: `Insomnia_Collection_EpilepticAI.json` (import ready)

**Guide complet**: `GUIDE_TEST_COMPLET_POSTMAN.md`
