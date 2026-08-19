import { Routes } from '@angular/router';
import { authGuard, guestGuard, moduleGuard } from './core/auth.guard';
import { LoginPage } from './features/auth/login.page';
import { DashboardPage } from './features/dashboard/dashboard.page';
import { NotFoundPage } from './features/not-found/not-found.page';
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
      { path: 'history', redirectTo: 'soft-gcc/evaluations/historique', pathMatch: 'full' },
      { path: '**', component: NotFoundPage, canActivate: [moduleGuard] },
    ],
  },
];
