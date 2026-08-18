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
      { path: '**', component: NotFoundPage, canActivate: [moduleGuard] },
    ],
  },
];
