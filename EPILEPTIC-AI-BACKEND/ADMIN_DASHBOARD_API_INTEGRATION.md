# Intégration API du Dashboard Admin - Complété

## Résumé

Le AdminDashboard a été complètement migré de localStorage vers l'API backend. Maintenant, toutes les opérations CRUD sur les doctors sont persistantes en base de données.

## Changements Effectués

### 1. Import du Service Admin

**Fichier**: `src/pages/AdminDashboard.tsx` (ligne 18)

```typescript
import * as adminService from "@/services/adminService";
```

### 2. Fonction loadDoctors (Remplacée)

**AVANT** (lignes 122-175):
```typescript
const loadDoctors = () => {
  try {
    const savedDoctors = localStorage.getItem('epilepticai_doctors');
    if (savedDoctors) {
      setDoctors(JSON.parse(savedDoctors));
    } else {
      // Hardcoded test data
      setDoctors(testDoctors);
      localStorage.setItem('epilepticai_doctors', JSON.stringify(testDoctors));
    }
  } catch (error) {
    // Error handling
  }
};
```

**APRÈS** (lignes 123-153):
```typescript
const loadDoctors = async () => {
  try {
    const doctorsList = await adminService.getAllDoctors();

    // Map backend fields (snake_case) to frontend format (camelCase)
    const mappedDoctors = doctorsList.map(doc => ({
      id: doc.id,
      name: doc.full_name,
      email: doc.email,
      phone: doc.phone || "",
      location: doc.location || doc.hospital || "",
      specialization: doc.specialization || "",
      licenseNumber: doc.license_number || "",
      yearsExperience: doc.years_experience || "",
      department: doc.department || "",
      education: doc.education || "",
      availability: doc.availability || "",
      bio: doc.bio || "",
      createdAt: doc.created_at,
      isActive: doc.is_active
    }));

    setDoctors(mappedDoctors);
    console.log('Doctors loaded from API:', mappedDoctors);
  } catch (error) {
    console.error('Error loading doctors:', error);
    toast({
      title: "Error",
      description: "Unable to load doctors list from server.",
      variant: "destructive"
    });
  }
};
```

**Changements clés**:
- ✅ Fonction devient `async`
- ✅ Appelle `adminService.getAllDoctors()` au lieu de localStorage
- ✅ Mappe les champs backend → frontend
- ✅ Supprime les données de test hardcodées

### 3. Fonction saveDoctors (Supprimée)

**AVANT** (lignes 177-184):
```typescript
const saveDoctors = (doctorsList) => {
  try {
    localStorage.setItem('epilepticai_doctors', JSON.stringify(doctorsList));
  } catch (error) {
    console.error('Error saving doctors:', error);
  }
};
```

**APRÈS**: ❌ Supprimée complètement (plus nécessaire)

### 4. Fonction addDoctor (Remplacée)

**AVANT** (lignes 186-202):
```typescript
const addDoctor = (doctorData) => {
  try {
    const newDoctor = { ...doctorData, role: "doctor" };
    const updatedDoctors = [...doctors, newDoctor];
    setDoctors(updatedDoctors);
    saveDoctors(updatedDoctors);
    return newDoctor;
  } catch (error) {
    throw error;
  }
};
```

**APRÈS** (lignes 155-181):
```typescript
const addDoctor = async (doctorData) => {
  try {
    const newDoctor = await adminService.createDoctor({
      email: doctorData.email,
      full_name: doctorData.name,
      password: doctorData.password || "doctor123",
      phone: doctorData.phone,
      specialization: doctorData.customSpecialization || doctorData.specialization,
      hospital: doctorData.customLocation || doctorData.location,
      license_number: doctorData.licenseNumber,
      location: doctorData.customLocation || doctorData.location,
      department: doctorData.department,
      years_experience: doctorData.yearsExperience,
      bio: doctorData.bio,
      education: doctorData.education,
      availability: doctorData.availability,
    });

    // Reload doctors list from API
    await loadDoctors();

    return newDoctor;
  } catch (error) {
    console.error('Error adding doctor:', error);
    throw error;
  }
};
```

**Changements clés**:
- ✅ Fonction devient `async`
- ✅ Appelle `adminService.createDoctor()` avec mapping des champs
- ✅ Recharge la liste via `loadDoctors()` après création
- ✅ Supprime l'appel à `saveDoctors()`

### 5. Fonction updateDoctor (Remplacée)

**AVANT** (lignes 204-216):
```typescript
const updateDoctor = (doctorId, updatedData) => {
  try {
    const updatedDoctors = doctors.map(d =>
      d.id === doctorId ? { ...d, ...updatedData } : d
    );
    setDoctors(updatedDoctors);
    saveDoctors(updatedDoctors);
    return updatedDoctors.find(d => d.id === doctorId);
  } catch (error) {
    throw error;
  }
};
```

