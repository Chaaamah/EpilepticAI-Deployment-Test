# Correction du problème de redirection vers login après actualisation

## Problème
Après avoir actualisé la page (F5), l'utilisateur était systématiquement redirigé vers `/login` même s'il était authentifié.

## Cause
Le problème était dû à un **race condition** entre:
1. Le chargement de l'utilisateur depuis `localStorage` dans `AuthContext`
2. La vérification d'authentification dans `ProtectedRoute`

### Timeline du problème

```
Page refresh (F5)
    ↓
ProtectedRoute render #1
    ↓ isAuthenticated = false (user pas encore chargé)
    ↓
Redirect to /login ❌
    ↓
useEffect dans AuthContext execute
    ↓ Load user from localStorage
    ↓ setUser(...)
    ↓
Mais trop tard! Déjà redirigé
```

## Solution appliquée

### 1. Ajout d'un état `isLoading` dans AuthContext

**Fichier**: `src/contexts/AuthContext.tsx`

#### Interface AuthContextType (ligne 32)
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;  // ✅ Nouveau champ
  // ... autres méthodes
}
```

#### État dans le provider (ligne 148)
```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);  // ✅ Commence à true
  // ...
}
```

#### useEffect amélioré (lignes 154-169)
```typescript
useEffect(() => {
  const savedUser = localStorage.getItem("epilepticai_user");
  const authToken = localStorage.getItem("auth_token");

  if (savedUser && authToken) {
    try {
      const parsed = JSON.parse(savedUser);
      setUser({ ...parsed, role: parsed.role as "admin" | "doctor" });
    } catch {
      localStorage.removeItem("epilepticai_user");
      localStorage.removeItem("auth_token");
    }
  }

  setIsLoading(false);  // ✅ Marque le chargement comme terminé
}, []);
```

#### Provider value (ligne 442)
```typescript
return (
  <AuthContext.Provider
    value={{
      user,
      isAuthenticated: !!user,
      isLoading,  // ✅ Expose isLoading
      // ... autres valeurs
    }}
  >
    {children}
  </AuthContext.Provider>
);
```

### 2. Mise à jour de ProtectedRoute

**Fichier**: `src/components/ProtectedRoute.tsx`

#### Utilisation de isLoading (lignes 11-25)
```typescript
const ProtectedRoute = ({ children, allowedRoles = ['admin', 'doctor'] }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  console.log("ProtectedRoute check:", { isAuthenticated, user, allowedRoles, isLoading });

  // ✅ Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ Ne redirige vers login QUE si le chargement est terminé ET l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // ... reste du code
}
```

## Nouvelle Timeline (Corrigée)

```
Page refresh (F5)
    ↓
ProtectedRoute render #1
    ↓ isLoading = true
    ↓
Affiche le loader (spinner) ✅
    ↓
useEffect dans AuthContext execute
    ↓ Load user from localStorage
    ↓ Load auth_token from localStorage
    ↓ setUser(parsed)
    ↓ setIsLoading(false)
    ↓
ProtectedRoute re-render
    ↓ isLoading = false
    ↓ isAuthenticated = true
    ↓
Affiche le contenu protégé ✅
Reste sur la page actuelle ✅
```

## Vérifications de sécurité

### Double vérification localStorage
```typescript
const savedUser = localStorage.getItem("epilepticai_user");
const authToken = localStorage.getItem("auth_token");

if (savedUser && authToken) {  // ✅ Les deux doivent exister
  // ...
}
```

### Nettoyage en cas d'erreur
```typescript
try {
  const parsed = JSON.parse(savedUser);
  setUser({ ...parsed, role: parsed.role as "admin" | "doctor" });
} catch {
  // ✅ En cas d'erreur de parsing, nettoyer le localStorage
  localStorage.removeItem("epilepticai_user");
  localStorage.removeItem("auth_token");
}
```

## États possibles

| isLoading | isAuthenticated | user  | Comportement                          |
|-----------|-----------------|-------|---------------------------------------|
| true      | false           | null  | Affiche loader (en cours de charge)   |
| false     | false           | null  | Redirige vers /login                  |
| false     | true            | {...} | Affiche le contenu protégé            |

## Test

### Scénario 1: Utilisateur connecté actualise la page
1. Utilisateur sur `/dashboard`
2. Appuie sur F5
3. ✅ Voit brièvement le loader
4. ✅ Reste sur `/dashboard` (pas de redirection)
5. ✅ Contenu chargé normalement

### Scénario 2: Utilisateur non connecté tente d'accéder à une page protégée
1. Utilisateur tape `/dashboard` dans l'URL
2. Pas d'auth dans localStorage
3. ✅ Voit brièvement le loader
4. ✅ Redirigé vers `/login`

### Scénario 3: Token corrompu
1. localStorage contient des données invalides
2. Actualisation
3. ✅ Catch l'erreur
4. ✅ Nettoie localStorage
5. ✅ Redirige vers `/login`

## Fichiers modifiés

1. ✅ `src/contexts/AuthContext.tsx`
   - Ligne 32: Ajout `isLoading` à l'interface
   - Ligne 148: État `isLoading` initialisé à `true`
   - Lignes 154-169: useEffect avec vérification token et setIsLoading
   - Ligne 442: Export `isLoading` dans le provider

2. ✅ `src/components/ProtectedRoute.tsx`
   - Ligne 11: Utilisation de `isLoading` depuis useAuth
   - Lignes 16-25: Affichage du loader pendant isLoading
   - Ligne 27: Vérification authentification seulement si !isLoading

## Avantages

✅ **Plus de redirection intempestive** vers login après F5
✅ **Meilleure UX** avec loader pendant le chargement
✅ **Sécurisé** - vérifie à la fois user et token
✅ **Robuste** - gère les erreurs de parsing
✅ **Performant** - chargement instantané depuis localStorage

## Note importante

Le `isLoading` commence à `true` et passe à `false` APRÈS que le useEffect ait terminé de vérifier localStorage. Cela garantit qu'on ne redirige jamais prématurément vers login.
