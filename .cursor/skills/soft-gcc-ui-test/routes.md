# Routes et rôles Soft GCC

Base : `http://localhost:4201`. Toutes les pages métier sont sous `/soft-gcc/…` dans `gcc-app-shell`, derrière `authGuard` + `moduleGuard`.

Le menu latéral vient de `GET /api/Module/my-modules` (pas des routes Angular en dur). Un item absent du menu n’est pas forcément une 404 : y aller par URL peut donner **403**.

Admin (`roleTitle` admin / administrator / administrateur) : `canAccessRoute` toujours vrai.

Seed `Role_Modules` (rôles 1–4) : Manager **sans** Paramètres ni Attestations. RH / Direction / Admin : modules racines complets. Les **permissions** API restent plus strictes (ex. `PUBLISH_SKILL_REFERENTIAL` = Admin + RH seulement).

## Auth

| URL | Garde | Succès |
|---|---|---|
| `/login` | `guestGuard` | Formulaire SoftTalent |
| `/unauthorized` | `authGuard` | 403 + retour dashboard |
| `/soft-gcc/tableau-de-bord` | module | Titre « Tableau de bord RH » |

## Menu métier

| Module | URL | Titre typique |
|---|---|---|
| Analyse statistiques | `/soft-gcc/tableau-de-bord` | Tableau de bord RH |
| Profil des compétences | `/soft-gcc/competences` | Liste compétences employés |
| Bulletin de compétences | `/soft-gcc/evaluations/bulletin` | Bulletin |
| Plan de carrière | `/soft-gcc/carrieres` | Liste plans |
| Création plan | `/soft-gcc/carrieres/creation` | Formulaire |
| Détail / édition plan | `/soft-gcc/carrieres/fiche/detail/:id` · `…/fiche/modifier/:id` | Wizard / fiche |
| Départ à la retraite | `/soft-gcc/retraite` | Liste |
| Évolution de carrière | `/soft-gcc/souhaits-evolution` | Liste souhaits |
| Ajout / détail / edit souhait | `…/ajouter` · `…/details/:id` · `…/edit/:id` | |
| Effectifs | `/soft-gcc/effectifs` | Départements |
| Import CSV | `/soft-gcc/effectifs/importer` | Import |
| Détail département | `/soft-gcc/effectifs/details/:departmentId` | |
| Organigramme | `/soft-gcc/organigramme` | Canvas |
| Notation | `/soft-gcc/evaluations/liste` | Liste notations |
| Wizard notation | `/soft-gcc/evaluations/notation/:evaluationId` | Stepper |
| Planning | `/soft-gcc/evaluations/planning` | Liste campagnes |
| Nouvelle campagne | `/soft-gcc/evaluations/planning/campagne` | Wizard |
| Entretiens | `/soft-gcc/evaluations/accueil` | (`…/entretiens` redirige ici) |
| Wizard / validation entretien | `…/entretiens/:id` · `…/entretiens/:id/validation` | |
| Historique évaluations | `/soft-gcc/evaluations/historique` · `…/:evaluationId` | |
| Récap objectifs | `/soft-gcc/evaluations/objectifs` | |
| Attestations | `/soft-gcc/attestations` | Manager : 403 attendu |
| Historique activités | `/soft-gcc/historique` | |
| Assistant IA | `/soft-gcc/assistant` | Canvas chat (pas de FAB) |

## Paramètres (souvent absents pour Manager)

| URL | Titre / rôle |
|---|---|
| `/soft-gcc/parametres/referentiel-competences` | Catalogue compétences |
| `…/referentiel-competences/competences/nouveau` | Nouvelle compétence |
| `…/referentiel-competences/competences/:skillId` | Fiche (brouillon / Publier / Archiver) |
| `…/referentiel-competences/domaines` | Domaines |
| `…/referentiel-competences/familles` | Familles |
| `…/referentiel-competences/postes` | Liste postes |
| `…/referentiel-competences/postes/:positionId` | Matrice emploi |
| `/soft-gcc/parametres/competences` | Nomenclatures (écoles, langues, diplômes, filières, départements) |
| `/soft-gcc/parametres/carrieres` | Paramètres carrières |
| `/soft-gcc/parametres/employes/liste` | Liste employés |
| `/soft-gcc/parametres/employes/creer` | Création employé |
| `/soft-gcc/employes/fiche/:employeeKey` | Fiche (Infos / Compétences / Carrières) |
| `/soft-gcc/evaluations/parametres` | Paramètres évaluations |
| `/soft-gcc/parametres/utilisateurs` | Comptes (`…/acces` rôles & permissions) |
| `/soft-gcc/parametres/synchronisation` | Sync employés |
| `/soft-gcc/parametres/agent-ia` | Réglages agent IA |

## Qui tester avec quel compte

| Besoin | Compte |
|---|---|
| Smoke large, settings, users, référentiel | `admin` |
| Flux RH (employés, souhaits, eval, publish skill) | `RH` |
| Menu réduit, 403 paramètres, validation manager | `manager` |
| Validation direction, lecture étendue | `direction` |

Si le menu local ne correspond pas au tableau (seed différent), le noter dans le rapport et suivre le menu réel + la 403.
