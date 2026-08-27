import { Component, computed, input, model, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  CompetenceLineOption,
  initialsOf,
  planningEmployeeName,
  PlanningEmployee,
  PlanningQuestion,
  QuestionSelectionMap,
  responseTypeMeta,
  selectedQuestionCount,
} from './evaluation.models';

@Component({
  selector: 'app-planning-questions-step',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, GccEmptyState, GccStatusTag],
  template: `
    <div class="flex flex-col gap-5">
      <div class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-sm font-bold text-navy">Questionnaire par salarié</h2>
            <p class="text-xs font-medium text-slate-500">
              Chaque personne doit avoir au moins une question. Les doublons entre collègues sont signalés.
            </p>
          </div>
          <div class="min-w-44">
            <div class="mb-1 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Couverture</span>
              <span>{{ coverage() }}/{{ employees().length }}</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="coveragePercent()" class="h-2 rounded-full" />
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-2xs">
          <p class="text-sm font-bold text-navy">Chargement des compétences et questions…</p>
        </div>
      } @else if (!employees().length) {
        <gcc-empty-state title="Aucun salarié" message="Ajoutez au moins un salarié pour composer le questionnaire." />
      } @else {
        <div class="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav class="rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xs">
            @for (employee of employees(); track employee.employeeId) {
              <button
                type="button"
                class="mb-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition"
                [class]="
                  activeEmployeeId() === employee.employeeId
                    ? 'bg-indigo-50 text-navy'
                    : 'hover:bg-slate-50 text-slate-600'
                "
                (click)="activeEmployeeId.set(employee.employeeId)"
              >
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-accent to-indigo-500 text-[10px] font-extrabold text-white"
                >
                  {{ initialsOf(planningEmployeeName(employee)) }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-xs font-bold">{{ planningEmployeeName(employee) }}</span>
                  <span class="block truncate text-[10px] text-slate-400">{{ employee.position || '—' }}</span>
                </span>
                <span class="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  {{ selectedQuestionCount(selection(), employee.employeeId) }}
                </span>
              </button>
            }
          </nav>

          @if (activeEmployee(); as employee) {
            <section class="min-w-0 space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-extrabold text-navy">{{ planningEmployeeName(employee) }}</h3>
                  <p class="text-xs text-slate-500">{{ employee.position || 'Poste non renseigné' }} · {{ employee.department || '—' }}</p>
                </div>
                @if (samePositionPeers().length) {
                  <button
                    mat-stroked-button
                    class="gcc-btn-secondary !rounded-xl !text-xs"
                    type="button"
                    (click)="copyToSamePosition.emit(employee.employeeId)"
                  >
                    <mat-icon class="!mr-1.5 !h-4 !w-4 !text-[16px]">content_copy</mat-icon>
                    Appliquer au même poste ({{ samePositionPeers().length }})
                  </button>
                }
              </div>

              @if (!competencesForActive().length) {
                <gcc-empty-state
                  title="Aucune compétence associée"
                  message="Ce poste n’a pas de compétence attendue dans la matrice, ou le référentiel n’est pas encore renseigné."
                />
              } @else {
                @for (domain of domainGroups(); track domain.key) {
                  <div class="space-y-3">
                    <div class="flex items-center gap-2 px-1">
                      <span class="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-[11px] font-bold text-violet-700">
                        {{ domain.competences.length }}
                      </span>
                      <h4 class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{{ domain.name }}</h4>
                      <div class="h-px flex-1 bg-slate-200/80"></div>
                    </div>
                    @for (competence of domain.competences; track competence.competenceLineId) {
                      @if (questionsFor(employee.employeeId, competence.competenceLineId); as questions) {
                        <article class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <button
                        type="button"
                        class="flex w-full items-center gap-3 px-4 py-3 text-left"
                        (click)="toggleCompetence(employee.employeeId, competence.competenceLineId)"
                      >
                        <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-[11px] font-bold text-accent">
                          {{ questions.length }}
                        </span>
                        <span class="min-w-0 flex-1">
                          <span class="block text-sm font-bold text-navy">{{ competence.skillName }}</span>
                          <span class="block truncate text-xs text-slate-500">{{ competence.description || 'Sans description' }}</span>
                        </span>
                        <gcc-status-tag
                          [status]="selectedCount(employee.employeeId, competence.competenceLineId) ? 'processed' : 'pending'"
                          [label]="selectedCount(employee.employeeId, competence.competenceLineId) + '/' + questions.length"
                        />
                        <mat-icon class="!h-5 !w-5 !text-[20px] text-slate-400">
                          {{ isOpen(employee.employeeId, competence.competenceLineId) ? 'expand_less' : 'expand_more' }}
                        </mat-icon>
                      </button>

                      @if (isOpen(employee.employeeId, competence.competenceLineId)) {
                        <div class="border-t border-slate-100 px-4 py-3">
                          <div class="mb-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              class="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                              (click)="selectAll.emit({ employeeId: employee.employeeId, competenceLineId: competence.competenceLineId, selected: true })"
                            >
                              Tout sélectionner
                            </button>
                            <button
                              type="button"
                              class="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                              (click)="selectAll.emit({ employeeId: employee.employeeId, competenceLineId: competence.competenceLineId, selected: false })"
                            >
                              Tout retirer
                            </button>
                            <button
                              type="button"
                              class="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                              (click)="randomPick.emit({ employeeId: employee.employeeId, competenceLineId: competence.competenceLineId, count: 2 })"
                            >
                              2 au hasard
                            </button>
                          </div>

                          @if (!questions.length) {
                            <p class="text-xs text-slate-500">Aucune question pour cette compétence et ce type d’évaluation.</p>
                          } @else {
                            <ul class="space-y-2">
                              @for (question of questions; track question.questionId) {
                                <li>
                                  <button
                                    type="button"
                                    class="flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition"
                                    [class]="
                                      isChecked(employee.employeeId, competence.competenceLineId, question.questionId)
                                        ? 'border-indigo-200 bg-indigo-50/70'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                    "
                                    (click)="
                                      toggleQuestion.emit({
                                        employeeId: employee.employeeId,
                                        competenceLineId: competence.competenceLineId,
                                        questionId: question.questionId,
                                      })
                                    "
                                  >
                                    <span
                                      class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
                                      [class]="
                                        isChecked(employee.employeeId, competence.competenceLineId, question.questionId)
                                          ? 'border-accent bg-accent text-white'
                                          : 'border-slate-300 bg-white text-transparent'
                                      "
                                    >
                                      <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">check</mat-icon>
                                    </span>
                                    <span class="min-w-0 flex-1">
                                      <span class="flex items-start justify-between gap-2">
                                        <span class="block text-sm font-medium text-navy">{{ question.question }}</span>
                                        <gcc-status-tag
                                          class="shrink-0"
                                          [status]="responseTypeMeta(question.responseTypeName).kind"
                                          [label]="responseTypeMeta(question.responseTypeName).label"
                                        />
                                      </span>
                                      @if (usedByOther(question.questionId, employee.employeeId)) {
                                        <span class="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                                          <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">warning</mat-icon>
                                          Déjà retenue pour un autre salarié
                                        </span>
                                      }
                                    </span>
                                  </button>
                                </li>
                              }
                            </ul>
                          }
                        </div>
                      }
                    </article>
                  }
                    }
                  </div>
                }
              }
            </section>
          }
        </div>
      }
    </div>
  `,
})
export class PlanningQuestionsStep {
  employees = input.required<PlanningEmployee[]>();
  competenceLines = input.required<Record<number, CompetenceLineOption[]>>();
  questions = input.required<Record<number, Record<number, PlanningQuestion[]>>>();
  selection = model<QuestionSelectionMap>({});
  loading = input(false);

