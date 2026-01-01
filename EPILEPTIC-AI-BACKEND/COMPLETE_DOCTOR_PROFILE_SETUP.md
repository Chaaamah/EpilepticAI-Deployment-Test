# Configuration Complète du Profil Docteur - Tous les Champs

## Vue d'ensemble

Ce document décrit la configuration complète de tous les champs du profil docteur entre le frontend et le backend, avec focus sur:
- Gender
- Blood Group
- DOB (Date of Birth)
- Education Information
- Availability
- Awards & Recognition
- Certifications

## État Actuel

### Backend - Modèle Doctor

Le modèle `app/models/doctor.py` définit toutes les colonnes nécessaires:

| Colonne Backend    | Type SQLAlchemy | Description                           |
|--------------------|-----------------|---------------------------------------|
| gender             | String(20)      | Gender (male/female)                  |
| blood_group        | String(10)      | Blood group (O+, A+, B+, AB+, etc.)   |
| dob                | Date            | Date of birth                         |
| education          | Text            | Education background with dates       |
| availability       | Text            | Weekly availability schedule          |
| awards             | Text            | Awards and recognition                |
| certifications     | Text            | Professional certifications           |
| years_experience   | **String**      | Years of experience ("15+ Years")     |
| bio                | Text            | Short biography                       |
| qualifications     | Text            | Professional qualifications           |
| clinic             | Text            | Clinic/Hospital name                  |
| status             | String(50)      | Status (available/busy/unavailable)   |

### Backend - Schémas Pydantic

#### DoctorUpdate Schema (`app/schemas/doctor.py`)

Tous les champs sont définis comme `Optional` pour permettre des mises à jour partielles:

```python
class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    hospital: Optional[str] = None
    license_number: Optional[str] = None
    availability: Optional[str] = None              # ✅
    qualifications: Optional[str] = None
    blood_group: Optional[str] = None               # ✅
    gender: Optional[str] = None                     # ✅
    years_experience: Optional[str] = None           # ✅ Changed to str
    bio: Optional[str] = None
    education: Optional[str] = None                  # ✅
    certifications: Optional[str] = None             # ✅
    awards: Optional[str] = None                     # ✅
    dob: Optional[date] = None                       # ✅
    clinic: Optional[str] = None
    status: Optional[str] = None
```

#### DoctorInDB Schema

Même structure que `DoctorUpdate` pour la cohérence.

### Frontend - EditProfile.tsx

Le formulaire capture tous les champs:

```typescript
const [formData, setFormData] = useState({
  // Informations personnelles
  name: safeUser.name,
  email: safeUser.email,
  phone: safeUser.phone,
  dob: safeUser.dob,                          // ✅
  gender: safeUser.gender,                     // ✅
  bloodGroup: safeUser.bloodGroup,             // ✅
  location: safeUser.location,
  yearsExperience: safeUser.yearsExperience,   // ✅

  // Informations professionnelles
  specialization: safeUser.specialization,
  qualifications: safeUser.qualifications,
  clinic: safeUser.clinic,
  licenseNumber: safeUser.licenseNumber,
  bio: safeUser.bio,
  status: safeUser.status,

  // Éducation et certifications
  education: safeUser.education,               // ✅
  certifications: safeUser.certifications,     // ✅
  awards: safeUser.awards,                     // ✅
});
```

### Frontend - AuthContext.tsx

Le mapping frontend → backend est complet (lignes 267-284):

