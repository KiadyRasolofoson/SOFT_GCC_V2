import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import {
  EvaluationPortalSession,
  PORTAL_REQUEST,
} from '../features/evaluation-portal/evaluation-portal-session';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const portal = inject(EvaluationPortalSession);
  const router = inject(Router);

  const isEvalLogin = req.url.includes('/EvaluationLogin/');
  const isPortal = req.context.get(PORTAL_REQUEST) || isEvalLogin;
  const isRhLogin = req.url.includes('/Authentification/login');

  if (isPortal) {
    const portalToken = portal.token();
    const withPortalAuth =
      portalToken && !isEvalLogin && !req.headers.has('Authorization')
        ? req.clone({ setHeaders: { Authorization: `Bearer ${portalToken}` } })
        : req;

    return next(withPortalAuth).pipe(
      catchError((err: unknown) => {
        const httpErr = err instanceof HttpErrorResponse ? err : null;
        if (httpErr?.status === 401 && !isEvalLogin) {
          portal.clear();
          void router.navigateByUrl('/soft-gcc/evaluation/connexion');
        }
        return throwError(() => err);
      }),
    );
  }

  const token = localStorage.getItem('token');
  const withAuth =
    token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(withAuth).pipe(
    catchError((err: unknown) => {
      const httpErr = err instanceof HttpErrorResponse ? err : null;
      if (httpErr?.status === 401 && !isRhLogin) {
        auth.logout();
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
