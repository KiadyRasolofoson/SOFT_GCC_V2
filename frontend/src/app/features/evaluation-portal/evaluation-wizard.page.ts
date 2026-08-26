import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { catchError, forkJoin, interval, of } from 'rxjs';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccIdentityCard } from '../../ui/gcc-identity-card';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  EvaluationDetails,
  initialsOf,
  lookupById,
  QuestionOption,
  SelectedQuestion,
} from '../evaluations/evaluation.models';
import { EvaluationPortalService, PortalAnswerPayload } from './evaluation-portal.service';
import { EvaluationPortalSession } from './evaluation-portal-session';
import { EvaluationSubmitDialog } from './evaluation-submit.dialog';

@Component({
  selector: 'app-evaluation-wizard-page',
  imports: [
    FormsModule,
    GccEmptyState,
    GccIdentityCard,
    GccPageHeader,
    GccStatusTag,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatRadioModule,
    MatStepperModule,
  ],
  host: { class: 'block min-w-0 w-full' },
  template: `
    <gcc-page-header
      [title]="headerTitle()"
      [subtitle]="headerSubtitle()"
      icon="quiz"
    />

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger le questionnaire"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="load()"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200/90 bg-white px-6 py-12 text-center shadow-xs">
        <div class="mb-3 inline-flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-indigo-50 text-accent">
          <mat-icon class="!h-6 !w-6 !text-[24px]">sync</mat-icon>
        </div>
        <p class="text-sm font-bold text-navy">Chargement du questionnaire…</p>
        <p class="mt-1 text-xs text-slate-400">Récupération des questions et de votre progression.</p>
      </div>
    } @else if (!questions().length) {
      <gcc-empty-state
        title="Aucune question"
        message="Ce dossier ne contient pas encore de questions. Contactez les ressources humaines."
      />
    } @else {
      <gcc-identity-card
        class="mb-4 block sm:mb-6"
        [name]="employeeName()"
        [role]="employeeRole()"
        [department]="employeeDepartment()"
        [initials]="initialsOf(employeeName())"
        matricule=""
        seniority=""
      />

      @if (saveError()) {
        <div class="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 sm:mb-5">
          <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-red-600">error</mat-icon>
          <span>{{ saveError() }}</span>
        </div>
      }

      <div class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-6">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="text-[11px] font-bold uppercase tracking-wider text-accent">Progression</p>
            <p class="mt-0.5 text-sm font-semibold tabular text-navy">
              Question {{ stepIndex() + 1 }} / {{ questions().length }}
              <span class="font-medium text-slate-500">
                · {{ answeredCount() }} répondue{{ answeredCount() > 1 ? 's' : '' }}
              </span>
            </p>
          </div>
          <gcc-status-tag
            [status]="allAnswered() ? 'ok' : 'pending'"
            [label]="allAnswered() ? 'Complet' : 'En cours'"
          />
        </div>
        <mat-progress-bar class="mb-3" mode="determinate" [value]="progressPercent()" />
        <p class="mb-5 text-[11px] leading-relaxed text-slate-400">
          Vos réponses sont enregistrées automatiquement.
        </p>

        <mat-stepper
          class="gcc-stepper gcc-portal-stepper"
          [linear]="true"
          labelPosition="bottom"
          [selectedIndex]="stepIndex()"
          (selectedIndexChange)="onStepChange($event)"
        >
          @for (question of questions(); track question.questionId; let i = $index) {
            <mat-step [label]="'Q' + (i + 1)" [completed]="isAnswered(question.questionId)">
              <article class="rounded-2xl border border-slate-100 bg-canvas/60 p-4 sm:p-5">
                @if (question.competenceName) {
                  <p class="text-[11px] font-bold uppercase tracking-wider text-accent">
                    {{ question.competenceName }}
                  </p>
                }
                <p class="mt-1 text-base font-semibold leading-snug text-navy sm:text-[1.05rem]">
                  {{ question.questionText }}
                </p>
                <p class="mt-2 text-xs text-slate-400">
                  Question {{ i + 1 }} sur {{ questions().length }}
                </p>

                @if (isQcm(question)) {
                  <mat-radio-group
                    class="mt-5 flex flex-col gap-2"
                    [ngModel]="answers()[question.questionId] ?? ''"
                    (ngModelChange)="setAnswer(question.questionId, $event)"
                  >
                    @for (option of optionsOf(question.questionId); track optionValue(option)) {
                      <mat-radio-button
                        class="gcc-portal-choice !whitespace-normal"
                        [value]="optionValue(option)"
                      >
                        {{ option.optionText }}
                      </mat-radio-button>
                    }
                  </mat-radio-group>
                } @else {
                  <label class="mt-5 block">
                    <span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Votre réponse
                    </span>
                    <textarea
                      class="gcc-input min-h-36 !rounded-xl !text-base !leading-relaxed sm:min-h-40"
                      rows="6"
                      [ngModel]="answers()[question.questionId] ?? ''"
                      (ngModelChange)="setAnswer(question.questionId, $event)"
                      placeholder="Saisissez votre réponse"
                    ></textarea>
                  </label>
                }
              </article>
            </mat-step>
          }
        </mat-stepper>
      </div>

      <div
        class="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgb(15_23_42/0.06)] backdrop-blur sm:static sm:mx-0 sm:mt-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:backdrop-blur-none"
      >
        <div
          class="flex flex-col-reverse gap-2 pb-[max(0px,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pb-0"
        >
          <button
            mat-stroked-button
            class="gcc-btn-secondary !min-h-11 !w-full !rounded-xl sm:!w-auto"
            type="button"
            [disabled]="stepIndex() === 0"
            (click)="goStep(stepIndex() - 1)"
          >
            <mat-icon class="!mr-1">arrow_back</mat-icon>
            Précédent
          </button>

          @if (stepIndex() < questions().length - 1) {
            <button
              mat-flat-button
              class="gcc-btn-primary !min-h-11 !w-full !rounded-xl sm:!w-auto"
              type="button"
              [disabled]="!isAnswered(questions()[stepIndex()].questionId)"
              (click)="goStep(stepIndex() + 1)"
            >
              Suivant
              <mat-icon iconPositionEnd class="!ml-1">arrow_forward</mat-icon>
            </button>
          } @else {
            <button
              mat-flat-button
              class="gcc-btn-primary !min-h-11 !w-full !rounded-xl sm:!w-auto"
              type="button"
              [disabled]="!allAnswered() || submitting()"
              (click)="confirmSubmit()"
            >
              {{ submitting() ? 'Envoi…' : 'Soumettre le questionnaire' }}
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class EvaluationWizardPage implements OnInit, OnDestroy {
  private readonly portal = inject(EvaluationPortalService);
  private readonly session = inject(EvaluationPortalSession);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly stepper = viewChild(MatStepper);

  readonly initialsOf = initialsOf;
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly evaluation = signal<EvaluationDetails | null>(null);
  readonly questions = signal<SelectedQuestion[]>([]);
  readonly options = signal<Record<number, QuestionOption[]>>({});
  readonly answers = signal<Record<number, string>>({});
  readonly stepIndex = signal(0);

  private readonly responseIds = new Map<number, number>();
  private readonly dirty = new Set<number>();
  private readonly startedAt = new Map<number, number>();
  private readonly timeSpent = new Map<number, number>();
  private lastStep = 0;

  readonly employeeName = computed(() => this.evaluation()?.employeeName?.trim() || 'Salarié');
  readonly employeeRole = computed(() => this.evaluation()?.position?.trim() || '');
  readonly employeeDepartment = computed(() => this.evaluation()?.department?.trim() || '');
  readonly headerTitle = computed(() => this.evaluation()?.title?.trim() || 'Questionnaire');
  readonly headerSubtitle = computed(
    () => this.evaluation()?.description?.trim() || 'Répondez à chaque question pour finaliser votre auto-évaluation.',
  );
  readonly answeredCount = computed(() =>
    this.questions().filter((question) => this.isAnswered(question.questionId)).length,
  );
  readonly allAnswered = computed(
    () => this.questions().length > 0 && this.answeredCount() === this.questions().length,
  );
  readonly progressPercent = computed(() => {
    const total = this.questions().length;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((this.answeredCount() / total) * 100));
  });

  constructor() {
    interval(30_000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => void this.autosave());
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    void this.autosave();
  }

  load(): void {
    const evaluationId = this.session.evaluationId();
    if (!evaluationId) {
      void this.router.navigateByUrl('/soft-gcc/evaluation/connexion');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      details: this.portal.getEvaluation(evaluationId).pipe(catchError(() => of(null))),
      questions: this.portal.getSelectedQuestions(evaluationId),
      options: this.portal.getQuestionOptions(evaluationId).pipe(catchError(() => of({} as Record<number, QuestionOption[]>))),
      responses: this.portal.getResponses(evaluationId).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ details, questions, options, responses }) => {
        this.evaluation.set(details);
        this.questions.set(questions);
        this.options.set(options);
        this.session.setCampaignTitle(details?.title || 'Questionnaire');

        const nextAnswers: Record<number, string> = {};
        for (const question of questions) {
          if (this.isQcm(question)) continue;
          const text = question.responseValue?.trim();
          if (text) nextAnswers[question.questionId] = text;
        }
        for (const response of responses) {
          if (!response.responseValue) continue;
          nextAnswers[response.questionId] = this.normalizeStoredValue(
            response.questionId,
            response.responseValue,
            questions,
            options,
          );
          if (response.responseId > 0) this.responseIds.set(response.questionId, response.responseId);
        }
        const local = this.session.loadAnswers(evaluationId);
        for (const [key, value] of Object.entries(local)) {
          const questionId = Number(key);
          if (!Number.isFinite(questionId) || !value.trim()) continue;
          nextAnswers[questionId] = this.normalizeStoredValue(questionId, value, questions, options);
        }

        this.answers.set(nextAnswers);
        const firstOpen = questions.findIndex((question) => !this.hasValue(nextAnswers[question.questionId]));
        this.stepIndex.set(firstOpen >= 0 ? firstOpen : Math.max(0, questions.length - 1));
        this.lastStep = this.stepIndex();
        this.markStarted(questions[this.stepIndex()]?.questionId);
        this.syncProgress();
        this.loading.set(false);
        this.scrollActiveStepIntoView();
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(loadErrorMessage(err));
      },
    });
  }

  isQcm(question: SelectedQuestion): boolean {
    return (question.responseType ?? '').trim().toUpperCase() === 'QCM';
  }

  isAnswered(questionId: number): boolean {
    return this.hasValue(this.answers()[questionId]);
  }

  optionsOf(questionId: number): QuestionOption[] {
    const stored = lookupById(this.options(), questionId) ?? [];
    if (stored.length) return stored;
    const question = this.questions().find((item) => item.questionId === questionId);
    if (!question || !this.isQcm(question)) return [];
    return qcmChoices(questionId, {});
  }

  optionValue(option: QuestionOption): string {
    return optionChoiceValue(option);
  }

  setAnswer(questionId: number, value: string): void {
    this.answers.update((current) => ({ ...current, [questionId]: value }));
    this.dirty.add(questionId);
    this.markStarted(questionId);
    this.syncProgress();
    const evaluationId = this.session.evaluationId();
    if (evaluationId) this.session.saveAnswers(evaluationId, this.answers());
  }

  onStepChange(index: number): void {
    this.accumulateTime(this.questions()[this.lastStep]?.questionId);
    this.stepIndex.set(index);
    this.lastStep = index;
    this.markStarted(this.questions()[index]?.questionId);
    void this.autosave();
    this.scrollActiveStepIntoView();
  }

  goStep(index: number): void {
    if (index < 0 || index >= this.questions().length) return;
    const current = this.questions()[this.stepIndex()];
    if (index > this.stepIndex() && current && !this.isAnswered(current.questionId)) return;
    this.stepIndex.set(index);
    const stepper = this.stepper();
    if (stepper) stepper.selectedIndex = index;
  }

  async confirmSubmit(): Promise<void> {
    if (!this.allAnswered() || this.submitting()) return;
    const ref = this.dialog.open(EvaluationSubmitDialog, {
      width: '28rem',
      maxWidth: 'calc(100vw - 1.5rem)',
      data: {
        title: 'Soumettre le questionnaire ?',
        message:
          'Une fois envoyé, votre compte temporaire sera clôturé. Vous ne pourrez plus modifier vos réponses.',
        confirmLabel: 'Envoyer',
      },
    });
    const confirmed = await ref.afterClosed();
    if (confirmed) await this.submit();
  }

  private async submit(): Promise<void> {
    const evaluationId = this.session.evaluationId();
    if (!evaluationId) return;
    this.submitting.set(true);
    this.saveError.set(null);
    this.accumulateTime(this.questions()[this.stepIndex()]?.questionId);
    await this.autosave();

    const now = new Date();
    const payload = {
      responses: this.questions().map((question) => {
        const started = this.startedAt.get(question.questionId);
        return {
          questionId: question.questionId,
          responseType: this.isQcm(question) ? 'QCM' : 'TEXT',
          responseValue: (this.answers()[question.questionId] ?? '').trim(),
          timeSpent: this.timeSpent.get(question.questionId) ?? 0,
          startTime: toSqlIso(started ? new Date(started) : now),
          endTime: toSqlIso(now),
        };
      }),
      overallFeedback: '',
      averageScore: 0,
      completionDate: toSqlIso(now),
    };

    this.portal.submit(evaluationId, payload).subscribe({
      next: () => {
        this.session.clear();
        void this.router.navigateByUrl('/soft-gcc/evaluation/confirmation');
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.saveError.set(submitErrorMessage(err));
      },
    });
  }

  private async autosave(): Promise<void> {
    const evaluationId = this.session.evaluationId();
    const employeeId = this.session.employeeId();
    if (!evaluationId || this.loading() || this.submitting()) return;

    this.session.saveAnswers(evaluationId, this.answers());
    const dirtyIds = [...this.dirty];
    this.dirty.clear();
    for (const questionId of dirtyIds) {
      const question = this.questions().find((item) => item.questionId === questionId);
      const value = (this.answers()[questionId] ?? '').trim();
      if (!question || !value) continue;
      const body: PortalAnswerPayload = {
        evaluationId,
        questionId,
        responseType: this.isQcm(question) ? 'QCM' : 'TEXT',
        responseValue: value,
        timeSpent: this.timeSpent.get(questionId) ?? 0,
        startTime: toSqlIso(this.startedAt.has(questionId) ? new Date(this.startedAt.get(questionId)!) : new Date()),
        endTime: toSqlIso(new Date()),
        isCorrect: false,
      };
      try {
        const savedId = await new Promise<number | null>((resolve) => {
          this.portal.saveAnswer(body, this.responseIds.get(questionId)).subscribe({
            next: (id) => resolve(id),
            error: () => resolve(this.responseIds.get(questionId) ?? null),
          });
        });
        if (savedId) this.responseIds.set(questionId, savedId);
      } catch {
        this.dirty.add(questionId);
      }
    }

    const total = this.questions().length;
    const answered = this.answeredCount();
    const progressPercentage = total > 0 ? Math.round((answered / total) * 10000) / 100 : 0;
    this.portal
      .saveProgress(evaluationId, {
        employeeId: employeeId ?? 0,
        totalQuestions: total,
        answeredQuestions: answered,
        progressPercentage,
      })
      .subscribe({ error: () => undefined });
    if (employeeId) {
      this.portal.updatePortalProgress(evaluationId, employeeId, answered).subscribe({ error: () => undefined });
    }
  }

  private syncProgress(): void {
    this.session.setProgress(this.answeredCount(), this.questions().length);
  }

  private scrollActiveStepIntoView(): void {
    queueMicrotask(() => {
      const headers = this.host.nativeElement.querySelectorAll('.mat-step-header');
      const current = headers.item(this.stepIndex());
      current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }

  private markStarted(questionId: number | undefined): void {
    if (!questionId || this.startedAt.has(questionId)) return;
    this.startedAt.set(questionId, Date.now());
  }

  private accumulateTime(questionId: number | undefined): void {
    if (!questionId) return;
    const started = this.startedAt.get(questionId);
    if (!started) return;
    const extra = Math.max(0, Math.round((Date.now() - started) / 1000));
    this.timeSpent.set(questionId, (this.timeSpent.get(questionId) ?? 0) + extra);
    this.startedAt.set(questionId, Date.now());
  }

  private normalizeStoredValue(
    questionId: number,
    raw: string,
    questions: SelectedQuestion[],
    options: Record<number, QuestionOption[]>,
  ): string {
    const question = questions.find((item) => item.questionId === questionId);
    if (!question || !this.isQcm(question)) return raw;
    const list = qcmChoices(questionId, options);
    if (list.some((option) => optionChoiceValue(option) === raw)) return raw;
    const byText = list.find((option) => option.optionText.trim() === raw.trim());
    return byText ? optionChoiceValue(byText) : raw;
  }

  private hasValue(value: string | undefined): boolean {
    return String(value ?? '').trim().length > 0;
  }
}

const FALLBACK_QCM_LABELS = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'] as const;

function qcmChoices(questionId: number, options: Record<number, QuestionOption[]>): QuestionOption[] {
  const stored = lookupById(options, questionId) ?? [];
  if (stored.length) return stored;
  return FALLBACK_QCM_LABELS.map((optionText, index) => ({
    optionId: -(index + 1),
    questionId,
    optionText,
    isCorrect: false,
  }));
}

function optionChoiceValue(option: QuestionOption): string {
  return option.optionId > 0 ? `${option.optionId}` : option.optionText;
}

function toSqlIso(value: Date): string {
  const min = Date.UTC(1753, 0, 1);
  const time = value.getTime();
  return new Date(Number.isFinite(time) && time >= min ? time : Date.now()).toISOString();
}

function loadErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse && err.status === 401) {
    return 'Votre session a expiré. Reconnectez-vous avec vos identifiants temporaires.';
  }
  return 'Le questionnaire n’a pas pu être chargé. Réessayez dans un instant.';
}

function submitErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const data = err.error;
    if (data && typeof data === 'object' && typeof (data as { message?: string }).message === 'string') {
      return (data as { message: string }).message;
    }
  }
  return 'L’envoi a échoué. Vérifiez vos réponses et réessayez.';
}
