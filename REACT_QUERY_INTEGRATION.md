# Guide d'Intégration React Query

Ce guide explique comment intégrer React Query avec les services API créés pour remplacer les données mock par des données réelles du backend.

## 📋 Table des Matières
1. [Structure des Hooks](#structure-des-hooks)
2. [Exemples d'Implémentation](#exemples-dimplémentation)
3. [Mise à Jour des Pages](#mise-à-jour-des-pages)
4. [Gestion des Erreurs](#gestion-des-erreurs)

---

## 🎯 Structure des Hooks

Créez un dossier `src/hooks/api/` avec un fichier par domaine fonctionnel.

### Fichiers à Créer

```
src/hooks/api/
├── useAuth.ts          # Authentification
├── usePatients.ts      # Gestion patients
├── useDashboard.ts     # Dashboard stats
├── useAlerts.ts        # Alertes
├── useSeizures.ts      # Crises
├── useMedications.ts   # Médicaments
└── useClinicalNotes.ts # Notes cliniques
```

---

## 📝 Exemples d'Implémentation

### 1. useAuth.ts

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { LoginRequest, RegisterRequest } from '@/types/api';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.access_token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useRegisterDoctor() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.registerDoctor(data),
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.access_token);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
  });
}
```

### 2. usePatients.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '@/services/patientService';
import { PatientCreateRequest, PatientUpdateRequest } from '@/types/api';

// Get all patients with metrics
export function usePatients(params?: {
  skip?: number;
  limit?: number;
  health_status?: string;
}) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientService.getPatientsWithMetrics(params),
    staleTime: 30000, // 30 seconds
  });
}

// Get single patient
export function usePatient(id: number) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getPatientById(id),
    enabled: !!id,
  });
}

// Create patient
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PatientCreateRequest) => patientService.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// Update patient
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PatientUpdateRequest }) =>
      patientService.updatePatient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', variables.id] });
    },
  });
}

// Delete patient
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => patientService.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// Transfer patient
export function useTransferPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newDoctorEmail }: { id: number; newDoctorEmail: string }) =>
      patientService.transferPatient(id, newDoctorEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
```

### 3. useDashboard.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getStats,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useSeizureStatistics(days: number = 30) {
  return useQuery({
    queryKey: ['seizureStatistics', days],
    queryFn: () => dashboardService.getSeizureStatistics(days),
    staleTime: 60000,
  });
}

export function useSeizureHistory(params?: {
  days?: number;
  patient_id?: number;
  skip?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['seizureHistory', params],
    queryFn: () => dashboardService.getSeizureHistory(params),
    staleTime: 30000,
  });
}
```

### 4. useAlerts.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '@/services/alertService';

export function useAlerts(params?: {
  active_only?: boolean;
  days?: number;
  skip?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertService.getAlerts(params),
    staleTime: 30000,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

export function useUnreadAlerts() {
  return useQuery({
    queryKey: ['alerts', 'unread'],
    queryFn: alertService.getUnreadAlerts,
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => alertService.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      alertService.resolveAlert(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
```

### 5. useSeizures.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seizureService } from '@/services/seizureService';
import { SeizureCreateRequest } from '@/types/api';

export function useSeizures(days: number = 30) {
  return useQuery({
    queryKey: ['seizures', days],
    queryFn: () => seizureService.getSeizures(days),
    staleTime: 30000,
  });
}

export function useSeizure(id: number) {
  return useQuery({
    queryKey: ['seizure', id],
    queryFn: () => seizureService.getSeizureById(id),
    enabled: !!id,
  });
}

