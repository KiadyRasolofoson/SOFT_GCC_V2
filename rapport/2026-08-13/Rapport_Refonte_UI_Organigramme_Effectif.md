# Rapport — Refonte UI Organigramme et effectifs

**Date :** 2026-08-13  
**Projet :** SOFT_GCC_V2  
**Périmètre :** Frontend — module Organigramme et effectif (`/soft-gcc/effectifs`, détails département, organigramme, import CSV)

## Résumé

Le module conservait un style Star Admin / Bootstrap ancien (en-têtes `#B8860B`, cartes département peu lisibles, organigramme récursif sommaire). L’interface a été alignée sur le tableau de bord (tokens slate/bleu, Nunito). L’organigramme filtre désormais les branches **par département** (option « Tous les départements »), et non plus par employé racine.

## Travail réalisé

### 1. Charte visuelle

Réécriture de `front_soft_gcc/src/styles/orgChart.css` : variables `--org-*` calquées sur le dashboard (`#2563eb`, surfaces blanches, ombres légères, rayon 12px). Composants : en-tête de page, KPI, cartes département, tableau, badges, toolbar organigramme, zone d’import CSV.

### 2. Effectifs par département (`/soft-gcc/effectifs`)

`DepartmentEffective.jsx` : KPI (collaborateurs, départements, résultats filtrés), recherche, cartes cliquables, bouton Organigramme, import CSV conditionné à la permission fonctionnelle `IMPORT_ORG`. Fil d’Ariane corrigé vers `/soft-gcc/effectifs` (pluriel).

### 3. Détail département

`DetailsDepartment.jsx` : tableau moderne (avatar / initiales, matricule, poste, **date d’embauche** au lieu du libellé erroné « Naissance », ancienneté). Filtre nom / matricule / poste. Dates d’embauche absentes affichées « — » au lieu d’une date invalide.

### 4. Organigramme

`OrgChart.jsx` : fiches (avatar ou initiales, poste, département), branches repliables (N+1), survol pour le détail, zoom, affichage multi-racines.

Filtre **par département** dans `EmployeeOrgChart.jsx` :

- Option « Tous les départements » : arbre complet.
- Un département : seules les branches de ce département ; un collaborateur dont le manager est hors département devient racine locale.
- KPI « Dans la vue », « Branches », nom du filtre actif.

Le backend fournit `departmentId` sur chaque `EmployeeNode` pour ce filtre.

### 5. Import CSV

`CsvUploader.jsx` intégré au `Template` : drag-and-drop, aperçu des premières lignes, messages succès / erreur, même charte que le reste du module.

## Fichiers créés et modifiés

**Front — modifiés**

- `front_soft_gcc/src/styles/orgChart.css` — charte complète du module
- `front_soft_gcc/src/pages/OrganizationalChart/DepartmentEffective.jsx`
- `front_soft_gcc/src/pages/OrganizationalChart/DetailsDepartment.jsx`
- `front_soft_gcc/src/pages/OrganizationalChart/EmployeeOrgChart.jsx`
- `front_soft_gcc/src/pages/OrganizationalChart/CsvUploader.jsx`
- `front_soft_gcc/src/components/organizationalChart/OrgChart.jsx`

**Backend — liés à l’UI organigramme**

- `BACKEND/Core/Entities/entrepriseOrg/EmployeeNode.cs` — `DepartmentId` pour le filtre
- `BACKEND/Infrastructure/Repositories/DataService/OrgDataService.cs`
- `BACKEND/Application/Services/entrepriseOrg/OrgService.cs`

## Vérification

- Build backend : `dotnet build` — succès (0 erreur).
- Pas de `npm run build` frontend exécuté dans cette session.
- Validation manuelle attendue : `/soft-gcc/effectifs`, `/soft-gcc/effectifs/details/:id`, `/soft-gcc/organigramme` (filtre département), `/soft-gcc/effectifs/importer`.

## Résultats, limites ou risques restants

- Routes et permissions inchangées (`VIEW_ORGANIZATION`, `IMPORT_ORGANIZATION`, `MANAGE_ORGANIZATION`).
- Le filtre département est côté client à partir de l’arbre déjà chargé ; pas de nouvel endpoint.
- Un organigramme très large reste en défilement horizontal ; le zoom aide mais n’est pas un layout « fit to screen ».
- L’import CSV conserve le contrat existant (`POST /api/Org/employee/import`) ; `managerId` à 0 si absent dans le fichier (comportement d’origine).
