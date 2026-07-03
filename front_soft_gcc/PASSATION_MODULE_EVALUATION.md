# FORMULAIRE DE PASSATION - MODULE D'ÉVALUATION
## EN_SMQ_22 - Passation de démissionnaire

---

## 📋 INFORMATIONS PERSONNELLES

| Champ | Information |
|-------|-------------|
| **Nom** | [Nom du démissionnaire - Développeur Module Évaluation] |
| **Poste occupé** | Développeur Frontend React - Module d'Évaluation |
| **Date de départ** | [Date de départ] |
| **Manager direct** | [Nom du manager] |
| **Date de démission** | [Date de la démission] |

---

## 💼 RESPONSABILITÉS ET TÂCHES QUOTIDIENNES
### Liste des Fonctionnalités du Module d'Évaluation

#### 1. 📋 PLANIFICATION DES ÉVALUATIONS

| Fonctionnalité | Description | Emplacement | Responsable de la reprise | Signature |
|----------------|-------------|-------------|---------------------------|-----------|
| **Sélection des employés à évaluer** | Interface de sélection multiple des employés pour une campagne d'évaluation | `SalaryListPlanning.jsx` | [Nom] | |
| **Configuration des dates** | Définition des dates de début et fin d'évaluation avec calcul automatique de la durée | `EvaluationConfiguration.jsx` - fonction `calculateDatesFromDuration()` | [Nom] | |
| **Calcul de durée recommandée** | Calcul automatique de la durée recommandée basée sur le nombre de questions (via API) | `EvaluationConfiguration.jsx` - fonction `fetchRecommendedDuration()` | [Nom] | |
| **Sélection des superviseurs** | Ajout/suppression de superviseurs pour une évaluation | `EvaluationConfiguration.jsx` - fonctions `handleAddSupervisor()` / `handleRemoveSupervisor()` | [Nom] | |
| **Sélection des questions** | Sélection manuelle des questions par compétence pour chaque employé | `EvaluationConfiguration.jsx` - fonction `handleQuestionSelection()` | [Nom] | |
| **Sélection aléatoire de questions** | Sélection aléatoire de N questions uniques par employé (évite les doublons) | `EvaluationConfiguration.jsx` - fonction `handleRandomSelection()` | [Nom] | |
| **Sélection en masse par compétence** | Sélection/désélection de toutes les questions d'une compétence | `EvaluationConfiguration.jsx` - fonction `handleSelectAllQuestionsForCompetence()` | [Nom] | |
| **Validation de la configuration** | Validation des dates, questions et configuration avant création | `EvaluationConfiguration.jsx` - fonction `validateConfiguration()` | [Nom] | |
| **Finalisation de la planification** | Création de la campagne d'évaluation et des entretiens associés | `EvaluationConfiguration.jsx` - fonction `handleFinalizePlanning()` | [Nom] | |

#### 2. 🎤 GESTION DES ENTRETIENS

