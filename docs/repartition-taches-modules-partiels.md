# Répartition des tâches — modules critiques (2 personnes)

Lot réduit : **seulement** les modules cœur déjà partiels, nécessaires pour que l’évaluation des compétences soit fiable.

Le référentiel de compétences (module 1) est **déjà en place**. Les deux personnes le consomment, elles ne le reconstruisent pas.

---

## Périmètre

| Conservé (critique) | Pourquoi |
|---|---|
| **3. Évaluation des compétences** | Campagnes et notation existent, mais pas le même langage que le référentiel (note globale recopiée, % vs 1–4, portail salarié encore en React). |
| **2. Emplois — compétences requises** | Sans niveau attendu par poste, pas d’écart réel. La matrice existe : il faut qu’elle soit **la** source unique pour l’évaluation. |
| **4. Entretien de performance** | Déjà dans le flux d’évaluation (CR, validation). À relier aux écarts, pas un second produit. |

### Hors lot (non critique pour cette passe)

PDI, formation / Soft Training, entretien professionnel légal, 360°, bourse interne, succession, passerelles / arbre de carrière, familles / filières métier, cartographie GPEC, relances PDI.

Droits, workflows de campagne et cloche d’évaluation : **déjà là**, ne pas les refaire.

---

## Principes

| Règle | Détail |
|---|---|
| Découpage métier, pas front / back | Chaque personne livre API + Angular de **son** lot. |
| Même langage | Échelle **1–4**. Écart = attendu du poste vs acquis. Pas de nouvelle grille. |
| UI | Templates `gcc-*`. Portail salarié = `gcc-portal-shell`. |
| Matrice postes | Déjà dans `skill-matrix` : A l’expose ; B ne recrée pas de listes de compétences par poste. |

---

## Vue d’ensemble

| Personne | Périmètre |
|---|---|
| **A — Attendus et écarts** | Poste = niveaux attendus ; fiche employé et bulletin parlent en 1–4. |
| **B — Campagne et entretien** | Notation **par compétence**, portail auto-éval Angular, entretien préparé avec les écarts. |

```
Personne A                              Personne B
─────────                               ─────────
Matrice poste = source des attendus
Écarts fiche employé (API gaps)
Bulletin / historique en 1–4
        │                               Notation par compétence 1–4
        │                               Portail auto-éval Angular
        └──────── contrat gaps ────────► Entretien : compétences à discuter
                                         Note de performance ≠ niveau de maîtrise
```

---

## Contrats partagés (jour 1)

### API d’écarts (existante — ne pas casser)

`GET /api/skill-referential/employees/{id}/gaps`

- Entrée : employé + poste (actuel par défaut).
- Sortie : compétence, attendu (1–4), acquis (1–4), criticité, écart.
- **A** s’assure que les attendus viennent de la matrice poste.
- **B** affiche ces écarts en notation et en entretien.
- Tout changement de contrat = ticket commun.

### Compétence critique

`requirementKind = Critical` sur la matrice poste. Même définition pour A (affichage) et B (priorité en entretien).

### Fichiers à ne pas croiser

| Zone | Propriétaire |
|---|---|
| `skill-referential/` (postes, matrice) | **A** |
| `employee/` onglet Compétences, `bulletin-competence` | **A** |
| `evaluations/` (planning, notation, portail, entretiens, historique) | **B** |
| `Position.cs` / matrice attendus | **A** |
| `EvaluationPortal*`, `EvaluationLogin*`, wizard notation / entretien | **B** |
| `SkillReferentialController` (gaps) | **A** ; B en lecture seule |
| `app.routes.ts`, seeds modules | PRs séparées, relecture croisée |

---

## Personne A — Attendus du poste et écarts

**Objectif :** on sait, pour un collaborateur, ce que son poste exige et où il en est — en 1–4, partout pareil.

### A1 — Matrice poste, source unique des attendus

| ID | Tâche | Fait quand |
|---|---|---|
| A1.1 | Confirmer / exposer pour chaque poste : compétences, niveau attendu 1–4, `Required` / `Critical` / `Desired`, poids. Réutiliser `skill-matrix`, pas une 2ᵉ table. | L’API poste (ou gaps) renvoie les attendus utilisés par B. |
| A1.2 | Écran fiche poste **utile à l’éval** (DetailPage) : identité + matrice. Pas de missions / familles / publication dans ce lot. | RH voit et corrige les attendus au même endroit. |
| A1.3 | Si `Competence_Lines` (questionnaires) n’est pas aligné sur `Skill_position`, documenter le pont `SkillPositionId` et corriger les cas cassés. | Une compétence de poste notée = une ligne de la matrice. |

**Appui :** `skill-matrix.page.ts`, `skill-position-list.page.ts`, `SkillReferentialController`.

### A2 — Écarts sur la fiche et le bulletin

