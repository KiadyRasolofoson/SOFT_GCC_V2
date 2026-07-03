# Documentation des Modules - Soft_GCC

Ce document présente l'architecture fonctionnelle et le rôle de chaque module de l'application **Soft_GCC**, en précisant leur couverture (présence dans le projet), la logique métier appliquée et les tables de base de données concernées.

---

## 1. Vue d'Ensemble & Base de Données Globale

L'application **Soft_GCC** (Gestion des Compétences et des Carrières) est structurée autour d'un backend ASP.NET Core et d'un frontend moderne. 

### Schéma global des tables identifiées dans la base de données (`Soft_GCC`) :
- **Employés & Organisation** : `Employee`, `Department`, `Civilite`
- **Parcours Académique & Compétences** : `Study_path`, `Degree`, `School`, `Employee_education`, `Language`, `Employee_language`, `Domain_skill`, `Skill`, `Employee_skill`, `Employee_other_formation`
- **Plan de Carrière & Postes** : `Position`, `Assignment_type`, `Establishment`, `Fonction`, `Employee_type`, `Socio_category_professional`, `Indication`, `Professional_category`, `legal_class`, `Newsletter_template`, `Payment_method`, `Echelon`, `career_plan`
- **Attestations & Certificats** : `Certificate_type`, `Certificate_history`
- **Historiques & Logs** : `Module`, `History`, `Activity_logs`
- **Retraite** : `Retirement_parameter`
- **Souhaits d'Évolution** : `Wish_type`, `Wish_evolution_career`, `Skill_position`

---

## 2. Analyse Détaillée des Modules Spécifiés

### a. Gestion des Compétences
* **État de présence** : **Présent**
* **Rôle** : Permet de gérer, mettre à jour et consulter les compétences (techniques, linguistiques, académiques) des employés, d'obtenir le profil détaillé d'un employé avec une description résumée, et d'ajouter/modifier/supprimer des compétences associées.
* **Représentation de la Logique Métier** :
  - L'application calcule et liste le nombre de compétences acquises par département.
  - Le profil des compétences regroupe les compétences professionnelles, le niveau d'éducation (diplômes, écoles) et les compétences linguistiques d'un employé.
  - Le système permet de filtrer ces profils par mot-clé (nom ou matricule).