| Fonctionnalité | Description | Emplacement | Responsable de la reprise | Signature |
|----------------|-------------|-------------|---------------------------|-----------|
| **Liste des entretiens** | Affichage de la liste des employés avec leurs entretiens d'évaluation | `EvaluationInterviewHome.jsx` | [Nom] | |
| **Filtrage et recherche** | Filtrage par statut, date, nom avec fonction de recherche | `EvaluationInterviewHome.jsx` - fonction `handleResetFilters()` | [Nom] | |
| **Tri des colonnes** | Tri ascendant/descendant sur les colonnes du tableau | `EvaluationInterviewHome.jsx` | [Nom] | |
| **Redirection vers validation** | Redirection directe vers la page de validation d'un entretien | `EvaluationInterviewHome.jsx` - fonction `redirectToValidation()` | [Nom] | |
| **Gestion des états de chargement** | Indicateurs de chargement par action pour éviter les clics multiples | `EvaluationInterviewHome.jsx` - fonctions `setActionLoading()` / `isActionLoading()` | [Nom] | |
| **Détails de l'entretien** | Affichage complet des détails d'un entretien avec navigation par onglets | `EvaluationDetails.jsx` | [Nom] | |
| **Affichage des notes structurées** | Visualisation des notes d'entretien au format structuré | `EvaluationDetails.jsx` - fonction `renderStructuredNotes()` | [Nom] | |
| **Validation de l'entretien** | Validation d'un entretien par le superviseur avec commentaires | `EvaluationDetails.jsx` - fonction `handleValidationSubmit()` | [Nom] | |
| **Remplissage de formulaire** | Formulaire structuré de remplissage d'évaluation (compétences, objectifs) | `EvaluationFill.jsx` | [Nom] | |
| **Gestion des compétences** | Ajout/modification/notation des compétences par catégorie | `EvaluationFill.jsx` - fonction `handleSkillChange()` | [Nom] | |
| **Gestion des objectifs** | Ajout/suppression/modification des objectifs | `EvaluationFill.jsx` - fonctions `handleAddObjective()` / `handleRemoveObjective()` / `handleObjectiveChange()` | [Nom] | |
| **Calcul de moyenne** | Calcul automatique de la moyenne des compétences | `EvaluationFill.jsx` - fonction `calculateAverageRating()` | [Nom] | |
| **Sauvegarde progressive** | Sauvegarde des données d'entretien en cours de remplissage | `EvaluationFill.jsx` - fonction `handleSave()` | [Nom] | |
| **Import de données** | Import de données d'évaluation depuis fichier externe | `EvaluationImport.jsx` | [Nom] | |
| **Workflow d'évaluation** | Visualisation et suivi du workflow d'évaluation | `EvaluationWorkflow.jsx` | [Nom] | |
| **Sélection de participants** | Interface de sélection des participants à une évaluation | `ParticipantSelector.jsx` | [Nom] | |

#### 3. ⭐ NOTATION DES ÉVALUATIONS

| Fonctionnalité | Description | Emplacement | Responsable de la reprise | Signature |
|----------------|-------------|-------------|---------------------------|-----------|
| **Système de notation en 3 étapes** | Processus de notation guidé en 3 étapes (Questions → Remarques → Validation) | `EvaluationNotation.jsx` | [Nom] | |
| **Step 1 : Notation des questions** | Notation individuelle de chaque question avec système d'étoiles (1-5) | `Step1.jsx` | [Nom] | |
| **Affichage réponses de référence** | Panneau latéral extensible avec les réponses de référence pour aide à la notation | `Step1.jsx` - fonction `toggleReferenceExpand()` | [Nom] | |
| **Support QCM** | Notation automatique des QCM (correct/incorrect) avec affichage de la bonne réponse | `Step1.jsx` - gestion du `responseType === 'QCM'` | [Nom] | |
| **Notation par critères** | Notation selon plusieurs critères (pertinence, technique, clarté) | `Step1.jsx` - fonction `handleCriteriaRatingChange()` | [Nom] | |
| **Commentaires par question** | Ajout de commentaires détaillés pour chaque question | `Step1.jsx` - fonction `handleCommentChange()` | [Nom] | |
| **Affichage des points clés** | Visualisation des points clés attendus dans les réponses | `Step1.jsx` - fonction `renderKeyPoints()` | [Nom] | |
| **Step 2 : Remarques générales** | Ajout de remarques et commentaires globaux sur l'évaluation | `Step2.jsx` | [Nom] | |
| **Step 3 : Récapitulatif et validation** | Récapitulatif complet avec validation finale et génération PDF | `Step3.jsx` | [Nom] | |
| **Calcul de moyenne automatique** | Calcul automatique de la moyenne des notes | `EvaluationNotation.jsx` - fonction `calculateAverage()` | [Nom] | |
| **Vérification notation complète** | Vérification que toutes les questions sont notées avant passage à l'étape suivante | `EvaluationNotation.jsx` - fonction `allQuestionsRated()` | [Nom] | |
| **Sauvegarde des résultats** | Sauvegarde des résultats de notation | `EvaluationNotation.jsx` - fonction `saveEvaluationResults()` | [Nom] | |
| **Validation finale** | Validation finale de l'évaluation avec génération automatique du PDF | `EvaluationNotation.jsx` - fonction `validateEvaluation()` | [Nom] | |
| **Génération de PDF** | Génération automatique d'un rapport PDF avec notes, moyenne et commentaires | `EvaluationNotation.jsx` - fonction `generatePDFAfterValidation()` + `pdfGenerator.js` | [Nom] | |

