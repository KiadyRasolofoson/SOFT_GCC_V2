# Analyse des Fonctionnalités - SOFT GCC

> Rapport d'analyse de la présence des fonctionnalités spécifiées dans le projet **SOFT_GCC_V2**.
> Date : 09/07/2026

---

## Légende

| Symbole | Signification |
|---------|---------------|
| ✅ **Présent** | Fonctionnalité entièrement ou partiellement implémentée |
| ❌ **Absent** | Fonctionnalité non trouvée dans le projet |
| ⚠️ **Partiel / Remarque** | Présent mais incomplet ou avec des différences notables |

---

## 1. Liaison avec les autres modules

### TRAIN : Récupération des compétences acquises

| Statut | Détail |
|--------|--------|
| ⚠️ **Partiel** | Une table `Competence_Trainings` et un service `CompetenceTrainingService` existent pour gérer des formations liées aux lignes de compétences. Il y a aussi un `TrainingSuggestionService` et une table `Training_suggestions`. Cependant, **il n'y a pas de module TRAIN externe** auquel le système se connecte. Les compétences acquises via formation sont gérées en interne (via `EmployeeOtherFormation` et `CompetenceTraining`), mais **pas de liaison automatique avec un module externe TRAIN**. |

### SANCTIONS DISCIPLINAIRES

| Statut | Détail |
|--------|--------|
| ❌ **Absent** | Aucune table, entité, contrôleur, service ou page frontend liée aux sanctions disciplinaires n'a été trouvée dans l'intégralité du projet. Il n'existe pas d'onglet "Sanctions" dans la fiche salarié. |

---

## 2. Accès

### Administrateur

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Système d'authentification complet avec :
| | - Login avec mot de passe (JWT)
| | - Rôle `Admin` avec toutes les permissions (`Role_id = 1`, toutes les permissions associées via `Role_Permissions`)
| | - Création et gestion des utilisateurs (`UsersList.jsx`, `UserManagement.jsx`, `UserController.cs`)
| | - Configuration des accès via rôles et permissions (`RolesManagement.jsx`, `PermissionsManagement.jsx`)
| | - Un `ProtectedRoute` protège les routes selon les permissions |
| ⚠️ **Remarque** | Le mot de passe par défaut "admin/admin" est présent dans les données de test, mais **aucune procédure de modification forcée du mot de passe par défaut** n'est implémentée. |

### Utilisateurs

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Gestion des utilisateurs avec :
| | - Création par Administrateur
| | - Accès personnalisable par rôle et permission
| | - Permissions : `VIEW_USERS`, `CREATE_USERS`, `EDIT_USERS`, `DELETE_USERS`, etc.
| | - Les rôles RH et Directeur sont présents (rôles "RH" et "Directeur" dans les données essentielles) |
| ⚠️ **Remarque** | La spécification mentionne des niveaux d'accès spécifiques ("Lire => pas d'ajout pas de suppression", "Supprimer => peut lire et peut ajouter mais pas de suppression"). Le système actuel utilise un système de **permissions binaire individuelles** (VIEW/CREATE/EDIT/DELETE) plutôt que ces niveaux prédéfinis. La logique "Lire = VIEW sans CREATE/DELETE" fonctionne mais n'est pas formalisée en tant que niveau d'accès distinct. |

---

## 3. Paramétrages nécessaires

### Information sur la société

| Statut | Détail |
|--------|--------|
| ⚠️ **Partiel** | Une table `Establishment` existe avec les colonnes : `Establishment_name`, `Adress`, `Contact`, `Mail`, `Website`, `Social_network`, `Logo`. |
| | ❌ **NIF** : Non présent dans la table Establishment |
| | ❌ **STAT** : Non présent dans la table Establishment |
| | ❌ Aucun contrôleur API ou page frontend dédiée à la gestion des informations de la société n'a été trouvé (pas de `CompanyInfoController`, pas de page spécifique) |

### Liste des domaines ou filière

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Tables `Domain_skill` et `Study_path`. Pages frontend : `DomainCrudPage.jsx`, `StudyPathCrudPage.jsx`. Contrôleurs : `DomainSkillController.cs`, `StudyPathController.cs`. |

### Liste des compétences par domaine

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Table `Skill` liée à `Domain_skill`. Page : `SkillCrudPage.jsx`. Contrôleur : `SkillController.cs`. Vue `VSkills`. |

### Liste de statut validation