  toggleQuestion = output<{ employeeId: number; competenceLineId: number; questionId: number }>();
  selectAll = output<{ employeeId: number; competenceLineId: number; selected: boolean }>();
  randomPick = output<{ employeeId: number; competenceLineId: number; count: number }>();
  copyToSamePosition = output<number>();

  readonly activeEmployeeId = signal<number | null>(null);
  readonly openKeys = signal<Record<string, boolean>>({});

  readonly initialsOf = initialsOf;
  readonly planningEmployeeName = planningEmployeeName;
  readonly selectedQuestionCount = selectedQuestionCount;
  readonly responseTypeMeta = responseTypeMeta;

  readonly activeEmployee = computed(() => {
    const employees = this.employees();
    const id = this.activeEmployeeId() ?? employees[0]?.employeeId ?? null;
    return employees.find((row) => row.employeeId === id) ?? employees[0] ?? null;
  });

  readonly coverage = computed(
    () => this.employees().filter((row) => selectedQuestionCount(this.selection(), row.employeeId) > 0).length,
  );

  readonly coveragePercent = computed(() => {
    const total = this.employees().length;
    return total ? Math.round((this.coverage() / total) * 100) : 0;
  });

  readonly samePositionPeers = computed(() => {
    const current = this.activeEmployee();
    if (!current?.positionId) return [];
    return this.employees().filter(
      (row) => row.employeeId !== current.employeeId && row.positionId === current.positionId,
    );
  });

  competencesForActive(): CompetenceLineOption[] {
    const employee = this.activeEmployee();
    if (!employee) return [];
    return this.competenceLines()[employee.employeeId] ?? [];
  }

  readonly domainGroups = computed(() => {
    const groups = new Map<string, { key: string; name: string; competences: CompetenceLineOption[] }>();
    for (const competence of this.competencesForActive()) {
      const name = competence.domainName?.trim() || 'Autres domaines';
      const key = competence.domainId && competence.domainId > 0 ? `id:${competence.domainId}` : `name:${name}`;
      const group = groups.get(key) ?? { key, name, competences: [] };
      group.competences.push(competence);
      groups.set(key, group);
    }
    return [...groups.values()];
  });

  questionsFor(employeeId: number, competenceLineId: number): PlanningQuestion[] {
    return this.questions()[employeeId]?.[competenceLineId] ?? [];
  }

  selectedCount(employeeId: number, competenceLineId: number): number {
    return this.selection()[employeeId]?.[competenceLineId]?.length ?? 0;
  }

  isChecked(employeeId: number, competenceLineId: number, questionId: number): boolean {
    return this.selection()[employeeId]?.[competenceLineId]?.includes(questionId) ?? false;
  }

  usedByOther(questionId: number, employeeId: number): boolean {
    const selection = this.selection();
    for (const [otherId, byCompetence] of Object.entries(selection)) {
      if (Number(otherId) === employeeId) continue;
      for (const ids of Object.values(byCompetence)) {
        if (ids.includes(questionId)) return true;
      }
    }
    return false;
  }

  keyOf(employeeId: number, competenceLineId: number): string {
    return `${employeeId}-${competenceLineId}`;
  }

  isOpen(employeeId: number, competenceLineId: number): boolean {
    const key = this.keyOf(employeeId, competenceLineId);
    const state = this.openKeys()[key];
    return state === undefined ? true : state;
  }

  toggleCompetence(employeeId: number, competenceLineId: number): void {
    const key = this.keyOf(employeeId, competenceLineId);
    this.openKeys.update((current) => ({ ...current, [key]: !this.isOpen(employeeId, competenceLineId) }));
  }
}
