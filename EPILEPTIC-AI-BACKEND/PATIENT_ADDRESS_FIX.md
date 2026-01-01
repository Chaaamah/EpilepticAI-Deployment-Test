# Correction du champ Address pour les patients

## Problème

Lors de la modification des informations d'un patient, le champ **Address** (adresse) ne se stockait pas dans la base de données.

### Symptômes
- L'utilisateur modifie l'adresse dans le formulaire EditPatient
- Clique "Save Changes"
- L'adresse n'est pas sauvegardée dans la base de données ❌
- Après rechargement, le champ Address reste vide ❌

## Cause

Le champ `address` n'existait pas dans la table `patients` de la base de données ni dans les schémas backend.

### Analyse du Problème

#### 1. Frontend (EditPatient.tsx)
Le formulaire capture bien le champ `address` (ligne 50):
```typescript
const [formData, setFormData] = useState({
  name: "",
  age: "",
  phone: "",
  email: "",
  address: "",  // ✅ Champ présent
  description: "",
  healthStatus: "",
});
```

Mais lors de la soumission (ligne 108 - AVANT):
```typescript
await updatePatient(Number(id), {
  // ... autres champs
  country: formData.address, // ❌ Mappé vers "country"
});
```

#### 2. PatientsContext (ligne 223 - AVANT)
```typescript
if ((data as any).country) updates.hospital = (data as any).country;
// ❌ "country" → "hospital" au lieu de "address" → "address"
```

#### 3. Backend - Modèle Patient
**AVANT**: Pas de colonne `address` dans la table `patients`

#### 4. Backend - Schémas Pydantic
**AVANT**: Pas de champ `address` dans `PatientBase`, `PatientUpdate`, etc.

### Flow du Problème (AVANT)

```
EditPatient.tsx
    ↓ formData.address = "123 Rue de Paris"
    ↓
updatePatient({ country: "123 Rue de Paris" })
    ↓
PatientsContext
    ↓ country → hospital mapping
    ↓
API PUT /api/v1/doctors/patients/{id}
    ↓ updates.hospital = "123 Rue de Paris"
    ↓
Backend receives { hospital: "123 Rue de Paris" }
    ✅ Stocké dans la colonne "hospital"
    ❌ Pas de colonne "address"
    ❌ L'adresse écrase l'hôpital!
```

## Solution Appliquée

### 1. Migration SQL - Ajouter la colonne `address`

**Fichier**: `add_patient_address_column.sql`

```sql
-- Add address column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comment to document the column
COMMENT ON COLUMN patients.address IS 'Patient home address';
```

**Exécution**:
Via pgAdmin ou psql:
```bash
psql -U postgres -d epileptic_ai -f add_patient_address_column.sql
```

### 2. Backend - Modèle Patient

**Fichier**: `app/models/patient.py` (lignes 30-31)

```python
# Medical Team
treating_neurologist = Column(String, nullable=True)
hospital = Column(String, nullable=True)

# Contact Information
address = Column(Text, nullable=True)  # ✅ Nouvelle colonne

# Health Status
health_status = Column(String, nullable=True, default='stable')
```

### 3. Backend - Schémas Pydantic

**Fichier**: `app/schemas/patient.py`

Ajout de `address` dans **tous** les schémas:

#### PatientBase (lignes 33-36)
```python
treating_neurologist: Optional[str] = None
hospital: Optional[str] = None
address: Optional[str] = None  # ✅ Ajouté
health_status: Optional[str] = None
```

#### PatientCreateByDoctor (lignes 62-64)
```python
treating_neurologist: Optional[str] = None
hospital: Optional[str] = None
address: Optional[str] = None  # ✅ Ajouté
```

#### PatientUpdate (lignes 75-78)
```python
treating_neurologist: Optional[str] = None
hospital: Optional[str] = None
address: Optional[str] = None  # ✅ Ajouté
health_status: Optional[str] = None
```

### 4. Frontend - PatientsContext

**Fichier**: `src/contexts/PatientsContext.tsx`

#### Interface Patient (lignes 29-30)
```typescript
hospital?: string;
address?: string;  // ✅ Ajouté
```

#### loadPatients() - Mapping backend → frontend (lignes 109-110)
```typescript
hospital: p.hospital || '',
address: p.address || ''  // ✅ Ajouté
```

#### updatePatient() - Mapping frontend → backend (ligne 226)
```typescript
if ((data as any).country) updates.hospital = (data as any).country;
if ((data as any).address !== undefined) updates.address = (data as any).address;  // ✅ Ajouté
```

### 5. Frontend - EditPatient.tsx