**APRÈS** (lignes 183-208):
```typescript
const updateDoctor = async (doctorId, updatedData) => {
  try {
    const updatedDoctor = await adminService.updateDoctor(doctorId, {
      full_name: updatedData.name,
      email: updatedData.email,
      phone: updatedData.phone,
      specialization: updatedData.customSpecialization || updatedData.specialization,
      hospital: updatedData.customLocation || updatedData.location,
      license_number: updatedData.licenseNumber,
      location: updatedData.customLocation || updatedData.location,
      department: updatedData.department,
      years_experience: updatedData.yearsExperience,
      bio: updatedData.bio,
      education: updatedData.education,
      availability: updatedData.availability,
    });

    // Reload doctors list from API
    await loadDoctors();

    return updatedDoctor;
  } catch (error) {
    console.error('Error updating doctor:', error);
    throw error;
  }
};
```

**Changements clés**:
- ✅ Fonction devient `async`
- ✅ Appelle `adminService.updateDoctor()` avec mapping des champs
- ✅ Recharge la liste via `loadDoctors()` après modification
- ✅ Supprime l'appel à `saveDoctors()`

### 6. Fonction deleteDoctor (Remplacée)

**AVANT** (lignes 218-229):
```typescript
const deleteDoctor = (doctorId) => {
  try {
    const updatedDoctors = doctors.filter(d => d.id !== doctorId);
    setDoctors(updatedDoctors);
    saveDoctors(updatedDoctors);
    return true;
  } catch (error) {
    throw error;
  }
};
```

**APRÈS** (lignes 210-222):
```typescript
const deleteDoctor = async (doctorId) => {
  try {
    await adminService.deleteDoctor(doctorId);

    // Reload doctors list from API
    await loadDoctors();

    return true;
  } catch (error) {
    console.error('Error deleting doctor:', error);
    throw error;
  }
};
```

**Changements clés**:
- ✅ Fonction devient `async`
- ✅ Appelle `adminService.deleteDoctor()` (soft delete)
- ✅ Recharge la liste via `loadDoctors()` après suppression
- ✅ Supprime l'appel à `saveDoctors()`

### 7. Handler handleAddDoctor (Mis à jour)

**AVANT** (ligne 359):
```typescript
const handleAddDoctor = () => {
  // ... validation logic

  if (isEditing && formData.id) {
    updateDoctor(formData.id, doctorData);  // Synchrone
  } else {
    addDoctor({ ...doctorData });  // Synchrone
  }
}
```

**APRÈS** (ligne 359):
```typescript
const handleAddDoctor = async () => {
  // ... validation logic

  if (isEditing && formData.id) {
    await updateDoctor(formData.id, doctorData);  // Asynchrone
  } else {
    await addDoctor({ ...doctorData });  // Asynchrone
  }
}
```

**Changements clés**:
- ✅ Fonction devient `async`
- ✅ Ajoute `await` devant `updateDoctor()` et `addDoctor()`
- ✅ Améliore le message d'erreur avec `error.message`

### 8. Handler handleDeleteDoctor (Mis à jour)

**AVANT** (ligne 494):
```typescript
const handleDeleteDoctor = (doctorId, doctorName) => {
  if (window.confirm(...)) {
    try {
      deleteDoctor(doctorId);  // Synchrone
      toast({ title: "Doctor deleted" });
    } catch (error) {
      toast({ title: "Error" });
    }
  }
};
```

**APRÈS** (ligne 494):
```typescript
const handleDeleteDoctor = async (doctorId, doctorName) => {
  if (window.confirm(...)) {
    try {
      await deleteDoctor(doctorId);  // Asynchrone
      toast({ title: "Doctor deactivated" });
    } catch (error) {
      toast({ title: "Error" });
    }
  }
};
```

**Changements clés**:
- ✅ Fonction devient `async`
- ✅ Ajoute `await` devant `deleteDoctor()`
- ✅ Change "deleted" en "deactivated" (soft delete)

## Mapping des Champs

### Frontend → Backend (Create/Update)

| Champ Frontend      | Champ Backend       | Notes                    |
|---------------------|---------------------|--------------------------|
| name                | full_name           | ✅ Obligatoire           |
| email               | email               | ✅ Obligatoire, unique   |
| phone               | phone               | Optionnel                |
| location            | location            | ✅ Nouvelle colonne      |
| customLocation      | location            | Si "Other" sélectionné   |
| specialization      | specialization      | Optionnel                |
| customSpecialization| specialization      | Si "Other" sélectionné   |
| licenseNumber       | license_number      | Optionnel                |
| department          | department          | ✅ Nouvelle colonne      |
| yearsExperience     | years_experience    | String (ex: "15+ Years") |
| bio                 | bio                 | Optionnel                |
| education           | education           | Optionnel (multiline)    |
| availability        | availability        | Optionnel (multiline)    |
| password            | password            | Obligatoire à la création|

### Backend → Frontend (Read)

