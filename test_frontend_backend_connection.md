# Test de Connexion Frontend ↔ Backend

**Date**: 31 Décembre 2025, 03:45 AM

## 🔍 Tests à Effectuer

### Test 1: Vérifier que le Backend Tourne

```bash
# Dans un terminal
curl http://localhost:8000/docs

# Devrait retourner du HTML (la page Swagger)
```

**Résultat attendu**: Page Swagger UI

---

### Test 2: Vérifier l'Endpoint de Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "boutaina@gmail.com",
    "password": "VOTRE_MOT_DE_PASSE"
  }'
```

**Résultat attendu**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_type": "doctor"
}
```

---

### Test 3: Vérifier l'Endpoint des Patients

```bash
# D'abord, récupérer le token du test 2
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Puis tester
curl -X GET http://localhost:8000/api/v1/doctors/patients \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu**:
```json
[
  {
    "id": 1,
    "email": "patient@example.com",
    "full_name": "Test Patient",
    "phone": "+212600123456",
    "date_of_birth": "1995-01-01",
    ...
  }
]
```

---

### Test 4: Vérifier dans le Navigateur

1. **Ouvrez le navigateur** et allez sur http://localhost:5173 (ou votre port Vite)
2. **Ouvrez la console** (F12)
3. **Connectez-vous** comme docteur
4. **Observez les logs** dans la console

**Logs attendus**:
```
🔵 API REQUEST: POST /auth/login
Full URL: http://localhost:8000/api/v1/auth/login
Headers: {Content-Type: "application/json"}
Data: {email: "boutaina@gmail.com", password: "..."}

🟢 API RESPONSE: POST /auth/login
Status: 200 OK
Data: {access_token: "...", token_type: "bearer", user_type: "doctor"}
```

---

### Test 5: Vérifier le Stockage du Token

**Dans la console du navigateur**:
```javascript
// Vérifier que le token est stocké
console.log('Token:', localStorage.getItem('auth_token'));

// Devrait afficher quelque chose comme:
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJib3V0YWluYUBnbWFpbC5jb20iLCJ1c2VyX3R5cGUiOiJkb2N0b3IiLCJleHAiOjE3MDQwNjI0MDB9...."
```

---

### Test 6: Vérifier le Chargement des Patients

1. **Allez sur la page Patients**
2. **Observez les logs dans la console**

**Logs attendus**:
```
Loading patients from API...

🔵 API REQUEST: GET /doctors/patients
Full URL: http://localhost:8000/api/v1/doctors/patients
Headers: {Authorization: "Bearer eyJ...", Content-Type: "application/json"}

🟢 API RESPONSE: GET /doctors/patients
Status: 200 OK
Data: [{id: 1, email: "...", full_name: "..."}, ...]

Patients loaded from API: [...]
Transformed patients: [...]
```

**Si vous voyez une erreur**:
```
🔴 API ERROR: GET /doctors/patients
Status: 422
Error Data: {detail: [...]}
```

Alors copiez l'erreur complète et envoyez-la moi.

---

### Test 7: Tester l'Ajout d'un Patient

1. **Cliquez sur "Add Patient"**
2. **Remplissez le formulaire**
3. **Cliquez sur "Save"**
4. **Observez les logs**

**Logs attendus**:
```
Creating patient with data: {
  email: "test@example.com",
  full_name: "Test Patient",
  password: "...",
  date_of_birth: "1997-12-31",
  ...
}

🔵 API REQUEST: POST /doctors/patients
Full URL: http://localhost:8000/api/v1/doctors/patients
Data: {email: "test@example.com", full_name: "Test Patient", ...}

🟢 API RESPONSE: POST /doctors/patients
Status: 200 OK
Data: {id: 2, email: "test@example.com", ...}

Patient created successfully: {id: 2, ...}
```

---

### Test 8: Tester la Modification du Profil

1. **Allez dans Edit Profile**
2. **Modifiez le champ "Bio"** à: "Test de modification bio"
3. **Cliquez sur "Save Changes"**
4. **Observez les logs**

**Logs attendus**:
```
Sending update to API: {
  full_name: "Boutaina Er-ragragy",
  bio: "Test de modification bio",
  ...
}

🔵 API REQUEST: PUT /doctors/me
Full URL: http://localhost:8000/api/v1/doctors/me
Data: {full_name: "...", bio: "Test de modification bio", ...}

🟢 API RESPONSE: PUT /doctors/me
Status: 200 OK
Data: {id: 1, email: "...", bio: "Test de modification bio", ...}

Updated doctor from API: {bio: "Test de modification bio", ...}
Updated user state: {bio: "Test de modification bio", ...}
```

---

### Test 9: Vérifier la Persistance dans la BDD

**Dans pgAdmin**, exécutez:

```sql
-- Vérifier que le profil est bien mis à jour
SELECT id, email, full_name, bio, education, certifications, awards
FROM doctors
WHERE email = 'boutaina@gmail.com';
```

**Résultat attendu**: La colonne `bio` doit contenir "Test de modification bio"

---

## 🚨 Problèmes Possibles

### Problème 1: Network Error

**Symptôme**:
```
🔴 API ERROR: GET /doctors/patients
Error Message: Network Error
```

**Cause**: Le backend n'est pas démarré ou tourne sur un autre port

**Solution**:
```bash
cd EPILEPTIC-AI-BACKEND
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Problème 2: CORS Error

**Symptôme**:
```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Cause**: Le backend ne permet pas les requêtes depuis le frontend

**Solution**: Vérifier `app/main.py` contient:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Problème 3: 401 Unauthorized

**Symptôme**:
```
🔴 API ERROR: GET /doctors/patients
Status: 401
Error Data: {detail: "Not authenticated"}
```

**Cause**: Token manquant ou invalide

**Solution**:
1. Se reconnecter
2. Vérifier que le token est dans localStorage: `localStorage.getItem('auth_token')`

---

### Problème 4: 422 Unprocessable Entity

**Symptôme**:
```
🔴 API ERROR: POST /doctors/patients
Status: 422
Error Data: {detail: [{loc: ["body", "date_of_birth"], msg: "..."}]}
```

**Cause**: Données envoyées invalides

**Solution**: Regarder `detail` pour voir quel champ pose problème

---

## 📊 Checklist de Diagnostic

- [ ] Backend démarré sur http://localhost:8000
- [ ] Swagger UI accessible sur http://localhost:8000/docs
- [ ] Frontend démarré sur http://localhost:5173
- [ ] Login fonctionne (retourne un token)
- [ ] Token stocké dans localStorage
- [ ] Requêtes GET /doctors/patients fonctionnent
- [ ] Les logs axios s'affichent dans la console
- [ ] Aucune erreur CORS
- [ ] Aucune erreur 401
- [ ] Les patients s'affichent dans la table
- [ ] L'ajout de patient fonctionne
- [ ] La modification du profil fonctionne
- [ ] Les données persistent dans PostgreSQL

---

## 🎯 Actions Immédiates

1. **Ouvrez la console** du navigateur (F12)
2. **Rafraîchissez la page** (F5)
3. **Connectez-vous**
4. **Allez sur la page Patients**
5. **Copiez TOUS les logs** de la console
6. **Envoyez-moi les logs**

Je pourrai alors voir exactement:
- Si les requêtes partent vers le bon URL
- Si le token est envoyé
- Si le backend répond
- Quelles données sont envoyées
- Quelles erreurs sont retournées

---

**Date**: 31 Décembre 2025, 03:45 AM
