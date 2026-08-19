import { Component, computed, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import {
  emptyInterviewNotes,
  EvaluationDetails,
  initialsOf,
  InterviewNotes,
  InterviewRecord,
  parseInterviewNotes,
} from './evaluation.models';
import { EvaluationService } from './evaluation.service';
import { InterviewContextStep } from './interview-context.step';
import { InterviewObjectivesStep } from './interview-objectives.step';
import { InterviewReviewStep } from './interview-review.step';
import { InterviewSummaryStep } from './interview-summary.step';

@Component({
  selector: 'app-interview-wizard-page',
  imports: [
    GccPageHeader,
    GccEmptyState,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    InterviewContextStep,
    InterviewReviewStep,
    InterviewObjectivesStep,
    InterviewSummaryStep,
  ],
  template: `
    <gcc-page-header
      title="Conduire l’entretien"
      [subtitle]="headerSubtitle()"
      icon="record_voice_over"
      [crumbs]="crumbs"
      secondaryLabel="Retour à la liste"
      secondaryIcon="arrow_back"
      (secondary)="goList()"
    />

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger l’entretien"
        [message]="error()!"
        actionLabel="Retour à la liste"
        actionIcon="arrow_back"
        (action)="goList()"
      />
    } @else if (success()) {
      <gcc-empty-state
        title="Entretien enregistré"
        message="Le compte-rendu a été transmis. Il pourra être validé par le manager puis par la direction."
        actionLabel="Retour aux entretiens"
        actionIcon="groups"
        (action)="goList()"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
        <div class="mb-3 inline-flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-indigo-50 text-accent">
          <mat-icon class="!h-6 !w-6 !text-[24px]">sync</mat-icon>
        </div>
        <p class="text-sm font-bold text-navy">Préparation de la séance…</p>
        <p class="mt-1 text-xs text-slate-400">Chargement du dossier salarié et des notes existantes.</p>
      </div>
    } @else if (interview(); as current) {
      <div class="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent to-indigo-500 text-base font-extrabold text-white shadow-md shadow-accent/20"
            >
              {{ initialsOf(employeeName()) }}
            </span>
            <div>
              <h2 class="text-base font-extrabold leading-snug text-navy">{{ employeeName() }}</h2>
              <p class="mt-1 text-xs font-medium text-slate-500">
                {{ evaluation()?.position || 'Poste non spécifié' }}
                · {{ evaluation()?.department || 'Département non spécifié' }}
              </p>
            </div>
          </div>
          <span class="inline-flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            <mat-icon class="!h-4 !w-4 !text-[16px]">flag</mat-icon>
            {{ objectiveCount() }} objectif{{ objectiveCount() > 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      @if (saveError()) {
        <div class="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          <mat-icon class="!h-5 !w-5 !text-[20px] text-red-600">error</mat-icon>
          <span>{{ saveError() }}</span>
        </div>
      }

      <div class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <mat-stepper
          class="gcc-stepper"
          [linear]="false"
          [selectedIndex]="stepIndex()"
          (selectedIndexChange)="stepIndex.set($event)"
        >
          <mat-step label="Cadre" [completed]="contextReady()">
            <app-interview-context-step [(notes)]="notes" />
            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="goList()">
                Annuler
              </button>
              <button mat-flat-button class="gcc-btn-primary !rounded-xl" type="button" (click)="goStep(1)">
                Bilan de période
                <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </mat-step>

          <mat-step label="Bilan" [completed]="reviewReady()">
            <app-interview-review-step [(notes)]="notes" />
            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="goStep(0)">
                <mat-icon class="!mr-1">arrow_back</mat-icon>
                Précédent
              </button>
              <button mat-flat-button class="gcc-btn-primary !rounded-xl" type="button" (click)="goStep(2)">
                Objectifs
                <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </mat-step>

          <mat-step label="Objectifs" [completed]="objectivesReady()">
            <app-interview-objectives-step [(notes)]="notes" />
            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="goStep(1)">
                <mat-icon class="!mr-1">arrow_back</mat-icon>
                Précédent
              </button>
              <button mat-flat-button class="gcc-btn-primary !rounded-xl" type="button" (click)="goStep(3)">
                Synthèse
                <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </mat-step>

          <mat-step label="Synthèse">
            <app-interview-summary-step
              [(notes)]="notes"
              [fileName]="fileName()"
              [previewUrl]="previewUrl()"
              (fileSelected)="onFile($event)"
              (clearFile)="clearFile()"
            />
            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="goStep(2)">
                <mat-icon class="!mr-1">arrow_back</mat-icon>
                Précédent
              </button>
              <button
                mat-flat-button
                class="gcc-btn-primary !rounded-xl"
                type="button"
                [disabled]="saving() || !canSubmit()"
                (click)="save()"
              >
                <mat-icon class="!mr-1.5">save</mat-icon>
                {{ saving() ? 'Enregistrement…' : 'Enregistrer l’entretien' }}
              </button>
            </div>
          </mat-step>
        </mat-stepper>
      </div>
    }
  `,
})
export class InterviewWizardPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly evaluations = inject(EvaluationService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly stepper = viewChild(MatStepper);

  readonly crumbs = [{ label: 'Évaluations' }, { label: 'Entretien' }, { label: 'Séance' }];
  readonly initialsOf = initialsOf;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly stepIndex = signal(0);
  readonly interview = signal<InterviewRecord | null>(null);
  readonly evaluation = signal<EvaluationDetails | null>(null);
  readonly notes = signal<InterviewNotes>(emptyInterviewNotes());
  readonly fileName = signal('');
  readonly previewUrl = signal<SafeResourceUrl | null>(null);
  private objectUrl: string | null = null;

  readonly employeeName = computed(() => this.evaluation()?.employeeName?.trim() || 'Salarié');
  readonly headerSubtitle = computed(() =>
    this.evaluation()
      ? `Compte-rendu structuré pour ${this.employeeName()}.`
      : 'Saisissez le déroulé de l’entretien, le bilan et les objectifs.',
  );
  readonly objectiveCount = computed(
    () => this.notes().objectives.filter((item) => item.description.trim()).length,
  );
  readonly contextReady = computed(() => Boolean(this.notes().general.date));
  readonly reviewReady = computed(() => {
    const period = this.notes().previousPeriod;
    return Boolean(period.achievements.trim() || period.challenges.trim());
  });
  readonly objectivesReady = computed(() => this.objectiveCount() > 0);
  readonly canSubmit = computed(() => this.objectivesReady());

  ngOnInit(): void {
    const interviewId = Number(this.route.snapshot.paramMap.get('interviewId'));
    if (!interviewId) {
      this.error.set('Identifiant d’entretien manquant.');
      this.loading.set(false);
      return;
    }
    this.load(interviewId);
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  goList(): void {
    void this.router.navigateByUrl('/soft-gcc/evaluations/accueil');
  }

  goStep(index: number): void {
    this.stepIndex.set(index);
    const stepper = this.stepper();
    if (stepper) stepper.selectedIndex = index;
  }

  onFile(file: File): void {
    if (file.type !== 'application/pdf') {
      this.saveError.set('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    this.revokePreview();
    this.objectUrl = URL.createObjectURL(file);
    this.fileName.set(file.name);
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
  }

  clearFile(): void {
    this.revokePreview();
    this.fileName.set('');
    this.previewUrl.set(null);
  }

  save(): void {
    const interview = this.interview();
    if (!interview) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.evaluations
      .completeInterview(interview.interviewId, {
        notes: JSON.stringify(this.notes()),
        managerApproval: interview.managerApproval,
        managerComments: interview.managerComments ?? '',
        directorApproval: interview.directorApproval,
        directorComments: interview.directorComments ?? '',
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set(true);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.saveError.set(this.apiMessage(err, 'L’enregistrement de l’entretien a échoué.'));
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
        forkJoin({
          evaluation: this.evaluations.getEvaluation(interview.evaluationId).pipe(catchError(() => of(null))),
        }).subscribe({
          next: ({ evaluation }) => {
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

  private revokePreview(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  private apiMessage(err: HttpErrorResponse, fallback: string): string {
    const body = err.error as { message?: string } | string | null;
    if (typeof body === 'string' && body.trim()) return body;
    if (body && typeof body === 'object' && body.message) return body.message;
    return fallback;
  }
}
