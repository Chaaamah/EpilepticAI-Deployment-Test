# ✅ CHECKLIST DE MISE EN PLACE - Epileptic-AI-Backend

Date: ___________  
Testeur: ___________  
Version Python: ___________ (Doit être 3.13+)

---

## 📋 PRÉ-INSTALLATION

- [ ] Python 3.13+ installé
  - Commande: `python --version`
  - Résultat attendu: `Python 3.13.x`

- [ ] Docker installé
  - Commande: `docker --version`
  - Résultat attendu: `Docker version xx.x.x`

- [ ] Docker Compose installé
  - Commande: `docker-compose --version`
  - Résultat attendu: `Docker Compose version xx.x.x`

---

## 🔧 INSTALLATION DES DÉPENDANCES

- [ ] Dépendances Python installées
  ```powershell
  python -m pip install --upgrade pip setuptools wheel
  pip install -r requirements.txt
  ```
  - Durée: 3-5 minutes
  - Résultat: `Successfully installed xxx packages`

- [ ] Packages clés vérifiés
  ```powershell
  pip list | findstr "fastapi uvicorn sqlalchemy pydantic celery redis"
  ```
  - [ ] fastapi (version 0.124+)
  - [ ] uvicorn (version 0.38+)
  - [ ] sqlalchemy (version 2.0+)
  - [ ] pydantic (version 2.5+)
  - [ ] celery (version 5.3+)
  - [ ] redis (version 7.0+)

---

## 🐳 SERVICES DOCKER

- [ ] Services Docker démarrés
  ```powershell
  docker-compose up -d
  ```
  - Attendre 30 secondes
  - Résultat: `Status: Up`

- [ ] Services Docker actifs (vérifier)
  ```powershell
  docker-compose ps
  ```
  - [ ] postgres (Status: Up and healthy)
  - [ ] redis (Status: Up)

- [ ] Vérifier les logs
  ```powershell
  docker-compose logs postgres
  docker-compose logs redis
  ```
  - Pas d'erreurs critiques

---

## 🚀 SERVEUR FastAPI

- [ ] Serveur lancé sans erreur
  ```powershell
  python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
  ```
  - Résultat attendu:
    ```
    INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
    INFO:     Started reloader process
    ```

- [ ] Serveur accessible (dans un autre PowerShell)
  ```powershell
  Invoke-WebRequest -Uri "http://127.0.0.1:8000/docs" -UseBasicParsing
  ```
  - Résultat attendu: `StatusCode : 200`

---

## 📚 DOCUMENTATION API

- [ ] Documentation Swagger accessible
  - URL: http://127.0.0.1:8000/docs
  - Résultat: Page chargée avec liste des endpoints

- [ ] ReDoc accessible
  - URL: http://127.0.0.1:8000/redoc
  - Résultat: Documentation alternative chargée

---

## 🧪 TESTS API

### Test 1: Récupérer les médecins
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/doctors/" -Method GET
```
- [ ] Status Code: 200
- [ ] Réponse JSON: `[]` ou liste de médecins

### Test 2: Enregistrer un patient
```powershell
$body = @{
    email = "test@example.com"
    full_name = "Test Patient"
    password = "TestPassword123!"
    confirm_password = "TestPassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/auth/register/patient" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```
- [ ] Status Code: 200
- [ ] Réponse contient: `id`, `email`, `full_name`

### Test 3: Récupérer les patients
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/patients/" -Method GET
```
- [ ] Status Code: 200 ou 401 (si authentification requise)
- [ ] Réponse JSON valide

### Test 4: Script de test automatisé
```powershell
python test_api.py
```
- [ ] 4 tests passent avec ✅
- [ ] Pas d'erreurs ❌

### Test 5: Tests unitaires
```powershell
pytest tests/ -v
```
- [ ] Tous les tests passent
- [ ] Ou au moins 1 test réussit (selon les tests écrits)

---

## 📊 ENDPOINTS À VALIDER

Cochez chaque endpoint testé avec succès (via Swagger):

**Authentication:**
- [ ] POST `/auth/register/patient` - Enregistrement patient
- [ ] POST `/auth/register/doctor` - Enregistrement médecin
- [ ] POST `/auth/login` - Login

**Patients:**
- [ ] GET `/patients/` - Liste des patients
- [ ] GET `/patients/{id}` - Détail patient
- [ ] POST `/patients/` - Créer patient
- [ ] PUT `/patients/{id}` - Modifier patient

**Doctors:**
- [ ] GET `/doctors/` - Liste des médecins
- [ ] GET `/doctors/{id}` - Détail médecin
- [ ] POST `/doctors/` - Créer médecin

**Biometrics:**
- [ ] GET `/biometrics/` - Liste des données biométriques
- [ ] POST `/biometrics/` - Ajouter données

**Predictions:**
- [ ] GET `/predictions/` - Historique prédictions
- [ ] GET `/predictions/latest` - Dernière prédiction
- [ ] POST `/predictions/analyze` - Analyser données

**Seizures:**
- [ ] GET `/seizures/` - Historique crises

**Alerts:**
- [ ] GET `/alerts/` - Historique alertes

**Medications:**
- [ ] GET `/medications/` - Liste médicaments
- [ ] POST `/medications/` - Ajouter médicament

**Emergency:**
- [ ] GET `/emergency/` - Contacts d'urgence
- [ ] POST `/emergency/` - Ajouter contact

---

## ⚠️ ERREURS ATTENDUES & SOLUTIONS

| Erreur | Solution |
|--------|----------|
| Port 8000 occupé | `netstat -ano \| findstr :8000` puis `taskkill /PID xxx /F` |
| DB non connectée | `docker-compose ps` et `docker-compose up -d` |
| ModuleNotFoundError | `pip install -r requirements.txt --force-reinstall` |
| "No such file: seizure_predictor.pkl" | C'est un warning, pas bloquant ✓ |
| 401 Unauthorized | Utiliser un token Bearer ou créer un patient d'abord |

---

## 📝 NOTES & OBSERVATIONS

```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## ✅ VALIDATION FINALE

- [ ] Toutes les étapes complétées
- [ ] Aucune erreur bloquante
- [ ] L'API fonctionne correctement
- [ ] Les endpoints répondent correctement
- [ ] Documentation bien accessible

**Date de validation:** ___________  
**Signature:** ___________

---

**✅ Prêt pour la production!** 🚀
