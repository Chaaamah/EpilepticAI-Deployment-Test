# Correction de la mise à jour de l'email du docteur

## Problème
L'email du docteur n'était pas mis à jour lors de la modification du profil car:
1. Le champ `email` n'était pas dans le schéma `DoctorUpdate`
2. Le mapping `email` manquait dans `AuthContext.tsx`
3. L'endpoint backend ne gérait pas le changement d'email dans la table User

## Solution appliquée

### 1. Schéma Backend - DoctorUpdate (app/schemas/doctor.py)

**Ligne 25**: Ajout du champ `email` avec validation EmailStr

```python
class DoctorUpdate(BaseModel):
    email: Optional[EmailStr] = None  # Allow email updates with validation
    full_name: Optional[str] = None
    phone: Optional[str] = None
    # ... autres champs
```

### 2. Frontend - AuthContext.tsx

**Ligne 268**: Ajout du mapping pour l'email

```typescript
const updateData: any = {};
if (data.email !== undefined) updateData.email = data.email;
if (data.name !== undefined) updateData.full_name = data.name;
// ... autres mappings
```

**Ligne 310**: Ajout de l'email dans l'état mis à jour

```typescript
const updated = {
  ...user,
  email: updatedDoctor.email || user.email,
  name: updatedDoctor.full_name || user.name,
  // ... autres champs
};
```

### 3. Backend - Endpoint /doctors/me (app/api/v1/doctors.py)

**Lignes 256-288**: Gestion complète du changement d'email

```python
# Store old email before updating
old_email = doctor.email

for field, value in update_data.items():
    setattr(doctor, field, value)

# Also update User table for consistency
user = db.query(User).filter(User.email == old_email).first()
if user:
    if doctor_data.full_name:
        user.full_name = doctor_data.full_name
    if doctor_data.phone:
        user.phone = doctor_data.phone
    if doctor_data.email and doctor_data.email != old_email:
        # Check if new email already exists
        existing_user = db.query(User).filter(User.email == doctor_data.email).first()
        existing_doctor = db.query(Doctor).filter(
            Doctor.email == doctor_data.email,
            Doctor.id != doctor.id
        ).first()

        if existing_user and existing_user.email != old_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use by another user"
            )
        if existing_doctor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use by another doctor"
            )

        user.email = doctor_data.email
```

## Sécurité

### Validation de l'email
- ✅ Validation Pydantic avec `EmailStr` (format email valide)
- ✅ Vérification des doublons dans la table `users`
- ✅ Vérification des doublons dans la table `doctors`
- ✅ Empêche l'utilisation d'un email déjà existant

### Synchronisation des tables
- ✅ Mise à jour dans la table `doctors`
- ✅ Mise à jour dans la table `users` pour cohérence
- ✅ Utilisation de l'ancien email pour retrouver le user

## Flow de mise à jour

### Avant (Email non mis à jour)
```
EditProfile.tsx
    ↓ (email dans formData mais pas envoyé)
AuthContext.updateProfile()
    ↓ (email non mappé)
API PUT /doctors/me
    ↓ (email ignoré)
Database
    ✗ Email inchangé
```

### Après (Email mis à jour correctement)
```
EditProfile.tsx
    ↓ (email: "newemail@example.com")
AuthContext.updateProfile()
    ↓ updateData.email = data.email
API PUT /doctors/me
    ↓ Vérification doublons
    ↓ Update doctor.email
    ↓ Update user.email
Database
    ✅ Email mis à jour dans doctors
    ✅ Email mis à jour dans users
LocalStorage
    ✅ Email mis à jour dans l'état local
```

## Test

### Scénario 1: Changer l'email avec succès
1. Ouvrir `/profile/edit`
2. Modifier le champ Email Address: `boutaina@gmail.com` → `newemail@gmail.com`
3. Cliquer "Save Changes"
4. ✅ Aucune erreur
5. ✅ Email mis à jour dans le profil
6. ✅ Peut se reconnecter avec le nouvel email

### Scénario 2: Email déjà utilisé
1. Ouvrir `/profile/edit`
2. Modifier l'email vers un email déjà existant
3. Cliquer "Save Changes"
4. ✅ Erreur: "Email already in use by another user"
5. ✅ Email reste inchangé

### Scénario 3: Email invalide
1. Ouvrir `/profile/edit`
2. Entrer un email invalide: `notanemail`
3. ✅ Validation HTML5 ou erreur Pydantic
4. ✅ Email non accepté

## Fichiers modifiés

1. ✅ `app/schemas/doctor.py` - Ligne 25 (ajout email)
2. ✅ `app/api/v1/doctors.py` - Lignes 256-288 (gestion changement email)
3. ✅ `src/contexts/AuthContext.tsx` - Lignes 268, 310 (mapping email)

## Note importante

⚠️ **Attention**: Changer l'email d'un utilisateur change son identifiant de connexion. Après avoir changé l'email:
- L'utilisateur doit se reconnecter avec le nouvel email
- Tous les liens/tokens basés sur l'ancien email deviennent invalides
- Les patients liés au docteur restent liés (pas d'impact)

## Résultat

Maintenant, le champ **Email Address** dans la page `/profile/edit` peut être modifié et sera correctement sauvegardé dans:
- ✅ Table `doctors`
- ✅ Table `users`
- ✅ État local (localStorage)
- ✅ Interface utilisateur

Le backend redémarré applique ces changements immédiatement.