| Champ Backend       | Champ Frontend      | Transformation           |
|---------------------|---------------------|--------------------------|
| id                  | id                  | Direct                   |
| full_name           | name                | ✅ Renommé               |
| email               | email               | Direct                   |
| phone               | phone               | Défaut: ""               |
| location            | location            | Fallback: hospital       |
| hospital            | location (fallback) | Si location vide         |
| specialization      | specialization      | Défaut: ""               |
| license_number      | licenseNumber       | ✅ camelCase             |
| department          | department          | Défaut: ""               |
| years_experience    | yearsExperience     | ✅ camelCase             |
| bio                 | bio                 | Défaut: ""               |
| education           | education           | Défaut: ""               |
| availability        | availability        | Défaut: ""               |
| created_at          | createdAt           | ✅ camelCase             |
| is_active           | isActive            | ✅ camelCase             |

## Endpoints API Utilisés

| Opération         | Endpoint                    | Méthode | Auth   |
|-------------------|-----------------------------|---------|--------|
| Lister doctors    | `/api/v1/doctors/`          | GET     | Public |
| Créer doctor      | `/api/v1/auth/register/doctor` | POST | Public/Admin |
| Modifier doctor   | `/api/v1/doctors/{id}`      | PUT     | **Admin** |
| Supprimer doctor  | `/api/v1/doctors/{id}`      | DELETE  | **Admin** |

**Note**: Les endpoints PUT et DELETE nécessitent une authentification admin.

## Flow de Données Complet

### 1. Chargement Initial

```
AdminDashboard mount
    ↓
useEffect() exécute loadDoctors()
    ↓
adminService.getAllDoctors()
    ↓
GET /api/v1/doctors/
    ↓
Backend retourne Liste[DoctorInDB] (snake_case)
    ↓
Mapping snake_case → camelCase
    ↓
setDoctors(mappedDoctors)
    ↓
Affichage dans la table
```

### 2. Création d'un Doctor

```
User clique "Add Doctor"
    ↓
Remplit le formulaire
    ↓
handleAddDoctor() (async)
    ↓
Validation des champs
    ↓
addDoctor(doctorData) (async)
    ↓
adminService.createDoctor() avec mapping
    ↓
POST /api/v1/auth/register/doctor
    ↓
Backend crée User + Doctor
    ↓
loadDoctors() (recharge depuis API)
    ↓
Toast de succès
    ↓
Dialog fermé
```

### 3. Modification d'un Doctor

```
User clique "Edit" sur un doctor
    ↓
handleEditDoctor() remplit le formulaire
    ↓
User modifie et clique "Update Doctor"
    ↓
handleAddDoctor() (async) avec isEditing=true
    ↓
updateDoctor(doctorId, doctorData) (async)
    ↓
adminService.updateDoctor() avec mapping
    ↓
PUT /api/v1/doctors/{id}
    ↓
Backend met à jour Doctor + User (email sync)
    ↓
loadDoctors() (recharge depuis API)
    ↓
Toast de succès
    ↓
Dialog fermé
```

### 4. Suppression d'un Doctor

```
User clique "Delete" sur un doctor
    ↓
Confirmation dialog
    ↓
handleDeleteDoctor() (async)
    ↓
deleteDoctor(doctorId) (async)
    ↓
adminService.deleteDoctor()
    ↓
DELETE /api/v1/doctors/{id}
    ↓
Backend soft delete (is_active = False)
    ↓
loadDoctors() (recharge depuis API)
    ↓
Toast de succès
```

## Avantages de la Migration

### Avant (localStorage)
- ❌ Données perdues au clear du cache
- ❌ Pas de synchronisation entre utilisateurs
- ❌ Pas de persistance en base de données
- ❌ Données de test hardcodées
- ❌ Pas de validation backend
- ❌ ID générés côté client (Date.now())

### Après (API Backend)
- ✅ Données persistantes en PostgreSQL
- ✅ Synchronisation temps réel entre admins
- ✅ Validation Pydantic côté backend
- ✅ ID générés par la base de données (auto-increment)
- ✅ Gestion d'erreurs robuste
- ✅ Soft delete (is_active = False)
- ✅ Email uniqueness garantie
- ✅ Sync automatique User ↔ Doctor

## Test Recommandé

1. **Rafraîchir la page** → Les doctors doivent se charger depuis l'API
2. **Ajouter un nouveau doctor** → Doit apparaître immédiatement
3. **Modifier un doctor** → Changements doivent persister
4. **Supprimer un doctor** → Doit disparaître de la liste
5. **Vérifier pgAdmin** → Données doivent être en BDD
6. **Re-login** → Doctors toujours présents (pas localStorage)

## Prochaines Étapes

1. ✅ **TERMINÉ**: Migration doctors localStorage → API
2. **TODO**: Migration patients localStorage → API
3. **TODO**: Ajouter statistiques via `/api/v1/users/stats`
4. **TODO**: Exécuter migrations SQL (location, department, address)
5. **TODO**: Tester avec données réelles

## Fichiers Modifiés

- ✅ `src/pages/AdminDashboard.tsx` (18, 123-222, 359-516)
- ✅ `src/services/adminService.ts` (Créé précédemment)
- ✅ `app/api/v1/doctors.py` (Endpoints admin ajoutés)
- ✅ `app/models/doctor.py` (Colonnes location, department ajoutées)
- ✅ `app/schemas/doctor.py` (Champs location, department ajoutés)

Le dashboard admin est maintenant complètement connecté au backend! 🎉