```typescript
const updateData: any = {};
if (data.name !== undefined) updateData.full_name = data.name;
if (data.phone !== undefined) updateData.phone = data.phone;
if (data.specialization !== undefined) updateData.specialization = data.specialization;
if (data.location !== undefined) updateData.hospital = data.location;
if (data.licenseNumber !== undefined) updateData.license_number = data.licenseNumber;
if ((data as any).bio !== undefined) updateData.bio = (data as any).bio;
if ((data as any).qualifications !== undefined) updateData.qualifications = (data as any).qualifications;
if ((data as any).yearsExperience !== undefined) updateData.years_experience = (data as any).yearsExperience;
if ((data as any).gender !== undefined) updateData.gender = (data as any).gender;                           // ✅
if ((data as any).bloodGroup !== undefined) updateData.blood_group = (data as any).bloodGroup;              // ✅
if ((data as any).dob !== undefined) updateData.dob = (data as any).dob;                                    // ✅
if ((data as any).clinic !== undefined) updateData.clinic = (data as any).clinic;
if ((data as any).status !== undefined) updateData.status = (data as any).status;
if ((data as any).availability !== undefined) updateData.availability = (data as any).availability;         // ✅
if ((data as any).education !== undefined) updateData.education = (data as any).education;                  // ✅
if ((data as any).certifications !== undefined) updateData.certifications = (data as any).certifications;   // ✅
if ((data as any).awards !== undefined) updateData.awards = (data as any).awards;                           // ✅
```

### Mapping Complet Frontend ↔ Backend

| Champ Frontend   | Champ Backend       | Format Frontend               | Format Backend    | Status |
|------------------|---------------------|-------------------------------|-------------------|--------|
| gender           | gender              | "male" / "female"             | String(20)        | ✅     |
| bloodGroup       | blood_group         | "O+" / "A-" etc.              | String(10)        | ✅     |
| dob              | dob                 | "YYYY-MM-DD"                  | Date              | ✅     |
| education        | education           | Multi-line text with dates    | Text              | ✅     |
| availability     | availability        | "Monday: 9 AM - 5 PM\n..."    | Text              | ✅     |
| awards           | awards              | Multi-line text               | Text              | ✅     |
| certifications   | certifications      | Multi-line text               | Text              | ✅     |
| yearsExperience  | years_experience    | "15+ Years"                   | **String**        | ✅     |

## Migration Base de Données

### Script SQL: `complete_doctor_migration.sql`

Ce script:
1. ✅ Ajoute toutes les colonnes manquantes avec `ADD COLUMN IF NOT EXISTS`
2. ✅ Change `years_experience` de `INTEGER` → `VARCHAR`
3. ✅ Ajoute des commentaires pour documenter chaque colonne
4. ✅ Vérifie que toutes les colonnes existent après migration

### Colonnes Ajoutées/Modifiées

```sql
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS awards TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS certifications TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualifications TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';

-- Modification spéciale pour years_experience
ALTER TABLE doctors ALTER COLUMN years_experience TYPE VARCHAR;
```

## Formats de Données Spéciaux

### Education (Multi-ligne)
Format attendu:
```
Boston Medicine Institution - MD
25 May 1990 - 29 Jan 1992

Harvard Medical School, Boston - MBBS
25 May 1985 - 29 Jan 1990
```

### Availability (Schedule)
Format attendu:
```
Monday: 9:00 AM - 5:00 PM
Tuesday: 9:00 AM - 5:00 PM
Wednesday: 9:00 AM - 1:00 PM
Friday: 2:00 PM - 6:00 PM
```

Le frontend (`EditProfile.tsx`) gère la conversion entre format utilisateur et format stocké.

### Awards (Multi-ligne)
Format attendu:
```
Top Doctor Award (2023)
Recognized by U.S. News & World Report for outstanding achievements.

Patient Choice Award (2022)
Awarded by Vitals.com for high patient ratings.
```

### Certifications (Multi-ligne)
Format attendu:
```
Certification by the American Board of Family Medicine (ABFM), 2015
Demonstrates mastery of comprehensive care.

American Heart Association, 2024
CPR and emergency cardiac care certification.
```

## API Endpoint

### PUT /api/v1/doctors/me

**Fichier**: `app/api/v1/doctors.py` (lignes 234-272)

**Fonctionnement**:
1. Reçoit `DoctorUpdate` schema avec tous les champs optionnels
2. Met à jour uniquement les champs fournis (`exclude_unset=True`)
3. Synchronise `full_name` et `phone` avec la table `users`
4. Met à jour `updated_at`
5. Retourne `DoctorInDB` avec toutes les données