#### 4. 📊 HISTORIQUE ET STATISTIQUES

| Fonctionnalité | Description | Emplacement | Responsable de la reprise | Signature |
|----------------|-------------|-------------|---------------------------|-----------|
| **Historique complet** | Affichage de l'historique de toutes les évaluations | `EvalHistory.jsx` | [Nom] | |
| **KPIs (Indicateurs clés)** | Affichage des indicateurs clés de performance (nombre total, en cours, validées, etc.) | `EvalHistory.jsx` - composant `KpiCard` | [Nom] | |
| **Graphiques statistiques** | Graphiques en camembert (Nivo) pour visualiser les statistiques | `EvalHistory.jsx` - composant `StatisticsPieChart` | [Nom] | |
| **Graphique de performance globale** | Graphique de performance globale des évaluations | `GlobalPerformanceGraph.jsx` | [Nom] | |
| **Graphique de performance individuelle** | Graphique de performance par employé | `PerformanceGraph.jsx` | [Nom] | |
| **Filtrage de l'historique** | Filtrage par statut, date, type d'évaluation | `EvalHistory.jsx` - fonction `handleFilterChange()` | [Nom] | |
| **Recherche dans l'historique** | Recherche textuelle dans l'historique | `EvalHistory.jsx` - fonction `handleSearchChange()` | [Nom] | |
| **Réinitialisation des filtres** | Bouton de réinitialisation de tous les filtres | `EvalHistory.jsx` - fonction `resetFilters()` | [Nom] | |
| **Détails en modal** | Affichage des détails d'une évaluation dans une fenêtre modale | `EvaluationDetailsModal.jsx` | [Nom] | |
| **Export Excel** | Export de l'historique au format Excel (.xlsx) | `EvalHistory.jsx` - fonction `handleExport('excel')` | [Nom] | |
| **Export PDF** | Export de l'historique au format PDF avec mise en page | `EvalHistory.jsx` - fonction `handleExport('pdf')` | [Nom] | |
| **Export CSV** | Export de l'historique au format CSV | `EvalHistory.jsx` - fonction `handleExport('csv')` | [Nom] | |
| **Gestion des statuts** | Affichage des statuts avec classes CSS et labels appropriés | `EvalHistory.jsx` - fonctions `getStatusClass()` / `getStatusLabel()` | [Nom] | |

#### 5. ⚙️ PARAMÈTRES ET CONFIGURATION

| Fonctionnalité | Description | Emplacement | Responsable de la reprise | Signature |
|----------------|-------------|-------------|---------------------------|-----------|
| **Page principale paramètres** | Interface principale d'accès aux différents paramètres d'évaluation | `Evaluations.jsx` | [Nom] | |
| **Gestion des types d'évaluation** | CRUD complet des types d'évaluation (Créer, Lire, Modifier, Supprimer) | `EvaluationTypesSettings.jsx` + `EvaluationTypeService.jsx` | [Nom] | |
| **Gestion des questionnaires** | Configuration et gestion des questionnaires d'évaluation | `QuestionEvaluation.jsx` | [Nom] | |
| **Suggestions de formations** | Gestion des suggestions de formations post-évaluation | `FormationSuggestions.jsx` | [Nom] | |
| **Administration avancée** | Paramètres d'administration avancés (durées, rappels, etc.) | `AdminSettings.jsx` | [Nom] | |
| **Contrôle d'accès par permissions** | Vérification des permissions pour accès aux paramètres | `Evaluations.jsx` - utilisation de `PermissionService` | [Nom] | |

#### 6. 👤 ÉVALUATION PAR LES EMPLOYÉS

| Fonctionnalité | Description | Emplacement | Responsable de la reprise | Signature |
|----------------|-------------|-------------|---------------------------|-----------|
| **Page de connexion évaluation** | Interface de connexion dédiée pour les employés | `EvaluationLogin.jsx` | [Nom] | |
| **Page d'évaluation employé** | Interface simplifiée pour que l'employé remplisse son auto-évaluation | `EvaluationPage.jsx` | [Nom] | |
| **Confirmation d'évaluation** | Page de confirmation après soumission de l'auto-évaluation | `EvaluationConfirmation.jsx` | [Nom] | |

#### 7. 🔧 SERVICES ET UTILITAIRES

