# Flux à exercer

Ne pas tout jouer à chaque changement. Prendre le **flux du diff** + 1 page voisine. Compte par défaut : `admin` / `admin`.

Préfixe des créations : `TEST-AGENT-`.

## A. Smoke login + shell

1. `admin` → dashboard, sidebar, cloche, avatar (rôle affiché).
2. Ouvrir 2 rubriques du menu (parent avec chevron puis enfant).
3. Logout → login `manager` → **Paramètres** absent ; URL `/soft-gcc/parametres/employes/liste` → 403.
4. Logout → `RH` → Paramètres visible.

## B. Liste type (ListPage)

Ex. `/soft-gcc/parametres/employes/liste` ou `/soft-gcc/evaluations/liste`.

1. Header + `gcc-filter-bar` + `mat-table` (ou empty-state).
2. Filtrer un terme connu → lignes réduites. Réinitialiser → retour.
3. Paginer s’il y a plusieurs pages.
4. Ouvrir une ligne / action → détail. Retour : liste cohérente.

## C. Référentiel de compétences

Routes : `/soft-gcc/parametres/referentiel-competences`. Comptes : `admin` ou `RH`.

1. Catalogue : filtres domaine / famille / catégorie (`gcc-select`).
2. **Domaines** / **Familles** : liste, Enregistrer si `canManage`.
3. **Nouvelle compétence** : code (hint `CODE_HINT`), nom, catégorie, famille, définition, 4 descripteurs.
4. **Enregistrer brouillon** → rester sur la fiche, badge d’état.
5. **Publier** (Admin/RH) → état Active. `manager` ne doit pas arriver ici (403 menu).
6. **Matrice emplois** : ouvrir un poste, Enregistrer la matrice.
7. Voisins : `/soft-gcc/competences`, fiche employé onglet Compétences, bulletin.

## D. Fiche employé

1. Liste employés → une fiche `/soft-gcc/employes/fiche/:employeeKey`.
2. `gcc-identity-card` (nom, poste, département, matricule).
3. Onglets Infos / Compétences / Carrières.
4. Compétences : badges / écarts `gcc-skill-badge` · `gcc-skill-gap`. Dialog **Ajouter/Modifier** → Enregistrer.
5. Retour liste : pas d’écran blanc.

## E. Évaluations

| Flux | Entrée | Succès |
|---|---|---|
| Notation | `/soft-gcc/evaluations/liste` → wizard | Stepper, brouillon, pas de 500 |
| Planning | `/soft-gcc/evaluations/planning` | Liste / wizard campagne |
| Entretien | `/soft-gcc/evaluations/accueil` | Liste ; Valider si permission |
| Validation manager | compte `manager` | Page validation, pas 403 |
| Validation direction | compte `direction` | Idem direction |
| Objectifs / historique / bulletin | URLs dédiées | Titre + données ou empty-state |

Wizards : boutons d’étape (**Enregistrer le brouillon & Continuer**, **Enregistrer l’entretien**). PDF : vérifier qu’un dialogue/téléchargement part, ne pas bloquer sur le fichier.

Ne pas **Valider définitivement** une évaluation réelle sauf demande explicite.

## F. Carrières / souhaits / retraite / effectifs

- Plans : liste → création ou détail.
- Souhaits : liste → ajouter / détails.
- Retraite : liste + tri colonnes.
- Effectifs → détail département ; organigramme (canvas). Import CSV seulement si le ticket le dit.

## G. Paramètres users / eval / IA

- `/soft-gcc/parametres/utilisateurs` : comptes, section accès. Dialogs Material.
- `/soft-gcc/evaluations/parametres` : sections, dialog questions.
- `/soft-gcc/parametres/agent-ia` et `/soft-gcc/assistant` : seulement si le diff touche l’IA. Fermer le FAB s’il masque la page.

## H. Régression d’état

Si le code **écrit** un état (compétence publiée, skill employé, souhait, note) :

1. Écran d’écriture : succès visible (badge, toast inline, redirection).
2. Écran de lecture lié (liste, fiche, bulletin, dashboard si KPI).
3. Recharger l’URL (F5 via `browser_navigate` sur la même URL) : l’état survit (JWT + API).

Erreur attendue : bandeau / `gcc-empty-state` `variant="error"` / champ ambre. Une page blanche ou un spinner infini = KO.