**Code**:
```python
@router.put("/me", response_model=DoctorInDB)
async def update_current_doctor_profile(
    doctor_data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    doctor = db.query(Doctor).filter(Doctor.email == current_doctor.email).first()

    # Update doctor fields
    update_data = doctor_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doctor, field, value)

    # Sync with User table
    user = db.query(User).filter(User.email == doctor.email).first()
    if user:
        if doctor_data.full_name:
            user.full_name = doctor_data.full_name
        if doctor_data.phone:
            user.phone = doctor_data.phone

    doctor.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doctor)

    return doctor
```

## Instructions de Déploiement

### 1. Exécuter la Migration SQL

**Via pgAdmin**:
1. Ouvrir pgAdmin 4
2. Se connecter à la base de données `epileptic_ai`
3. Clic droit → Query Tool
4. Copier/coller le contenu de `complete_doctor_migration.sql`
5. Exécuter (F5)

**Via psql**:
```bash
psql -U postgres -d epileptic_ai -f complete_doctor_migration.sql
```

### 2. Redémarrer le Backend

```bash
cd EPILEPTIC-AI-BACKEND
docker compose restart backend
```

### 3. Vérifier les Logs

```bash
docker compose logs backend --tail=50
```

### 4. Tester le Frontend

1. Recharger la page `/profile/edit`
2. Remplir tous les champs:
   - Gender: Sélectionner "Male" ou "Female"
   - Blood Group: Sélectionner un groupe sanguin
   - DOB: Choisir une date
   - Years of Experience: Taper "15+ Years"
   - Education: Entrer des diplômes multi-lignes
   - Availability: Utiliser l'interface de créneaux horaires
   - Awards: Entrer des récompenses
   - Certifications: Entrer des certifications
3. Cliquer "Save Changes"
4. Vérifier qu'il n'y a pas d'erreur
5. Actualiser la page et vérifier que les données sont bien sauvegardées

## Fichiers Modifiés/Créés

### Backend
- ✅ `app/models/doctor.py` - Modèle mis à jour
- ✅ `app/schemas/doctor.py` - Schémas DoctorUpdate et DoctorInDB mis à jour
- ✅ Créé: `complete_doctor_migration.sql` - Migration complète
- ✅ Créé: `check_doctor_columns.sql` - Script de vérification

### Frontend
- ℹ️ `src/pages/EditProfile.tsx` - Déjà correct
- ℹ️ `src/contexts/AuthContext.tsx` - Déjà correct

## Validation

### Checklist de Test

- [ ] Exécuter `complete_doctor_migration.sql` dans pgAdmin
- [ ] Redémarrer le backend Docker
- [ ] Ouvrir `/profile/edit` dans le navigateur
- [ ] Remplir le champ Gender
- [ ] Remplir le champ Blood Group
- [ ] Remplir le champ DOB
- [ ] Remplir le champ Years of Experience ("15+ Years")
- [ ] Remplir Education Information
- [ ] Ajouter des créneaux horaires dans Availability
- [ ] Remplir Awards & Recognition
- [ ] Remplir Certifications
- [ ] Cliquer "Save Changes"
- [ ] Vérifier qu'il n'y a pas d'erreur "Update Failed"
- [ ] Actualiser la page
- [ ] Vérifier que toutes les données sont toujours présentes

## Résultat Attendu

Après migration et redémarrage, le profil docteur devrait pouvoir être mis à jour avec TOUS les champs, y compris:
- ✅ Gender
- ✅ Blood Group
- ✅ Date of Birth
- ✅ Education (multi-ligne)
- ✅ Availability (créneaux horaires)
- ✅ Awards (multi-ligne)
- ✅ Certifications (multi-ligne)
- ✅ Years of Experience (texte libre)

Aucune erreur "Update Failed" ne devrait apparaître.