| Statut | Détail |
|--------|--------|
| ⚠️ **Partiel** | Il n'y a pas de table dédiée "StatutValidation" dans le projet. Le statut de validation est géré de manière **programmatique** via :
| | - Les champs `isServiceApproved`, `isDgApproved` dans la table `Evaluations`
| | - Le `InterviewStatus` dans les entretiens d'évaluation
| | - Les champs `state` (entier : 0=Brouillon, 10=Planifiée, 15=En cours, 20=Terminée, 30=Archivée)
| | Ce n'est pas une "liste configurable de statuts de validation" comme spécifié |

### Liste diplôme

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Table `Degree`, page `DegreeCrudPage.jsx`, contrôleur `DegreeController.cs`. |

### Liste langues

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Table `Language`, page `LanguageCrudPage.jsx`, contrôleur `LanguageController.cs`. |

### Type d'évaluation

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Table `Evaluation_type`, page `EvaluationTypesSettings.jsx`, contrôleur et service dédiés (`EvaluationTypeController.cs`, `EvaluationTypeService.cs`). Types préconfigurés : Évaluation annuelle, période d'essai, de projet. |

### Paramétrage envoi mail

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Service `EmailService`, `EmailController.cs`, modèle `SendEmailRequest`. Newsletter/Template de bulletin : `NewsLetterTemplate`. `ReminderSettings` pour les relances. |
| ⚠️ **Remarque** | Le "Mail de convocation" est bien présent (utilisé dans `EvaluationService` pour envoyer les convocations aux évaluations). |

---

## 4. Listes nécessaires

### Liste d'affectation et historique pour chaque salarié

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Module "Plan de Carrière" complet avec :
| | - Table `career_plan` avec type d'affectation, poste, dates
| | - Pages : `ListCareerPage.jsx`, `CareerProfilePage.jsx`, `DetailAssignment.jsx`, `EditAffectation.jsx`
| | - Contrôleur : `CareerPlanController.cs`
| | - Vues : `VEmployeeCareer`, `VEmployeePosition`, `VAssignmentAdvancement`, `VAssignmentAppointment`, `VAssignmentAvailability` |

### Listes des salariés avec ses compétences

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Pages : `ListSkillSalaryPage.jsx`, `SalaryProfilePage.jsx` (profil complet avec compétences, langues, formations). Contrôleurs : `EmployeeSkillsController.cs`, `EmployeeController.cs`. |
| | Les compétences peuvent être mises à jour manuellement ou via les résultats d'évaluation (`EvaluationCompetenceService`). |

### Liste des évaluateurs

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Table `EvaluationSupervisors`, entité `EvaluationSupervisors.cs`, contrôleur et service de gestion. Les superviseurs sont associés aux évaluations. |

### Liste des questionnaires d'évaluation

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Tables : `Evaluation_questions`, `Evaluation_questionnaire`, `Evaluation_Question_Options`, `Evaluation_Selected_Questions`, `EvaluationQuestionConfig`. Page : `QuestionEvaluation.jsx`. Service : `EvaluationService.cs`. |

---

## 5. Traitement à faire

### Planification d'évaluation

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Table `EvaluationSchedule`, service `EvaluationPlanningService.cs`, page `SalaryListPlanning.jsx` avec `EvaluationConfiguration.jsx`. Planification avec dates, envoi de convocation. |

### Entretien d'évaluation

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Module d'entretien complet :
| | - Tables : `Evaluation_interviews`, `InterviewParticipants`
| | - Pages : `EvaluationInterviews.jsx`, `EvaluationInterviewHome.jsx`, `EvaluationDetails.jsx`, `EvaluationFill.jsx`
| | - Workflow : `EvaluationWorkflow.jsx` avec validation manager/directeur
| | - Compte-rendu et affectation d'objectifs présents |

### Suivi de la réalisation des objectifs

