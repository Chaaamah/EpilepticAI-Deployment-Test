# ✅ Guide de Test Postman - PostgreSQL (Docker)

## 🎯 Configuration confirmée

✅ **PostgreSQL** actif dans Docker
✅ **Patient de test** créé (ID: 1)
✅ **SECRET_KEY** synchronisée entre `.env` et `docker-compose.yml`
✅ **Données biométriques** historiques créées (5 points)

---

## 📋 Informations de connexion

### Patient de test
- **Email**: `patient@test.com`
- **Password**: `password123`
- **Patient ID**: 1
- **Contact d'urgence**: Marie Dupont (+33698765432)

### Serveur
- **URL API**: `http://localhost:8000`
- **Documentation**: `http://localhost:8000/docs`
- **PostgreSQL**: `localhost:5432`
- **PgAdmin**: `http://localhost:5050` (admin@epileptic.ai / admin123)

---

## 🔥 Tests Postman

### 1️⃣ LOGIN

**Method**: POST
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

**Response attendue** ✅:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_type": "patient"
}
```

⚠️ **COPIEZ le `access_token` pour les requêtes suivantes!**

---

### 2️⃣ PRÉDICTION - Valeurs NORMALES

**Method**: POST
**URL**: `http://localhost:8000/api/v1/seizure-detection/predict-simple`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <VOTRE_TOKEN>
```

**Body**:
```json
{
  "heart_rate": 75.0,
  "heart_rate_variability": 50.0,
  "spo2": 98.0,
  "temperature": 36.7
}
```

**Response attendue** ✅:
```json
{
  "status": "ok",
  "prediction_id": X,
  "risk_score": 0.XX,
  "confidence": 0.XX,
  "message": "Données biométriques normales",
  "biometric_saved": true,
  "input_data": { ... }
}
```

---

### 3️⃣ PRÉDICTION - RISQUE ÉLEVÉ (Countdown 30s!)

**Method**: POST
**URL**: `http://localhost:8000/api/v1/seizure-detection/predict-simple`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <VOTRE_TOKEN>
```

**Body**:
```json
{
  "heart_rate": 125.0,
  "heart_rate_variability": 25.0,
  "spo2": 92.0,
  "temperature": 38.2
}
```

**Response attendue** ✅:
```json
{
  "status": "alert_triggered",
  "alert_id": X,
  "prediction_id": X,
  "risk_score": 0.8X,
  "confidence": 0.9X,
  "countdown_seconds": 30,
  "message": "Risque de crise détecté! Veuillez confirmer que vous allez bien.",
  "biometric_saved": true,
  "input_data": { ... }
}
```

🚨 **Le countdown de 30 secondes démarre automatiquement!**

---

### 4️⃣ VÉRIFIER LE COUNTDOWN

**Method**: GET
**URL**: `http://localhost:8000/api/v1/seizure-detection/countdown-status`

**Headers**:
```
Authorization: Bearer <VOTRE_TOKEN>
```

**Response** (countdown actif) ✅:
```json
{
  "has_active_countdown": true,
  "alert_id": X,
  "risk_score": 0.85,
  "countdown_seconds": 30,
  "elapsed_seconds": 12,
  "remaining_seconds": 18,
  "started_at": "2025-12-29T18:30:00Z"
}
```

**Response** (pas de countdown):
```json
{
  "has_active_countdown": false,
  "message": "Aucun countdown actif"
}
```

---

### 5️⃣ CONFIRMER LA SÉCURITÉ (Annuler le countdown)

**Method**: POST
**URL**: `http://localhost:8000/api/v1/seizure-detection/confirm`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <VOTRE_TOKEN>
```

**Body**:
```json
{
  "alert_id": 1,
  "notes": "Je vais bien"
}
```

**Response** ✅:
```json
{
  "status": "confirmed",
  "message": "Merci de confirmer. Les contacts d'urgence ne seront pas notifiés.",
  "alert_id": 1,
  "confirmed_at": "2025-12-29T18:30:15Z"
}
```

**Résultat**:
- ✅ Countdown annulé
- ✅ Aucun SMS envoyé
- ✅ Alerte résolue dans PostgreSQL

---

### 6️⃣ SI VOUS NE CONFIRMEZ PAS (Attendre 30s)

**Action**: NE PAS appeler `/confirm` et attendre 30 secondes

**Résultat automatique**:
1. ⏰ Countdown expire après 30s
2. 📱 **SMS automatique envoyé** à Marie Dupont (+33698765432)
3. 🚨 Alerte marquée `emergency_notified = true` dans PostgreSQL
4. 📝 Logs backend montrent l'envoi SMS

**Message SMS envoyé**:
```
🚨 URGENCE EPILEPSIE

