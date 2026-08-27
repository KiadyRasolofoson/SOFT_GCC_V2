# Fonctionnalités — Parcours de carrière & Avancement (backlog métier)

> Source : analyse de la logique d'évolution de carrière / avancement (SOFT_GCC_V2).
> Objectif : rendre le module **fiable et conforme aux pratiques SIRH professionnelles** (un acte RH = une seule saisie, tout le reste est dérivé).
> Chaque ligne est une fonctionnalité à implémenter, avec priorité, motif, fichiers impactés et critère d'acceptation.
> Légende priorité : **P1** = correctif/indispensable · **P2** = moyen terme · **P3** = évolutif.
> Avancement : ✅ **FP-01**, **FP-03** (V0) · ✅ **FP-02**, **FP-05** (V1) · ✅ **FP-09**.

---

## Principe directeur

> **Un acte RH = une seule ligne dans `Career_plan`.** On ne crée **jamais** deux lignes pour une même décision (l'avancement EST la nomination quand l'indice augmente → on qualifie l'acte, on ne le duplique pas).

---

## P1 — Correctifs & fiabilité

### ✅ FP-01 · Clôture automatique de TOUS les plans actifs à la création
- **Motif** : `GetByEmployeeAndContractType` filtre `AND Employee_type_id = 2` → la clôture du plan précédent (`Ending_contract = date du nouvel acte`) ne s'applique qu'aux employés CDD (id 2 dans le seed). Pour un CDI, l'ancien plan reste actif → plusieurs plans « actifs » en parallèle → parcours incohérent.
- **Fichiers impactés** :
  - `BACKEND/src/SoftGcc.Infrastructure/Persistence/Repositories/Data/CareerPlanDataService.cs` (`GetByEmployeeAndContractType`)
  - `BACKEND/src/SoftGcc.Api/Controllers/career/CareerPlanController.cs` (`Create`)
- **Critère d'acceptation** :
  - À la création d'un plan, **tout** plan actif (`State > 0`) de l'employé est clôturé (`Ending_contract = Assignment_date` du nouvel acte), quel que soit le type de contrat.
  - Un seul plan « actif » (sans `Ending_contract`) existe par employé après création.

### ✅ FP-02 · Auto-classification du type d'affectation à la création
- **Motif** : le type (Nomination/Avancement/Dispo) est choisi manuellement avec pour défaut « Nomination ». Une nomination avec un **indice supérieur** au plan actuel est sémantiquement un **avancement** — le système doit le détecter et le proposer par défaut (l'utilisateur garde la main).
- **Fichiers impactés** :
  - `frontend/src/app/features/career/career-plan-create.page.ts` (sélection employé → détection du type)
  - `frontend/src/app/core/career-plan-create.service.ts` (chargement dernier plan actif)
  - Réutilisation de la règle R1 du formulaire d'avancement (`career-advancement-form.component.ts`)
- **Logique de détection** (comparaison avec le dernier plan actif) :
  | Situation | Type proposé |
  |---|---|
  | Aucun plan antérieur | Nomination (1ʳᵉ affectation) |
  | Poste/département change, indice inchangé | Nomination (réaffectation) |
  | **Indice augmente** | **Avancement** (type 3) |
  | Absence temporaire | Disponibilité (type 2) — choix manuel |
- **Critère d'acceptation** :
  - Dès la sélection de l'employé, le type proposé par défaut est calculé selon la logique ci-dessus.
  - L'utilisateur peut toujours forcer un autre type (liste non bloquée).
  - Un badge explique la suggestion : « Indice supérieur au plan actuel → Avancement proposé ».

### ✅ FP-03 · Règles métier centralisées dans le backend
- **Motif** : R1 (indice strictement croissant), R2 (échelon → indice), R3 (ancienneté min), R4 (reset si changement de classe), salaire min et dates cohérentes ne sont validés **que côté frontend** → un appel API direct peut créer un acte incohérent.
- **Fichiers impactés** :
  - `BACKEND/src/SoftGcc.Application/Services/career_plan/CareerPlanService.cs` (ou nouveau `CareerPlanValidator`)
  - `BACKEND/src/SoftGcc.Api/Controllers/career/CareerPlanController.cs` (`Create`, `Update`)
- **Critère d'acceptation** :
  - `POST/PUT /CareerPlan` rejettent (4xx, message explicite) un acte violant :
    - indice nouveau ≤ indice actuel (pour un avancement) ;
    - échelon dont l'indice ne correspond pas (`Echelon.Indication_id`) ;
    - salaire base < `LegalClass.Min_salary` ;
    - `Decision_date > Assignment_date`.
  - Les mêmes règles restent dans les formulaires pour l'UX (erreurs par champ), le backend étant la garantie.

### FP-04 · Confirmation explicite du remplacement du plan courant
- **Motif** : la clôture du plan précédent est un **effet de bord silencieux** (l'utilisateur ne sait pas qu'il remplace l'acte en cours).
- **Fichiers impactés** :
  - `frontend/src/app/features/career/career-plan-create.page.ts`
  - `frontend/src/app/features/career/career-plan-edit.page.ts`
- **Critère d'acceptation** :
  - Quand un plan actif existe pour l'employé, un encart affiche : « Ce plan remplacera et clôturera le plan X (poste Y, au Z) ».
  - (Option) Case à cocher ou dialogue de confirmation avant enregistrement.

### ✅ FP-09 · Échelon dérivé automatiquement de l'indice à la nomination
- **Motif** : le formulaire de **Nomination** ne capture pas l'échelon → `Echelon_id` reste NULL après la nomination. Or l'**avancement** lit l'échelon du dernier plan pour R3 (ancienneté min) → R3 est silencieusement désactivée et la situation actuelle est incomplète (l'échelon fait partie de la grille, R2 : `Echelon.Indication_id`).
- **Fichiers impactés** :
  - `frontend/src/app/features/career/components/career-appointment-form.component.ts`
- **Critère d'acceptation** :
  - À la sélection d'un indice dans la nomination, l'échelon correspondant (même `Indication_id`, filtré par classe légale) est dérivé automatiquement et enregistré dans `form.echelonId` (→ `Career_plan.Echelon_id` non NULL).
  - Un libellé discret affiche l'échelon dérivé (transparence).
  - Tout changement de catégorie/classe/indice réinitialise proprement l'échelon.
  - Après une nomination, `GET /CareerPlan/last/{matricule}` renvoie un `echelonId` → R3 réactivée.

---

## P2 — Parcours & statut

### ✅ FP-05 · Acte courant mis en évidence dans l'onglet Carrières
- **Motif** : la fiche employé → Carrières liste nominations/avancements/dispos mais ne met pas en avant le **plan actif** (celui sans `Ending_contract`).
- **Fichiers impactés** :
  - `frontend/src/app/features/employee/components/employee-career-panel.component.ts`
- **Critère d'acceptation** :
  - Le plan courant est marqué « Courant » (badge) et trié en tête de chaque tableau.
  - Un résumé « Situation actuelle » (poste, département, indice, salaire) est visible en haut du panneau.

### FP-06 · Statut de workflow (optionnel selon besoin d'approbation)
- **Motif** : `State` (1 actif / 0 supprimé) ne couvre pas un cycle d'approbation. Si le métier exige une validation hiérarchique avant application, ajouter un statut.
- **Fichiers impactés** :
  - `BACKEND/src/SoftGcc.Domain/Entities/career_plan/CareerPlan.cs` (+ migration SQL)
  - `BACKEND/src/SoftGcc.Api/Controllers/career/CareerPlanController.cs`
  - `frontend/src/app/features/career/career-list.page.ts` (badge État)
- **Critère d'acceptation** :
  - Cycle **Brouillon → Validé → Effectif → Clôturé** avec champ `Validated_by` / `Validated_date` (facultatif).
  - Seuls les plans « Effectif » alimentent la fiche employé et le calcul de situation actuelle.
  - ⚠️ Si non requis : garder l'actuel (actif/inactif + dates) pour rester simple.

---

## P3 — Évolutions

### FP-07 · Parcours visuel (timeline) de l'employé
- **Motif** : le parcours est lisible en tableaux mais pas comme une frise chronologique.
- **Fichiers impactés** :
  - `frontend/src/app/features/employee/components/employee-career-panel.component.ts`
- **Critère d'acceptation** : une frise chronologique (date → acte → poste/indice) complète les tableaux, avec l'acte courant en évidence.

### FP-08 · Rattachement automatique d'une attestation/certificat à l'acte
- **Motif** : les certificats (`CertificateHistory` / `WorkCertificates`) ne sont pas liés à un `Career_plan_id` → pas de traçabilité décision ↔ attestation.
- **Fichiers impactés** :
  - `BACKEND/src/SoftGcc.Domain/Entities/career_plan/CertificateHistory.cs` (+ migration SQL)
  - `BACKEND/src/SoftGcc.Api/Controllers/career/CareerPlanController.cs` (`Certificate/Save`)
- **Critère d'acceptation** : une attestation peut être rattachée à un acte et apparaît dans la fiche de l'acte.

---

## Ordre de mise en œuvre recommandé

1. **FP-01** (clôture) — correctif, faible effort, fort impact.
2. **FP-02** (auto-classification) — améliore immédiatement le parcours.
3. **FP-09** (échelon dérivé à la nomination) — données de parcours complètes.
4. **FP-03** (règles backend) — fiabilité et conformité.
5. **FP-04** (confirmation) — transparence UX.
6. **FP-05** (acte courant) — lisibilité du parcours.
7. **FP-06 à FP-08** — selon besoin métier.
