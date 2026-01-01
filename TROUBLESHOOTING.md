# 🔧 Résolution des Problèmes Docker

## 🚨 Erreur: "failed to receive status: rpc error"

### Cause
Cette erreur est généralement causée par:
- Manque de ressources (RAM/CPU) pour Docker
- Connexion réseau instable
- Build cache corrompu
- Timeout pendant le téléchargement des dépendances npm

### Solutions

#### Solution 1: Augmenter les Ressources Docker (Recommandé)

**Windows/Mac - Docker Desktop:**
1. Ouvrir Docker Desktop
2. Settings → Resources
3. Augmenter:
   - **Memory:** Au moins 4 GB (recommandé: 6-8 GB)
   - **CPUs:** Au moins 2 cores (recommandé: 4)
   - **Disk:** Au moins 20 GB
4. Cliquer "Apply & Restart"
5. Relancer le build

#### Solution 2: Build en Mode Séquentiel

Au lieu de builder tous les services en parallèle, buildons-les un par un:

```powershell
# Arrêter tout
docker compose down

# Build backend d'abord (plus rapide)
docker compose build backend

# Puis frontend (plus long)
docker compose build frontend

# Puis démarrer
docker compose up -d
```

#### Solution 3: Build avec Retry

```powershell
# Script PowerShell avec retry
$maxRetries = 3
$retryCount = 0
$success = $false

while (-not $success -and $retryCount -lt $maxRetries) {
    $retryCount++
    Write-Host "Tentative $retryCount/$maxRetries..." -ForegroundColor Yellow

    try {
        docker compose build frontend
        $success = $true
        Write-Host "✅ Build réussi!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Échec, nouvelle tentative..." -ForegroundColor Red
        Start-Sleep -Seconds 5
    }
}

if ($success) {
    docker compose up -d
}
```

#### Solution 4: Nettoyer le Cache Docker

```powershell
# Nettoyer le cache build
docker builder prune -a -f

# Nettoyer tout Docker
docker system prune -a --volumes -f

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d
```

#### Solution 5: Build Sans Cache avec Timeout Plus Long

Modifiez temporairement le `Dockerfile` du frontend:

**EpilepticAI-web/Dockerfile:**
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install with retry and longer timeout
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build
RUN npm run build

# Stage 2: Production (pas de changement)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Puis rebuild:
```powershell
docker compose build --no-cache frontend
```

---

## 🔄 Alternative: Build Local Puis Docker

Si le build Docker continue d'échouer, buildons le frontend localement puis copions-le:

### Étape 1: Build Local

```powershell
# Aller dans le dossier frontend
cd EpilepticAI-web

# Installer dépendances localement
npm install

# Build production
npm run build

# Retour à la racine
cd ..
```

### Étape 2: Utiliser un Dockerfile Simplifié

Créez `EpilepticAI-web/Dockerfile.simple`:

```dockerfile
FROM nginx:alpine

# Copy pre-built app
COPY dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Étape 3: Modifier docker-compose.yml

```yaml
frontend:
  build:
    context: ./EpilepticAI-web
    dockerfile: Dockerfile.simple  # Utiliser le Dockerfile simplifié
```

### Étape 4: Build et Démarrer

```powershell
docker compose build frontend
docker compose up -d
```

---

## 🚀 Solution Quick Fix Complète

Utilisez ce script PowerShell qui gère tout automatiquement:

**fix-docker-build.ps1:**

```powershell
Write-Host "🔧 Script de correction du build Docker" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Nettoyer Docker
Write-Host "1. Nettoyage Docker..." -ForegroundColor Yellow
docker compose down
docker builder prune -f
Write-Host "✅ Nettoyage terminé" -ForegroundColor Green
Write-Host ""

