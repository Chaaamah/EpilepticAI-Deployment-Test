# 🔧 Fix Erreur 422 - Registration Failed

## ❌ Problème

Lors de la création d'un compte docteur via le frontend, l'erreur suivante apparaît:

```
POST http://localhost/api/v1/auth/register/doctor 422 (Unprocessable Entity)
registration_failed
[object Object]
```

## 🔍 Cause

Le backend FastAPI exige des champs spécifiques dans le schéma `DoctorCreate`:

```python
class DoctorCreate(DoctorBase):
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('passwords do not match')
        return v
```

**Problèmes identifiés:**

1. ❌ Le frontend n'envoyait pas `confirm_password`
2. ❌ Le `minLength` était 6 au lieu de 8

## ✅ Solution Appliquée

### 1. Ajout de `confirm_password` dans la Requête

**Fichier:** [Register.tsx](EpilepticAI-web/src/pages/Register.tsx:64-73)

**AVANT:**
```typescript
body: JSON.stringify({
  email: email,
  password: password,
  full_name: fullName,
  phone: "",
  specialization: "",
  license_number: "",
  hospital: ""
})
```

**APRÈS:**
```typescript
body: JSON.stringify({
  email: email,
  password: password,
  confirm_password: confirmPassword,  // ✅ Ajouté
  full_name: fullName,
  phone: "",
  specialization: "",
  license_number: "",
  hospital: ""
})
```

### 2. Correction de la Longueur Minimale du Mot de Passe

**Fichier:** [Register.tsx](EpilepticAI-web/src/pages/Register.tsx:198)

**AVANT:**
```typescript
minLength={6}
```

**APRÈS:**
```typescript
minLength={8}
```

## 🚀 Redéploiement

```powershell
# Rebuilder le frontend
docker compose build frontend

# Redémarrer
docker compose up -d frontend
```

## 🧪 Test

### Créer un Compte

1. Ouvrir <http://localhost/register>
2. Remplir le formulaire:
   - **Full Name:** Dr. Test Fix
   - **Email:** testfix@doctor.com
   - **Password:** Test12345 (au moins 8 caractères)
   - **Confirm Password:** Test12345 (identique)
   - ✓ Accepter les termes
3. Cliquer "Register"

### Résultat Attendu

**Console:**
```
Registration successful: {id: 1, email: "testfix@doctor.com", ...}
```

**Toast:**
```
✅ registration_successful
registration_successful_desc
```

**Redirection:** → `/login`

### Vérifier dans pgAdmin

```sql
SELECT * FROM doctors WHERE email = 'testfix@doctor.com';
SELECT * FROM users WHERE email = 'testfix@doctor.com';
```

**Attendu:** Au moins 1 ligne dans `doctors`

## 🐛 Autres Erreurs 422 Possibles

### Erreur: "passwords do not match"

**Cause:** `password` ≠ `confirm_password`

**Solution:** Vérifier que les deux champs sont identiques

### Erreur: "value_error.email"

**Cause:** Email invalide

**Solution:** Utiliser un email valide avec `@` et domaine

### Erreur: "value_error.any_str.min_length"

**Cause:** Un champ est trop court

**Solutions:**
- `full_name`: Au moins 2 caractères
- `password`: Au moins 8 caractères

### Erreur: "Email already registered"

**Cause:** L'email existe déjà dans la BDD

**Solution:** Utiliser un autre email ou supprimer l'ancien:

```sql
DELETE FROM doctors WHERE email = 'testfix@doctor.com';
DELETE FROM users WHERE email = 'testfix@doctor.com';
```

## 📊 Validation Schéma Complet

### Champs Requis

| Champ | Type | Validation |
|-------|------|------------|
| `email` | EmailStr | Format email valide |
| `password` | str | ≥ 8 caractères |
| `confirm_password` | str | ≥ 8 caractères, = password |
| `full_name` | str | 2-100 caractères |

### Champs Optionnels

| Champ | Type | Default |
|-------|------|---------|
| `phone` | str? | `""` |
| `specialization` | str? | `""` |
| `license_number` | str? | `""` |
| `hospital` | str? | `""` |

## 🔍 Debugging

### Voir les Logs Backend

```powershell
docker compose logs -f backend | Select-String "register"
```

### Voir la Requête Exacte

**DevTools → Network → XHR → POST register/doctor → Request**

```json
{
  "email": "test@example.com",
  "password": "Test12345",
  "confirm_password": "Test12345",
  "full_name": "Dr. Test",
  "phone": "",
  "specialization": "",
  "license_number": "",
  "hospital": ""
}
```

### Tester l'API Directement (PowerShell)

```powershell
$body = @{
    email = "testdirect@doctor.com"
    password = "Test12345"
    confirm_password = "Test12345"
    full_name = "Dr. Test Direct"
    phone = ""
    specialization = ""
    license_number = ""
    hospital = ""
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/auth/register/doctor" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**Attendu:** Statut 200 + objet Doctor retourné

## ✅ Checklist de Vérification

- [x] `confirm_password` ajouté dans la requête
- [x] `minLength={8}` pour le password
- [x] Frontend rebuild
- [x] Service redémarré
- [ ] Test d'inscription réussi
- [ ] Compte visible dans pgAdmin
- [ ] Login fonctionne avec le nouveau compte

## 📖 Documentation

- **Schéma Backend:** [app/schemas/doctor.py](EPILEPTIC-AI-BACKEND/app/schemas/doctor.py)
- **Endpoint Registration:** [app/api/v1/auth.py](EPILEPTIC-AI-BACKEND/app/api/v1/auth.py:27-82)
- **Frontend Register:** [src/pages/Register.tsx](EpilepticAI-web/src/pages/Register.tsx)

---

**Fix appliqué le:** 30 Décembre 2025
