# 🔧 Guide de Débogage Postman - Solutions aux Problèmes Courants

## ⚠️ Problème: "Rien ne se stocke dans PostgreSQL mais répond 200"

### Diagnostic

Il y a **3 situations possibles**:

#### 1️⃣ **Erreur 401 Unauthorized**
Si vous obtenez cette erreur, c'est un problème d'authentification.

**Solution**: Vérifiez le format de votre header Authorization dans Postman

#### 2️⃣ **200 OK mais "insufficient_data"**
Si vous voyez ce message, **les données SONT sauvegardées** mais il n'y a pas assez de données pour faire une prédiction.

**Réponse type**:
```json
{
    "status": "insufficient_data",
    "message": "Insufficient biometric data for prediction. Found 1 records, minimum 3 required (15 min).",
    "biometric_saved": true
}
```

**✅ Ce n'est PAS une erreur!** La donnée est bien dans PostgreSQL, mais le modèle AI a besoin de **minimum 3 enregistrements** dans une fenêtre de 15 minutes pour faire une prédiction.

#### 3️⃣ **200 OK avec prédiction normale**
Le modèle a analysé vos données et déterminé qu'il n'y a pas de risque élevé.

---

## ✅ SOLUTION 1: Corriger l'Authentification (Erreur 401)

### Dans Postman

**Option A: Utiliser l'onglet "Authorization"** (Recommandé)
1. Dans votre requête Postman, allez à l'onglet **Authorization**
2. Type: Sélectionnez **Bearer Token**
3. Token: Collez SEULEMENT le contenu de `access_token` (sans "Bearer")

**Option B: Header manuel**
1. Allez à l'onglet **Headers**
2. Ajoutez un header:
   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (avec "Bearer " devant)

### ⚠️ Erreurs courantes

❌ **INCORRECT**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
(Manque "Bearer ")

❌ **INCORRECT**:
```
Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
(Ne pas mettre de guillemets autour du token)

✅ **CORRECT**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ SOLUTION 2: Envoyer 3+ Requêtes pour Activer la Prédiction

Le modèle AI nécessite **au moins 3 points de données** dans une fenêtre de 15 minutes.

### Test Complet dans Postman

#### Étape 1: Login
```http
POST http://localhost:8000/api/v1/auth/login/patient
Content-Type: application/json

{
  "email": "patient@test.com",
  "password": "password123"
}
```

**Copiez le `access_token` de la réponse!**

---

#### Étape 2: Première Prédiction (Normale)
```http
POST http://localhost:8000/api/v1/seizure-detection/predict-simple
Content-Type: application/json
Authorization: Bearer <VOTRE_TOKEN>

{
  "heart_rate": 75.0,
  "heart_rate_variability": 50.0,
  "spo2": 98.0,
  "temperature": 36.7
}
```

**Réponse attendue**:
```json
{
  "status": "insufficient_data",
  "message": "Insufficient biometric data for prediction. Found 1 records, minimum 3 required (15 min).",
  "biometric_saved": true,
  "input_data": { ... }
}
```

✅ **C'est normal!** La donnée est sauvegardée dans PostgreSQL.

---

#### Étape 3: Deuxième Prédiction
```http
POST http://localhost:8000/api/v1/seizure-detection/predict-simple
Content-Type: application/json
Authorization: Bearer <VOTRE_TOKEN>

{
  "heart_rate": 78.0,
  "heart_rate_variability": 52.0,
  "spo2": 97.0,
  "temperature": 36.8
}
```

**Réponse attendue**:
```json
{
  "status": "insufficient_data",
  "message": "Insufficient biometric data for prediction. Found 2 records, minimum 3 required (15 min).",
  "biometric_saved": true
}
```

✅ Encore 1 record nécessaire!

---

#### Étape 4: Troisième Prédiction - RISQUE ÉLEVÉ 🚨
```http
POST http://localhost:8000/api/v1/seizure-detection/predict-simple
Content-Type: application/json
Authorization: Bearer <VOTRE_TOKEN>

{
  "heart_rate": 125.0,
  "heart_rate_variability": 25.0,
  "spo2": 92.0,
  "temperature": 38.2
}
```

**Réponse attendue** (si le modèle détecte un risque):
```json
{
  "status": "alert_triggered",
  "alert_id": 1,
  "prediction_id": 1,
  "risk_score": 0.85,
  "confidence": 0.92,
  "countdown_seconds": 30,
  "message": "Risque de crise détecté! Veuillez confirmer que vous allez bien.",
  "biometric_saved": true,
  "input_data": { ... }
}
```

**OU** (si le modèle ne détecte pas de risque):
```json
{
  "status": "ok",
  "prediction_id": 1,
  "risk_score": 0.0015,
  "confidence": 0.998,
  "message": "Données biométriques normales",
  "biometric_saved": true
}
```

> ⚠️ **Note**: Le modèle AI peut donner un faible score de risque même avec des valeurs élevées, car il analyse des **patterns complexes** et pas seulement des seuils simples.

---

## 🔍 Comment Vérifier que les Données sont Sauvegardées

### Option 1: Via PgAdmin (Interface Graphique)

1. Ouvrir `http://localhost:5050`
2. Login: `admin@epileptic.ai` / `admin123`
3. Connecter au serveur PostgreSQL:
   - Host: `postgres`
   - Port: `5432`
   - Database: `epileptic_ai`
   - Username: `postgres`
   - Password: `password`

