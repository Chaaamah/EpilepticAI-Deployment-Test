# Configuration du Dashboard Admin - EpilepticAI

## Vue d'ensemble

Le dashboard admin permet de gérer tous les utilisateurs (doctors et patients) de l'application EpilepticAI. Ce document décrit les changements effectués pour connecter le frontend admin au backend API.

## Problème Initial

Le AdminDashboard utilisait **localStorage** pour stocker les doctors et patients, ce qui signifie:
- ❌ Les données n'étaient pas persistantes en base de données
- ❌ Les données étaient perdues lors du refresh du navigateur
- ❌ Aucune synchronisation entre utilisateurs
- ❌ Pas d'intégration avec le backend

## Solution Implémentée

### 1. Backend - Nouvelles Colonnes Doctor

**Fichier**: `app/models/doctor.py` (lignes 16-17)

Ajout de deux nouvelles colonnes:
```python
location = Column(String(255), nullable=True)      # Ville/localisation du doctor
department = Column(String(100), nullable=True)    # Département/spécialité
```

**Migration SQL**: `add_doctor_location_department.sql`

```sql
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department VARCHAR(100);
```

### 2. Backend - Schémas Pydantic Mis à Jour

**Fichier**: `app/schemas/doctor.py`

Ajout de `location` et `department` dans tous les schémas:
- `DoctorBase` (lignes 12-13)
- `DoctorUpdate` (lignes 33-34)
- `DoctorInDB` (hérite de DoctorBase)

### 3. Backend - Nouveaux Endpoints Admin

**Fichier**: `app/api/v1/doctors.py` (ajouté à la fin)

#### PUT /api/v1/doctors/{doctor_id}
- **Permission**: Admin uniquement
- **Fonction**: Mettre à jour n'importe quel profil doctor
- **Fonctionnalités**:
  - Vérifie que le doctor existe
  - Gère le changement d'email avec vérification des duplicatas
  - Met à jour l'email dans la table `users` également
  - Supporte tous les champs: bio, education, certifications, location, department, etc.

#### DELETE /api/v1/doctors/{doctor_id}
- **Permission**: Admin uniquement
- **Fonction**: Désactiver un doctor (soft delete)
- **Fonctionnalités**:
  - Met `is_active = False` au lieu de supprimer
  - Désactive aussi dans la table `users`
  - Préserve les données historiques

### 4. Frontend - Service Admin

**Fichier**: `src/services/adminService.ts` (CRÉÉ)

Service TypeScript complet pour les opérations admin:

#### Gestion des Doctors
```typescript
getAllDoctors()          // GET /api/v1/doctors/
getDoctorById(id)        // GET /api/v1/doctors/{id}
createDoctor(data)       // POST /api/v1/auth/register/doctor
updateDoctor(id, data)   // PUT /api/v1/doctors/{id}
deleteDoctor(id)         // DELETE /api/v1/doctors/{id}
changeDoctorPassword(id) // PATCH /api/v1/users/{id}/password
```

#### Gestion des Patients
```typescript
getAllPatients()         // GET /api/v1/doctors/patients
getPatientById(id)       // GET /api/v1/doctors/patients/{id}
createPatient(data)      // POST /api/v1/doctors/patients
updatePatient(id, data)  // PUT /api/v1/doctors/patients/{id}
deletePatient(id)        // DELETE /api/v1/doctors/patients/{id}
```

#### Statistiques
```typescript
getUserStats()           // GET /api/v1/users/stats
```

### 5. Interfaces TypeScript

**Doctor Interface**:
```typescript
interface Doctor {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
  license_number?: string;
  location?: string;             // ✅ Nouveau
  department?: string;           // ✅ Nouveau
  availability?: string;
  qualifications?: string;
  blood_group?: string;
  gender?: string;
  years_experience?: string;
  bio?: string;
  education?: string;
  certifications?: string;
  awards?: string;
  dob?: string;
  clinic?: string;
  status?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}
```

## Mapping Backend ↔ Frontend

### Champs Doctor

