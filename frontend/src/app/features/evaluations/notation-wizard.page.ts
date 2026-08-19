import { ChangeDetectorRef, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { downloadEvaluationPdf, evaluationPdfBlob } from './evaluation-pdf';
import {
  averageOf,
  EvaluationDetails,
  initialsOf,
  NotationRemarks,
  NotationValidation,
  QuestionOption,
  ReferenceAnswer,
  SelectedQuestion,
  TrainingSuggestion,
} from './evaluation.models';
import { EvaluationService } from './evaluation.service';
import { NotationCommentsStep } from './notation-comments.step';
import { NotationQuestionsStep } from './notation-questions.step';
import { NotationValidationStep } from './notation-validation.step';
import { PdfPreviewDialog } from './pdf-preview.dialog';

@Component({
  selector: 'app-notation-wizard-page',
  imports: [
    GccPageHeader,
    GccEmptyState,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    NotationQuestionsStep,
    NotationCommentsStep,
    NotationValidationStep,
  ],
  template: `
    <gcc-page-header
      title="Notation d’évaluation"
      [subtitle]="headerSubtitle()"
      icon="fact_check"
      [crumbs]="crumbs"
    />

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger l’évaluation"
        [message]="error()!"
        actionLabel="Retour à la liste"
        actionIcon="arrow_back"
        (action)="goList()"
      />
    } @else if (success()) {
      <gcc-empty-state
        title="Notation enregistrée & rapport généré"
        message="L’évaluation a été validée avec succès et le rapport officiel PDF a été téléchargé."
        actionLabel="Retour à la liste des évaluations"
        actionIcon="list"
        (action)="goList()"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
        <div class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-accent mb-3 animate-pulse">
          <mat-icon class="!h-6 !w-6 !text-[24px]">sync</mat-icon>
        </div>
        <p class="text-sm font-bold text-navy">Chargement du dossier d’évaluation…</p>
        <p class="text-xs text-slate-400 mt-1">Récupération des questions, réponses salarié et référentiels.</p>
      </div>
    } @else if (evaluation(); as evalData) {
      <!-- Employee Hero Card -->
      <div class="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent to-indigo-500 text-base font-extrabold text-white shadow-md shadow-accent/20"
            >
              {{ initialsOf(evalData.employeeName) }}
            </span>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base font-extrabold text-navy leading-snug">{{ evalData.employeeName }}</h2>
                <span class="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                  {{ evalData.position || 'Poste non spécifié' }}
                </span>
                @if (readonly()) {
                  <span class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                    <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">lock</mat-icon>
                    Mode consultation
                  </span>
                }
              </div>
              <p class="text-xs text-slate-500 font-medium mt-1">
                Département : <span class="font-bold text-slate-700">{{ evalData.department || '—' }}</span> · Intitulé session : <span class="font-bold text-navy">{{ evalData.title }}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 self-end sm:self-auto">
            <button
              mat-stroked-button
              class="gcc-btn-secondary !rounded-xl !text-xs !py-1.5"
              type="button"
              (click)="goList()"
            >
              <mat-icon class="!mr-1.5 !h-4 !w-4 !text-[16px]">arrow_back</mat-icon>
              Retour liste
            </button>
          </div>
        </div>
      </div>

      @if (saveError()) {
        <div class="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 shadow-2xs">
          <mat-icon class="!h-5 !w-5 !text-[20px] text-red-600 shrink-0">error</mat-icon>
          <span>{{ saveError() }}</span>
        </div>
      }

      <!-- Stepper Container -->
      <div class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <mat-stepper
          class="gcc-stepper"
          [linear]="!readonly()"
          [selectedIndex]="stepIndex()"
          (selectedIndexChange)="stepIndex.set($event)"
        >
          <!-- Step 1: Notation -->
          <mat-step label="Notation des questions" [completed]="allRated()">
            <app-notation-questions-step
              [questions]="questions()"
              [(ratings)]="ratings"
              [(comments)]="comments"
              [references]="references()"
              [options]="options()"
              [evaluationTypeId]="evalData.evaluationTypeId"
              [readonly]="readonly()"
            />
            <div class="mt-6 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="cancel()">
                Annuler
              </button>
              <button
                mat-flat-button
                class="gcc-btn-primary !rounded-xl shadow-xs hover:shadow-md"
                type="button"
                [disabled]="!allRated()"
                (click)="goStep(1)"
              >
                Étape 2 : Commentaires
                <mat-icon iconPositionEnd class="!ml-1">arrow_forward</mat-icon>
              </button>
            </div>
          </mat-step>

          <!-- Step 2: Comments -->
          <mat-step label="Appréciation & Synthèse" [completed]="draftSaved()">
            <app-notation-comments-step [ratings]="ratings()" [(remarks)]="remarks" [readonly]="readonly()" />
            <div class="mt-6 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="goStep(0)">
                <mat-icon class="!mr-1">arrow_back</mat-icon>
                Précédent
              </button>
              <button
                mat-flat-button
                class="gcc-btn-primary !rounded-xl shadow-xs hover:shadow-md"
                type="button"
                [disabled]="saving()"
                (click)="saveDraftAndNext()"
              >
                {{ saving() ? 'Enregistrement du brouillon…' : 'Enregistrer le brouillon & Continuer' }}
                <mat-icon iconPositionEnd class="!ml-1">arrow_forward</mat-icon>
              </button>
            </div>
          </mat-step>

          <!-- Step 3: Validation -->
          <mat-step label="Validation & Rapport PDF">
            <app-notation-validation-step
              [ratings]="ratings()"
              [average]="averageDisplay()"
              [suggestions]="suggestions()"
              [(validation)]="validation"
              [readonly]="readonly()"
              (preview)="previewPdf()"
            />
            <div class="mt-6 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="goStep(1)">
                <mat-icon class="!mr-1">arrow_back</mat-icon>
                Précédent
              </button>
              <button
                mat-flat-button
                class="gcc-btn-primary !rounded-xl shadow-sm hover:shadow-md"
                type="button"
                [disabled]="saving() || readonly() || !canValidate()"
                (click)="validateAndDownload()"
              >
                <mat-icon class="!mr-1.5">verified_user</mat-icon>
                {{ saving() ? 'Génération du rapport en cours…' : 'Valider définitivement & Télécharger le PDF' }}
              </button>
            </div>
          </mat-step>
        </mat-stepper>
      </div>
    }
  `,
})
export class NotationWizardPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly evaluations = inject(EvaluationService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly stepper = viewChild(MatStepper);

  readonly crumbs = [{ label: 'Évaluations' }, { label: 'Notation' }, { label: 'Dossier' }];
  readonly initialsOf = initialsOf;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly readonly = signal(false);
  readonly draftSaved = signal(false);
  readonly stepIndex = signal(0);

  readonly evaluation = signal<EvaluationDetails | null>(null);
  readonly questions = signal<SelectedQuestion[]>([]);
  readonly ratings = signal<Record<number, number>>({});
  readonly comments = signal<Record<number, string>>({});
  readonly references = signal<Record<number, ReferenceAnswer>>({});
  readonly options = signal<Record<number, QuestionOption[]>>({});
  readonly suggestions = signal<TrainingSuggestion[]>([]);
  readonly remarks = signal<NotationRemarks>({ strengths: '', weaknesses: '', generalEvaluation: '' });
  readonly validation = signal<NotationValidation>({
    serviceApproved: false,
    dgApproved: false,
    serviceDate: '',
    dgDate: '',
  });

  readonly allRated = computed(() => {
    const items = this.questions();
    if (!items.length) return false;
    const ratings = this.ratings();
    return items.every((question) => ratings[question.questionId] != null);
  });

  readonly averageDisplay = computed(() => averageOf(this.ratings()).toFixed(2));

  readonly headerSubtitle = computed(() => {
    const evaluation = this.evaluation();
    if (!evaluation) return 'Saisir les notes, commenter, puis valider le rapport.';
    return `${evaluation.title} — ${evaluation.employeeName}`;
  });

  ngOnInit(): void {
    const evaluationId = Number(this.route.snapshot.paramMap.get('evaluationId'));
    if (!Number.isFinite(evaluationId) || evaluationId <= 0) {
      this.loading.set(false);
      this.error.set('Identifiant d’évaluation manquant ou invalide.');
      return;
    }
    this.load(evaluationId);
    this.readonly.set(this.route.snapshot.queryParamMap.get('view') === '1');
  }

  goList(): void {
    void this.router.navigateByUrl('/soft-gcc/evaluations/liste');
  }

  cancel(): void {
    if (this.readonly() || this.draftSaved() || window.confirm('Quitter sans enregistrer ? Les notes non sauvegardées seront perdues.')) {
      this.goList();
    }
  }

  goStep(index: number): void {
    this.stepIndex.set(index);
    this.cdr.detectChanges();
    const stepper = this.stepper();
    if (stepper && stepper.selectedIndex !== index) {
      stepper.selectedIndex = index;
    }
  }

  saveDraftAndNext(): void {
    if (this.readonly()) {
      this.goStep(2);
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    this.evaluations.saveResults(this.buildResults()).subscribe({
      next: () => {
        this.draftSaved.set(true);
        this.saving.set(false);
        this.loadSuggestions();
        this.cdr.detectChanges();
        this.goStep(2);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.describeSaveError(err));
      },
    });
  }

  canValidate(): boolean {
    const data = this.validation();
    if (data.serviceApproved && !data.serviceDate) return false;
    if (data.dgApproved && !data.dgDate) return false;
    return true;
  }

  previewPdf(): void {
    const blob = evaluationPdfBlob(this.pdfData());
    const url = URL.createObjectURL(blob);
    this.dialog
      .open(PdfPreviewDialog, { data: { url }, width: '900px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe(() => URL.revokeObjectURL(url));
  }

  validateAndDownload(): void {
    if (!this.canValidate()) return;
    this.saving.set(true);
    this.saveError.set(null);
    const evaluation = this.evaluation();
    if (!evaluation) return;

    const validation = this.validation();
    this.evaluations.saveResults(this.buildResults()).subscribe({
      next: () => {
        this.evaluations
          .validateEvaluation({
            evaluationId: evaluation.evaluationId,
            isServiceApproved: validation.serviceApproved,
            isDgApproved: validation.dgApproved,
            serviceApprovalDate: validation.serviceApproved && validation.serviceDate
              ? new Date(validation.serviceDate).toISOString()
              : null,
            dgApprovalDate: validation.dgApproved && validation.dgDate
              ? new Date(validation.dgDate).toISOString()
              : null,
          })
          .subscribe({
            next: () => {
              downloadEvaluationPdf(this.pdfData());
              this.saving.set(false);
              this.success.set(true);
            },
            error: () => {
              this.saving.set(false);
              this.saveError.set('La validation a échoué. Les notes sont enregistrées, mais l’approbation n’a pas été prise en compte.');
            },
          });
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.describeSaveError(err));
      },
    });
  }

  private describeSaveError(err: unknown): string {
    const status = err instanceof HttpErrorResponse ? err.status : 0;
    if (status === 401 || status === 403) {
      return 'Vous n’avez pas les droits nécessaires pour enregistrer cette notation.';
    }
    if (status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.';
    }
    return 'L’enregistrement des résultats a échoué. Réessayez ou contactez l’administrateur.';
  }

  private load(evaluationId: number): void {
    this.loading.set(true);
    forkJoin({
      evaluation: this.evaluations.getEvaluation(evaluationId),
      questions: this.evaluations.getSelectedQuestions(evaluationId),
      options: this.evaluations.getQuestionOptions(evaluationId),
    }).subscribe({
      next: ({ evaluation, questions, options }) => {
        const unique = this.uniqueQuestions(questions);
        this.evaluation.set(evaluation);
        this.questions.set(unique);
        this.options.set(options);
        this.hydrateRatings(unique);
        this.loading.set(false);
        const ids = unique.map((question) => question.questionId);
        this.evaluations.getReferenceAnswers(ids).subscribe((references) => this.references.set(references));
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Le dossier d’évaluation est introuvable ou vous n’avez pas les droits pour le consulter.');
      },
    });
  }

  private loadSuggestions(): void {
    this.evaluations
      .getTrainingSuggestions(this.ratings())
      .pipe(catchError(() => of([])))
      .subscribe((items) => this.suggestions.set(items));
  }

  private uniqueQuestions(items: SelectedQuestion[]): SelectedQuestion[] {
    const seen = new Set<number>();
    const next: SelectedQuestion[] = [];
    for (const item of items) {
      if (seen.has(item.questionId)) continue;
      seen.add(item.questionId);
      next.push(item);
    }
    return next;
  }

  private hydrateRatings(questions: SelectedQuestion[]): void {
    const ratings: Record<number, number> = {};
    const comments: Record<number, string> = {};
    for (const question of questions) {
      const parsed = this.parseExisting(question);
      if (parsed.score != null) ratings[question.questionId] = parsed.score;
      if (parsed.comment) comments[question.questionId] = parsed.comment;
    }
    this.ratings.set(ratings);
    this.comments.set(comments);
  }

  private parseExisting(question: SelectedQuestion): { score?: number; comment: string } {
    const raw = (question.responseValue ?? '').replace(/^"|"$/g, '').trim();
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const score = Number(parsed['overallRating'] ?? parsed['global'] ?? parsed['OverallRating']);
        const comment = String(parsed['comment'] ?? parsed['Comment'] ?? '');
        return { score: Number.isFinite(score) && score > 0 ? score : undefined, comment };
      } catch {
        return { score: undefined, comment: '' };
      }
    }
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 5 && raw !== '' && !Number.isNaN(numeric) && String(numeric) === raw) {
      return { score: numeric, comment: '' };
    }
    if (question.responseType === 'QCM') {
      return { score: question.isCorrect ? 5 : 0, comment: '' };
    }
    return { score: undefined, comment: '' };
  }

  private buildResults() {
    const evaluation = this.evaluation()!;
    const ratings = this.ratings();
    const comments = this.comments();
    const remarks = this.remarks();
    return {
      evaluationId: evaluation.evaluationId,
      ratings,
      overallScore: averageOf(ratings),
      strengths: remarks.strengths,
      weaknesses: remarks.weaknesses,
      generalEvaluation: remarks.generalEvaluation,
      detailedRatings: this.questions().map((question) => ({
        questionId: question.questionId,
        overallRating: ratings[question.questionId] ?? 0,
        comment: comments[question.questionId] || null,
      })),
    };
  }

  private pdfData() {
    return {
      evaluation: this.evaluation()!,
      questions: this.questions(),
      ratings: this.ratings(),
      comments: this.comments(),
      average: averageOf(this.ratings()),
      validation: this.validation(),
      suggestions: this.suggestions(),
      strengths: this.remarks().strengths,
      weaknesses: this.remarks().weaknesses,
      generalEvaluation: this.remarks().generalEvaluation,
    };
  }
}