4. Exécuter ces requêtes SQL:

```sql
-- Voir les données biométriques (doivent être présentes!)
SELECT id, patient_id, heart_rate, heart_rate_variability,
       stress_level, movement_intensity, source, recorded_at
FROM biometrics
WHERE patient_id = 1
ORDER BY recorded_at DESC
LIMIT 10;

-- Voir les prédictions (seulement si >= 3 records biométriques)
SELECT id, patient_id, risk_score, confidence, predicted_at
FROM predictions
WHERE patient_id = 1
ORDER BY predicted_at DESC;

-- Voir les alertes (seulement si risque élevé détecté)
SELECT id, patient_id, alert_type, severity, risk_score,
       requires_user_confirmation, user_confirmed,
       emergency_notified, created_at
FROM alerts
WHERE patient_id = 1
ORDER BY created_at DESC;
```

### Option 2: Via Docker CLI

```bash
# Vérifier les données biométriques
docker exec epileptic_postgres psql -U postgres -d epileptic_ai \
  -c "SELECT id, heart_rate, heart_rate_variability, source, recorded_at FROM biometrics WHERE patient_id = 1 ORDER BY recorded_at DESC LIMIT 5;"

# Vérifier les prédictions
docker exec epileptic_postgres psql -U postgres -d epileptic_ai \
  -c "SELECT id, risk_score, confidence, predicted_at FROM predictions WHERE patient_id = 1 ORDER BY predicted_at DESC;"

# Vérifier les alertes
docker exec epileptic_postgres psql -U postgres -d epileptic_ai \
  -c "SELECT id, alert_type, risk_score, user_confirmed, emergency_notified FROM alerts WHERE patient_id = 1 ORDER BY created_at DESC;"
```

---

## 🎯 Checklist de Débogage

- [ ] **Token valide**: Copié correctement le `access_token` du login
- [ ] **Format Authorization**: `Bearer <token>` avec espace après "Bearer"
- [ ] **Content-Type**: `application/json` dans les headers
- [ ] **3+ requêtes**: Envoyé au moins 3 requêtes pour activer la prédiction
- [ ] **Vérification PostgreSQL**: Consulté la table `biometrics` pour confirmer

---

## 📊 Comprendre les Réponses

### Status: "insufficient_data"
- ✅ **Les données SONT sauvegardées**
- ⚠️ Besoin de 3+ enregistrements dans 15 minutes
- 💡 **Solution**: Envoyer plus de requêtes

### Status: "ok"
- ✅ Données sauvegardées
- ✅ Prédiction réussie
- ✅ Risque faible détecté par le modèle AI
- 📊 Pas de countdown déclenché

### Status: "alert_triggered"
- ✅ Données sauvegardées
- ✅ Prédiction réussie
- 🚨 **Risque élevé détecté!**
- ⏱️ Countdown de 30 secondes démarré
- 📱 SMS sera envoyé si pas de confirmation

---

## 🚨 Tester le Countdown Complet

### 1. Créer une alerte (3+ requêtes avec valeurs élevées)

Envoyez 3 requêtes avec des valeurs progressivement plus dangereuses:

**Requête 1**:
```json
{"heart_rate": 95, "heart_rate_variability": 40, "spo2": 95, "temperature": 37.2}
```

**Requête 2**:
```json
{"heart_rate": 110, "heart_rate_variability": 32, "spo2": 93, "temperature": 37.8}
```

**Requête 3**:
```json
{"heart_rate": 130, "heart_rate_variability": 22, "spo2": 91, "temperature": 38.5}
```

### 2. Vérifier le countdown

```http
GET http://localhost:8000/api/v1/seizure-detection/countdown-status
Authorization: Bearer <TOKEN>
```

### 3. Confirmer la sécurité (annuler SMS)

```http
POST http://localhost:8000/api/v1/seizure-detection/confirm
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "alert_id": 1,
  "notes": "Je vais bien"
}
```

### 4. OU Attendre 30 secondes

Si vous ne confirmez pas, un **SMS automatique** sera envoyé au contact d'urgence (Marie Dupont: +33698765432).

---

## 🔄 Nettoyer et Recommencer

Si vous voulez tout remettre à zéro:

```bash
# Arrêter et supprimer les volumes
docker-compose down -v

# Redémarrer (va recréer la base vide)
docker-compose up -d

# Attendre 10 secondes que PostgreSQL démarre
timeout 10

# Recréer le patient de test
docker exec epileptic_backend python scripts/create_test_patient.py
```

---

## ✅ Résumé

**Si Postman répond 200 OK**:
1. ✅ Les données **SONT sauvegardées** dans PostgreSQL
2. ✅ L'authentification fonctionne
3. ⚠️ Il faut 3+ enregistrements pour une prédiction
4. 📊 Le modèle AI peut donner un score faible même avec valeurs élevées

**Pour déclencher le countdown**:
1. Envoyer 3+ requêtes avec des valeurs progressivement dangereuses
2. Le modèle doit détecter un **pattern de risque** (pas juste des seuils)
3. Si `risk_score > 0.7` et `confidence > 0.8` → Countdown démarre

**Vérification garantie**:
```bash
docker exec epileptic_postgres psql -U postgres -d epileptic_ai \
  -c "SELECT COUNT(*) FROM biometrics WHERE patient_id = 1;"
```

Si le count > 0, **vos données sont bien sauvegardées!** ✅
