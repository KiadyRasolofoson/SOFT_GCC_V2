# 📁 Scripts SQL - Module d'Évaluation (VERSION FINALE)

Ce dossier contient tous les scripts SQL nécessaires pour installer et configurer le module d'évaluation de l'application GCC.

---

## 🎯 STRUCTURE FINALE (4 SCRIPTS PRINCIPAUX)

```
📁 BACKEND/bdd/eval/
├── 📄 01_TABLES_EVALUATIONS.sql       ⭐ TABLES (25 tables)
├── 📄 02_VUES_EVALUATIONS.sql         ⭐ VUES (8 vues)
├── 📄 03_DONNEES_ESSENTIELLES.sql     ⭐ DONNÉES DE BASE
├── 📄 04_DONNEES_TEST.sql             🧪 DONNÉES DE TEST (optionnel)
└── 📄 README.md                       📚 Ce fichier
```

---

## 📋 ORDRE D'EXÉCUTION (OBLIGATOIRE)

### ✅ **Installation Production**

```sql
-- 1️⃣ TABLES (OBLIGATOIRE)
01_TABLES_EVALUATIONS.sql

-- 2️⃣ VUES (OBLIGATOIRE)
02_VUES_EVALUATIONS.sql

-- 3️⃣ DONNÉES ESSENTIELLES (OBLIGATOIRE)
03_DONNEES_ESSENTIELLES.sql
```

### 🧪 **Installation Développement/Test**

```sql
-- 1️⃣ à 3️⃣ (comme Production ci-dessus)

-- 4️⃣ DONNÉES DE TEST (OPTIONNEL)
04_DONNEES_TEST.sql
```

**Tables créées**:
1. `Roles`, `Department`, `Position`, `Permissions`
2. `Evaluation_type`, `ResponseTypes`
3. `Competence_Lines`, `Competence_Trainings`
4. `Role_Permissions`, `Users`
5. `Evaluations`, `Evaluation_questions`
6. `Evaluation_questionnaire`, `Training_suggestions`
7. `Evaluation_interviews`, `InterviewParticipants`
8. `Evaluation_progress`, `TemporaryAccounts`
9. `LoginAttempts`, `Evaluation_Selected_Questions`
10. `Evaluation_Responses`, `Evaluation_Question_Options`
11. `EvaluationQuestionConfig`, `Evaluation_Competence_Results`
12. `EvaluationSupervisors`, `Evaluation_Reference_Answers`

**Prérequis**:
- ✅ Table `Employee` doit exister
- ✅ Tables `Department`, `Position`, `Roles` doivent exister (ou seront créées)

---

### 2️⃣ **02_VUES_EVALUATIONS.sql** ⭐ VUES
**Taille**: ~12 KB | **Type**: Vues | **Durée**: ~3 secondes

**Rôle**: Création de toutes les vues pour les rapports et requêtes

**Contenu**:
- ✅ **8 vues** complètes
- ✅ Vérification des prérequis
- ✅ Suppression automatique des vues existantes
- ✅ Messages de progression

**Vues créées**:

| # | Vue | Description | Utilisée par Backend |
|---|-----|-------------|---------------------|
| 1 | `VEmployeeDetails` | Détails des employés avec évaluations terminées | ✅ Oui |
| 2 | `VEmployeesWithoutEvaluation` | Employés sans évaluation active | ✅ Oui |
| 3 | `VEmployeesFinishedEvaluation` | Employés avec évaluations terminées (détaillé) | ✅ Oui |
| 4 | `VEmployeesOngoingEvaluation` | Employés avec évaluations en cours | ✅ Oui |
| 5 | `VEmployeeEvaluationProgress` | Progression des évaluations | ✅ Oui |
| 6 | `VTemporaryActiveAccounts` | Comptes temporaires actifs | ❌ Non (utilitaire) |
| 7 | `VFailedLoginAttempts` | Tentatives de connexion échouées | ❌ Non (sécurité) |
| 8 | `VEvaluationHistory` | Historique complet des évaluations | ✅ Oui |

**Prérequis**:
- ✅ Script `01_TABLES_EVALUATIONS.sql` exécuté
- ✅ Table `Employee` doit exister
- ✅ Vue `v_employee_position` doit exister

---


**Rôle**: Insertion des données essentielles pour le fonctionnement du module

**Contenu**:
- ✅ **23 Permissions** (VIEW_EVALUATIONS, CREATE_EVALUATIONS, etc.)
- ✅ **4 Rôles** (Admin, Manager, RH, Directeur)
- ✅ **Attribution des permissions** aux rôles
- ✅ **5 Départements** (Informatique, Marketing, Direction, etc.)
- ✅ **4 Postes** (Développeur, Technicien, etc.)
- ✅ **3 Types d'évaluation** (Annuelle, Période d'essai, Projet)
- ✅ **3 Types de réponse** (TEXT, QCM, SCORE)

**Permissions créées**:
- Utilisateurs: `VIEW_USERS`, `CREATE_USERS`, `EDIT_USERS`, `DELETE_USERS`
- Rôles: `VIEW_ROLES`, `CREATE_ROLES`, `EDIT_ROLES`, `DELETE_ROLES`
- Permissions: `VIEW_PERMISSIONS`, `MANAGE_PERMISSIONS`
- Évaluations: `VIEW_EVALUATIONS`, `CREATE_EVALUATIONS`, `EDIT_EVALUATIONS`, `DELETE_EVALUATIONS`, `APPROVE_EVALUATIONS`
- Départements & Postes: `VIEW_DEPARTMENTS`, `MANAGE_DEPARTMENTS`, `VIEW_POSITIONS`, `MANAGE_POSITIONS`
- Rapports: `VIEW_REPORTS`, `EXPORT_REPORTS`
- Autres: `MANAGE_CAREER`, `MANAGE_RETIREMENT`

