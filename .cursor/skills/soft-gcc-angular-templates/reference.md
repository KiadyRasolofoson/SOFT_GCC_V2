# Référence — kit Soft GCC

Chemins relatifs à `design-system/src/app/`.

## Fichiers à copier / extraire

### Layouts

| Sélecteur | Fichier | Quand |
|---|---|---|
| `gcc-app-shell` | `layouts/gcc-app-shell.ts` | Toutes les pages authentifiées |
| `gcc-auth-shell` | `layouts/gcc-auth-shell.ts` | Login, register, unauthorized |
| `gcc-portal-shell` | `layouts/gcc-portal-shell.ts` | Évaluation salarié, verify attestation |

### Pages (structures, pas toujours un fichier dédié)

Composer comme dans `catalog/pages.page.ts` et `catalog/layouts.page.ts`.

| Nom | Quand | Enfants typiques |
|---|---|---|
| DashboardPage | Tableau de bord | PageHeader, KpiCard × 4, cartes charts |
| ListPage | Listes métier | PageHeader, FilterBar, MatTable, paginator, EmptyState |
| FormPage | Création / édition | PageHeader, carte, gcc-input, gcc-select |
| DetailPage | Fiche | PageHeader, IdentityCard, mat-tab-group, SkillGap |
| SettingsPage | CRUD référentiels | PageHeader, mat-tab-group, MatTable, bouton icône edit |
| WizardPage | Multi-étapes | PageHeader, mat-stepper, cartes d’étape |
| CanvasPage | Visu plein espace | PageHeader, zone canvas, EmptyState |

### Composants

| Sélecteur | Fichier |
|---|---|
| `gcc-page-header` | `ui/gcc-page-header.ts` |
| `gcc-filter-bar` | `ui/gcc-filter-bar.ts` |
| `gcc-select` | `ui/gcc-select.ts` |
| `gcc-kpi-card` | `ui/gcc-kpi-card.ts` |
| `gcc-skill-badge` | `ui/gcc-skill-badge.ts` |
| `gcc-status-tag` | `ui/gcc-status-tag.ts` |
| `gcc-identity-card` | `ui/gcc-identity-card.ts` |
| `gcc-empty-state` | `ui/gcc-empty-state.ts` |
| `gcc-skill-gap` | `ui/gcc-skill-gap.ts` |

Types : `ui/gcc.types.ts` (`GccCrumb`, `GccSelectOption`).
Tokens CSS : `design-system/src/styles.css`.

## Tokens

| Rôle | Hex | Classe |
|---|---|---|
| Navy (60 %) | `#0F172A` | `bg-navy` `text-navy` |
| Indigo pro | `#1E3A8A` | `bg-indigo-pro` |
| Canvas (30 %) | `#F8FAFC` | `bg-canvas` |
| Carte | `#FFFFFF` | `bg-white border-slate-200` |
| Accent (10 %) | `#6366F1` | `bg-accent` `text-accent` |
| Violet carrière | `#7C3AED` | `bg-accent-violet` |

Badges maîtrise (`gcc-skill-badge`) :

| Niveau | Input | Fond / texte |
|---|---|---|
| Notions | `beginner` | `#E0F2FE` / `#0369A1` |
| Autonome | `intermediate` | `#D1FAE5` / `#047857` |
| Expert | `expert` | `#EDE9FE` / `#6D28D9` |

Statuts (`gcc-status-tag`) : `pending`, `ok` / `validated`, `gap` (`#FEF3C7` / `#B45309`), `refused`, `processed`.

Boutons : `mat-flat-button` + `gcc-btn-primary` ; `mat-stroked-button` + `gcc-btn-secondary`.

## Mapping écrans existants (React → template)

| Route / écran actuel | Layout | Page |
|---|---|---|
| Login, Register, Unauthorized | AuthShell | — |
| `/evaluation/connexion`, questionnaire, confirmation, verify attestation | PortalShell | Wizard / confirmation |
| Tableau de bord | AppShell | Dashboard |
| Listes compétences, carrières, retraite, souhaits, évaluations, employés, historique | AppShell | ListPage |
| Créer employé, affectation, souhait | AppShell | FormPage |
| Fiche employé, détail affectation, détail souhait | AppShell | DetailPage |
| Paramètres compétences / carrières / users | AppShell | SettingsPage |
| Notation, entretien, création plan | AppShell | WizardPage |
| Organigramme, effectifs, bulletin, matrice | AppShell | CanvasPage |

## API composants (inputs)

`gcc-page-header` : `title`, `subtitle`, `icon` (Material ligature), `crumbs`, `actionLabel`, `actionIcon`, `secondaryLabel`, `secondaryIcon`.

`gcc-select` : `options` (`{ label, value }[]`), `value` (model), `placeholder`. Overlay CDK — ne pas utiliser `<select>`.

`gcc-skill-gap` : `skill`, `required`, `acquired` (`SkillLevel`). Host `display: block` ; empiler avec `flex flex-col gap-3`.

`gcc-empty-state` : `title`, `message`, `actionLabel`, `actionIcon`, `variant` (`empty` \| `error` \| `forbidden`).

`gcc-kpi-card` : `label`, `value`, `hint`, `tone` (`neutral` \| `up` \| `down` \| `accent`).

## Widgets Material autorisés

`mat-table`, `mat-paginator`, `mat-tab-group`, `mat-stepper`, `mat-progress-bar`, `mat-button`, `mat-icon`.

Thème : variables `--mat-sys-*` déjà calées Inter + indigo dans `styles.css`. Ne pas charger un autre prebuilt theme sans réappliquer ces tokens.
