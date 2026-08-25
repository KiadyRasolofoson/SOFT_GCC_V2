---
name: soft-gcc-ui-test
description: >-
  Tests the Soft GCC (SoftTalent) Angular web UI in the Cursor browser during
  agent development: local login, role-based menus, lists, forms, wizards, 403s,
  and regressions. Use when verifying frontend changes, exercising user flows,
  smoke-testing after a UI/API change, or when the user asks to tester
  l'interface, tester un flux, vérifier dans le navigateur, E2E, or smoke test.
---

# Soft GCC — test UI (navigateur)

Tester **l’app Angular** comme un utilisateur, pas seulement le visuel. Un screenshot ne suffit pas.

Outils : namespace MCP `cursor-ide-browser`. Appeler `GetDynamicTools` (`namespace: cursor-ide-browser`) avant le premier `CallDynamicTool`.

Références :
- Cartographie des routes et rôles : [routes.md](routes.md)
- Flux smoke / métier : [flows.md](flows.md)

## Quand l’utiliser

- Après une modification UI, routing, auth, permissions, listes, formulaires, wizards.
- Quand l’utilisateur demande de tester un écran ou un flux.
- Avant de déclarer une tâche frontend **terminée**.

Ne pas lancer un parcours complet si le changement est isolé : tester le flux touché **et** les pages qui lisent le même état.

## Prérequis

| Service | URL | Démarrage |
|---|---|---|
| Frontend Angular | `http://localhost:4201` | `cd frontend && npm start` |
| API | `http://localhost:5189` | `cd BACKEND && dotnet run --project src/SoftGcc.Api` |
| Swagger | `http://localhost:5189/swagger` | — |

1. Vérifier les terminaux du workspace. Ne pas relancer un serveur déjà actif.
2. Si le front ne répond pas : démarrer `npm start` dans `frontend/` (port **4201**, pas 4200).
3. Si le login échoue (réseau / 5xx) : démarrer l’API.
4. Login `403` avec `licence invalide` : licence locale, pas un bug UI — le signaler et s’arrêter.

Ne pas tester `old_frontend/` (React, port 5173) sauf demande explicite.

## Comptes locaux (dev uniquement)

Champ login : `#identifier` (« Identifiant / Email »). Ce sont des **usernames**, pas des e-mails.

| Username | Password | Rôle attendu | Usage |
|---|---|---|---|
| `admin` | `admin` | Admin | Accès total, ignore le `moduleGuard` |
| `RH` | `RH` | RH | Opérations + paramètres (référentiel, employés, users) |
| `manager` | `manager` | Manager | Métier sans Paramètres ni Attestations |
| `direction` | `direction` | Direction | Lecture étendue, validation direction |

Choisir le compte selon le flux (voir [routes.md](routes.md)). Défaut pour un écran RH / paramétrage : **`admin`**.

Ne jamais utiliser ces identifiants hors local. Ne pas les recopier dans un commit, un PR, ou un message utilisateur.

## Protocole navigateur

1. `browser_tabs` `list`.
2. Pas d’onglet → `browser_navigate` vers `http://localhost:4201/login` (sans `position`, sauf si l’utilisateur demande de voir le navigateur).
3. Onglet existant → `browser_lock` `{ action: "lock" }` **avant** toute interaction.
4. `browser_snapshot` : source de vérité (refs). Screenshot seulement pour le visuel.
5. Interagir avec `browser_click` / `browser_fill` / `browser_type` / `browser_press_key` / `browser_scroll`. **Jamais** CDP `Input.*`.
6. Après chaque action qui change l’écran : **nouveau snapshot** (les refs expirent).
7. 4 échecs ou impasse → arrêter, rapporter page / cible / blocage.
8. Fin du tour : `browser_lock` `{ action: "unlock" }`.

Attente : snapshot ou CDP `Runtime.evaluate` (présence d’un `h1`, disparition de « Chargement… »). Pas de boucle wait-action-wait.

SPA : une fois connecté, `browser_navigate` vers l’URL cible réutilise le JWT (`localStorage` `token`).

## Recette login

1. Aller sur `http://localhost:4201/login`.
2. Snapshot. Titre attendu : **Connexion à SoftTalent**.
3. `browser_fill` `#identifier` puis `#password`.
4. Cliquer **Se connecter** (pas Entrée si le bouton est disabled / loading).
5. Succès : URL `/soft-gcc/tableau-de-bord`, sidebar « Navigation Principale », header avec initiales.
6. Échec : bandeau ambre sous le titre — lire `message` + `suggestion`.

**Changer de rôle** : avatar en haut à droite → **Déconnexion** → `/login` → reconnecter. Ne pas empiler deux sessions.

Déjà connecté + `/login` : `guestGuard` redirige vers le tableau de bord. Pour un autre compte, se déconnecter d’abord.

## Recette 403

Naviguer (URL ou menu) vers une route hors rôle. Page **Accès non autorisé (403)** dans `gcc-auth-shell`, bouton **Retour au tableau de bord**.

Contrôle typique : `manager` sur `/soft-gcc/parametres/utilisateurs` ou `/soft-gcc/parametres/referentiel-competences`.

## Contrôles UI (ne pas se tromper)

| Contrôle | Comment faire |
|---|---|
| `gcc-select` / `gcc-searchable-select` | **Pas** un `<select>` natif. Cliquer le bouton, snapshot du overlay, cliquer l’option. Ne pas utiliser `browser_select_option`. |
| `gcc-filter-bar` | Saisir, **Filtrer** ou Entrée. **Réinitialiser** pour vider. |
| Header d’action | Bouton primaire dans `gcc-page-header` (ex. « Nouvelle compétence »), pas un `h1` cliquable. |
| `mat-dialog` | Overlay body. Snapshot **après** ouverture. **Enregistrer** / **Annuler** (`mat-dialog-close`). |
| `mat-tab-group` | Cliquer le libellé d’onglet (fiche employé : Infos / Compétences / Carrières). |
| `mat-stepper` (wizards) | Avancer via les boutons de l’étape, pas en cliquant un step completed. |
| Table + paginator | Ligne cliquable ou bouton d’action. Changer de page avec `mat-paginator`. |
| Liste vide | `gcc-empty-state` (« Aucun résultat » / erreur) — ce n’est pas un crash. |
| FAB **Ouvrir SoftTalent AI** | Ignorer sauf test assistant. |

Canvas (organigramme, bulletin, `/soft-gcc/assistant`) : `main` sans padding, overflow hidden — scroller dans le canvas, pas la page.

## Vérifier un flux (checklist)

```
- [ ] Serveurs joignables (4201 + 5189)
- [ ] Login avec le bon rôle
- [ ] Écran cible : titre gcc-page-header + données (pas bloqué sur « Chargement… »)
- [ ] Action principale (ouvrir, filtrer, créer, enregistrer, valider)
- [ ] Résultat visible (ligne, badge, navigation, empty-state, erreur inline)
- [ ] Page liée qui lit le même état
- [ ] Logout si un 2e rôle est nécessaire
```

Création de données : préfixe `TEST-AGENT-` (code / nom). Ne pas supprimer des employés, campagnes ou compétences existantes sauf si le ticket le demande.

## Rapport

Être factuel. Format :

```
Rôle : admin
Parcours : login → [écrans] → résultat
OK : …
KO : [page] [action] [attendu] [observé]
Non testé : …
```

Bloquant classique : API down, licence, 401 après reload, 403 inattendu, overlay non cliquable, formulaire qui n’enregistre pas, état OK sur un écran et KO sur l’autre.
