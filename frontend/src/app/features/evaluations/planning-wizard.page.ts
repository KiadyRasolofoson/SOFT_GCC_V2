import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, OnInit, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import {
  CompetenceLineOption,
  CreateEvaluationWithQuestionsPayload,
  datesFromWeeks,
  DurationRecommendation,
  durationInDays,
  EvaluationTypeOption,
  PlanningQuestion,
  PlanningQuestionPick,
  QuestionSelectionMap,
  selectedQuestionCount,
  SupervisorOption,
  weeksFromDates,
} from './evaluation.models';
import { EvaluationService } from './evaluation.service';
import { PlanningConfigErrors, PlanningConfigStep } from './planning-config.step';
import { PlanningQuestionsStep } from './planning-questions.step';
import { PlanningSessionService } from './planning-session.service';
import { PlanningSummaryStep } from './planning-summary.step';

@Component({
  selector: 'app-planning-wizard-page',
  imports: [
    GccPageHeader,
    GccEmptyState,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    PlanningConfigStep,
    PlanningQuestionsStep,
    PlanningSummaryStep,
  ],
  template: `
    <gcc-page-header
      title="Nouvelle campagne d’évaluation"
      subtitle="Configurez la période, les superviseurs, puis composez le questionnaire de chaque salarié."
      icon="auto_awesome"
      [crumbs]="crumbs"
      secondaryLabel="Retour à la sélection"
      secondaryIcon="arrow_back"
      (secondary)="goList()"
    />

    @if (success()) {
      <gcc-empty-state
        title="Campagne planifiée"
        [message]="successMessage()"
        actionLabel="Retour à la planification"
        actionIcon="event_available"
        (action)="goList()"
      />
    } @else if (!employees().length) {
      <gcc-empty-state
        title="Aucun salarié sélectionné"
        message="Revenez à la liste pour constituer l’équipe de la campagne."
        actionLabel="Choisir des salariés"
        actionIcon="group_add"
        (action)="goList()"
      />
    } @else {
      @if (saveError()) {
        <div class="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          <mat-icon class="!h-5 !w-5 !text-[20px] text-red-600">error</mat-icon>
          <span>{{ saveError() }}</span>
        </div>
      }

      <div class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <mat-stepper class="gcc-stepper" [linear]="true" [selectedIndex]="stepIndex()" (selectedIndexChange)="onStepChange($event)">
          <mat-step label="Configuration" [completed]="configValid()">
            <app-planning-config-step
              [employees]="employees()"
              [types]="types()"
              [supervisors]="supervisors()"
              [recommendation]="recommendation()"
              [errors]="configErrors()"
              [(evaluationType)]="evaluationType"
              [(supervisorIds)]="supervisorIds"
              [(durationWeeks)]="durationWeeks"
              [(startDate)]="startDate"
              [(endDate)]="endDate"
              [(remindersEnabled)]="remindersEnabled"
              (weeksChange)="applyWeeks($event)"
              (startChange)="onStartChange($event)"
              (endChange)="onEndChange($event)"
              (removeEmployee)="removeEmployee($event)"
            />
            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="goList()">
                Annuler
              </button>
              <button
                mat-flat-button
                class="gcc-btn-primary !rounded-xl shadow-xs hover:shadow-md"
                type="button"
                [disabled]="loadingQuestions()"
                (click)="goQuestions()"
              >
                {{ loadingQuestions() ? 'Chargement des questions…' : 'Composer le questionnaire' }}
              </button>
            </div>
          </mat-step>

          <mat-step label="Questions" [completed]="questionsValid()">
            <app-planning-questions-step
              [employees]="employees()"
              [competenceLines]="competenceLines()"
              [questions]="questions()"
              [loading]="loadingQuestions()"
              [(selection)]="selection"
              (toggleQuestion)="toggleQuestion($event)"
              (selectAll)="selectAll($event)"
              (randomPick)="randomPick($event)"
              (copyToSamePosition)="copyToSamePosition($event)"
            />
            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="stepper().previous()">
                Retour
              </button>
              <button mat-flat-button class="gcc-btn-primary !rounded-xl" type="button" (click)="goSummary()">
                Voir le récapitulatif
              </button>
            </div>
          </mat-step>

          <mat-step label="Récapitulatif">
            <app-planning-summary-step
              [employees]="employees()"
              [types]="types()"
              [supervisors]="supervisors()"
              [competenceLines]="competenceLines()"
              [selection]="selection()"
              [evaluationType]="evaluationType()"
              [supervisorIds]="supervisorIds()"
              [startDate]="startDate()"
              [endDate]="endDate()"
              [remindersEnabled]="remindersEnabled()"
            />
            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="stepper().previous()">
                Retour
              </button>
              <button
                mat-flat-button
                class="gcc-btn-primary !rounded-xl shadow-sm hover:shadow-md"
                type="button"
                [disabled]="saving()"
                (click)="finalize()"
              >
                {{ saving() ? 'Planification…' : 'Planifier la campagne' }}
              </button>
            </div>
          </mat-step>
        </mat-stepper>
      </div>
    }
  `,
})
export class PlanningWizardPage implements OnInit {
  private readonly evaluations = inject(EvaluationService);
  private readonly session = inject(PlanningSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly stepper = viewChild.required(MatStepper);

  readonly crumbs = [{ label: 'Évaluations' }, { label: 'Planification' }, { label: 'Campagne' }];

  readonly employees = this.session.employees;
  readonly remindersEnabled = this.session.remindersEnabled;

  readonly types = signal<EvaluationTypeOption[]>([]);
  readonly supervisors = signal<SupervisorOption[]>([]);
  readonly competenceLines = signal<Record<number, CompetenceLineOption[]>>({});
  readonly questions = signal<Record<number, Record<number, PlanningQuestion[]>>>({});
  readonly selection = signal<QuestionSelectionMap>({});
  readonly recommendation = signal<DurationRecommendation | null>(null);

  readonly evaluationType = signal<string | null>(null);
  readonly supervisorIds = signal<number[]>([]);
  readonly durationWeeks = signal<string | null>(null);
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly configErrors = signal<PlanningConfigErrors>({
    evaluationType: '',
    supervisors: '',
    dates: '',
    employees: '',
    duration: '',
  });
  readonly stepIndex = signal(0);
  readonly loadingQuestions = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly success = signal(false);
  readonly createdCount = signal(0);

  readonly successMessage = computed(
    () => `${this.createdCount()} évaluation(s) ont été créées et les convocations pourront être suivies depuis la liste.`,
  );

  readonly configValid = computed(() => !this.validateConfig(false));
  readonly questionsValid = computed(
    () => this.employees().length > 0 && this.employees().every((row) => this.questionPicksFor(row.employeeId).length > 0),
  );

  private lastLoadedType: string | null = null;

  constructor() {
    effect(() => {
      this.evaluationType();
      this.supervisorIds();
      this.employees();
      untracked(() => this.refreshDuration());
    });
  }

  ngOnInit(): void {
    forkJoin({
      types: this.evaluations.getEvaluationTypes(),
      supervisors: this.evaluations.getSupervisors(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ types, supervisors }) => {
          this.types.set(types);
          this.supervisors.set(supervisors);
        },
        error: () => this.saveError.set('Impossible de charger les types d’évaluation ou les superviseurs.'),
      });
  }

