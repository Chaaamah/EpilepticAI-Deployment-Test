-- Script pour corriger l'assignation des patients aux docteurs
-- À exécuter sur le serveur si vous avez déjà des patients sans treating_neurologist

-- Voir les patients sans docteur assigné
SELECT id, full_name, email, treating_neurologist
FROM patients
WHERE treating_neurologist IS NULL OR treating_neurologist = '';

-- Option 1: Assigner tous les patients orphelins au premier docteur disponible
-- (Décommentez si vous voulez l'utiliser)
-- UPDATE patients
-- SET treating_neurologist = (SELECT email FROM doctors LIMIT 1)
-- WHERE treating_neurologist IS NULL OR treating_neurologist = '';

-- Option 2: Assigner chaque patient à un docteur spécifique manuellement
-- Remplacez 'doctor@example.com' par l'email du docteur
-- UPDATE patients
-- SET treating_neurologist = 'doctor@example.com'
-- WHERE id = 1;  -- Remplacez par l'ID du patient

-- Vérifier le résultat
SELECT p.id, p.full_name, p.email, p.treating_neurologist, d.full_name as doctor_name
FROM patients p
LEFT JOIN doctors d ON p.treating_neurologist = d.email
ORDER BY p.id;