| Frontend (camelCase)   | Backend (snake_case)    | Type    | Note |
|------------------------|-------------------------|---------|------|
| full_name              | full_name               | string  | ✅    |
| license_number         | license_number          | string  | ✅    |
| location               | location                | string  | ✅ NOUVEAU |
| department             | department              | string  | ✅ NOUVEAU |
| years_experience       | years_experience        | string  | ✅ (changé de int à string) |
| blood_group            | blood_group             | string  | ✅    |
| dob                    | dob                     | date    | ✅    |

### Endpoints Disponibles

| Endpoint                          | Méthode | Auth Required | Utilisé Par |
|-----------------------------------|---------|---------------|-------------|
| `/auth/login`                     | POST    | Public        | Login       |
| `/auth/me`                        | GET     | User          | Profile     |
| `/auth/register/doctor`           | POST    | Public/Admin  | Admin Create|
| `/doctors/`                       | GET     | Public        | Admin List  |
| `/doctors/{id}`                   | GET     | Public        | Admin View  |
| `/doctors/{id}`                   | PUT     | **Admin**     | **Admin Update** ✅ NOUVEAU |
| `/doctors/{id}`                   | DELETE  | **Admin**     | **Admin Delete** ✅ NOUVEAU |
| `/doctors/me`                     | PUT     | Doctor        | Self Edit   |
| `/doctors/patients`               | GET     | Doctor/Admin  | Admin Patients |
| `/doctors/patients`               | POST    | Doctor/Admin  | Admin Create Patient |
| `/doctors/patients/{id}`          | PUT     | Doctor/Admin  | Admin Update Patient |
| `/doctors/patients/{id}`          | DELETE  | Doctor/Admin  | Admin Delete Patient |
| `/users/`                         | GET     | Admin         | Not used yet |
| `/users/stats`                    | GET     | Admin         | Admin Stats |

## Instructions de Déploiement

### 1. Exécuter la Migration SQL

**Via pgAdmin**:
1. Ouvrir pgAdmin 4
2. Se connecter à la base de données `epileptic_ai`
3. Clic droit → Query Tool
4. Copier le contenu de `add_doctor_location_department.sql` + `add_patient_address_column.sql`
5. Exécuter (F5)

**Via psql**:
```bash
psql -U postgres -d epileptic_ai -f add_doctor_location_department.sql
psql -U postgres -d epileptic_ai -f add_patient_address_column.sql
```

### 2. Vérifier les Colonnes

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'doctors'
  AND column_name IN ('location', 'department');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'patients'
  AND column_name = 'address';
```

### 3. Redémarrer le Backend

```bash
cd EPILEPTIC-AI-BACKEND
docker compose restart backend
```

### 4. Vérifier les Logs

```bash
docker compose logs backend --tail=50
```

Devrait afficher:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 5. Tester les Endpoints

**Login Admin**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin"
  }'
```

**Get All Doctors** (avec token admin):
```bash
curl -X GET http://localhost:8000/api/v1/doctors/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Prochaines Étapes

### À FAIRE (Ordre de priorité)

1. ✅ **TERMINÉ**: Ajouter colonnes location et department
2. ✅ **TERMINÉ**: Mettre à jour modèles et schémas backend
3. ✅ **TERMINÉ**: Créer adminService.ts
4. ✅ **TERMINÉ**: Ajouter endpoints admin au backend
5. **EN COURS**: Exécuter les migrations SQL
6. **À FAIRE**: Mettre à jour AdminDashboard.tsx pour utiliser adminService
7. **À FAIRE**: Remplacer localStorage par API calls
8. **À FAIRE**: Tester le flow complet admin

### Modification AdminDashboard.tsx

Le fichier `AdminDashboard.tsx` doit être modifié pour:

#### Remplacer localStorage par API
```typescript
// AVANT
const loadDoctors = () => {
  const saved = localStorage.getItem('epilepticai_doctors');
  if (saved) {
    setDoctors(JSON.parse(saved));
  }
}

// APRÈS
const loadDoctors = async () => {
  try {
    const doctorsList = await adminService.getAllDoctors();
    setDoctors(doctorsList);
  } catch (error) {
    console.error('Error loading doctors:', error);
  }
}
```

#### Créer un Doctor
```typescript
// AVANT
const handleAddDoctor = (doctorData) => {
  const newDoctor = { ...doctorData, id: Date.now() };
  const updated = [...doctors, newDoctor];
  setDoctors(updated);
  localStorage.setItem('epilepticai_doctors', JSON.stringify(updated));
}

