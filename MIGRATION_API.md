# 🔄 Migration localStorage → API Backend

## ✅ Ce Qui Est Déjà Fait

### 1. Authentification ✅
- **Login** → Connecté à l'API (`AuthContext.tsx`)
- **Register** → Connecté à l'API (`Register.tsx`)

### 2. Services API Créés ✅
- `authService.ts` ✅
- `patientService.ts` ✅
- `dashboardService.ts` ✅
- `seizureService.ts` ✅
- `medicationService.ts` ✅
- `alertService.ts` ✅
- `clinicalNoteService.ts` ✅

---

## 🔧 Ce Qui Reste à Faire

### Fichiers Principaux à Modifier

| Fichier | État | Action Requise |
|---------|------|----------------|
| `AuthContext.tsx` | ✅ Partiellement | Login ✅ / addDoctor à remplacer |
| `Register.tsx` | ✅ Fait | Connecté à l'API |
| `PatientsContext.tsx` | ❌ localStorage | Remplacer par appels API |
| Composants Dashboard | ❌ localStorage | Utiliser dashboardService |
| Composants Patients | ❌ localStorage | Utiliser PatientsContext (API) |

---

## 📋 Plan de Migration Rapide

### Option 1: Migration Complète (Recommandée)

Remplacer `PatientsContext.tsx` par la version API:

```powershell
# Sauvegarder l'ancien
mv src/contexts/PatientsContext.tsx src/contexts/PatientsContext.old.tsx

# Utiliser la nouvelle version
mv src/contexts/PatientsContext.new.tsx src/contexts/PatientsContext.tsx

# Rebuilder le frontend
docker compose down
docker compose build frontend
docker compose up -d
```

**Avantages:**
- ✅ Tout connecté à la vraie BDD
- ✅ Données persistantes
- ✅ Partagées entre docteurs
- ✅ Visible dans pgAdmin

**Inconvénients:**
- ⚠️ Peut casser certains composants existants
- ⚠️ Besoin de tester chaque page

### Option 2: Migration Progressive (Plus Sûre)

Garder les deux systèmes et migrer page par page:

1. **Tester la connexion** ✅
2. **Tester l'inscription** ✅
3. **Migrer le Dashboard**
4. **Migrer la liste des Patients**
5. **Migrer les détails Patient**
6. **Migrer les Crises**
7. **Migrer les Médicaments**

---

## 🚀 Migration Immédiate: Registration + Login

### Étape 1: Rebuild Frontend

Les fichiers `AuthContext.tsx` et `Register.tsx` ont été modifiés:

```powershell
docker compose down
docker compose build frontend
docker compose up -d
```

### Étape 2: Tester l'Inscription

1. Ouvrir <http://localhost>
2. Cliquer sur "Create Account"
3. Remplir le formulaire:
   - Full Name: Test User
   - Email: testuser@example.com
   - Password: Test123!
   - Confirm Password: Test123!
   - Accepter les termes
4. Cliquer "Register"

### Étape 3: Vérifier dans pgAdmin

```sql
-- Voir le nouveau compte
SELECT * FROM doctors WHERE email = 'testuser@example.com';
SELECT * FROM users WHERE email = 'testuser@example.com';
```

### Étape 4: Tester la Connexion

1. Se connecter avec testuser@example.com / Test123!
2. Vérifier la redirection vers dashboard
3. DevTools → Console → Voir les logs API

---

## 🔍 Fichiers Modifiés

### 1. Register.tsx (✅ Fait)

**AVANT:**
```typescript
addDoctor({
  name: fullName,
  email: email,
  password: password,
  // ...
});
```

**APRÈS:**
```typescript
const response = await fetch('/api/v1/auth/register/doctor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email,
    password: password,
    full_name: fullName,
    phone: "",
    specialization: "",
    license_number: "",
    hospital: ""
  })
});
```

### 2. AuthContext.tsx - Login (✅ Fait)

**AVANT:**
```typescript
const found = current.find(d => d.email === email);
if (found && password === found.password) {
  setUser(found);
  return true;
}
```

**APRÈS:**
```typescript
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

const data = await response.json();
localStorage.setItem('auth_token', data.access_token);

const userResponse = await fetch('/api/v1/auth/me', {
  headers: { 'Authorization': `Bearer ${data.access_token}` }
});

const userData = await userResponse.json();
setUser({
  id: userData.id,
  name: userData.full_name,
  email: userData.email,
  role: "doctor",
  // ...
});
```

### 3. PatientsContext.tsx (❌ À Faire)