  goList(): void {
    void this.router.navigate(['/soft-gcc/evaluations/planning']);
  }

  removeEmployee(employeeId: number): void {
    this.session.remove(employeeId);
    this.selection.update((current) => {
      const next = { ...current };
      delete next[employeeId];
      return next;
    });
  }

  applyWeeks(weeks: number): void {
    const { start, end } = datesFromWeeks(weeks);
    this.startDate.set(start);
    this.endDate.set(end);
    this.refreshDuration();
  }

  onStartChange(value: string): void {
    this.startDate.set(value);
    if (value && this.endDate()) this.durationWeeks.set(String(weeksFromDates(value, this.endDate()) || ''));
    this.refreshDuration();
  }

  onEndChange(value: string): void {
    this.endDate.set(value);
    if (this.startDate() && value) this.durationWeeks.set(String(weeksFromDates(this.startDate(), value) || ''));
    this.refreshDuration();
  }

  onStepChange(index: number): void {
    this.stepIndex.set(index);
    if (index >= 1) this.ensureQuestionsLoaded();
    if (index === 0) this.refreshDuration();
  }

  goQuestions(): void {
    if (this.validateConfig(true)) return;
    this.ensureQuestionsLoaded(true);
    this.stepper().next();
  }

  goSummary(): void {
    if (!this.questionsValid()) {
      this.saveError.set('Sélectionnez au moins une question pour chaque salarié avant de continuer.');
      return;
    }
    this.saveError.set(null);
    this.stepper().next();
  }