**Fichier**: `src/pages/EditPatient.tsx` (ligne 108)

**AVANT**:
```typescript
await updatePatient(Number(id), {
  // ...
  country: formData.address, // ❌ Mappé vers country/hospital
});
```

**APRÈS**:
```typescript
await updatePatient(Number(id), {
  // ...
  address: formData.address,  // ✅ Envoyé directement comme address
});
```

## Nouveau Flow (CORRIGÉ)

```
EditPatient.tsx
    ↓ formData.address = "123 Rue de Paris"
    ↓
updatePatient({ address: "123 Rue de Paris" })  ✅
    ↓
PatientsContext
    ↓ address → address mapping ✅
    ↓
API PUT /api/v1/doctors/patients/{id}
    ↓ updates.address = "123 Rue de Paris" ✅
    ↓
Backend receives { address: "123 Rue de Paris" }
    ↓
Pydantic validation (PatientUpdate schema) ✅
    ↓
SQLAlchemy ORM update
    ↓
Database UPDATE patients SET address = '123 Rue de Paris' ✅
    ↓
Success ✅
```

## Mapping Complet

| Frontend Field | Backend Field | Table Column | Type |
|----------------|---------------|--------------|------|
| address        | address       | address      | TEXT |
| hospital       | hospital      | hospital     | String |

**Note**: Les deux champs sont maintenant **distincts et indépendants**:
- `address` = Adresse personnelle du patient
- `hospital` = Hôpital où le patient est traité

## Test

### Scénario 1: Modifier l'adresse d'un patient

1. Ouvrir `/patients/{id}/edit`
2. Remplir le champ "Address": `123 Rue de la Paix, Paris 75002`
3. Cliquer "Save Changes"
4. ✅ Vérifier qu'il n'y a pas d'erreur
5. ✅ Vérifier que l'adresse s'affiche dans PatientDetail
6. Actualiser la page
7. ✅ Vérifier que l'adresse est toujours présente

### Scénario 2: Vérification base de données

```sql
SELECT id, full_name, address, hospital
FROM patients
WHERE id = 1;
```

**Résultat attendu**:
```
id | full_name    | address                        | hospital
---+--------------+--------------------------------+------------------
1  | John Doe     | 123 Rue de la Paix, Paris      | CHU de Paris
```

### Scénario 3: Créer un nouveau patient avec adresse

1. Utiliser l'endpoint `POST /api/v1/doctors/patients`
2. Envoyer:
```json
{
  "email": "patient@example.com",
  "full_name": "Jane Doe",
  "password": "password123",
  "address": "456 Avenue des Champs-Élysées"
}
```
3. ✅ Patient créé avec l'adresse

## Fichiers Modifiés

### Backend
1. ✅ `app/models/patient.py` - Ligne 31 (ajout colonne address)
2. ✅ `app/schemas/patient.py` - Lignes 35, 64, 77 (ajout champ address dans tous les schémas)
3. ✅ Créé: `add_patient_address_column.sql` - Migration SQL

### Frontend
4. ✅ `src/contexts/PatientsContext.tsx` - Lignes 30, 110, 226 (ajout champ address)
5. ✅ `src/pages/EditPatient.tsx` - Ligne 108 (mapping direct address)

## Instructions de Déploiement

### 1. Exécuter la migration SQL

**Via pgAdmin**:
1. Ouvrir pgAdmin 4
2. Se connecter à la base de données `epileptic_ai`
3. Clic droit → Query Tool
4. Copier/coller le contenu de `add_patient_address_column.sql`
5. Exécuter (F5)

**Via psql**:
```bash
psql -U postgres -d epileptic_ai -f add_patient_address_column.sql
```

### 2. Vérifier que la colonne a été ajoutée

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'patients' AND column_name = 'address';
```

### 3. Redémarrer le backend

```bash
cd EPILEPTIC-AI-BACKEND
docker compose restart backend
```

### 4. Vérifier les logs

```bash
docker compose logs backend --tail=50
```

### 5. Tester l'application

1. Ouvrir l'interface web
2. Modifier un patient et remplir l'adresse
3. Sauvegarder
4. Vérifier que l'adresse est bien stockée

## Résultat

Maintenant, le champ **Address** dans le formulaire EditPatient:
- ✅ Est stocké dans la colonne `address` de la table `patients`
- ✅ Est distinct du champ `hospital`
- ✅ Persiste après rechargement
- ✅ S'affiche correctement dans l'interface
- ✅ Peut être modifié indépendamment

L'adresse personnelle du patient et l'hôpital sont maintenant deux informations séparées et correctement gérées.