// APRÈS
const handleAddDoctor = async (doctorData) => {
  try {
    const newDoctor = await adminService.createDoctor({
      email: doctorData.email,
      full_name: doctorData.name,
      password: doctorData.password || 'doctor123',
      phone: doctorData.phone,
      specialization: doctorData.specialization,
      hospital: doctorData.hospital,
      license_number: doctorData.licenseNumber,
      location: doctorData.location,
      department: doctorData.department,
      availability: doctorData.availability,
      bio: doctorData.bio,
      education: doctorData.education,
    });
    await loadDoctors(); // Reload list
  } catch (error) {
    console.error('Error creating doctor:', error);
    // Show error toast
  }
}
```

#### Mettre à Jour un Doctor
```typescript
const handleEditDoctor = async (doctorId, doctorData) => {
  try {
    await adminService.updateDoctor(doctorId, {
      full_name: doctorData.name,
      email: doctorData.email,
      phone: doctorData.phone,
      specialization: doctorData.specialization,
      location: doctorData.location,
      department: doctorData.department,
      // ... autres champs
    });
    await loadDoctors(); // Reload list
  } catch (error) {
    console.error('Error updating doctor:', error);
  }
}
```

#### Supprimer un Doctor
```typescript
const handleDeleteDoctor = async (doctorId) => {
  try {
    await adminService.deleteDoctor(doctorId);
    await loadDoctors(); // Reload list
  } catch (error) {
    console.error('Error deleting doctor:', error);
  }
}
```

## Mapping Complet des Champs

### AdminDashboard Form → Backend API

| Form Field (Frontend)     | API Field (Backend)     | Notes |
|---------------------------|-------------------------|-------|
| name                      | full_name               | ✅     |
| email                     | email                   | ✅     |
| phone                     | phone                   | ✅     |
| location                  | location                | ✅ Nouveau |
| customLocation            | location                | Si "Other" sélectionné |
| department                | department              | ✅ Nouveau |
| specialization            | specialization          | ✅     |
| customSpecialization      | specialization          | Si "Other" sélectionné |
| password                  | password                | Pour création uniquement |
| licenseNumber             | license_number          | ✅     |
| yearsExperience           | years_experience        | ✅     |
| bio                       | bio                     | ✅     |
| education                 | education               | ✅     |
| availability              | availability            | ✅     |

## Authentification Admin

**Credentials**:
- Email: `admin@gmail.com`
- Password: `admin`

L'admin est stocké dans la table `users` avec:
- `role = UserRole.ADMIN`
- `is_superuser = True`

Les endpoints admin vérifient:
```python
def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user
```

## Architecture des Tables

### Table `users` (Base)
- id, email, full_name, phone
- role (admin/doctor/patient)
- hashed_password, is_active, is_verified, is_superuser
- created_at, updated_at, last_login

### Table `doctors` (Détails Doctor)
- Toutes les colonnes spécifiques au profil doctor
- Synchronisée avec `users` par email
- **Nouvelles colonnes**: location, department

### Table `patients` (Détails Patient)
- Toutes les colonnes spécifiques au profil patient
- Synchronisée avec `users` par email
- **Nouvelle colonne**: address

## Résumé

### ✅ Complété
1. Colonnes location et department ajoutées au modèle Doctor
2. Schémas Pydantic mis à jour
3. Endpoints admin créés (PUT, DELETE /doctors/{id})
4. Service adminService.ts créé avec tous les endpoints
5. Mapping camelCase ↔ snake_case documenté

### 🔄 En Cours
1. Exécution des migrations SQL dans pgAdmin

### 📋 À Faire
1. Modifier AdminDashboard.tsx pour utiliser adminService
2. Remplacer toutes les opérations localStorage par API calls
3. Tester le flow complet de gestion des doctors et patients
4. Ajouter gestion d'erreurs et loading states
5. Ajouter toasts pour les succès/erreurs

Le dashboard admin est maintenant prêt à être connecté au backend avec une API complète et sécurisée! 🎉
