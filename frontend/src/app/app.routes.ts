import { Routes } from '@angular/router';
import { authGuard, guestGuard, moduleGuard } from './core/auth.guard';
import { LoginPage } from './features/auth/login.page';
import { CareerListPage } from './features/career/career-list.page';
import { CareerPlanCreatePage } from './features/career/career-plan-create.page';
import { CareerPlanEditPage } from './features/career/career-plan-edit.page';
import { DashboardPage } from './features/dashboard/dashboard.page';
import { DepartmentDetailPage } from './features/effectif/department-detail.page';
import { DepartmentEffectivePage } from './features/effectif/department-effective.page';
import { EmployeeCreatePage } from './features/employee/employee-create.page';
import { EmployeeFichePage } from './features/employee/employee-fiche.page';
import { EmployeeListPage } from './features/employee/employee-list.page';
import { EmployeeSkillListPage } from './features/skills/employee-skill-list.page';
import { NotFoundPage } from './features/not-found/not-found.page';
import { OrgChartPage } from './features/organigramme/org-chart.page';
import { RetirementListPage } from './features/retirement/retirement-list.page';
import { ParametresCarrieresPage } from './features/settings/parametres-carrieres.page';
import { ParametresCompetencesPage } from './features/settings/parametres-competences.page';
import { WishEvolutionAddPage } from './features/wish-evolution/wish-evolution-add.page';
import { WishEvolutionDetailPage } from './features/wish-evolution/wish-evolution-detail.page';
import { WishEvolutionEditPage } from './features/wish-evolution/wish-evolution-edit.page';
import { WishEvolutionListPage } from './features/wish-evolution/wish-evolution-list.page';
import { UnauthorizedPage } from './features/unauthorized/unauthorized.page';
import { GccAppShell } from './layouts/gcc-app-shell';

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'unauthorized', component: UnauthorizedPage, canActivate: [authGuard] },
  {
    path: '',
    component: GccAppShell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'soft-gcc/tableau-de-bord' },
      {
        path: 'soft-gcc/tableau-de-bord',
        component: DashboardPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/competences',
        component: EmployeeSkillListPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/carrieres',
        component: CareerListPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/carrieres/creation',
        component: CareerPlanCreatePage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/carrieres/fiche/modifier/:careerPlanId',
        component: CareerPlanEditPage,
        data: { mode: 'edit' },
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/carrieres/fiche/detail/:careerPlanId',
        component: CareerPlanEditPage,
        data: { mode: 'detail' },
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/effectifs',
        component: DepartmentEffectivePage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/effectifs/importer',
        loadComponent: () =>
          import('./features/effectif/csv-import.page').then((m) => m.CsvImportPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/effectifs/details/:departmentId',
        component: DepartmentDetailPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/organigramme',
        component: OrgChartPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/retraite',
        component: RetirementListPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/parametres/competences',
        component: ParametresCompetencesPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/parametres/carrieres',
        component: ParametresCarrieresPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/parametres/employes/liste',
        component: EmployeeListPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/parametres/employes/creer',
        component: EmployeeCreatePage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/employes/fiche/:employeeKey',
        component: EmployeeFichePage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/souhaits-evolution',
        component: WishEvolutionListPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/souhaits-evolution/ajouter',
        component: WishEvolutionAddPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/souhaits-evolution/details/:wishEvolutionId',
        component: WishEvolutionDetailPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/souhaits-evolution/edit/:wishEvolutionId',
        component: WishEvolutionEditPage,
        canActivate: [moduleGuard],
      },
      { 
        path: 'soft-gcc/evaluations/planning',
        loadComponent: () =>
          import('./features/evaluations/planning-list.page').then((m) => m.PlanningListPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/planning/campagne',
        loadComponent: () =>
          import('./features/evaluations/planning-wizard.page').then((m) => m.PlanningWizardPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/liste',
        loadComponent: () =>
          import('./features/evaluations/notation-list.page').then((m) => m.NotationListPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/notation/evaluation/:evaluationId',
        redirectTo: 'soft-gcc/evaluations/notation/:evaluationId',
        pathMatch: 'full',
      },
      {
        path: 'soft-gcc/evaluations/notation/:evaluationId',
        loadComponent: () =>
          import('./features/evaluations/notation-wizard.page').then((m) => m.NotationWizardPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/accueil',
        loadComponent: () =>
          import('./features/evaluations/interview-list.page').then((m) => m.InterviewListPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/entretiens',
        pathMatch: 'full',
        redirectTo: 'soft-gcc/evaluations/accueil',
      },
      {
        path: 'soft-gcc/evaluations/entretiens/:interviewId/validation',
        loadComponent: () =>
          import('./features/evaluations/interview-detail.page').then((m) => m.InterviewDetailPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/details/:interviewId',
        redirectTo: 'soft-gcc/evaluations/entretiens/:interviewId/validation',
        pathMatch: 'full',
      },
      {
        path: 'soft-gcc/evaluations/entretiens/:interviewId',
        loadComponent: () =>
          import('./features/evaluations/interview-wizard.page').then((m) => m.InterviewWizardPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/historique',
        loadComponent: () =>
          import('./features/evaluations/history-list.page').then((m) => m.HistoryListPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/historique/:evaluationId',
        loadComponent: () =>
          import('./features/evaluations/history-detail.page').then((m) => m.HistoryDetailPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/objectifs',
        loadComponent: () =>
          import('./features/evaluations/objectives-list.page').then((m) => m.ObjectivesListPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/bulletin',
        loadComponent: () =>
          import('./features/evaluations/bulletin-competence.page').then((m) => m.BulletinCompetencePage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/attestations',
        loadComponent: () =>
          import('./features/attestation/attestation-model-list.page').then((m) => m.AttestationModelListPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/parametres/synchronisation',
        loadComponent: () =>
          import('./features/settings/employee-sync.page').then((m) => m.EmployeeSyncPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/parametres',
        loadComponent: () =>
          import('./features/evaluations/settings.page').then((m) => m.SettingsPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/evaluations/parametres/:section',
        loadComponent: () =>
          import('./features/evaluations/settings.page').then((m) => m.SettingsPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/parametres/utilisateurs',
        loadComponent: () => import('./features/users/users.page').then((m) => m.UsersPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/parametres/utilisateurs/liste',
        redirectTo: 'soft-gcc/parametres/utilisateurs',
        pathMatch: 'full',
      },
      {
        path: 'soft-gcc/parametres/utilisateurs/roles',
        redirectTo: 'soft-gcc/parametres/utilisateurs/acces',
        pathMatch: 'full',
      },
      {
        path: 'soft-gcc/parametres/utilisateurs/permissions',
        redirectTo: 'soft-gcc/parametres/utilisateurs/acces',
        pathMatch: 'full',
      },
      {
        path: 'soft-gcc/parametres/utilisateurs/administration',
        redirectTo: 'soft-gcc/parametres/utilisateurs/acces',
        pathMatch: 'full',
      },
      {
        path: 'soft-gcc/parametres/utilisateurs/:section',
        loadComponent: () => import('./features/users/users.page').then((m) => m.UsersPage),
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/historique',
        loadComponent: () =>
          import('./features/history/activity-history.page').then((m) => m.ActivityHistoryPage),
        canActivate: [moduleGuard],
      },
      { path: 'history', redirectTo: 'soft-gcc/evaluations/historique', pathMatch: 'full' },
      { path: '**', component: NotFoundPage, canActivate: [moduleGuard] },
    ],
  },
];