| Fonctionnalité | Description | Emplacement | Responsable de la reprise | Signature |
|----------------|-------------|-------------|---------------------------|-----------|
| **Service API Évaluation** | Service de communication avec l'API backend pour les évaluations | `EvaluationService.jsx` - 3 méthodes principales | [Nom] | |
| **Service Types d'Évaluation** | Service CRUD pour les types d'évaluation | `EvaluationTypeService.jsx` - 5 méthodes CRUD | [Nom] | |
| **Service Utilisateur** | Service de gestion des utilisateurs pour les évaluations | `UserService.jsx` | [Nom] | |
| **Formatage de dates** | Fonction de formatage des dates au format YYYY-MM-DD HH:mm | `utils.jsx` - fonction `formatDate()` | [Nom] | |
| **Validation de dates** | Validation des dates d'entretien | `utils.jsx` - fonction `isValidInterviewDate()` | [Nom] | |
| **Comparaison de dates** | Comparaison de dates sans tenir compte de l'heure | `utils.jsx` - fonction `compareDates()` | [Nom] | |

#### 8. 🔐 SÉCURITÉ ET PERMISSIONS

| Fonctionnalité | Description | Emplacement | Responsable de la reprise | Signature |
|----------------|-------------|-------------|---------------------------|-----------|
| **Routes protégées** | Protection des routes par authentification et permissions | `AppRouter.jsx` - utilisation de `ProtectedRoute` | [Nom] | |
| **Vérification des permissions** | Vérification des permissions fonctionnelles (MANAGE_EVALUATIONS, EVAL_SETTINGS, etc.) | Utilisation de `PermissionService` dans les composants | [Nom] | |
| **Gestion des rôles** | Affichage conditionnel selon les rôles utilisateurs | Divers composants avec `hasPermission` | [Nom] | |

---

## 🚀 PROJETS EN COURS

| Nom du projet | Description | État actuel | Détails de la passation | Personne(s) à contacter | Responsable de la reprise | Signature |
|---------------|-------------|-------------|-------------------------|-------------------------|---------------------------|-----------|
| **Module d'Évaluation - Application GCC** | Module complet de gestion des évaluations des employés (planification, entretiens, notation, historique) | En production - Maintenance continue | **Architecture:**<br>- 8 sous-dossiers principaux<br>- ~30 fichiers, ~8000 lignes de code<br>- 6 composants principaux (>600 lignes chacun)<br><br>**Composants clés:**<br>1. EvaluationInterviewHome (1221 lignes)<br>2. EvaluationDetails (763 lignes)<br>3. EvaluationConfiguration (1118 lignes)<br>4. EvaluationNotation (671 lignes)<br>5. EvaluationFill (710 lignes)<br>6. EvalHistory (689 lignes)<br><br>**Technologies:**<br>- React 18+, React Router v6<br>- Axios, @nivo/pie, jsPDF<br>- react-toastify, react-icons<br><br>**Emplacement code:**<br>- Pages: `src/pages/Evaluations/`<br>- Services: `src/services/Evaluations/`<br>- Paramètres: `src/pages/settings/evaluations/`<br>- Styles: `src/assets/css/Evaluations/`<br>- Routes: `src/routes/AppRouter.jsx`<br><br>**Points d'attention:**<br>- Routes dupliquées à nettoyer (lignes 95-102, 122-129, 138-144)<br>- URL hardcodée dans EvaluationTypeService.jsx<br>- Fichier vide à supprimer: EvaluationService.js<br>- Refactorisation nécessaire des gros composants | - Équipe Backend (API)<br>- Product Owner (Besoins)<br>- Équipe QA (Tests)<br>- Utilisateurs RH<br>- DevOps (Déploiement)<br>- Lead Technique | [Nom] | |



---

## 📁 DOSSIERS ET DOCUMENTS CLÉS

| Nom du dossier/document | Description | Emplacement | Responsable de la reprise | Signature |
|-------------------------|-------------|-------------|---------------------------|-----------|
| **Code source - Pages Évaluations** | Tous les composants du module d'évaluation | `src/pages/Evaluations/` | [Nom] | |
| **Code source - Services** | Services API pour les évaluations | `src/services/Evaluations/` | [Nom] | |
| **Code source - Paramètres** | Configuration et paramètres d'évaluation | `src/pages/settings/evaluations/` | [Nom] | |
| **Styles CSS** | Tous les fichiers CSS du module | `src/assets/css/Evaluations/` | [Nom] | |
| **Routes** | Configuration des routes | `src/routes/AppRouter.jsx` | [Nom] | |