# Étape 2: Build backend (rapide)
Write-Host "2. Build backend..." -ForegroundColor Yellow
docker compose build backend
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend build réussi" -ForegroundColor Green
} else {
    Write-Host "❌ Échec build backend" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Étape 3: Build frontend avec retry
Write-Host "3. Build frontend (avec retry)..." -ForegroundColor Yellow
$maxRetries = 3
$retryCount = 0
$success = $false

while (-not $success -and $retryCount -lt $maxRetries) {
    $retryCount++
    Write-Host "   Tentative $retryCount/$maxRetries..." -ForegroundColor Cyan

    docker compose build --no-cache frontend 2>&1

    if ($LASTEXITCODE -eq 0) {
        $success = $true
        Write-Host "✅ Frontend build réussi" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Échec, attente 10s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
}

if (-not $success) {
    Write-Host ""
    Write-Host "❌ Build frontend échoué après $maxRetries tentatives" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions alternatives:" -ForegroundColor Yellow
    Write-Host "1. Augmenter RAM Docker (Settings → Resources → Memory → 6GB+)"
    Write-Host "2. Build local: cd EpilepticAI-web; npm install; npm run build"
    Write-Host "3. Vérifier connexion internet"
    exit 1
}

Write-Host ""

# Étape 4: Démarrer les services
Write-Host "4. Démarrage des services..." -ForegroundColor Yellow
docker compose up -d

Write-Host ""
Write-Host "✅ Tous les services démarrés!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Accès:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost" -ForegroundColor White
Write-Host "   API Docs: http://localhost/api/v1/docs" -ForegroundColor White
Write-Host ""
```

**Utilisation:**
```powershell
.\fix-docker-build.ps1
```

---

## 📊 Vérifier les Ressources Docker

```powershell
# Voir les ressources actuelles
docker system df

# Voir les stats en temps réel
docker stats

# Info Docker
docker info | Select-String "Memory", "CPUs"
```

---

## 🔍 Diagnostique Avancé

Si le problème persiste:

### 1. Vérifier les Logs Build

```powershell
# Build avec logs verbeux
docker compose build --progress=plain frontend 2>&1 | Tee-Object -FilePath build.log

# Analyser le fichier build.log
```

### 2. Tester la Connexion npm

```powershell
# Dans le container
docker run --rm -it node:18-alpine sh
npm config set registry https://registry.npmjs.org/
npm install -g npm
exit
```

### 3. Build Avec Variables d'Environnement

```powershell
# Augmenter timeout
$env:COMPOSE_HTTP_TIMEOUT=300
$env:DOCKER_CLIENT_TIMEOUT=300
docker compose build
```

---

## ✅ Checklist de Résolution

- [ ] Docker Desktop en cours d'exécution
- [ ] RAM Docker ≥ 4 GB (idéal: 6-8 GB)
- [ ] CPUs Docker ≥ 2 cores
- [ ] Connexion internet stable
- [ ] Pas d'antivirus bloquant Docker
- [ ] Cache Docker nettoyé (`docker builder prune -a`)
- [ ] Essayé build séquentiel (backend puis frontend)
- [ ] Essayé build avec retry
- [ ] Essayé build local + Dockerfile simple

---

## 🆘 Si Rien ne Marche

### Option de Dernier Recours: Skip Docker Build

1. **Build tout localement:**
   ```powershell
   # Backend
   cd EPILEPTIC-AI-BACKEND
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt

   # Frontend
   cd ..\EpilepticAI-web
   npm install
   npm run build
   ```

2. **Utiliser docker-compose.dev.yml:**
   - Backend: Volume mount du code
   - Frontend: Servir depuis `npm run dev` (pas Docker)

3. **Contacter support:**
   - Partager les logs (`build.log`)
   - Spécifications machine (RAM, CPU, OS)
   - Version Docker Desktop

---

## 📞 Informations Utiles

**Versions Recommandées:**
- Docker Desktop: 4.25+
- RAM Allouée: 6-8 GB
- CPUs: 4 cores
- Disk: 30 GB

**Ressources:**
- [Docker Desktop Settings](https://docs.docker.com/desktop/settings/windows/)
- [Troubleshooting Docker](https://docs.docker.com/desktop/troubleshoot/overview/)

---

**Mise à jour:** 30 Décembre 2025
