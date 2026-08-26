# Pont `Competence_Lines` ↔ `Skill_position` (A1.3)

> **Règle du lot (A1.3)** : « Une compétence de poste notée = une ligne de la matrice. »
> Une ligne de questionnaire d'évaluation doit toujours référencer une ligne active de la matrice
> emploi–compétences (`Skill_position`). On n'évalue pas une compétence absente du poste.

---

## 1. Le pont

La table `Competence_Lines` (lignes de compétence du questionnaire) est reliée à la matrice par
la colonne **`SkillPositionId`** :

```
Competence_Lines.SkillPositionId
        │  (FK)
        ▼
Skill_position.Skill_position_id      ← la matrice emploi–compétences (source unique)
        ├── Position_id  → Position    (poste)
        └── Skill_id     → Skill       (compétence : nom, code, niveau attendu 1–4, criticité, poids)
```

- Une ligne de compétence = un **couple (poste, compétence)** issu de la matrice.
- Le niveau attendu (`Expected_level`), la criticité (`Requirement_kind`) et le poids (`Weight`)
  de l'évaluation viennent de la matrice, **jamais** d'une 2ᵉ table.

### Correspondance EF / SQL

| Entité EF | Table / colonnes |
|---|---|
| `CompetenceLine` (`SoftGcc.Domain/Entities/Evaluations/CompetenceLine.cs`) | `Competence_Lines` : `CompetenceLineId`, `SkillPositionId` (requis, FK), `Description`, `state` |
| `SkillPosition` (`SoftGcc.Domain/Entities/wish_evolution/SkillPosition.cs`) | `Skill_position` : `Skill_position_id`, `Position_id`, `Skill_id`, `Expected_level`, `Requirement_kind`, `Weight`, `State` |

---

## 2. Consommateurs du pont (backend)

| Code | Usage |
|---|---|
| `CompetenceLineService.GetByPositionIdAsync` → `EvaluationDataService.GetCompetenceLinesByPositionIdAsync` | filtre `cl.State == 1 && cl.SkillPosition.PositionId == positionId` |
| `EvaluationPlanningController.GetCompetenceLines(positionId)` | renvoie `skillPositionId`, `skillName`, `positionName` via `cl.SkillPosition` |
| `EvaluationCompetenceService` (résultats) | `LEFT JOIN Skill_position sp ON cl.SkillPositionId = sp.Skill_position_id` + `Skill` → nom, sinon « Inconnu » |
| `EvaluationService` (historique / résultats) | `LEFT JOIN SkillPosition sp ON cl.SkillPositionId = sp.SkillPositionId` |
| `EvaluationPlanningController` (planning) | propage `skillPositionId` aux lignes du questionnaire |

> ⚠️ Toute ligne dont `SkillPositionId` est `NULL` ou pointe vers une matrice absente/archivée
> fait remonter un nom « Inconnu » / « Non défini » et peut casser
> `GetCompetenceLinesByPositionIdAsync` (`cl.SkillPosition.PositionId` → `NullReferenceException`).

---

## 3. Désalignement constaté (avant correction)

1. **Schéma canonique obsolète** — `bdd/eval/01_TABLES_EVALUATIONS.sql` créait encore
   `Competence_Lines (PositionId NOT NULL, CompetenceName NOT NULL, SkillPositionId INT NULL)`
   sans FK vers `Skill_position`. Le modèle EF attend `SkillPositionId` (requis, FK) et ne connaît
   ni `PositionId` ni `CompetenceName` → écart script / ORM.
2. **Données de test** — `bdd/eval/04_DONNEES_TEST.sql` et `NEW DATA_TEST_EVALUATIONS.sql`
   inséraient des lignes avec `(PositionId, CompetenceName, Description, state)` **sans**
   `SkillPositionId` → lignes détachées de la matrice (non évaluables).
3. **Aucun script de réparation** pour les bases existantes (pas de FK, pas de backfill).

---

## 4. Corrections livrées

| Fichier | Rôle |
|---|---|
| `bdd/eval/01_TABLES_EVALUATIONS.sql` | Schéma canonique aligné : `SkillPositionId INT NOT NULL` + `FOREIGN KEY (SkillPositionId) REFERENCES Skill_position(Skill_position_id)`, plus de `PositionId`/`CompetenceName`. |
| `bdd/eval/04_DONNEES_TEST.sql`, `NEW DATA_TEST_EVALUATIONS.sql` | Les inserts passent par `SkillPositionId` résolu depuis la matrice (poste + nom de compétence). Une compétence absente de la matrice n'a pas de ligne. |
| `bdd/eval/12_ALIGN_COMPETENCE_LINES_SKILL_POSITION.sql` | **Réparation des bases existantes** (idempotent) : backfill `SkillPositionId`, désactivation des lignes non rattachables, FK + index, suppression des colonnes obsolètes. |
| `CompetenceLineService` (+ `IEvaluationDataService`) | Validation à la création / modification : `SkillPositionId` doit référencer une ligne **active** de la matrice (`State > 0`), sinon rejet. |

---

## 5. Application

### Base existante (base de données déjà créée)

Exécuter une fois, sur `Soft_GCC` :

```sql
-- BACKEND/src/SoftGcc.Api/bdd/eval/12_ALIGN_COMPETENCE_LINES_SKILL_POSITION.sql
```

Le script est idempotent (ré-exécutable sans danger).

### Installation neuve

Le schéma corrigé de `01_TABLES_EVALUATIONS.sql` est appliqué automatiquement par
`DatabaseInitializer` (création de la table si absente) ; puis les seeds (dont `04_DONNEES_TEST.sql`)
insèrent les lignes via `SkillPositionId`.

---

## 6. Critère de fin (rappel)

- ✅ `Competence_Lines.SkillPositionId` référence toujours une ligne active de `Skill_position`.
- ✅ Aucune ligne de questionnaire sans lien matrice (les lignes non rattachables sont `state = 0`).
- ✅ `GET /api/CompetenceLine/position/{positionId}` et le planning remontent nom de compétence
  et poste depuis la matrice, jamais depuis une colonne libre.
