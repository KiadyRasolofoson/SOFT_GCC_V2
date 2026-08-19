import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccIdentityCard } from '../../ui/gcc-identity-card';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  EvaluationHistoryDetail,
  HistoryQuestionDetail,
  SelectedQuestion,
  formatScore,
  historyEmployeeName,
  historyInterviewStatusMeta,
  historyStatusMeta,
  initialsOf,
  ratingLabel,
  scoreBadgeClass,
  scoreFillPercent,
  scoreToneClass,
} from './evaluation.models';
import { EvaluationService } from './evaluation.service';

@Component({
  selector: 'app-history-detail-page',
  imports: [
    DatePipe,
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
      title="Fiche d’évaluation"
      subtitle="Synthèse du dossier, points clés et compte-rendu d’entretien."
      icon="folder_shared"
      [crumbs]="crumbs()"
      secondaryLabel="Retour à l’historique"
      secondaryIcon="arrow_back"
      (secondary)="goList()"
    />

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Dossier introuvable"
        [message]="error()!"
        actionLabel="Retour"
        actionIcon="arrow_back"
        (action)="goList()"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
        <p class="text-sm font-bold text-navy">Chargement du dossier…</p>
      </div>
    } @else if (detail(); as current) {
      <gcc-identity-card
        class="mb-6 block"
        [name]="employeeName()"
        [role]="current.position || 'Poste non renseigné'"
        [department]="current.department || ''"
        [initials]="initialsOf(employeeName())"
        matricule=""
        seniority=""
      />

      <div class="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <article class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Campagne</p>
              <p class="mt-1 text-base font-bold text-navy">{{ current.evaluationType || 'Évaluation' }}</p>
              <p class="mt-1 text-sm text-slate-500">
                {{ current.startDate ? (current.startDate | date: 'dd MMM yyyy') : '—' }}
                →
                {{ current.endDate ? (current.endDate | date: 'dd MMM yyyy') : '—' }}
              </p>
            </div>
            <gcc-status-tag
              [status]="historyStatusMeta(inferredStatus()).kind"
              [label]="historyStatusMeta(inferredStatus()).label"
            />
          </div>
          <dl class="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Entretien</dt>
              <dd class="mt-1 text-sm font-semibold text-navy">
                {{ current.interviewDate ? (current.interviewDate | date: 'dd MMM yyyy') : 'Non planifié' }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Statut entretien</dt>
              <dd class="mt-1">
                <gcc-status-tag
                  [status]="historyInterviewStatusMeta(current.interviewStatus).kind"
                  [label]="historyInterviewStatusMeta(current.interviewStatus).label"
                />
              </dd>
            </div>
            <div>
              <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Participants</dt>
              <dd class="mt-1 text-sm font-semibold text-navy">{{ current.participants.length || '—' }}</dd>
            </div>
          </dl>
        </article>

        <article class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Note globale</p>
          <div class="mt-3 flex items-end gap-3">
            <p class="text-4xl font-extrabold tabular tracking-tight text-navy">
              {{ formatScore(current.overallScore) }}
            </p>
            <p class="mb-1 text-sm font-semibold text-slate-400">/ 5</p>
          </div>
          <p class="mt-1 text-sm font-bold" [class]="scoreTextClass(current.overallScore)">
            {{ ratingLabel(current.overallScore ?? 0) }}
          </p>
          <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full"
              [class]="scoreToneClass(current.overallScore)"
              [style.width.%]="scoreFillPercent(current.overallScore)"
            ></div>
          </div>
        </article>
      </div>

      <section class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <mat-tab-group class="gcc-tabs" animationDuration="0">
          <mat-tab label="Synthèse">
            <div class="grid gap-4 pt-5 md:grid-cols-2">
              <article class="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div class="mb-2 flex items-center gap-2">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-emerald-600">lightbulb</mat-icon>
                  <h3 class="text-sm font-bold text-navy">Points forts</h3>
                </div>
                <p class="text-sm leading-relaxed text-slate-700">{{ current.strengths || 'Non renseigné.' }}</p>
              </article>
              <article class="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <div class="mb-2 flex items-center gap-2">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-amber-600">priority_high</mat-icon>
                  <h3 class="text-sm font-bold text-navy">Axes d’amélioration</h3>
                </div>
                <p class="text-sm leading-relaxed text-slate-700">{{ current.weaknesses || 'Non renseigné.' }}</p>
              </article>
              <article class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div class="mb-2 flex items-center gap-2">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-indigo-500">comment</mat-icon>
                  <h3 class="text-sm font-bold text-navy">Commentaire général</h3>
                </div>
                <p class="text-sm leading-relaxed text-slate-700">{{ current.evaluationComments || 'Aucun commentaire.' }}</p>
              </article>
              <article class="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div class="mb-2 flex items-center gap-2">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-accent">auto_awesome</mat-icon>
                  <h3 class="text-sm font-bold text-navy">Recommandations</h3>
                </div>
                <p class="text-sm leading-relaxed text-slate-700">{{ current.recommendations || 'Aucune recommandation.' }}</p>
              </article>
            </div>
          </mat-tab>

          <mat-tab label="Questions">
            <div class="pt-5">
              @if (!questions().length) {
                <gcc-empty-state
                  title="Aucune question détaillée"
                  message="Le questionnaire n’a pas été archivé sur ce dossier, ou les notes n’ont pas encore été saisies."
                />
              } @else {
                <div class="space-y-3">
                  @for (item of questions(); track $index) {
                    <article class="rounded-xl border border-slate-200 bg-white p-4">
                      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-semibold text-navy">{{ item.question }}</p>
                          @if (item.competence) {
                            <p class="mt-1 text-[11px] font-medium text-slate-400">{{ item.competence }}</p>
                          }
                          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              class="h-full rounded-full"
                              [class]="scoreToneClass(item.score)"
                              [style.width.%]="scoreFillPercent(item.score)"
                            ></div>
                          </div>
                        </div>
                        <span
                          class="inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold tabular"
                          [class]="scoreBadgeClass(item.score)"
                        >
                          <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">star</mat-icon>
                          {{ formatScore(item.score) }} / 5
                        </span>
                      </div>
                    </article>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Entretien">
            <div class="pt-5">
              @if (!current.participants.length && !current.interviewDate) {
                <gcc-empty-state
                  title="Pas d’entretien associé"
                  message="Ce dossier n’a pas encore de créneau ni de participants enregistrés."
                />
              } @else {
                <div class="grid gap-4 md:grid-cols-2">
                  <article class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date</p>
                    <p class="mt-1 text-sm font-semibold text-navy">
                      {{ current.interviewDate ? (current.interviewDate | date: 'dd MMMM yyyy') : 'Non planifié' }}
                    </p>
                  </article>
                  <article class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Statut</p>
                    <div class="mt-1">
                      <gcc-status-tag
                        [status]="historyInterviewStatusMeta(current.interviewStatus).kind"
                        [label]="historyInterviewStatusMeta(current.interviewStatus).label"
                      />
                    </div>
                  </article>
                </div>
                @if (current.participants.length) {
                  <div class="mt-5">
                    <p class="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Participants</p>
                    <div class="flex flex-wrap gap-2">
                      @for (name of current.participants; track name) {
                        <span class="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/70 py-1 pl-1 pr-3 text-xs font-semibold text-navy">
                          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-indigo-500 text-[9px] font-extrabold text-white">
                            {{ initialsOf(name) }}
                          </span>
                          {{ name }}
                        </span>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </section>
    }
  `,
})
export class HistoryDetailPage implements OnInit {
  private readonly evaluations = inject(EvaluationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly detail = signal<EvaluationHistoryDetail | null>(null);
  readonly selectedQuestions = signal<SelectedQuestion[]>([]);

  readonly employeeName = computed(() => {
    const current = this.detail();
    return current ? historyEmployeeName(current) : 'Employé';
  });

  readonly crumbs = computed(() => [
    { label: 'Évaluations' },
    { label: 'Historique' },
    { label: this.employeeName() },
  ]);

  readonly questions = computed(() => this.mergeQuestions(this.detail(), this.selectedQuestions()));

  readonly historyStatusMeta = historyStatusMeta;
  readonly historyInterviewStatusMeta = historyInterviewStatusMeta;
  readonly initialsOf = initialsOf;
  readonly formatScore = formatScore;
  readonly ratingLabel = ratingLabel;
  readonly scoreBadgeClass = scoreBadgeClass;
  readonly scoreFillPercent = scoreFillPercent;
  readonly scoreToneClass = scoreToneClass;

  ngOnInit(): void {
    const evaluationId = Number(this.route.snapshot.paramMap.get('evaluationId'));
    if (!Number.isFinite(evaluationId) || evaluationId <= 0) {
      this.error.set('Identifiant d’évaluation invalide.');
      this.loading.set(false);
      return;
    }

    forkJoin({
      detail: this.evaluations.getHistoryDetail(evaluationId),
      questions: this.evaluations.getSelectedQuestions(evaluationId).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ detail, questions }) => {
        if (!detail) {
          this.error.set('Ce dossier n’existe pas ou vous n’avez pas les droits pour le consulter.');
          this.loading.set(false);
          return;
        }
        this.detail.set(detail);
        this.selectedQuestions.set(questions);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger le dossier. Vérifiez vos droits ou réessayez.');
        this.loading.set(false);
      },
    });
  }

  inferredStatus(): number | null {
    const current = this.detail();
    if (!current) return null;
    const interview = current.interviewStatus;
    if (interview === 30) return 30;
    if (interview === 20 || interview === 25) return 20;
    if (interview === 40 || interview === 50) return 40;
    return current.overallScore != null ? 30 : 10;
  }

  goList(): void {
    void this.router.navigate(['/soft-gcc/evaluations/historique']);
  }

  scoreTextClass(score: number | null | undefined): string {
    if (score == null) return 'text-slate-400';
    if (score >= 4) return 'text-emerald-700';
    if (score >= 3) return 'text-indigo-700';
    return 'text-amber-700';
  }

  private mergeQuestions(
    detail: EvaluationHistoryDetail | null,
    selected: SelectedQuestion[],
  ): Array<HistoryQuestionDetail & { competence?: string | null }> {
    if (detail?.questionDetails.length) {
      return detail.questionDetails;
    }
    return selected
      .map((item) => {
        const parsed = item.responseValue != null && item.responseValue !== '' ? Number(item.responseValue) : NaN;
        return {
          questionId: item.questionId,
          question: item.questionText || `Question ${item.questionId}`,
          score: Number.isFinite(parsed) ? parsed : null,
          competence: item.competenceName || null,
        };
      })
      .filter((item) => item.question.trim());
  }
}