export function useCreateSeizure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SeizureCreateRequest) => seizureService.createSeizure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seizures'] });
      queryClient.invalidateQueries({ queryKey: ['seizureHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useUpdateSeizure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SeizureCreateRequest> }) =>
      seizureService.updateSeizure(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seizures'] });
      queryClient.invalidateQueries({ queryKey: ['seizure', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['seizureHistory'] });
    },
  });
}
```

### 6. useClinicalNotes.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalNoteService } from '@/services/clinicalNoteService';
import { ClinicalNoteCreateRequest, ClinicalNoteUpdateRequest } from '@/types/api';

export function usePatientNotes(patientId: number) {
  return useQuery({
    queryKey: ['clinicalNotes', patientId],
    queryFn: () => clinicalNoteService.getPatientNotes(patientId),
    enabled: !!patientId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClinicalNoteCreateRequest) => clinicalNoteService.createNote(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clinicalNotes', variables.patient_id] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClinicalNoteUpdateRequest }) =>
      clinicalNoteService.updateNote(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clinicalNotes', data.patient_id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clinicalNoteService.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicalNotes'] });
    },
  });
}
```

---

## 🔄 Mise à Jour des Pages

### Exemple: Dashboard.tsx

**Avant (avec mock data):**
```typescript
const Dashboard = () => {
  // Mock data
  const stats = {
    newSeizures: 12,
    pending: 8,
    highRisk: 15,
  };

  return (
    <div>
      <h1>New Seizures: {stats.newSeizures}</h1>
      {/* ... */}
    </div>
  );
};
```

**Après (avec React Query):**
```typescript
import { useDashboardStats, useSeizureStatistics } from '@/hooks/api/useDashboard';
import { usePatients } from '@/hooks/api/usePatients';

const Dashboard = () => {
  const { data: stats, isLoading, error } = useDashboardStats();
  const { data: seizureStats } = useSeizureStatistics(7); // 7 days
  const { data: patients } = usePatients({ limit: 10 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading dashboard</div>;

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>New Seizures</CardHeader>
          <CardContent>
            <p className="text-4xl">{stats?.recent_seizures_this_week}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Critical Patients</CardHeader>
          <CardContent>
            <p className="text-4xl">{stats?.critical_patients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>High Risk</CardHeader>
          <CardContent>
            <p className="text-4xl">{stats?.high_risk_patients}</p>
          </CardContent>
        </Card>
      </div>

      {/* Seizure Activity Chart */}
      {seizureStats && (
        <LineChart data={seizureStats.daily_counts}>
          {/* Chart config */}
        </LineChart>
      )}

      {/* Recent Patients */}
      {patients?.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
};
```

### Exemple: Patients.tsx

**Avant:**
```typescript
const Patients = () => {
  const { patients } = usePatientsContext();

  return (
    <div>
      {patients.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  );
};
```

**Après:**
```typescript
import { usePatients, useDeletePatient } from '@/hooks/api/usePatients';
import { useState } from 'react';

const Patients = () => {
  const [healthStatus, setHealthStatus] = useState<string | undefined>();

  const { data: patients, isLoading, error } = usePatients({ health_status: healthStatus });
  const deleteMutation = useDeletePatient();

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <div>Loading patients...</div>;
  if (error) return <div>Error loading patients</div>;

  return (
    <div>
      <h1>Patients</h1>

      {/* Filter */}
      <Select value={healthStatus} onValueChange={setHealthStatus}>
        <SelectItem value="">All</SelectItem>
        <SelectItem value="critical">Critical</SelectItem>
        <SelectItem value="high-risk">High Risk</SelectItem>
        <SelectItem value="stable">Stable</SelectItem>
      </Select>

      {/* Patient List */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Risk Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients?.map(patient => (
            <TableRow key={patient.id}>
              <TableCell>{patient.full_name}</TableCell>
              <TableCell>{patient.risk_score.toFixed(1)}</TableCell>
              <TableCell>
                <Badge variant={patient.health_status === 'critical' ? 'destructive' : 'default'}>
                  {patient.health_status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button onClick={() => handleDelete(patient.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
```

### Exemple: PatientDetail.tsx

```typescript
import { useParams } from 'react-router-dom';
import { usePatient } from '@/hooks/api/usePatients';
import { usePatientNotes, useCreateNote } from '@/hooks/api/useClinicalNotes';
import { useSeizureHistory } from '@/hooks/api/useDashboard';

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);

  const { data: patient, isLoading } = usePatient(patientId);
  const { data: notes } = usePatientNotes(patientId);
  const { data: seizures } = useSeizureHistory({ patient_id: patientId });
  const createNoteMutation = useCreateNote();

  const handleAddNote = async (data: any) => {
    await createNoteMutation.mutateAsync({
      patient_id: patientId,
      ...data,
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (!patient) return <div>Patient not found</div>;

  return (
    <div>
      <h1>{patient.full_name}</h1>
      <p>Email: {patient.email}</p>
      <p>Epilepsy Type: {patient.epilepsy_type}</p>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seizures">Seizures ({seizures?.length || 0})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="seizures">
          {seizures?.map(seizure => (
            <div key={seizure.id}>
              <p>{new Date(seizure.start_time).toLocaleString()}</p>
              <p>Type: {seizure.seizure_type}</p>
              <p>Duration: {seizure.duration_minutes} min</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="notes">
          <Button onClick={() => handleAddNote({
            note_type: 'consultation',
            title: 'New Note',
            content: 'Note content...'
          })}>
            Add Note
          </Button>

          {notes?.map(note => (
            <div key={note.id}>
              <h3>{note.title}</h3>
              <p>{note.content}</p>
              <small>{note.created_by} - {new Date(note.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

---

## ⚠️ Gestion des Erreurs

### Composant ErrorBoundary

```typescript
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function QueryErrorHandler({ error }: { error: any }) {
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.detail || error.message || 'An error occurred',
      });
    }
  }, [error, toast]);

  return null;
}
```

### Utilisation dans les composants

```typescript
const { data, error } = usePatients();