**Prérequis**:
- ✅ Script `01_TABLES_EVALUATIONS.sql` exécuté

---

### 4️⃣ **04_DONNEES_TEST.sql** 🧪 DONNÉES DE TEST
**Taille**: ~42 KB | **Type**: Données de test | **Durée**: ~3 secondes

**Rôle**: Données complètes pour tester le module en développement

**Contenu**:
- ✅ Questions d'évaluation (nombreuses)
- ✅ Options QCM
- ✅ Compétences par poste
- ✅ Suggestions de formations
- ✅ Données de test complètes

**⚠️ À utiliser uniquement en développement/test**

**Prérequis**:
- ✅ Scripts 01, 02 et 03 exécutés

---

## 🎯 ÉTATS DES ÉVALUATIONS

| État | Valeur | Description |
|------|--------|-------------|
| Brouillon | 0 | Évaluation créée mais non démarrée |
| Planifiée | 10 | Évaluation planifiée |
| En cours | 15 | Évaluation en cours de remplissage |
| Terminée | 20 | Évaluation terminée et validée |
| Archivée | 30 | Évaluation archivée |

---

## 🚀 GUIDE D'INSTALLATION RAPIDE

### Étape 1: Vérifier les prérequis
```sql
-- Vérifier que les tables nécessaires existent
SELECT * FROM sys.tables WHERE name IN ('Employee', 'Department', 'Position', 'Roles');

-- Vérifier que la vue existe
SELECT * FROM sys.views WHERE name = 'v_employee_position';
```

### Étape 2: Exécuter les scripts dans l'ordre
```sql
-- 1. Tables
:r 01_TABLES_EVALUATIONS.sql

-- 2. Vues
:r 02_VUES_EVALUATIONS.sql

-- 3. Données essentielles
:r 03_DONNEES_ESSENTIELLES.sql

-- 4. Données de test (optionnel - dev uniquement)
:r 04_DONNEES_TEST.sql
```

### Étape 3: Vérifier l'installation
```sql
-- Compter les tables créées
SELECT COUNT(*) AS NombreTables 
FROM sys.tables 
WHERE name LIKE '%Evaluation%' OR name LIKE '%Interview%';
-- Résultat attendu: ~15-20 tables

-- Compter les vues créées
SELECT COUNT(*) AS NombreVues
FROM sys.views
WHERE name LIKE '%Employee%' AND name LIKE '%Evaluation%';
-- Résultat attendu: 8 vues

-- Vérifier les données essentielles
SELECT COUNT(*) FROM Permissions;  -- 23
SELECT COUNT(*) FROM Roles;        -- 4
SELECT COUNT(*) FROM Department;   -- 5
SELECT COUNT(*) FROM Position;     -- 4
SELECT COUNT(*) FROM Evaluation_type; -- 3
```

---


## 📊 RÉSUMÉ TECHNIQUE

| Élément | Quantité | Fichier |
|---------|----------|---------|
| **Tables** | 25 | 01_TABLES_EVALUATIONS.sql |
| **Vues** | 8 | 02_VUES_EVALUATIONS.sql |
| **Permissions** | 23 | 03_DONNEES_ESSENTIELLES.sql |
| **Rôles** | 4 | 03_DONNEES_ESSENTIELLES.sql |
| **Départements** | 5 | 03_DONNEES_ESSENTIELLES.sql |
| **Postes** | 4 | 03_DONNEES_ESSENTIELLES.sql |
| **Types d'évaluation** | 3 | 03_DONNEES_ESSENTIELLES.sql |
| **Procédures stockées** | 1 | 01_TABLES_EVALUATIONS.sql |

---


## 🗑️ FICHIERS OBSOLÈTES (À SUPPRIMER)

Les fichiers suivants sont obsolètes et peuvent être supprimés :
- ❌ `SCRIPT_COMPLET_EVALUATIONS.sql` (remplacé par 01 + 02)
- ❌ `SCRIPT_FINAL_EVALUATION_COMPLET.sql` (remplacé par 01 + 02)
- ❌ `SCRIPT_ESSENTIEL_EVALUATIONS.sql` (renommé en 03)
- ❌ `NEW DATA_TEST_EVALUATIONS.sql` (renommé en 04)
- ❌ `CLEAN_SCRIPT_TABLE_EVALUATIONS.sql` (obsolète)
- ❌ `REFACTORISATION_EMPLOYE_EVALUATION.sql` (intégré dans 01)
- ❌ `UPDATE_RESPONSE_TYPE.sql` (intégré dans 01)
- ❌ `update_competence_lines.sql` (migration ponctuelle)
- ❌ `ADD_REFERENCE_ANSWERS.sql` (doublon)
- ❌ `Evaluation_Reference_Answers.sql` (intégré dans 01)
- ❌ `NEW DATA_COMPETENCES_V2.sql` (obsolète)
- ❌ `NEW DATA_COMPETENCES_CORRECTED.sql` (obsolète)

---

