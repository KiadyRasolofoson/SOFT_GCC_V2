import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import { EvaluationPortalSession } from './evaluation-portal-session';

@Component({
  selector: 'app-evaluation-confirmation-page',
  imports: [GccEmptyState, GccPageHeader, GccStatusTag],
  host: { class: 'flex min-h-full flex-1 flex-col' },
  template: `
    <gcc-page-header
      title="Questionnaire envoyé"
      subtitle="Votre auto-évaluation a bien été transmise aux ressources humaines."
      icon="task_alt"
    />

    <div class="flex flex-1 flex-col justify-center">
      <div class="mb-4 flex justify-center">
        <gcc-status-tag status="ok" label="Envoyé" />
      </div>
      <gcc-empty-state
        class="block"
        title="Merci pour votre participation"
        message="Votre session est terminée et l’accès temporaire a été révoqué. Votre manager examinera le dossier. Vous pouvez fermer cet onglet."
        actionLabel="Retour à la connexion"
        actionIcon="login"
        (action)="goLogin()"
      />
    </div>
  `,
})
export class EvaluationConfirmationPage implements OnInit {
  private readonly session = inject(EvaluationPortalSession);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.session.clear();
    this.session.setCampaignTitle('Confirmation');
  }

  goLogin(): void {
    void this.router.navigateByUrl('/soft-gcc/evaluation/connexion');
  }
}
