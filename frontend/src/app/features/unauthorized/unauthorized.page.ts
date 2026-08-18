import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccAuthShell } from '../../layouts/gcc-auth-shell';

@Component({
  selector: 'app-unauthorized-page',
  imports: [GccAuthShell, GccEmptyState],
  template: `
    <gcc-auth-shell>
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
        <gcc-empty-state
          variant="forbidden"
          title="Accès non autorisé (403)"
          [message]="message"
          actionLabel="Retour au tableau de bord"
          actionIcon="home"
          (action)="goDashboard()"
        />
      </div>
    </gcc-auth-shell>
  `,
})
export class UnauthorizedPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly from = this.route.snapshot.queryParamMap.get('from');
  readonly message = this.from
    ? `L'accès à la page "${this.from}" n'est pas autorisé pour votre profil. Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.`
    : 'L’accès à cette section n’est pas autorisé pour votre rôle d’utilisateur.';

  goDashboard(): void {
    void this.router.navigateByUrl('/soft-gcc/tableau-de-bord');
  }
}