  toggleQuestion(event: { employeeId: number; competenceLineId: number; questionId: number }): void {
    this.selection.update((current) => {
      const next: QuestionSelectionMap = { ...current, [event.employeeId]: { ...(current[event.employeeId] ?? {}) } };
      const list = [...(next[event.employeeId][event.competenceLineId] ?? [])];
      const index = list.indexOf(event.questionId);
      if (index >= 0) list.splice(index, 1);
      else list.push(event.questionId);
      next[event.employeeId][event.competenceLineId] = list;
      return next;
    });
  }

  selectAll(event: { employeeId: number; competenceLineId: number; selected: boolean }): void {
    const ids = event.selected
      ? (this.questions()[event.employeeId]?.[event.competenceLineId] ?? []).map((row) => row.questionId)
      : [];
    this.patchSelection(event.employeeId, event.competenceLineId, ids);
  }

  randomPick(event: { employeeId: number; competenceLineId: number; count: number }): void {
    const pool = [...(this.questions()[event.employeeId]?.[event.competenceLineId] ?? [])];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    this.patchSelection(
      event.employeeId,
      event.competenceLineId,
      pool.slice(0, Math.min(event.count, pool.length)).map((row) => row.questionId),
    );
  }

  copyToSamePosition(employeeId: number): void {
    const source = this.employees().find((row) => row.employeeId === employeeId);
    if (!source?.positionId) return;
    const snapshot = this.selection()[employeeId] ?? {};
    this.selection.update((current) => {
      const next: QuestionSelectionMap = { ...current };
      for (const peer of this.employees()) {
        if (peer.employeeId === employeeId || peer.positionId !== source.positionId) continue;
        const peerCompetences = new Set((this.competenceLines()[peer.employeeId] ?? []).map((row) => row.competenceLineId));
        next[peer.employeeId] = { ...(next[peer.employeeId] ?? {}) };
        for (const [competenceId, ids] of Object.entries(snapshot)) {
          const id = Number(competenceId);
          if (peerCompetences.has(id)) next[peer.employeeId][id] = [...ids];
        }
      }
      return next;
    });
  }

  questionPicksFor(employeeId: number): PlanningQuestionPick[] {
    const grouped = this.selection()[employeeId] ?? {};
    const catalog = Object.values(this.questions()[employeeId] ?? {}).flat();
    const fallback =
      (this.competenceLines()[employeeId] ?? []).map((row) => row.competenceLineId).find((id) => id > 0) ?? null;
    const picks: PlanningQuestionPick[] = [];
    const seen = new Set<number>();

    for (const [groupId, questionIds] of Object.entries(grouped)) {
      const groupCompetenceId = Number(groupId);
      for (const questionId of questionIds) {
        if (seen.has(questionId)) continue;
        seen.add(questionId);
        const fromCatalog = catalog.find((row) => row.questionId === questionId);
        const competenceLineId =
          Number(fromCatalog?.competenceLineId) > 0
            ? Number(fromCatalog!.competenceLineId)
            : groupCompetenceId > 0
              ? groupCompetenceId
              : fallback;
        if (!competenceLineId) continue;
        picks.push({ questionId, competenceLineId });
      }
    }

    return picks;
  }

