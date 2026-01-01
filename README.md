# 🏥 EpilepticAI - Plateforme de Suivi des Patients Épileptiques

> Système complet de suivi médical avec IA pour la prédiction et la gestion des crises d'épilepsie

## 📖 Vue d'Ensemble

EpilepticAI est une plateforme web qui connecte:
- **Backend API (FastAPI + PostgreSQL)** - EPILEPTIC-AI-BACKEND
- **Application Web (React + TypeScript)** - EpilepticAI-web

Le système permet aux médecins de:
- Gérer leurs patients épileptiques
- Suivre l'historique des crises
- Visualiser des métriques et statistiques
- Recevoir des alertes en temps réel
- Gérer les prescriptions médicales
- Annoter les dossiers patients

---

## 🎯 Fonctionnalités

### ✅ MUST HAVE (Implémentées)

| Fonctionnalité | Description | Statut |
|----------------|-------------|--------|
| **Gestion Patients** | CRUD complet avec username/password | ✅ |
| **Dashboard** | Métriques (total, crises récentes, high-risk) | ✅ |
| **Graphiques** | Visualisation crises vs temps | ✅ |
| **Navigation** | Menu (Accueil, Patients, Historique) + Icons | ✅ |
| **Liste Patients** | Filtres (alphabétique, status, date) | ✅ |
| **Historique** | Journal complet des crises | ✅ |
| **Détail Patient** | Informations complètes + graphes + métriques | ✅ |
| **Prescriptions** | CRUD médicaments | ✅ |

### 🎁 NICE TO HAVE (Implémentées)

| Fonctionnalité | Description | Statut |
|----------------|-------------|--------|
| **Transfert Patient** | Vers un autre médecin | ✅ |
| **Notes Cliniques** | Annotations, commentaires, suivi | ✅ |

---

## 🚀 Démarrage Rapide

### 🐳 Option 1: Docker (Recommandé - 2 minutes)

**Prérequis:** Docker Desktop installé

```bash
# Démarrer tout avec une commande
docker compose up -d

# Ou utiliser le script
.\start.ps1        # Windows
./start.sh         # Linux/Mac
```

**✅ Application disponible:** http://localhost

📚 **Voir [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) pour plus de détails**

---

### 💻 Option 2: Installation Manuelle

**Prérequis:**
- **Python 3.11+** (Backend)
- **Node.js 18+** (Frontend)
- **PostgreSQL 15+** (Database)
- **npm ou yarn** (Package manager)

#### Installation en 3 Étapes

#### 1. Backend

```bash
cd EPILEPTIC-AI-BACKEND

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer la base de données
# Editer .env avec vos credentials PostgreSQL
# DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/epileptic_ai

# Exécuter les migrations
alembic upgrade head

# Lancer le serveur
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend disponible:** http://localhost:8000
**API Docs:** http://localhost:8000/docs

#### 2. Frontend

```bash
cd EpilepticAI-web

# Installer les dépendances
npm install

# Créer le fichier .env (déjà créé)
# VITE_API_BASE_URL=http://localhost:8000