---

## 🛠️ OUTILS ET LOGICIELS UTILISÉS

| Outil/Logiciel | Description | Accès (Login/MDP) | Responsable de la reprise | Signature |
|----------------|-------------|-------------------|---------------------------|-----------|
| **Visual Studio Code** | IDE principal pour le développement React | Installation locale | [Nom] | |
| **Git / GitHub ou GitLab** | Gestion de version du code source | [Compte Git] | [Nom] | |
| **Node.js / npm** | Environnement d'exécution et gestionnaire de paquets | Installation locale | [Nom] | |
| **React DevTools** | Extension navigateur pour déboguer React | Extension Chrome/Firefox | [Nom] | |
| **Postman / Insomnia** | Test des API backend | [Compte si applicable] | [Nom] | |

---

## 💻 MATÉRIELS, FOURNITURES ET PETITS OUTILLAGES

| Code immo. ou référence | Description | Quantité | État | Responsable de la reprise | Signature |
|-------------------------|-------------|----------|------|---------------------------|-----------|
| [Code] | Ordinateur portable [Marque/Modèle] | 1 | [Bon/Moyen/Mauvais] | Service IT | |
| [Code] | Écran(s) externe(s) | [Nombre] | [État] | Service IT | |
| [Code] | Badge d'accès | 1 | Bon | RH | |

---

## 👥 CONTACTS AVEC LES PARTIES PRENANTES

| Nom | Rôle / Relation | Coordonnées | Notes importantes |
|-----|-----------------|-------------|-------------------|
| **Équipe Backend** | Développeurs API d'évaluation | [Email équipe] | Endpoints: `/api/Evaluation/*`, `/api/EvaluationType/*` |
| **Product Owner** | Définition des besoins métier | [Email/Tél] | Validation des nouvelles fonctionnalités |
| **Équipe QA** | Tests et validation | [Email équipe] | Scénarios de test du module d'évaluation |
| **Utilisateurs clés (RH)** | Utilisateurs principaux du module | [Contacts RH] | Retours d'expérience et besoins |

---

## 📚 AUTRES INFORMATIONS IMPORTANTES

### 🔑 Informations Techniques Critiques

**Architecture du module:**
- Structure modulaire en 8 sous-dossiers principaux
- ~30 fichiers, ~8000+ lignes de code

**Composants principaux:**
1. **EvaluationInterviewHome** (1221 lignes) - Gestion des entretiens
2. **EvaluationDetails** (763 lignes) - Détails et validation
3. **EvaluationConfiguration** (1118 lignes) - Configuration campagnes
4. **EvaluationNotation** (671 lignes) - Système de notation
5. **EvaluationFill** (710 lignes) - Remplissage formulaires
6. **EvalHistory** (689 lignes) - Historique et stats

**Dépendances clés:**
- React 18+, React Router v6, Axios, @nivo/pie, jsPDF, react-toastify

### ⚠️ Points d'Attention Critiques

1. **Routes dupliquées** - AppRouter.jsx lignes 95-102, 122-129, 138-144
2. **URL hardcodée** - EvaluationTypeService.jsx ligne 3
3. **Composants volumineux** - 6 composants >600 lignes

---

## ✅ CHECKLIST DE PASSATION

- [ ] Toutes les tâches quotidiennes documentées
- [ ] Projets en cours clairement décrits
- [ ] Dossiers et documents accessibles
- [ ] Accès aux outils partagés
- [ ] Matériel listé et vérifié
- [ ] Contacts importants documentés
- [ ] Session de passation planifiée
- [ ] Code à jour sur le repository

---

## 📝 SIGNATURES

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| **Démissionnaire** | [Nom] | [Date] | |
| **Responsable de la reprise** | [Nom] | [Date] | |
| **Manager direct** | [Nom] | [Date] | |
| **RH** | [Nom] | [Date] | |

---

*Document généré le 2025-11-19 - Basé sur l'analyse complète du module d'évaluation*