  finalize(): void {
    if (this.validateConfig(true) || !this.questionsValid()) {
      this.saveError.set('La configuration est incomplète. Vérifiez les étapes précédentes.');
      return;
    }

    const typeId = Number(this.evaluationType());
    const payload: CreateEvaluationWithQuestionsPayload = {
      evaluationTypeId: typeId,
      supervisorIds: this.supervisorIds(),
      startDate: this.startDate(),
      endDate: this.endDate(),
      enableReminders: this.remindersEnabled(),
      employeeQuestions: this.employees().map((employee) => ({
        employeeId: employee.employeeId,
        evaluationTypeId: typeId,
        positionId: employee.positionId ?? 0,
        selectedQuestions: this.questionPicksFor(employee.employeeId),
      })),
    };

    this.saving.set(true);
    this.saveError.set(null);
    this.evaluations.createEvaluationWithQuestions(payload).subscribe({
      next: (result) => {
        const ids = result.evaluationIds ?? [];
        this.createdCount.set(ids.length || this.employees().length);
        if (this.remindersEnabled() && ids.length) {
          this.evaluations.configureReminders({ evaluationIds: ids, isEnabled: true }).subscribe({
            error: () => undefined,
          });
        }
        this.session.clear();
        this.saving.set(false);
        this.success.set(true);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.errorMessage(err, 'La planification a échoué. Vérifiez les dates, les questions et vos droits.'));
      },
    });
  }

  private patchSelection(employeeId: number, competenceLineId: number, ids: number[]): void {
    this.selection.update((current) => ({
      ...current,
      [employeeId]: {
        ...(current[employeeId] ?? {}),
        [competenceLineId]: ids,
      },
    }));
  }

  private validateConfig(assign: boolean): boolean {
    const errors: PlanningConfigErrors = {
      evaluationType: this.evaluationType() ? '' : 'Choisissez un type d’évaluation.',
      supervisors: this.supervisorIds().length ? '' : 'Ajoutez au moins un superviseur.',
      employees: this.employees().length ? '' : 'Conservez au moins un salarié.',
      duration: Number(this.durationWeeks()) > 0 ? '' : 'Définissez une durée.',
      dates: '',
    };

    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) {
      errors.dates = 'Les dates de début et de fin sont obligatoires.';
    } else {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);
      if (startDay < today) errors.dates = 'La date de début ne peut pas être antérieure à aujourd’hui.';
      else if (endDate < startDate) errors.dates = 'La date de fin doit être postérieure au début.';
      else {
        const rec = this.recommendation();
        const days = durationInDays(start, end);
        if (rec && days < rec.days) {
          errors.dates = `La durée (${days} jours) est inférieure à la recommandation (${rec.days} jours). Allongez la période ou réduisez l’équipe.`;
        }
      }
    }

    const hasErrors = Object.values(errors).some(Boolean);
    if (assign) this.configErrors.set(errors);
    return hasErrors;
  }

  private refreshDuration(): void {
    const typeId = Number(this.evaluationType());
    const employees = this.employees();
    if (!typeId || !employees.length) {
      this.recommendation.set(null);
      return;
    }

    const positionIds = employees.map((row) => row.positionId).filter((id): id is number => !!id);
    const uniqueCompetences = new Set<number>();
    let questionCount = 0;
    for (const employee of employees) {
      for (const competence of this.competenceLines()[employee.employeeId] ?? []) {
        uniqueCompetences.add(competence.competenceLineId);
      }
      questionCount += selectedQuestionCount(this.selection(), employee.employeeId);
    }

    this.evaluations
      .calculateRecommendedDuration({
        employeeCount: employees.length,
        evaluationTypeId: typeId,
        positionIds,
        currentDurationDays: durationInDays(this.startDate(), this.endDate()) || null,
        averageQuestionsPerEmployee: employees.length
          ? Math.ceil((questionCount || 10) / employees.length)
          : 10,
        totalCompetences: uniqueCompetences.size,
        supervisorCount: this.supervisorIds().length || 1,
      })
      .subscribe((rec) => this.recommendation.set(rec));
  }

  private ensureQuestionsLoaded(force = false): void {
    const typeId = this.evaluationType();
    if (!typeId) return;
    if (!force && this.lastLoadedType === typeId && Object.keys(this.questions()).length) return;

    this.loadingQuestions.set(true);
    this.saveError.set(null);
    this.lastLoadedType = typeId;
    const employees = this.employees();
    const positionIds = [
      ...new Set(employees.map((employee) => employee.positionId).filter((id): id is number => !!id && id > 0)),
    ];

    if (!employees.length) {
      this.competenceLines.set({});
      this.questions.set({});
      this.loadingQuestions.set(false);
      return;
    }

    if (!positionIds.length) {
      this.competenceLines.set({});
      this.questions.set({});
      this.loadingQuestions.set(false);
      this.saveError.set(
        'Les salariés sélectionnés n’ont pas de poste associé. Impossible de charger le questionnaire.',
      );
      return;
    }

    forkJoin(
      positionIds.map((positionId) =>
        forkJoin({
          competences: this.evaluations
            .getCompetenceLinesByPosition(positionId)
            .pipe(catchError(() => of([] as CompetenceLineOption[]))),
          questions: this.evaluations
            .getPlanningQuestions(Number(typeId), positionId)
            .pipe(catchError(() => of([] as PlanningQuestion[]))),
        }).pipe(map((pack) => ({ positionId, ...pack }))),
      ),
    ).subscribe({
      next: (results) => this.applyQuestionPacks(results),
      error: () => {
        this.loadingQuestions.set(false);
        this.saveError.set('Impossible de charger les compétences ou les questions d’évaluation.');
      },
    });
  }

  private applyQuestionPacks(
    results: { positionId: number; competences: CompetenceLineOption[]; questions: PlanningQuestion[] }[],
  ): void {
    const byPosition = new Map(results.map((row) => [row.positionId, row] as const));
    const competenceMap: Record<number, CompetenceLineOption[]> = {};
    const questionMap: Record<number, Record<number, PlanningQuestion[]>> = {};

    for (const employee of this.employees()) {
      const pack = byPosition.get(employee.positionId ?? -1);
      const questions = pack?.questions ?? [];
      const byLine = new Map<number, PlanningQuestion[]>();
      for (const question of questions) {
        const lineId = Number(question.competenceLineId) > 0 ? Number(question.competenceLineId) : 0;
        const list = byLine.get(lineId) ?? [];
        list.push(question);
        byLine.set(lineId, list);
      }

      const fromPack = pack?.competences ?? [];
      const competences: CompetenceLineOption[] = [];
      const seen = new Set<number>();

      for (const competence of fromPack) {
        const sample = (byLine.get(competence.competenceLineId) ?? [])[0];
        seen.add(competence.competenceLineId);
        competences.push({
          ...competence,
          skillName: sample?.skillName || competence.skillName,
          skillId: sample?.skillId ?? competence.skillId ?? null,
          domainId: sample?.domainId ?? competence.domainId ?? null,
          domainName: sample?.domainName ?? competence.domainName ?? null,
          familyId: sample?.familyId ?? competence.familyId ?? null,
          familyName: sample?.familyName ?? competence.familyName ?? null,
        });
      }

      for (const [lineId, list] of byLine) {
        if (lineId <= 0 || seen.has(lineId)) continue;
        const sample = list[0];
        competences.push({
          competenceLineId: lineId,
          skillName: sample.skillName || `Compétence #${lineId}`,
          description: null,
          positionId: employee.positionId ?? 0,
          skillId: sample.skillId,
          domainId: sample.domainId,
          domainName: sample.domainName,
          familyId: sample.familyId,
          familyName: sample.familyName,
        });
      }

      const unassigned = byLine.get(0) ?? [];
      competenceMap[employee.employeeId] = competences;
      questionMap[employee.employeeId] = {};
      for (const competence of competences) {
        questionMap[employee.employeeId][competence.competenceLineId] =
          byLine.get(competence.competenceLineId) ?? [];
      }
      if (unassigned.length && competences.length) {
        const firstId = competences[0].competenceLineId;
        questionMap[employee.employeeId][firstId] = [
          ...(questionMap[employee.employeeId][firstId] ?? []),
          ...unassigned,
        ];
      }
    }

    this.competenceLines.set(competenceMap);
    this.questions.set(questionMap);
    this.loadingQuestions.set(false);
    this.refreshDuration();

    const total = Object.values(questionMap).reduce(
      (sum, byCompetence) => sum + Object.values(byCompetence).reduce((inner, list) => inner + list.length, 0),
      0,
    );
    if (!total) {
      this.saveError.set(
        'Aucune question n’a été trouvée pour ce type d’évaluation et ces postes. Vérifiez le référentiel questions / compétences.',
      );
    }
  }

  private errorMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) return fallback;
    const data = err.error;
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (data && typeof data === 'object') {
      const msg = data.error ?? data.message ?? data.title;
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
    }
    return fallback;
  }
}