if (error) {
  return <QueryErrorHandler error={error} />;
}
```

---

## 🔥 Conseils de Performance

### 1. Utiliser staleTime
```typescript
useQuery({
  queryKey: ['patients'],
  queryFn: getPatients,
  staleTime: 60000, // 1 minute - évite les refetch trop fréquents
});
```

### 2. Pagination
```typescript
const [page, setPage] = useState(0);
const limit = 20;

const { data } = usePatients({
  skip: page * limit,
  limit,
});
```

### 3. Refetch Interval pour les données temps réel
```typescript
useAlerts({
  refetchInterval: 30000, // Refetch toutes les 30 secondes
});
```

### 4. Optimistic Updates
```typescript
const updateMutation = useUpdatePatient();

updateMutation.mutate(
  { id, data },
  {
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['patient', id] });
      const previousData = queryClient.getQueryData(['patient', id]);
      queryClient.setQueryData(['patient', id], newData);
      return { previousData };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['patient', id], context?.previousData);
    },
  }
);
```

---

## ✅ Checklist d'Intégration

- [ ] Créer tous les hooks dans `src/hooks/api/`
- [ ] Mettre à jour `AuthContext` pour utiliser `useLogin` et `useCurrentUser`
- [ ] Mettre à jour `Dashboard.tsx` pour utiliser `useDashboardStats`
- [ ] Mettre à jour `Patients.tsx` pour utiliser `usePatients`
- [ ] Mettre à jour `PatientDetail.tsx` pour utiliser `usePatient` et `usePatientNotes`
- [ ] Mettre à jour `Alerts.tsx` pour utiliser `useAlerts`
- [ ] Remplacer tous les appels à `localStorage` pour les données patients
- [ ] Tester toutes les fonctionnalités CRUD
- [ ] Ajouter des indicateurs de chargement
- [ ] Gérer les erreurs avec des toasts/notifications
- [ ] Tester la pagination
- [ ] Vérifier les refetch automatiques

---

## 📚 Ressources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Best Practices](https://tkdodo.eu/blog/practical-react-query)

---

**Version:** 1.0.0
**Dernière mise à jour:** 30 Décembre 2025
