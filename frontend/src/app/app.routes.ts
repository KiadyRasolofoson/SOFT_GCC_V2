import { Routes } from '@angular/router';
import { authGuard, guestGuard, moduleGuard } from './core/auth.guard';
import { LoginPage } from './features/auth/login.page';
import { CareerListPage } from './features/career/career-list.page';
import { CareerPlanCreatePage } from './features/career/career-plan-create.page';
import { DashboardPage } from './features/dashboard/dashboard.page';
import { EmployeeFichePage } from './features/employee/employee-fiche.page';
import { EmployeeSkillListPage } from './features/skills/employee-skill-list.page';
import { NotFoundPage } from './features/not-found/not-found.page';
import { WishEvolutionAddPage } from './features/wish-evolution/wish-evolution-add.page';
import { WishEvolutionDetailPage } from './features/wish-evolution/wish-evolution-detail.page';
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
      { path: '**', component: NotFoundPage, canActivate: [moduleGuard] },
    ],
  },
];
