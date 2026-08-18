import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';

@Component({
  selector: 'app-not-found-page',
  imports: [GccPageHeader, GccEmptyState],
  template: `
    <gcc-page-header
      title="Page introuvable"
      subtitle="Cette adresse n’existe pas ou n’a pas encore été migrée vers le nouveau frontend Angular."
      icon="search_off"
      [crumbs]="crumbs"
    />
    <div class="max-w-2xl mx-auto my-8">
      <gcc-empty-state
        variant="error"
        title="Module non encore disponible"
        message="Cette section de Soft GCC est en cours de refonte. Utilisez le menu latéral pour accéder aux fonctionnalités actives, comme le Tableau de bord."
        actionLabel="Retour au tableau de bord"
        actionIcon="dashboard"
        (action)="goDashboard()"
      />
    </div>
  `,
})
export class NotFoundPage {
  private readonly router = inject(Router);
  readonly crumbs = [{ label: 'Navigation' }, { label: 'Page introuvable' }];

  goDashboard(): void {
    void this.router.navigateByUrl('/soft-gcc/tableau-de-bord');
  }
}
