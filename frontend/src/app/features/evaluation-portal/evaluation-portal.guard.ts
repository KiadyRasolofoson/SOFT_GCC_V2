import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { EvaluationPortalService } from './evaluation-portal.service';
import { EvaluationPortalSession } from './evaluation-portal-session';

export const evaluationPortalGuard: CanActivateFn = () => {
  const session = inject(EvaluationPortalSession);
  const portal = inject(EvaluationPortalService);
  const router = inject(Router);
  const loginTree = router.createUrlTree(['/soft-gcc/evaluation/connexion']);

  if (!session.hasValidSession()) {
    session.clear();
    return loginTree;
  }

  return portal.validateToken().pipe(
    map((valid) => {
      if (valid) return true;
      session.clear();
      return loginTree;
    }),
    catchError(() => {
      session.clear();
      return of(loginTree);
    }),
  );
};

export const evaluationPortalGuestGuard: CanActivateFn = () => {
  const session = inject(EvaluationPortalSession);
  const portal = inject(EvaluationPortalService);
  const router = inject(Router);

  if (!session.hasValidSession()) {
    if (session.token() || session.evaluationId()) session.clear();
    return true;
  }

  return portal.validateToken().pipe(
    map((valid) => {
      if (valid) return router.createUrlTree(['/soft-gcc/evaluation/questionnaire']);
      session.clear();
      return true;
    }),
    catchError(() => of(true)),
  );
};
