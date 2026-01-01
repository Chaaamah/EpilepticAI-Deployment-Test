# 🚀 Déploiement sur Render.com

Guide complet pour déployer EpilepticAI Backend sur Render et le connecter à une app mobile iOS.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Déploiement étape par étape](#déploiement-étape-par-étape)
3. [Configuration iOS](#configuration-ios)
4. [Tests et vérification](#tests-et-vérification)
5. [Troubleshooting](#troubleshooting)

---

## Prérequis

- ✅ Compte GitHub (repository déjà créé : `EpilepticAI-Deployment-Test`)
- ✅ Compte Render.com gratuit : https://render.com
- ✅ Credentials Twilio (pour les alertes SMS)

---

## Déploiement étape par étape

### Étape 1 : Créer un compte Render

1. Allez sur https://render.com
2. Cliquez sur **"Get Started for Free"**
3. Connectez-vous avec votre compte **GitHub**
4. Autorisez Render à accéder à vos repositories

---

### Étape 2 : Créer la base de données PostgreSQL

1. Dans le dashboard Render, cliquez sur **"New +"** → **"PostgreSQL"**

2. **Configuration** :
   ```
   Name: epileptic-ai-db
   Database: epileptic_ai
   User: postgres
   Region: Frankfurt (EU Central)
   PostgreSQL Version: 15
   Plan: Free
   ```

3. Cliquez sur **"Create Database"**

4. ⏳ Attendez 2-3 minutes pendant la création

5. Une fois créée, allez dans **"Info"** et copiez :
   - **Internal Database URL** (commence par `postgresql://`)
   - **External Database URL** (pour accès depuis votre PC)

**IMPORTANT** : Gardez cette URL précieusement, elle sera utilisée à l'étape 3.

---

### Étape 3 : Déployer le Backend API

1. Cliquez sur **"New +"** → **"Web Service"**

2. **Connecter le repository** :
   - Cliquez sur "Connect a repository"
   - Cherchez et sélectionnez : `Chaaamah/EpilepticAI-Deployment-Test`
   - Cliquez sur "Connect"

3. **Configuration du service** :
   ```
   Name: epileptic-ai-backend
   Region: Frankfurt (EU Central)
   Branch: main
   Root Directory: EPILEPTIC-AI-BACKEND
   Runtime: Docker
   Dockerfile Path: Dockerfile
   Plan: Free
   ```

4. **Variables d'environnement** (cliquez sur "Advanced" puis "Add Environment Variable") :

   **⚠️ IMPORTANT : Remplacez les valeurs entre < >**

   ```bash
   # Application
   APP_NAME=EpilepticAI
   VERSION=1.0.0
   DEBUG=false
   ENVIRONMENT=production

   # Sécurité (générez une clé aléatoire forte)
   SECRET_KEY=<GÉNÉREZ UNE CLÉ ALÉATOIRE ICI>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080

   # Database (COPIEZ l'URL de l'étape 2)
   DATABASE_URL=<INTERNAL_DATABASE_URL_FROM_STEP_2>

   # CORS (autoriser toutes les origines pendant le dev)
   BACKEND_CORS_ORIGINS=["*"]

   # AI/ML
   ML_MODEL_PATH=models/seizure.keras
   PREDICTION_THRESHOLD=0.7

   # Twilio (VOS VRAIES CREDENTIALS)
   TWILIO_ACCOUNT_SID=<VOTRE_TWILIO_SID>
   TWILIO_AUTH_TOKEN=<VOTRE_TWILIO_TOKEN>
   TWILIO_PHONE_NUMBER=<VOTRE_TWILIO_PHONE>

   # Monitoring
   BIOMETRIC_COLLECTION_INTERVAL=5
   PREDICTION_INTERVAL=5
   PREDICTION_WINDOW_MINUTES=30
   ALERT_DELAY_MINUTES=15
   ALERT_COOLDOWN_MINUTES=15

   # Alertes
   ENABLE_SMS_ALERTS=true
   ENABLE_PUSH_NOTIFICATIONS=true
   ```

   **💡 Pour générer SECRET_KEY** :
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```

5. **Health Check** : `/docs`

6. Cliquez sur **"Create Web Service"**

---

### Étape 4 : Attendre le déploiement

⏳ **Durée : 5-10 minutes**

Le processus :
1. ✅ Clone du repository GitHub
2. ✅ Build de l'image Docker
3. ✅ Installation de TensorFlow (~620 MB)
4. ✅ Démarrage du service

Vous pouvez suivre en temps réel dans l'onglet **"Logs"**.

Quand vous voyez :
```
Application startup complete.
Uvicorn running on http://0.0.0.0:8000
```
✅ **C'est prêt !**

---

### Étape 5 : Obtenir votre URL de production

Une fois le déploiement terminé, Render vous donne une URL :

```
https://epileptic-ai-backend.onrender.com
```

**Testez immédiatement** :
- Documentation API : https://epileptic-ai-backend.onrender.com/docs
- Health check : https://epileptic-ai-backend.onrender.com/docs

---

### Étape 6 : Initialiser la base de données

La base PostgreSQL est vide. Vous devez créer les tables.

**Option A : Via le Shell Render**

1. Dans le dashboard du service backend → onglet **"Shell"**
2. Cliquez sur "Launch Shell"
3. Exécutez :
   ```bash
   python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```

**Option B : Via endpoint temporaire**

Ajoutez temporairement dans `app/main.py` :

```python
@app.get("/init-db")
def init_database():
    from app.core.database import Base, engine
    Base.metadata.create_all(bind=engine)
    return {"message": "Database initialized successfully"}
```

Puis appelez : `https://epileptic-ai-backend.onrender.com/init-db`

**⚠️ Supprimez cet endpoint après utilisation !**

---

### Étape 7 : Créer un utilisateur admin

**Via le Shell Render** :

```bash
python create_admin.py
```

Ou utilisez le script depuis votre PC local en vous connectant à la DB externe :

```bash
# Modifiez .env avec EXTERNAL_DATABASE_URL
DATABASE_URL=<EXTERNAL_URL_FROM_RENDER>

python create_admin.py
```

**Credentials par défaut** :
```
Email: admin@test.com
Password: Admin123!
```

---

## Configuration iOS

### Comment l'app iOS se connecte

Une fois le backend déployé, votre **URL de base** est :

```
https://epileptic-ai-backend.onrender.com/api/v1
```

### Code Swift pour l'app iOS

**1. Configuration de l'API**

```swift
import Foundation

class APIConfig {
    // 🌍 URL PRODUCTION (Render)
    static let baseURL = "https://epileptic-ai-backend.onrender.com/api/v1"

    // 🏠 URL LOCALE (pour tests)
    // static let baseURL = "http://localhost:8000/api/v1"
}
```

**2. Service d'authentification**

```swift
import Foundation

class AuthService {
    static let shared = AuthService()

    func login(email: String, password: String) async throws -> TokenResponse {
        let url = URL(string: "\(APIConfig.baseURL)/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded",
                        forHTTPHeaderField: "Content-Type")

        let body = "username=\(email)&password=\(password)"
        request.httpBody = body.data(using: .utf8)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.loginFailed
        }

        let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)

        // Sauvegarder le token dans Keychain
        KeychainHelper.save(token: tokenResponse.access_token)

        return tokenResponse
    }
}

struct TokenResponse: Codable {
    let access_token: String
    let token_type: String
}

enum APIError: Error {
    case loginFailed
    case noAuthToken
    case serverError
}
```

**3. Service biométrique (HealthKit → Backend)**

```swift
import HealthKit

class BiometricService {
    static let shared = BiometricService()

    func sendBiometric(heartRate: Double, hrv: Double, stress: Double) async throws {
        guard let token = KeychainHelper.getToken() else {
            throw APIError.noAuthToken
        }

        let url = URL(string: "\(APIConfig.baseURL)/biometrics/")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let biometric = BiometricData(
            heart_rate: heartRate,
            heart_rate_variability: hrv,
            stress_level: stress,
            recorded_at: ISO8601DateFormatter().string(from: Date()),
            source: "Apple Watch"
        )

        request.httpBody = try JSONEncoder().encode(biometric)

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
    }
}

struct BiometricData: Codable {
    let heart_rate: Double
    let heart_rate_variability: Double
    let stress_level: Double
    let recorded_at: String
    let source: String
}
```

**4. Récupérer les prédictions IA**

```swift
class PredictionService {
    static let shared = PredictionService()

    func getPrediction() async throws -> PredictionResponse {
        guard let token = KeychainHelper.getToken() else {
            throw APIError.noAuthToken
        }

        let url = URL(string: "\(APIConfig.baseURL)/predictions/analyze")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }

        return try JSONDecoder().decode(PredictionResponse.self, from: data)
    }
}

struct PredictionResponse: Codable {
    let prediction_id: Int
    let risk_score: Double
    let confidence: Double
    let recommendation: String
    let predicted_at: String
}
```

---

## Tests et vérification

### Test 1 : Documentation API

Ouvrez dans un navigateur :
```
https://epileptic-ai-backend.onrender.com/docs
```

Vous devriez voir l'interface Swagger avec tous les endpoints.

### Test 2 : Login via Swagger

1. Allez dans `/auth/login`
2. Cliquez sur "Try it out"
3. Remplissez :
   ```
   username: admin@test.com
   password: Admin123!
   ```
4. Exécutez
5. Vous devriez recevoir un `access_token`

### Test 3 : Depuis iOS (Postman d'abord)

**Login** :
```bash
POST https://epileptic-ai-backend.onrender.com/api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin@test.com&password=Admin123!
```

**Response** :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Envoyer biométrique** :
```bash
POST https://epileptic-ai-backend.onrender.com/api/v1/biometrics/
Authorization: Bearer <token>
Content-Type: application/json

{
  "heart_rate": 72.5,
  "heart_rate_variability": 55.2,
  "stress_level": 0.3,
  "recorded_at": "2024-12-27T14:30:00Z",
  "source": "iPhone"
}
```

---

## Troubleshooting

### ❌ Service se met en veille (Free plan)

**Problème** : Le service s'endort après 15 minutes d'inactivité.

**Solutions** :
1. **Upgrade vers plan payant** ($7/mois) - service toujours actif
2. **Utiliser UptimeRobot** (gratuit) pour ping automatique toutes les 5 minutes
3. **Accepter le délai** de 30-60s au premier appel

### ❌ CORS Error depuis l'app iOS

**Symptôme** : Erreur "blocked by CORS policy"

**Solution** : Vérifiez que `BACKEND_CORS_ORIGINS=["*"]` est bien défini dans les variables d'environnement Render.

### ❌ Database connection error

**Symptôme** : Logs montrent "could not connect to database"

**Solution** :
1. Vérifiez que `DATABASE_URL` pointe vers l'**Internal Database URL**
2. Vérifiez que la base PostgreSQL est bien démarrée (dashboard Render)

### ❌ Application failed to respond

**Symptôme** : Service démarre puis crash immédiatement

**Solution** :
1. Vérifiez les logs Render
2. Assurez-vous que le port est `8000`
3. Vérifiez que `uvicorn` écoute sur `0.0.0.0` (pas `localhost`)

### ❌ TensorFlow model not found

**Symptôme** : Logs montrent "models/seizure.keras not found"

**Solution** :
1. Vérifiez que le dossier `models/` et le fichier `seizure.keras` sont bien dans le repository
2. Vérifiez le `.gitignore` pour s'assurer que `models/` n'est pas exclu

---

## 💰 Limites du plan gratuit Render

| Ressource | Limite Free |
|-----------|-------------|
| **RAM** | 512 MB |
| **CPU** | Partagé |
| **Stockage** | Éphémère (reset au redémarrage) |
| **Bande passante** | 100 GB/mois |
| **Uptime** | Service dort après 15 min inactivité |
| **Database** | 1 GB, expire après 90 jours |
| **Build time** | 15 min max |

**⚠️ Notes importantes** :
- Le service **s'endort** après 15 min → premier appel lent (30-60s)
- Les fichiers uploadés sont **perdus** au redémarrage
- Base de données gratuite **expire après 90 jours**

---

## ✅ Checklist finale

- [ ] Compte Render créé et GitHub connecté
- [ ] Base PostgreSQL créée et URL copiée
- [ ] Service backend déployé avec toutes les variables d'env
- [ ] Déploiement terminé sans erreur
- [ ] Tables de base de données créées
- [ ] Utilisateur admin créé
- [ ] Documentation API accessible (`/docs`)
- [ ] Test login réussi via Swagger
- [ ] URL de production notée
- [ ] Code iOS mis à jour avec la nouvelle URL

---

**🎉 Félicitations ! Votre backend est maintenant accessible depuis n'importe où dans le monde !**

**URL de production** : `https://epileptic-ai-backend.onrender.com`

Pour l'app iOS, utilisez simplement cette URL comme `baseURL` et tout fonctionnera ! 🚀
