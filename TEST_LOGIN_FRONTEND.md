# 🔐 Test de Connexion Frontend → Backend

## ✅ Ce Qui a Été Corrigé

Le frontend utilisait **localStorage** (mock data) pour l'authentification, mais vous avez créé le docteur dans la **vraie base de données PostgreSQL**.

**Modification:** Le `AuthContext.tsx` a été mis à jour pour se connecter à l'API backend réelle.

---

## 🧪 Test Complet

### Étape 1: Redémarrer le Frontend

Après avoir modifié `AuthContext.tsx`, il faut rebuilder le frontend:

```powershell
# Arrêter les services
docker compose down

# Rebuilder le frontend
docker compose build frontend

# Redémarrer tout
docker compose up -d
```

### Étape 2: Créer un Compte Docteur (Si pas déjà fait)

**Via Swagger:** <http://localhost:8000/docs>

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

### Étape 3: Vérifier dans pgAdmin

**URL:** <http://localhost:5050>

**SQL:**
```sql
-- Voir dans la table doctors
SELECT * FROM doctors WHERE email = 'test@doctor.com';

-- Voir dans la table users (si existe)
SELECT * FROM users WHERE email = 'test@doctor.com';
```

**Résultat attendu:** Au moins 1 ligne dans la table `doctors`.

### Étape 4: Se Connecter sur le Frontend

**URL:** <http://localhost>

1. Ouvrir la page de connexion
2. **Ouvrir les DevTools** (F12)
3. Aller dans l'onglet **Console**
4. Entrer les identifiants:
   - Email: `test@doctor.com`
   - Password: `Test123!`
5. Cliquer sur **Login**

### Étape 5: Observer dans la Console

Vous devriez voir:
```
User data from API: {id: 1, email: "test@doctor.com", full_name: "Dr. Test", ...}
Logged user: {id: 1, name: "Dr. Test", email: "test@doctor.com", role: "doctor", ...}
```

### Étape 6: Vérifier dans Network Tab

Dans DevTools → **Network** → **XHR**:

1. **POST /api/v1/auth/login**
   - Status: **200 OK**
   - Response: `{"access_token": "...", "token_type": "bearer", "user_type": "doctor"}`

2. **GET /api/v1/auth/me**
   - Status: **200 OK**
   - Response: Les données du docteur

### Étape 7: Vérifier la Redirection

Après connexion réussie, vous devriez être redirigé vers `/dashboard`.

---

## 🐛 Si Ça Ne Marche Pas

### Erreur 1: "Network error" dans la console

**Cause:** Le backend n'est pas accessible

**Solution:**
```powershell
# Vérifier que le backend fonctionne
curl http://localhost:8000/health

# Voir les logs
docker compose logs -f backend

# Redémarrer
docker compose restart backend
```

### Erreur 2: "401 Unauthorized"

**Cause:** Identifiants incorrects

**Vérifier dans pgAdmin:**
```sql
SELECT email, full_name FROM doctors WHERE email = 'test@doctor.com';
```

**Si le docteur n'existe pas:**
- Le recréer via Swagger

**Si le docteur existe:**
- Vérifier que vous utilisez le bon mot de passe
- Le mot de passe est hashé dans la BDD, vous devez utiliser celui que vous avez entré lors de la création

### Erreur 3: "CORS policy blocked"

**Cause:** CORS pas configuré correctement

**Vérifier:** [docker-compose.yml](docker-compose.yml) ligne 60
```yaml
BACKEND_CORS_ORIGINS=["http://localhost", "http://localhost:80", "http://localhost:3000", "http://localhost:8000"]
```

**Solution:**
```powershell
docker compose restart backend
```

### Erreur 4: Frontend ne rebuild pas

**Solution:** Forcer le rebuild sans cache
```powershell
docker compose down
docker compose build --no-cache frontend
docker compose up -d
```

### Erreur 5: "Cannot read properties of undefined"

**Cause:** L'API retourne un objet User au lieu d'un objet Doctor

**Vérifier dans Console:**
```javascript
// Regarder ce que l'API retourne
console.log('User data from API:', userData);
```

**Si c'est un User (pas de specialization):**

Le backend retourne un objet User qui n'a pas de `specialization`. C'est normal car il cherche d'abord dans la table `users`, puis dans `doctors`.

**Solution:** L'AuthContext gère déjà ce cas avec des valeurs par défaut:
```typescript
specialization: userData.specialization || "",
```

---

## 🔍 Debugging Avancé

### Tester l'API Manuellement (PowerShell)

```powershell
# 1. Login
$body = @{
    email = "test@doctor.com"
    password = "Test123!"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/auth/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$token = $response.access_token
Write-Host "Token: $token"

# 2. Get user info
$headers = @{
    "Authorization" = "Bearer $token"
}

$user = Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/auth/me" `
    -Method Get `
    -Headers $headers

$user | ConvertTo-Json
```

### Vérifier les Logs Frontend

```powershell
docker compose logs -f frontend
```

### Vérifier les Logs Backend

```powershell
docker compose logs -f backend | Select-String "login\|auth"
```

---

## ✅ Checklist de Vérification

- [ ] Backend démarre sans erreur
- [ ] Frontend rebuild avec succès
- [ ] Compte docteur existe dans PostgreSQL
- [ ] `docker compose ps` montre tous les services "Up"
- [ ] <http://localhost:8000/health> retourne `{"status": "ok"}`
- [ ] <http://localhost> charge la page de login
- [ ] DevTools Console ouverte
- [ ] Login POST retourne 200 avec token
- [ ] GET /auth/me retourne 200 avec données utilisateur
- [ ] Console affiche "User data from API"
- [ ] Console affiche "Logged user"
- [ ] Redirection vers /dashboard

---

## 📊 Flow de Connexion

```
1. Utilisateur entre email/password
   ↓
2. Frontend: POST /api/v1/auth/login
   ↓
3. Backend: Vérifie dans table 'doctors'
   ↓
4. Backend: Retourne access_token
   ↓
5. Frontend: Stocke token dans localStorage
   ↓
6. Frontend: GET /api/v1/auth/me avec Bearer token
   ↓
7. Backend: Décode token, cherche user
   ↓
8. Backend: Retourne objet Doctor
   ↓
9. Frontend: Stocke user dans localStorage et context
   ↓
10. Frontend: Redirige vers /dashboard
```

---

## 🎯 Prochaines Étapes

Une fois la connexion fonctionnelle:

1. **Tester les autres endpoints:**
   - Créer un patient
   - Créer une crise
   - Voir le dashboard

2. **Vérifier la persistance:**
   - Rafraîchir la page
   - Vérifier que vous restez connecté

3. **Tester la déconnexion:**
   - Cliquer sur Logout
   - Vérifier la redirection vers /login
   - Vérifier que le token est supprimé

---

**Dernière mise à jour:** 30 Décembre 2025
