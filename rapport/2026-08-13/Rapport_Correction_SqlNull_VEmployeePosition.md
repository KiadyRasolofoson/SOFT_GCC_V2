# Rapport — Correction SqlNullValueException sur v_employee_position

**Date :** 2026-08-13  
**Projet :** SOFT_GCC_V2  
**Périmètre :** Backend — organigramme et effectifs (`VEmployeePosition`, EF Core, construction de l’arbre)

## Résumé

Les endpoints `/api/Org/organigramme` et `/api/Org/detailDepartement/{id}` levaient `System.Data.SqlTypes.SqlNullValueException: Data is Null. This method or property cannot be called on Null values` lors de la lecture de `v_employee_position`. EF tentait d’appeler `SqlDataReader.GetString` sur des colonnes NULL (LEFT JOIN département, données incomplètes après synchro). Les propriétés concernées ont été rendues nullables côté entité, mapping EF et snapshot.

## Travail réalisé

### 1. Diagnostic

La requête en échec était :

```sql
SELECT [v].[Civilite_name], [v].[Department_id], [v].[Department_name], [v].[Employee_id],
       [v].[FirstName], [v].[Hiring_date], [v].[Manager_id], [v].[Name], [v].[employee_photo],
       [v].[Position_id], [v].[Position_name], [v].[Registration_number], [v].[Seniority],
       [v].[Civilite_id]
FROM [v_employee_position] AS [v]
```

La vue `v_employee_position` s’appuie sur `v_employee`, elle-même en LEFT JOIN sur `Department`. Un employé sans département (ou avec nom / prénom / matricule NULL) produisait un NULL SQL. EF avait pourtant marqué `RegistrationNumber`, `Name`, `FirstName` et `DepartmentName` comme `IsRequired()`.

### 2. Entité `VEmployeePosition`

Les quatre chaînes non nullables ont été passées en `string?` :

- `RegistrationNumber`
- `Name`
- `FirstName`
- `DepartmentName`

Les autres champs (`CiviliteName`, `PositionName`, `Seniority`, `DepartmentId`, `HiringDate`, `Photo`) l’étaient déjà.

### 3. Configuration EF

Dans `ApplicationDbContext`, le mapping de la vue n’était qu’un `ToView` + `HasNoKey`. Il a été remplacé par une configuration explicite `IsRequired(false)` sur les quatre propriétés. Le snapshot `ApplicationDbContextModelSnapshot` a été aligné (suppression des `.IsRequired()` correspondants). Aucune migration de schéma n’est nécessaire : il s’agit d’une vue, pas d’une table.

### 4. Construction de l’organigramme

`OrgDataService.BuildOrgChart` et le doublon dans `OrgService` coalescent désormais les NULL (`?? string.Empty` / libellés de repli « Non assigné », « Poste non défini »). `EmployeeNode` expose aussi `EmployeeId`, `DepartmentId` et `HasPhoto` pour le front.

## Fichiers créés et modifiés

- `BACKEND/Core/Entities/career_plan/VEmployeePosition.cs` — propriétés string rendues nullables
- `BACKEND/Infrastructure/Data/ApplicationDbContext.cs` — `IsRequired(false)` sur la vue
- `BACKEND/Migrations/ApplicationDbContextModelSnapshot.cs` — snapshot aligné
- `BACKEND/Core/Entities/entrepriseOrg/EmployeeNode.cs` — `EmployeeId`, `DepartmentId`, `HasPhoto`
- `BACKEND/Infrastructure/Repositories/DataService/OrgDataService.cs` — coalescence NULL + nouveaux champs
- `BACKEND/Application/Services/entrepriseOrg/OrgService.cs` — même coalescence sur le builder inutilisé / aligné

## Vérification

- `dotnet build` dans `BACKEND` — succès (0 erreur, warnings pré-existants hors périmètre).
- Pas de tests automatisés dédiés à `OrgDataService`.
- Validation manuelle : redémarrage de l’API requis pour que le mapping nullable soit pris en compte.

## Résultats, limites ou risques restants

- L’exception disparaît dès qu’une ligne de la vue contient un NULL sur les colonnes string.
- Les employés sans département restent visibles (libellé « Non assigné ») au lieu de faire échouer toute la requête.
- D’autres vues du projet peuvent encore mapper des string non nullables alors que SQL renvoie NULL ; ce correctif ne couvre que `v_employee_position`.