**Nouveau fichier créé:** `PatientsContext.new.tsx`

**Changements:**
- ❌ Supprime `loadAllPatientsFromStorage()`
- ✅ Ajoute `loadPatients()` qui appelle `patientService.getPatientsWithMetrics()`
- ✅ `addPatient()` appelle `patientService.createPatient()`
- ✅ `updatePatient()` appelle `patientService.updatePatient()`
- ✅ `deletePatient()` appelle `patientService.deletePatient()`

---

## 🧪 Test de Bout en Bout

### 1. Créer un Compte

```powershell
# Via le frontend
# http://localhost
# Ou via Swagger
# http://localhost:8000/docs
```

### 2. Se Connecter

Frontend doit:
- ✅ Appeler POST /api/v1/auth/login
- ✅ Recevoir un token
- ✅ Appeler GET /api/v1/auth/me
- ✅ Stocker le user dans context
- ✅ Rediriger vers /dashboard

### 3. Créer un Patient (Après migration PatientsContext)

Frontend doit:
- ✅ Appeler POST /api/v1/patients/
- ✅ Envoyer first_name, last_name, date_of_birth, etc.
- ✅ Recharger la liste des patients
- ✅ Afficher le nouveau patient

### 4. Vérifier dans pgAdmin

```sql
SELECT
    p.id,
    p.first_name,
    p.last_name,
    d.full_name as doctor_name
FROM patients p
JOIN doctors d ON p.doctor_id = d.id
ORDER BY p.created_at DESC;
```

---

## 🐛 Problèmes Potentiels

### Problème 1: "Cannot read property 'id' of undefined"

**Cause:** Le format des données API est différent de localStorage

**Solution:** Transformer les données API pour matcher l'interface `Patient`

```typescript
const transformedPatients = response.map((p: any) => ({
  id: p.id,
  name: `${p.first_name} ${p.last_name}`,
  age: calculateAge(p.date_of_birth),
  email: p.email || '',
  // ...
}));
```

### Problème 2: "401 Unauthorized" lors des appels API

**Cause:** Token manquant ou expiré

**Solution:** Vérifier que le token est bien envoyé dans les headers

```typescript
// Dans lib/api.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Problème 3: Pages qui crashent après migration

**Cause:** Composants qui attendent des propriétés spécifiques

**Solution:** Vérifier chaque composant et adapter les props

---

## ✅ Checklist de Migration

### Phase 1: Auth (✅ Terminé)
- [x] Login connecté à l'API
- [x] Register connecté à l'API
- [x] Token JWT stocké
- [x] User info récupéré de /auth/me

### Phase 2: Patients (En cours)
- [ ] PatientsContext utilise l'API
- [ ] Créer patient via API
- [ ] Lister patients via API
- [ ] Modifier patient via API
- [ ] Supprimer patient via API
- [ ] Voir détails patient via API

### Phase 3: Dashboard
- [ ] Stats dashboard via API
- [ ] Graphiques via API
- [ ] Historique crises via API

### Phase 4: Crises
- [ ] Créer crise via API
- [ ] Lister crises via API
- [ ] Modifier crise via API
- [ ] Supprimer crise via API

### Phase 5: Médicaments
- [ ] Créer médicament via API
- [ ] Lister médicaments via API
- [ ] Modifier médicament via API
- [ ] Supprimer médicament via API

### Phase 6: Alertes
- [ ] Lister alertes via API
- [ ] Marquer alerte comme lue via API

---

## 🚀 Prochaine Étape Recommandée

**Migrer PatientsContext maintenant:**

```powershell
# 1. Sauvegarder l'ancien
Copy-Item src/contexts/PatientsContext.tsx src/contexts/PatientsContext.old.tsx

# 2. Utiliser la nouvelle version
Copy-Item src/contexts/PatientsContext.new.tsx src/contexts/PatientsContext.tsx

# 3. Rebuilder
docker compose down
docker compose build frontend
docker compose up -d

# 4. Tester
# http://localhost
# Se connecter et aller dans "Patients"
```

Si ça casse, on peut facilement revenir en arrière:

```powershell
Copy-Item src/contexts/PatientsContext.old.tsx src/contexts/PatientsContext.tsx
docker compose build frontend
docker compose up -d
```

---

## 📖 Documentation API

Tous les endpoints disponibles:

**Swagger:** <http://localhost:8000/docs>
**ReDoc:** <http://localhost:8000/redoc>

---

**Dernière mise à jour:** 30 Décembre 2025
