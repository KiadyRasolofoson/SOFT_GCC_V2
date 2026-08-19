import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccIdentityCard } from '../../ui/gcc-identity-card';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  emptyInterviewNotes,
  EvaluationDetails,
  hasFunctionalPermission,
  initialsOf,
  InterviewNotes,
  InterviewRecord,
  parseInterviewNotes,
} from './evaluation.models';
import { EvaluationService } from './evaluation.service';

@Component({
  selector: 'app-interview-detail-page',
  imports: [
    DatePipe,
    FormsModule,
    GccPageHeader,
    GccIdentityCard,
    GccStatusTag,
    GccEmptyState,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <gcc-page-header
      title="Validation de l’entretien"
      subtitle="Relisez le compte-rendu, puis donnez votre avis hiérarchique."
      icon="verified_user"
      [crumbs]="crumbs"
      secondaryLabel="Retour à la liste"
      secondaryIcon="arrow_back"
      (secondary)="goList()"
    />

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger le dossier"
        [message]="error()!"
        actionLabel="Retour"
        actionIcon="arrow_back"
        (action)="goList()"
      />
    } @else if (success()) {
      <gcc-empty-state
        title="Avis enregistré"
        [message]="successMessage()"
        actionLabel="Retour aux entretiens"
        actionIcon="groups"
        (action)="goList()"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
        <p class="text-sm font-bold text-navy">Chargement du compte-rendu…</p>
      </div>
    } @else if (interview(); as current) {
      <gcc-identity-card
        class="mb-6 block"
        [name]="employeeName()"
        [role]="evaluation()?.position || 'Poste non renseigné'"
        [department]="evaluation()?.department || ''"
        [initials]="initialsOf(employeeName())"
        matricule=""
        seniority=""
      />

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
        <section class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <mat-tab-group class="gcc-tabs" animationDuration="0">
            <mat-tab label="Cadre">
              <div class="space-y-4 pt-4">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date</p>
                    <p class="mt-1 text-sm font-semibold text-navy">{{ notes().general.date || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lieu</p>
                    <p class="mt-1 text-sm font-semibold text-navy">{{ notes().general.location || 'Non renseigné' }}</p>
                  </div>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contexte</p>
                  <p class="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {{ notes().general.context || 'Aucun contexte saisi.' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Notes générales</p>
                  <p class="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {{ notes().globalNotes || '—' }}
                  </p>
                </div>
              </div>
            </mat-tab>
            <mat-tab label="Bilan">
              <div class="grid gap-4 pt-4 sm:grid-cols-2">
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Réalisations</p>
                  <p class="mt-1 rounded-xl bg-emerald-50/60 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {{ notes().previousPeriod.achievements || '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Défis</p>
                  <p class="mt-1 rounded-xl bg-amber-50/70 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {{ notes().previousPeriod.challenges || '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Objectifs atteints</p>
                  <p class="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {{ notes().previousPeriod.previousObjectivesAchieved || '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Feedback</p>
                  <p class="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {{ notes().previousPeriod.feedback || '—' }}
                  </p>
                </div>
              </div>
            </mat-tab>
            <mat-tab label="Objectifs">
              <div class="space-y-3 pt-4">
                @for (objective of notes().objectives; track $index; let i = $index) {
                  <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div class="mb-2 flex items-center justify-between gap-2">
                      <h3 class="text-sm font-bold text-navy">Objectif {{ i + 1 }}</h3>
                      <gcc-status-tag
                        [status]="objective.status === 'Atteint' ? 'validated' : objective.status === 'Non atteint' ? 'refused' : 'pending'"
                        [label]="objective.status"
                      />
                    </div>
                    <p class="text-sm text-slate-700">{{ objective.description || 'Sans description' }}</p>
                    <div class="mt-3 grid gap-2 text-xs font-medium text-slate-500 sm:grid-cols-3">
                      <span>Échéance : {{ objective.dueDate || '—' }}</span>
                      <span>Indicateur : {{ objective.indicator || '—' }}</span>
                      <span>Réalisation : {{ objective.completionRate }} %</span>
                    </div>
                    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                      <div class="h-full rounded-full bg-accent" [style.width.%]="objective.completionRate"></div>
                    </div>
                  </article>
                } @empty {
                  <p class="text-sm text-slate-500">Aucun objectif n’a été défini.</p>
                }
              </div>
            </mat-tab>
            <mat-tab label="Développement">
              <div class="space-y-4 pt-4">
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Formations</p>
                  <p class="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {{ notes().developmentPlan.trainingNeeds || '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Aspirations</p>
                  <p class="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {{ notes().developmentPlan.careerAspiration || '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                  <p class="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {{ notes().developmentPlan.notes || '—' }}
                  </p>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </section>

        <aside class="space-y-4">
          <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <h2 class="text-sm font-bold text-navy">Circuit de validation</h2>
            <div class="mt-4 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-slate-500">Manager</span>
                <gcc-status-tag [status]="approvalKind(current.managerApproval)" [label]="approvalLabel(current.managerApproval)" />
              </div>
              @if (current.managerComments) {
                <p class="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">{{ current.managerComments }}</p>
              }
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-slate-500">Direction</span>
                <gcc-status-tag [status]="approvalKind(current.directorApproval)" [label]="approvalLabel(current.directorApproval)" />
              </div>
              @if (current.directorComments) {
                <p class="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">{{ current.directorComments }}</p>
              }
            </div>
          </section>

          @if (canAct() && !alreadyValidated()) {
            <section class="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
              <p class="text-xs font-bold uppercase tracking-wider text-indigo-700">Votre avis · {{ roleLabel() }}</p>
              <label class="mt-4 block">
                <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Commentaire</span>
                <textarea
                  class="gcc-input min-h-28 bg-white leading-relaxed"
                  rows="4"
                  placeholder="Justifiez votre décision…"
                  [ngModel]="comments()"
                  (ngModelChange)="comments.set($event)"
                ></textarea>
              </label>
              @if (saveError()) {
                <p class="mt-2 text-xs font-semibold text-red-600">{{ saveError() }}</p>
              }
              <div class="mt-4 grid grid-cols-2 gap-2">
                <button
                  mat-stroked-button
                  class="gcc-btn-secondary !rounded-xl"
                  type="button"
                  [disabled]="saving()"
                  (click)="submit(false)"
                >
                  Refuser
                </button>
                <button
                  mat-flat-button
                  class="gcc-btn-primary !rounded-xl"
                  type="button"
                  [disabled]="saving() || !comments().trim()"
                  (click)="submit(true)"
                >
                  {{ saving() ? 'Envoi…' : 'Valider' }}
                </button>
              </div>
            </section>
          } @else if (alreadyValidated()) {
            <section class="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
              Vous avez déjà rendu votre avis sur cet entretien.
            </section>
          } @else {
            <section class="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500">
              Vous n’avez pas de droit de validation sur ce dossier.
            </section>
          }

          <p class="text-[11px] font-medium text-slate-400">
            Créneau : {{ current.interviewDate ? (current.interviewDate | date: 'dd MMM yyyy HH:mm') : '—' }}
          </p>
        </aside>
      </div>
    }
  `,
})
export class InterviewDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly evaluations = inject(EvaluationService);
  private readonly auth = inject(AuthService);

  readonly crumbs = [{ label: 'Évaluations' }, { label: 'Entretien' }, { label: 'Validation' }];
  readonly initialsOf = initialsOf;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly success = signal(false);
  readonly successMessage = signal('');
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly interview = signal<InterviewRecord | null>(null);
  readonly evaluation = signal<EvaluationDetails | null>(null);
  readonly notes = signal<InterviewNotes>(emptyInterviewNotes());
  readonly comments = signal('');

  readonly employeeName = computed(() => this.evaluation()?.employeeName?.trim() || 'Salarié');
  readonly canValidateManager = computed(() => hasFunctionalPermission(this.auth.user()?.permissions, 'VALIDATE_AS_MANAGER'));
  readonly canValidateDirector = computed(() => hasFunctionalPermission(this.auth.user()?.permissions, 'VALIDATE_AS_DIRECTOR'));
  readonly canAct = computed(() => this.canValidateManager() || this.canValidateDirector());
  readonly alreadyValidated = computed(() => {
    const interview = this.interview();
    if (!interview) return false;
    if (this.canValidateManager() && interview.managerApproval != null) return true;
    if (this.canValidateDirector() && interview.directorApproval != null) return true;
    return false;
  });
  readonly roleLabel = computed(() => (this.canValidateDirector() && !this.canValidateManager() ? 'Direction' : 'Manager'));

  ngOnInit(): void {
    const interviewId = Number(this.route.snapshot.paramMap.get('interviewId'));
    if (!interviewId) {
      this.error.set('Identifiant d’entretien manquant.');
      this.loading.set(false);
      return;
    }
    this.load(interviewId);
  }

  goList(): void {
    void this.router.navigateByUrl('/soft-gcc/evaluations/accueil');
  }

  approvalKind(value: boolean | null): 'pending' | 'validated' | 'refused' {
    if (value === true) return 'validated';
    if (value === false) return 'refused';
    return 'pending';
  }

  approvalLabel(value: boolean | null): string {
    if (value === true) return 'Validé';
    if (value === false) return 'Refusé';
    return 'En attente';
  }

  submit(approved: boolean): void {
    const interview = this.interview();
    if (!interview) return;
    if (!this.comments().trim()) {
      this.saveError.set('Le commentaire est obligatoire.');
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);

    const payload = {
      notes: interview.notes,
      managerApproval: this.canValidateManager() ? approved : interview.managerApproval,
      managerComments: this.canValidateManager() ? this.comments().trim() : interview.managerComments,
      directorApproval: this.canValidateDirector() ? approved : interview.directorApproval,
      directorComments: this.canValidateDirector() ? this.comments().trim() : interview.directorComments,
    };

    this.evaluations.completeInterview(interview.interviewId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        this.successMessage.set(approved ? 'Validation enregistrée.' : 'Refus enregistré.');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const body = err.error as { message?: string } | string | null;
        this.saveError.set(
          typeof body === 'string' && body.trim()
            ? body
            : body && typeof body === 'object' && body.message
              ? body.message
              : 'Impossible d’enregistrer votre avis.',
        );
      },
    });
  }

  private load(interviewId: number): void {
    this.evaluations.getInterviewDetails(interviewId).subscribe({
      next: (interview) => {
        if (!interview) {
          this.error.set('Entretien introuvable.');
          this.loading.set(false);
          return;
        }
        this.interview.set(interview);
        this.notes.set(parseInterviewNotes(interview.notes));
        if (this.canValidateManager() && interview.managerComments) this.comments.set(interview.managerComments);
        if (this.canValidateDirector() && interview.directorComments) this.comments.set(interview.directorComments);
        this.evaluations.getEvaluation(interview.evaluationId).subscribe({
          next: (evaluation) => {
            this.evaluation.set(evaluation);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => {
        this.error.set('Impossible de charger les détails de l’entretien.');
        this.loading.set(false);
      },
    });
  }
}
