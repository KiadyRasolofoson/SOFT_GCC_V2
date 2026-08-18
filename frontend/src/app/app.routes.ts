import { Routes } from '@angular/router';
import { authGuard, guestGuard, moduleGuard } from './core/auth.guard';
import { LoginPage } from './features/auth/login.page';
import { DashboardPage } from './features/dashboard/dashboard.page';
import { EmployeeFichePage } from './features/employee/employee-fiche.page';
import { EmployeeSkillListPage } from './features/skills/employee-skill-list.page';
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
        path: 'soft-gcc/competences',
        component: EmployeeSkillListPage,
        canActivate: [moduleGuard],
      },
      {
        path: 'soft-gcc/employes/fiche/:employeeKey',
        component: EmployeeFichePage,
        canActivate: [moduleGuard],
      },
      { path: '**', component: NotFoundPage, canActivate: [moduleGuard] },
    ],
  },
];