# Lancer le serveur de développement
npm run dev
```

**Frontend disponible:** http://localhost:8080

#### 3. Tester la Connexion

**Linux/Mac:**
```bash
chmod +x test_backend.sh
./test_backend.sh
```

**Windows PowerShell:**
```powershell
.\test_backend.ps1
```

---

## 📚 Documentation

### Guides Complets

| Document | Description | Pages |
|----------|-------------|-------|
| **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** | Guide complet d'intégration backend-frontend | 17 |
| **[REACT_QUERY_INTEGRATION.md](./REACT_QUERY_INTEGRATION.md)** | Guide React Query avec exemples | 15 |
| **[SUMMARY.md](./SUMMARY.md)** | Résumé du travail accompli | 12 |

### Contenu des Guides

**INTEGRATION_GUIDE.md** contient:
- Liste complète des endpoints API
- Configuration backend/frontend
- Instructions de démarrage
- Exemples de requêtes/réponses
- Troubleshooting

**REACT_QUERY_INTEGRATION.md** contient:
- Hooks React Query pour chaque fonctionnalité
- Exemples d'implémentation complets
- Migration des pages existantes
- Best practices et optimisations

---

## 🏗️ Architecture

### Structure du Projet

```
New folder (2)/
├── EPILEPTIC-AI-BACKEND/      # API Backend (FastAPI)
│   ├── app/
│   │   ├── api/v1/             # Routes API
│   │   ├── models/             # Modèles SQLAlchemy
│   │   ├── schemas/            # Schémas Pydantic
│   │   ├── services/           # Business logic
│   │   └── core/               # Configuration
│   ├── alembic/                # Migrations DB
│   └── requirements.txt
│
├── EpilepticAI-web/            # Frontend React
│   ├── src/
│   │   ├── components/         # Composants React
│   │   ├── pages/              # Pages principales
│   │   ├── contexts/           # React Contexts
│   │   ├── services/           # Services API
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilitaires
│   │   └── types/              # Types TypeScript
│   ├── .env                    # Configuration
│   └── package.json
│
├── INTEGRATION_GUIDE.md        # Guide d'intégration
├── REACT_QUERY_INTEGRATION.md  # Guide React Query
├── SUMMARY.md                  # Résumé
├── test_backend.sh             # Script de test (Linux/Mac)
└── test_backend.ps1            # Script de test (Windows)
```

### Stack Technique

**Backend:**
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy ORM
- Alembic (migrations)
- JWT Authentication
- Pydantic (validation)

**Frontend:**
- React 18
- TypeScript
- Vite (build tool)
- TanStack Query (React Query)
- Axios (HTTP client)
- Tailwind CSS
- shadcn/ui (composants)
- Recharts (graphiques)

---

## 🔌 API Endpoints

### Authentification

```
POST   /api/v1/auth/login              # Se connecter
POST   /api/v1/auth/register/doctor    # Créer compte médecin
GET    /api/v1/auth/me                 # Utilisateur actuel
```

### Patients

```
GET    /api/v1/doctors/patients                   # Liste patients
GET    /api/v1/doctors/patients/with-metrics      # Avec métriques calculées
GET    /api/v1/doctors/patients/{id}              # Détails patient
POST   /api/v1/doctors/patients                   # Créer patient
PUT    /api/v1/doctors/patients/{id}              # Modifier patient
DELETE /api/v1/doctors/patients/{id}              # Supprimer patient
PUT    /api/v1/doctors/patients/{id}/transfer     # Transférer patient
```

### Dashboard

```
GET    /api/v1/doctors/dashboard/stats            # Statistiques
GET    /api/v1/doctors/seizures/statistics        # Stats crises
GET    /api/v1/doctors/history                    # Historique global
```

### Autres

```
GET    /api/v1/alerts                   # Alertes
GET    /api/v1/seizures                 # Crises
GET    /api/v1/medications              # Médicaments
POST   /api/v1/clinical-notes           # Notes cliniques
```

Voir **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** pour la liste complète avec exemples.

---

## 💡 Prochaines Étapes

### Pour Terminer l'Intégration

1. **Créer les Hooks React Query** (~3-4h)
   - Suivre [REACT_QUERY_INTEGRATION.md](./REACT_QUERY_INTEGRATION.md)
   - Créer hooks dans `src/hooks/api/`

2. **Mettre à Jour les Contexts** (~2h)
   - Migrer `AuthContext` vers hooks
   - Migrer `PatientsContext` vers hooks

3. **Mettre à Jour les Pages** (~4-6h)
   - Dashboard avec vraies données
   - Liste patients avec filtres backend
   - Détail patient avec API

4. **Tests & Validation** (~2-3h)
   - Tester tous les CRUD
   - Vérifier les graphiques
   - Valider les filtres

**Temps Total Estimé: 10-15 heures**

---

## 🔧 Configuration

### Backend (.env ou config.py)

```env
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/epileptic_ai
SECRET_KEY=your-secret-key-here
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:8080"]
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000
VITE_ENV=development
```

---

## 🧪 Tests

### Tester le Backend

**Méthode 1: Script Automatique**
```bash
# Linux/Mac
./test_backend.sh

# Windows
.\test_backend.ps1
```

**Méthode 2: Manuellement**
```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin"}'

# Dashboard stats (avec token)
curl http://localhost:8000/api/v1/doctors/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Méthode 3: Swagger UI**
- Ouvrir http://localhost:8000/docs
- Tester interactivement tous les endpoints

### Tester le Frontend

```bash
cd EpilepticAI-web
npm run dev
# Ouvrir http://localhost:8080
```

---

## 🐛 Dépannage

### "CORS error"
**Cause:** Backend pas lancé ou CORS mal configuré
**Solution:** Vérifier que le backend tourne sur port 8000

### "401 Unauthorized"
**Cause:** Token invalide ou expiré
**Solution:** Se reconnecter, vérifier `localStorage.auth_token`

### "Database connection failed"
**Cause:** PostgreSQL pas lancé ou mauvaise config
**Solution:**
```bash
# Vérifier PostgreSQL
psql -U postgres -l

# Vérifier DATABASE_URL dans .env
```

### "Module not found"
**Cause:** Dépendances non installées
**Solution:**
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

---

## 📊 État du Projet

| Composant | Avancement | Statut |
|-----------|------------|--------|
| **Backend API** | 100% | ✅ Prêt |
| **Frontend UI** | 100% | ✅ Prêt |
| **Services API** | 100% | ✅ Créés |
| **React Query Hooks** | 0% | ⏳ À faire |
| **Intégration Pages** | 0% | ⏳ À faire |
| **Tests E2E** | 0% | ⏳ À faire |

**Infrastructure:** ✅ 100% Complète
**Intégration:** 🟡 40% (Services créés, hooks à implémenter)

---

## 👥 Équipe & Contributions

### Développement

Ce projet a été développé dans le cadre du cours de **Projet Logiciel - 3ACI**.

### Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est développé à des fins éducatives dans le cadre d'un projet académique.

---

## 📞 Support

### Documentation
- [Guide d'Intégration](./INTEGRATION_GUIDE.md)
- [Guide React Query](./REACT_QUERY_INTEGRATION.md)
- [Résumé](./SUMMARY.md)

### Ressources Externes
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Vite Docs](https://vitejs.dev/)

---

## 🎉 Remerciements

Merci à tous les contributeurs et à l'équipe pédagogique pour leur soutien.

---

**Version:** 1.0.0
**Date:** 30 Décembre 2025
**Statut:** ✅ Infrastructure complète - Prêt pour intégration finale
