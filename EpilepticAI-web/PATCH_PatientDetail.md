# Instructions pour intégrer VitalSignsCard dans PatientDetail.tsx

## 1. Ajouter l'import

Après la ligne 50 (après les imports de services), ajoutez:

```typescript
import VitalSignsCard from "@/components/VitalSignsCard";
```

## 2. Supprimer le code des vitalSigns calculés

**SUPPRIMER** les lignes 598-604 (l'objet vitalSigns):

```typescript
  const vitalSigns = {
    bloodPressure: `${110 + Math.floor(patient.riskScore / 5)}/${70 + Math.floor(patient.riskScore / 10)}`,
    spo2: Math.max(94, 100 - Math.floor(patient.riskScore / 20)),
    temperature: (36.5 + (patient.riskScore / 100)).toFixed(1),
    respiratoryRate: 16 + Math.floor(patient.riskScore / 20),
    weight: 50 + patient.age,
  };
```

## 3. Remplacer la carte Vital Signs

**REMPLACER** tout le bloc des lignes 732-783 (le Card "Vital Signs") par:

```tsx
              {/* Vital Signs Card */}
              <VitalSignsCard patientId={patient.id} />
```

C'est tout! Le composant VitalSignsCard affichera maintenant les données biométriques en temps réel depuis l'API.

---

## Alternative: Modification manuelle complète

Si vous préférez modifier manuellement, voici les changements complets:

### Avant (lignes 732-783):
```tsx
              {/* Vital Signs Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-primary">⊞</span> Signes vitaux
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  {/* ... 50 lignes de code ... */}
                </CardContent>
              </Card>
```

### Après:
```tsx
              {/* Vital Signs Card */}
              <VitalSignsCard patientId={patient.id} />
```

La modification réduit ~50 lignes de code statique en 1 ligne qui affiche des données réelles!