| Statut | Détail |
|--------|--------|
| ⚠️ **Partiel** | Les objectifs sont implémentés dans le formulaire d'entretien (`EvaluationInterviews.jsx`) avec :
| | - ✅ `description` de l'objectif
| | - ✅ `dueDate` (date d'échéance)
| | - ✅ `indicator` (indicateur de réussite)
| | - ❌ **Taux de réalisation** : Le champ "taux de réalisation" (pourcentage de complétion) n'est pas présent dans les objectifs. Il manque un mécanisme de suivi du pourcentage de réalisation pour chaque objectif. |

### Validation des compétences

| Statut | Détail |
|--------|--------|
| ✅ **Présent** | Envoi de test à un salarié via un lien :
| | - `TemporaryAccountService.cs` : Création de comptes temporaires avec login/mot de passe
| | - `EvaluationPortalService.cs` : Portail d'évaluation avec progression
| | - Pages : `EvaluationLogin.jsx`, `EvaluationPage.jsx`, `EvaluationConfirmation.jsx`
| | - **Validation des notes** : `EvaluationCompetenceService.cs` pour l'affectation des résultats dans la fiche salarié |
| | **Workflow de validation** :
| | - Approbation hiérarchique (Manager puis Directeur) via `EvaluationDetails.jsx`
| | - Approbation service et DG (`isServiceApproved`, `isDgApproved`) dans la table `Evaluations` |

---

## 6. Etat

### Comparaison des compétences entre n et n-1 par salarié

| Statut | Détail |
|--------|--------|
| ⚠️ **Partiel** | Il existe une entité `PerformanceEvolution` et une vue (`KPIResult`), mais **pas de fonctionnalité dédiée de comparaison année n vs n-1 par salarié**. Les graphiques de performance (`PerformanceGraph.jsx`, `GlobalPerformanceGraph.jsx`) dans l'historique montrent des tendances mais pas de comparaison explicite année par année. |

### Bulletin des compétences individuelles

| Statut | Détail |
|--------|--------|
| ⚠️ **Partiel** | Un générateur PDF existe (`pdfGenerator.js`) dans le module de notation, mais **pas de "bulletin des compétences" individuel** dédié tel que décrit. Il y a un module de gestion d'attestations/certificats (`certificateManagement/` avec `ModelList.jsx`, `ModelEdit.jsx`, `VerifyAttestationPage.jsx`) qui permet de générer des attestations de travail, mais pas un bulletin de compétences standardisé. |

### Objectifs réalisés

| Statut | Détail |
|--------|--------|
| ⚠️ **Partiel** | Les objectifs sont enregistrés dans les entretiens d'évaluation (`formData.objectives` dans `EvaluationInterviews.jsx`). Cependant, **il manque** :
| | - Un écran/liste dédié "Objectifs réalisés" (état récapitulatif)
| | - Le taux de réalisation individuel par objectif
| | - Un historique consolidé des objectifs atteints/non atteints |
| | Les objectifs sont uniquement visibles dans le cadre de l'entretien individuel. |

---

## 7. Résumé global

| Catégorie | Présent | Partiel | Absent |
|-----------|:-------:|:-------:|:------:|
| Liaison modules (TRAIN) | | ⚠️ | |
| Sanctions disciplinaires | | | ❌ |
| Accès Administrateur | ✅ | | |
| Accès Utilisateurs | ✅ | | |
| Info société | | ⚠️ | |
| Domaines/Filières | ✅ | | |
| Compétences par domaine | ✅ | | |
| Statut validation | | ⚠️ | |
| Diplômes | ✅ | | |
| Langues | ✅ | | |
| Type évaluation | ✅ | | |
| Paramétrage email | ✅ | | |
| Affectations/historique | ✅ | | |
| Compétences salariés | ✅ | | |
| Évaluateurs | ✅ | | |
| Questionnaires | ✅ | | |
| Planification éval. | ✅ | | |
| Entretien évaluation | ✅ | | |
| Suivi objectifs | | ⚠️ | |
| Validation compétences | ✅ | | |
| Comparaison n/n-1 | | ⚠️ | |
| Bulletin compétences | | ⚠️ | |
| Objectifs réalisés | | ⚠️ | |
| **TOTAL** (23 items) | **14** ✅ | **8** ⚠️ | **1** ❌ |

---

## 8. Recommandations

1. **Module TRAIN** : Implémenter une API de liaison avec un système de formation externe ou créer un module de formation intégré avec récupération automatique des compétences acquises.

2. **Sanctions disciplinaires** : Créer une table `DisciplinarySanctions`, un onglet dédié dans la fiche salarié, et un CRUD complet.

3. **Information société** : Ajouter les champs `NIF` et `STAT` dans la table `Establishment`, créer un contrôleur API et une page de paramétrage dédiée.

4. **Statut validation** : Créer une table configurable `ValidationStatus` pour permettre à l'administrateur de définir ses propres statuts.

5. **Suivi des objectifs** : Ajouter un champ `completionRate` (taux de réalisation en %) aux objectifs, avec un mécanisme de mise à jour périodique.

6. **Comparaison n/n-1** : Développer une vue comparative année par année des compétences par salarié.

7. **Bulletin compétences** : Créer un template PDF standardisé de bulletin individuel de compétences.

8. **Objectifs réalisés** : Créer un tableau de bord/état récapitulatif des objectifs atteints/non atteints avec filtres par période et par salarié.
