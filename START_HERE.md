# 🚀 COMMENCEZ ICI!

## Pour Démarrer en 2 Minutes

### Windows PowerShell
```powershell
.\start.ps1
```

### Linux/Mac
```bash
./start.sh
```

### Ou Directement
```bash
docker compose up -d
```

---

## 🌐 Accéder à l'Application

### Ouvrir Automatiquement Tous les Services
```powershell
.\open-services.ps1
```

### Ou Manuellement
**Frontend:** <http://localhost>
**Swagger Direct (Port 8000):** <http://localhost:8000/docs>
**ReDoc (Port 8000):** <http://localhost:8000/redoc>
**Swagger via Nginx:** <http://localhost/api/v1/docs>
**pgAdmin (Database):** <http://localhost:5050>

### Initialiser la Base de Données (Première fois)
```powershell
.\init-database.ps1
```

---

## 📚 Prochaines Étapes

1. **Pour comprendre Docker:**
   → Lire [DOCKER_README.md](./DOCKER_README.md) (5 min)

2. **Pour l'intégration complète:**
   → Lire [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) (30 min)

3. **Pour React Query:**
   → Lire [REACT_QUERY_INTEGRATION.md](./REACT_QUERY_INTEGRATION.md) (30 min)

4. **Pour tout comprendre:**
   → Lire [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) (15 min)

---

## 🛠️ Commandes Utiles

```bash
# Arrêter
docker compose down

# Voir les logs
docker compose logs -f

# Avec Makefile (si disponible)
make up      # Démarrer
make down    # Arrêter
make logs    # Logs
make help    # Voir toutes les commandes
```

---

## 🧪 Tester la Communication Frontend ↔ Backend ↔ Database

1. **Créer un compte docteur:**
   - Ouvrir Swagger: <http://localhost/api/v1/docs>
   - POST /auth/register avec vos informations

2. **Vérifier dans pgAdmin:**
   - Ouvrir: <http://localhost:5050>
   - Login: `admin@epileptic.ai` / `admin123`
   - Voir votre docteur dans la table `doctors`

3. **Créer des données via le Frontend:**
   - Se connecter sur <http://localhost>
   - Créer un patient
   - Voir les changements en temps réel dans pgAdmin

📖 **Guide complet:** [GUIDE_ACCES_BDD_SWAGGER.md](./GUIDE_ACCES_BDD_SWAGGER.md)

---

## ❓ Problèmes?

1. **Docker ne démarre pas**
   → Lancer Docker Desktop

2. **Port 80 utilisé**
   → Lire section Troubleshooting dans [DOCKER_GUIDE.md](./DOCKER_GUIDE.md)

3. **Autre problème**
   → Consulter [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) section Troubleshooting

---

## 📖 Documentation Complète

| Document | Quand l'utiliser |
|----------|------------------|
| **START_HERE.md** | Vous êtes ici ✅ |
| **[QUICK_START.md](./QUICK_START.md)** | Guide démarrage rapide |
| **[DOCKER_README.md](./DOCKER_README.md)** | Quick reference Docker |
| **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)** | Guide Docker complet |
| **[FINAL_SUMMARY.md](./FINAL_SUMMARY.md)** | Résumé de tout |

---

**Bonne chance! 🎉**