| ID | Tâche | Fait quand |
|---|---|---|
| A2.1 | Fiche employé, onglet Compétences : écarts **réels** poste actuel vs acquis (`gcc-skill-gap`). Plus l’écart illustratif. | Aligné sur `GET .../gaps`. |
| A2.2 | Bulletin + affichage historique de **maîtrise** : mêmes libellés 1–4 que le référentiel. | Plus de mélange % / 3 étiquettes / seuils 40–70 % pour la maîtrise. |
| A2.3 | Après notation B, vérifier que `Acquired_level` et le bulletin se mettent à jour **par compétence**. | Un écart change uniquement pour la compétence notée. |

**Appui :** `employee-skills-panel.component.ts`, `bulletin-competence.page.ts`, `GET .../employees/{id}/gaps`.

---

## Personne B — Campagne, notation, portail, entretien

**Objectif :** évaluer chaque compétence en 1–4, y compris côté salarié dans Angular, puis en parler en entretien.

### B1 — Notation par compétence + portail

**Ne pas attendre A** pour démarrer le portail (API portail déjà là). Brancher les attendus A dès qu’ils sont stables.

| ID | Tâche | Fait quand |
|---|---|---|
| B1.1 | Notation manager **par compétence** (1–4). Interdit de recopier une note globale sur toutes les compétences. | Chaque résultat d’éval / `Acquired_level` correspond à la compétence notée. |
| B1.2 | Note de **performance** de campagne **séparée** du niveau de maîtrise. | Deux chiffres visibles, deux usages. |
| B1.3 | **Portail auto-évaluation Angular** (`gcc-portal-shell` + Wizard) : login compte temporaire, questionnaire, progression, finalisation. Brancher `EvaluationPortal` / `EvaluationLogin`. Plus de React pour ce flux. | Le salarié termine sans `old_frontend`. |
| B1.4 | Questions / lignes de compétence branchées sur la matrice poste (contrat A1). | On n’évalue pas une compétence absente du poste (sauf exception RH explicite). |

**Hors lot :** 360° (pairs, N-1, clients).

**Appui :** `notation-wizard.page.ts`, `EvaluationPortalController.cs`, `old_frontend/.../SalaryEval/`.

### B2 — Entretien de performance (existant)

Pas d’entretien professionnel légal dans ce lot.

| ID | Tâche | Fait quand |
|---|---|---|
| B2.1 | Préparer l’entretien avec la liste des compétences à discuter (écarts API, critiques en premier). | Le wizard affiche les écarts avant / pendant le CR. |
| B2.2 | Conserver planning, CR, PDF, validation manager puis direction. | Pas de régression sur le flux actuel. |
| B2.3 | Relances **existantes** de campagne : les garder ; ne pas ajouter de nouveaux types (PDI, échéance légale). | Cloche / relances éval inchangées ou seulement corrigées si cassées. |

**Appui :** `interview-wizard.page.ts`, `EvaluationInterviewController`.

---

## Calendrier (3 phases)

| Phase | Personne A | Personne B | Sync |
|---|---|---|---|
| **1** | A1 matrice = source des attendus | B1.3 portail Angular (API actuelle) | Contrat gaps + `SkillPositionId` |
| **2** | A2 fiche + bulletin 1–4 | B1.1–B1.2 notation par compétence | Une campagne test : acquis mis à jour par skill |
| **3** | A2.3 contrôle après notation | B2 entretien alimenté par les écarts | Parcours RH / manager / salarié bout en bout |

---

## Charge

| A | Effort | B | Effort |
|---|---|---|---|
| A1 Matrice / attendus | M | B1 Notation + portail Angular | L |
| A2 Écarts fiche + bulletin | M | B2 Entretien + écarts | M |

B1 est le lot le plus lourd. Si A a fini : aider le shell portail (`gcc-portal-shell`) **sans** toucher à la notation.

---

## Fin de lot

1. Salarié, manager, RH font une campagne **sans** l’ancien frontend React.
2. Tous les écarts affichés sont en **1–4** (attendu vs acquis).
3. La note de performance n’écrase pas les niveaux de compétence.
4. L’entretien de performance montre les compétences en écart.

| Module | Critère de fin |
|---|---|
| 2. Emplois (partie critique) | Matrice poste = unique source des niveaux attendus pour l’éval |
| 3. Évaluation | Notation par compétence 1–4 + portail Angular + écarts fiche + bulletin aligné |
| 4. Entretien performance | CR inchangé en validation, **préparé** avec les écarts |

---

## Revue croisée

- A relit le portail et le wizard notation (droits salarié / manager).
- B relit la fiche employé et le bulletin (lecture des gaps).
- Seeds `Modules` / `Permissions` : relecture de l’autre personne.

---

## Déjà en place — ne pas refaire

- Catalogue compétences, versions, publier / archiver
- Matrice emploi–compétences (écran actuel)
- Campagnes, superviseurs, historique, PDF manager
- Entretien performance (planning, CR, validation)
- RBAC, cloche, relances de campagnes
- Organigramme, effectifs, retraites, attestations, souhaits, assistant IA
