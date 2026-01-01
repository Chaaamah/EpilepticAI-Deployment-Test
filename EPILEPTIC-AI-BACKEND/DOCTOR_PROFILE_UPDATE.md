# Mise à jour du profil docteur - Correction du type years_experience

## Problème identifié
L'erreur "Update Failed" lors de la mise à jour du profil docteur était causée par une incompatibilité de type de données pour le champ `years_experience`:

- **Frontend**: Envoie un string comme "15+ Years"
- **Backend Modèle**: Attendait un Integer
- **Backend Schema**: Attendait un int

Cette incompatibilité causait une erreur de validation Pydantic lors de la mise à jour.

## Solution appliquée

### 1. Modèle Doctor (app/models/doctor.py)
**Ligne 22**: Changé le type de `years_experience` de `Integer` à `String`

```python
# AVANT
years_experience = Column(Integer, nullable=True)

# APRÈS
years_experience = Column(String, nullable=True)  # Changed from Integer to String to support "15+ Years" format
```

### 2. Schéma DoctorUpdate (app/schemas/doctor.py)
**Ligne 34**: Changé le type de `years_experience` de `int` à `str`

```python
# AVANT
years_experience: Optional[int] = None

# APRÈS
years_experience: Optional[str] = None  # Changed from int to str to support "15+ Years" format
```

### 3. Schéma DoctorInDB (app/schemas/doctor.py)
**Ligne 58**: Changé le type de `years_experience` de `int` à `str`

```python
# AVANT
years_experience: Optional[int] = None

# APRÈS
years_experience: Optional[str] = None  # Changed from int to str to support "15+ Years" format
```

## Migration de la base de données

Un script SQL a été créé: `update_doctor_columns.sql`

Pour appliquer la migration:

### Option 1: Via pgAdmin (Recommandé)
1. Ouvrir pgAdmin 4
2. Se connecter à la base de données `epileptic_ai`
3. Cliquer droit → Query Tool
4. Copier/coller le contenu de `update_doctor_columns.sql`
5. Exécuter (F5)

### Option 2: Via psql
```bash
psql -U postgres -d epileptic_ai -f update_doctor_columns.sql
```

Le script SQL fait:
```sql
ALTER TABLE doctors
ALTER COLUMN years_experience TYPE VARCHAR USING years_experience::VARCHAR;
```

## Validation Frontend/Backend

### Champs du formulaire EditProfile.tsx

| Champ Frontend    | Champ Backend        | Type Backend | Status |
|-------------------|----------------------|--------------|--------|
| name              | full_name            | String       | ✅     |
| email             | email                | String       | ✅     |
| phone             | phone                | String       | ✅     |
| specialization    | specialization       | String       | ✅     |
| location          | hospital             | String       | ✅     |
| licenseNumber     | license_number       | String       | ✅     |
| bio               | bio                  | Text         | ✅     |
| qualifications    | qualifications       | Text         | ✅     |
| yearsExperience   | years_experience     | **String**   | ✅     |
| gender            | gender               | String(20)   | ✅     |
| bloodGroup        | blood_group          | String(10)   | ✅     |
| dob               | dob                  | Date         | ✅     |
| clinic            | clinic               | Text         | ✅     |
| status            | status               | String(50)   | ✅     |
| availability      | availability         | Text         | ✅     |
| education         | education            | Text         | ✅     |
| certifications    | certifications       | Text         | ✅     |
| awards            | awards               | Text         | ✅     |

## Mapping dans AuthContext.tsx

Le fichier `AuthContext.tsx` mappe déjà correctement tous les champs (lignes 267-284):

```typescript
if (data.name !== undefined) updateData.full_name = data.name;
if (data.phone !== undefined) updateData.phone = data.phone;
if (data.specialization !== undefined) updateData.specialization = data.specialization;
if (data.location !== undefined) updateData.hospital = data.location;
if (data.licenseNumber !== undefined) updateData.license_number = data.licenseNumber;
if ((data as any).bio !== undefined) updateData.bio = (data as any).bio;
if ((data as any).qualifications !== undefined) updateData.qualifications = (data as any).qualifications;
if ((data as any).yearsExperience !== undefined) updateData.years_experience = (data as any).yearsExperience;
if ((data as any).gender !== undefined) updateData.gender = (data as any).gender;
if ((data as any).bloodGroup !== undefined) updateData.blood_group = (data as any).bloodGroup;
if ((data as any).dob !== undefined) updateData.dob = (data as any).dob;
if ((data as any).clinic !== undefined) updateData.clinic = (data as any).clinic;
if ((data as any).status !== undefined) updateData.status = (data as any).status;
if ((data as any).availability !== undefined) updateData.availability = (data as any).availability;
if ((data as any).education !== undefined) updateData.education = (data as any).education;
if ((data as any).certifications !== undefined) updateData.certifications = (data as any).certifications;
if ((data as any).awards !== undefined) updateData.awards = (data as any).awards;
```

## API Endpoint

L'endpoint `/doctors/me` (PUT) dans `app/api/v1/doctors.py` (lignes 234-272) gère correctement la mise à jour:

1. Reçoit les données via `DoctorUpdate` schema
2. Met à jour tous les champs fournis dans la table `doctors`
3. Synchronise `full_name` et `phone` avec la table `users`
4. Met à jour `updated_at`
5. Commit et retourne le docteur mis à jour

## Test

Après avoir exécuté la migration SQL et redémarré le backend:

1. Recharger la page `/profile/edit`
2. Modifier les informations (notamment Years of Experience avec "15+ Years")
3. Cliquer "Save Changes"
4. Vérifier que le profil est mis à jour sans erreur
5. Vérifier que les changements sont persistés dans la base de données

## Fichiers modifiés

1. ✅ `app/models/doctor.py` - Ligne 22
2. ✅ `app/schemas/doctor.py` - Lignes 34, 58
3. ✅ Créé: `update_doctor_columns.sql` - Script de migration

## Résultat attendu

Après ces modifications, la mise à jour du profil docteur devrait fonctionner correctement avec tous les champs, y compris `years_experience` au format string "15+ Years".