* **Tables concernées** :
  - `Employee` (Profil de l'employé)
  - `Employee_skill` (Lien entre l'employé, les compétences et les niveaux acquis)
  - `Skill` (Référentiel des compétences)
  - `Domain_skill` (Domaines de compétences)
  - `Employee_language` (Compétences linguistiques de l'employé)
  - `Language` (Référentiel des langues)
  - `Employee_education` (Parcours académique / diplômes obtenus)

---

### b. Plan de Carrière
* **État de présence** : **Présent**
* **Rôle** : Gère les affectations (nominations, avancements, mises en disponibilité), le suivi de la carrière des salariés sous forme de fiches individuelles, l'historisation des actions et l'exportation des attestations de travail au format PDF.
* **Représentation de la Logique Métier** :
  - Un plan de carrière (`career_plan`) est associé à un type d'affectation (`Assignment_type`) et possède des caractéristiques propres (salaire de base, échelon, indice, poste, département).
  - La logique gère l'état d'activité d'un plan : clôture automatique après validation ou à la date d'échéance.
  - Génération et téléchargement d'attestations de travail basées sur des modèles configurables (`Certificate_type` et `Certificate_history`).
  - Suivi des actions des utilisateurs via les tables d'historiques.
* **Tables concernées** :
  - `career_plan` (Table pivot regroupant tous les détails du plan de carrière de l'employé)
  - `Assignment_type` (Type d'affectation : Nomination, Avancement, etc.)
  - `Position` (Poste occupé)
  - `Department` (Département d'affectation)
  - `Establishment` (Établissement d'affectation)
  - `Certificate_type` & `Certificate_history` (Types d'attestations et fichiers PDF générés)
  - `Activity_logs` & `History` (Historiques d'activité des utilisateurs)

---

### c. Départ à la Retraite
* **État de présence** : **Présent**
* **Rôle** : Calcule et liste les dates de départ à la retraite estimées des employés disposant d'un plan de carrière en fonction de paramètres modifiables par genre (Homme / Femme).
* **Représentation de la Logique Métier** :
  - L'administrateur configure l'âge limite dans la table `Retirement_parameter`.
  - La date de retraite est calculée dynamiquement : `Date de Naissance (Birthday) + Âge légal de départ (selon Civilite)`.
  - La liste affiche le poste actuel et le département issus du plan de carrière actif de l'employé.
* **Tables concernées** :
  - `Retirement_parameter` (Configuration des âges de départ pour Hommes et Femmes)
  - `Employee` (Date de naissance, Civilité)
  - `Civilite` (Détermination du genre de l'employé)
  - `career_plan` (Pour obtenir le poste et département actuels)

---

### d. Gestion Souhait d'Évolution de Carrière
* **État de présence** : **Présent**
* **Rôle** : Enregistre et assure le suivi des demandes d'évolutions de carrières (changement de poste ou de département) soumises par les salariés, en proposant des suggestions basées sur l'adéquation de leurs compétences.
* **Représentation de la Logique Métier** :
  - Soumission d'une demande avec un niveau de priorité, une date de disponibilité et une motivation.
  - **Suggestion automatique de postes** : Comparaison entre les compétences détenues par l'employé (`Employee_skill`) et les compétences requises pour un poste cible (`Skill_position`). Si le niveau de l'employé correspond ou dépasse le niveau requis (`Required_level`), le poste lui est suggéré.
  - Suivi d'état de la demande (En attente, validé, refusé, traité).
* **Tables concernées** :
  - `Wish_evolution_career` (Enregistrement des demandes de souhaits d'évolution)
  - `Wish_type` (Types d'évolution demandés)
  - `Skill_position` (Compétences requises par poste)
  - `Employee_skill` (Compétences réelles de l'employé pour le calcul des suggestions)
  - `Position` (Poste souhaité / suggéré)

---

### e. Organigramme et Effectif
* **État de présence** : **Présent**
* **Rôle** : Fournit une vue sur les effectifs globaux par département, les détails d'ancienneté des équipes, et affiche un organigramme dynamique et interactif représentant les relations hiérarchiques de l'entreprise. Gère également l'import de données via fichier CSV.
* **Représentation de la Logique Métier** :
  - L'organigramme s'appuie sur la relation hiérarchique réflexive de la table `Employee` (`Manager_id` qui référence le responsable direct `Employee_id`).
  - L'ancienneté est calculée à partir de la date d'embauche (`Hiring_date`).
  - L'import de masse CSV permet d'insérer ou de mettre à jour de manière groupée les fiches employés ainsi que les liens de subordination.
* **Tables concernées** :
  - `Employee` (Relations parent-enfant via `Manager_id`, date d'embauche `Hiring_date`)
  - `Department` (Regroupement et effectifs par département)

---

### f. Analyse Statistiques et Tableau de Bord
* **État de présence** : **Présent**
* **Rôle** : Fournit un tableau de bord consolidant les indicateurs clés de l'entreprise (effectif total, total des souhaits d'évolution) ainsi que des graphiques d'analyse des compétences et des plans de carrière.
* **Représentation de la Logique Métier** :
  - Agrégations SQL pour obtenir le nombre total d'employés et de demandes.
  - Statistiques des compétences obtenues par état (Actif/Inactif) et par département.
  - Statistiques des effectifs répartis par postes au sein de chaque département.
* **Tables concernées** :
  - `Employee` (Calcul de l'effectif)
  - `Wish_evolution_career` (Calcul des demandes d'évolution)
  - `Employee_skill` / `Skill` (Statistiques et distribution des compétences)
  - `career_plan` / `Position` (Répartition des effectifs par poste et département)