Patient: Test Patient
Alerte: RISQUE DE CRISE DÉTECTÉ
Heure: 29/12/2025 18:30

ACTION IMMÉDIATE:
- Contacter le patient au +33612345678
- Se rendre à son domicile si pas de réponse
- Appeler le 15 (SAMU) si nécessaire

EpilepticAI
```

---

## 🎯 Valeurs de test recommandées

### ✅ NORMALES (pas de risque)
```json
{
  "heart_rate": 70,
  "heart_rate_variability": 55,
  "spo2": 98,
  "temperature": 36.7
}
```

### ⚠️ MODÉRÉ
```json
{
  "heart_rate": 105,
  "heart_rate_variability": 35,
  "spo2": 94,
  "temperature": 37.8
}
```

### 🚨 RISQUE ÉLEVÉ (Countdown!)
```json
{
  "heart_rate": 125,
  "heart_rate_variability": 25,
  "spo2": 92,
  "temperature": 38.2
}
```

### ⚠️🚨 CRITIQUE
```json
{
  "heart_rate": 145,
  "heart_rate_variability": 15,
  "spo2": 88,
  "temperature": 39.0
}
```

---

## 🗄️ Vérifier dans PostgreSQL

### Via PgAdmin

1. Ouvrir `http://localhost:5050`
2. Login: `admin@epileptic.ai` / `admin123`
3. Connecter PostgreSQL:
   - Host: `postgres`
   - Port: `5432`
   - Database: `epileptic_ai`
   - Username: `postgres`
   - Password: `password`

### Requêtes SQL utiles

```sql
-- Voir toutes les prédictions
SELECT * FROM predictions ORDER BY predicted_at DESC;

-- Voir toutes les alertes
SELECT * FROM alerts ORDER BY created_at DESC;

-- Voir les données biométriques
SELECT * FROM biometrics WHERE patient_id = 1 ORDER BY recorded_at DESC;

-- Voir les alertes avec countdown
SELECT id, alert_type, risk_score, user_confirmed,
       emergency_notified, created_at
FROM alerts
WHERE patient_id = 1
ORDER BY created_at DESC;
```

---

## 🔄 Commandes Docker utiles

```bash
# Voir les logs en temps réel
docker logs -f epileptic_backend

# Redémarrer le backend
docker-compose restart backend

# Arrêter tout
docker-compose down

# Démarrer tout
docker-compose up -d

# Nettoyer et redémarrer (⚠️ supprime les données)
docker-compose down -v
docker-compose up -d
```

---

## ✅ Checklist de test

- [ ] Login avec `patient@test.com`
- [ ] Copier le token
- [ ] Test prédiction valeurs normales → Status "ok"
- [ ] Test prédiction risque élevé → Status "alert_triggered"
- [ ] Vérifier countdown status → `has_active_countdown: true`
- [ ] Confirmer sécurité → Countdown annulé
- [ ] Relancer prédiction risque élevé
- [ ] Attendre 30s SANS confirmer → SMS envoyé automatiquement
- [ ] Vérifier dans PostgreSQL que l'alerte est `emergency_notified = true`

---

## 🎉 Tout fonctionne avec PostgreSQL!

✅ **Docker Compose** configuré
✅ **PostgreSQL** comme base de données principale
✅ **Endpoint `/predict-simple`** fonctionnel
✅ **Countdown 30 secondes** implémenté
✅ **SMS Twilio** automatique
✅ **Données persistantes** dans PostgreSQL

**URL Swagger**: `http://localhost:8000/docs`

Bonne chance avec vos tests! 🚀
