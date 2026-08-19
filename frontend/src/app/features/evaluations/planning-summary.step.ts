import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  CompetenceLineOption,
  EvaluationTypeOption,
  initialsOf,
  planningEmployeeName,
  PlanningEmployee,
  QuestionSelectionMap,
  selectedQuestionCount,
  SupervisorOption,
} from './evaluation.models';

@Component({
  selector: 'app-planning-summary-step',
  imports: [DatePipe, MatIconModule, GccKpiCard, GccStatusTag],
  template: `
    <div class="space-y-5">
      <div class="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <gcc-kpi-card label="Type" [value]="typeLabel()" hint="Référentiel de la campagne" tone="accent" icon="category" />
        <gcc-kpi-card
          label="Salariés"
          [value]="employees().length.toString()"
          hint="Dossiers qui seront créés"
          tone="neutral"
          icon="groups"
        />
        <gcc-kpi-card
          label="Questions"
          [value]="totalQuestions().toString()"
          hint="Total retenu sur la campagne"
          tone="up"
          icon="quiz"
        />
        <gcc-kpi-card
          label="Rappels"
          [value]="remindersEnabled() ? 'Activés' : 'Non'"
          hint="Relances automatiques"
          [tone]="remindersEnabled() ? 'up' : 'neutral'"
          icon="notifications"
        />
      </div>

      <section class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
        <div class="mb-4 flex items-center gap-2">
          <mat-icon class="!h-5 !w-5 !text-[20px] text-accent">event</mat-icon>
          <h2 class="text-sm font-bold text-navy">Fenêtre de réalisation</h2>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="min-w-0">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Période</p>
            <p class="mt-1 text-sm font-semibold leading-relaxed text-slate-700">
              <span class="inline-block">{{ startDate() | date: 'dd MMM yyyy HH:mm' }}</span>
              <span class="mx-1.5 text-slate-300">→</span>
              <span class="inline-block">{{ endDate() | date: 'dd MMM yyyy HH:mm' }}</span>
            </p>
          </div>
          <div class="min-w-0">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Superviseurs</p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              @for (supervisor of supervisorRows(); track supervisor.id) {
                <gcc-status-tag status="processed" [label]="supervisor.firstName + ' ' + supervisor.lastName" />
              } @empty {
                <span class="text-xs font-medium text-slate-500">Aucun superviseur</span>
              }
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-bold text-navy">Répartition des questions</h2>
        <div class="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
          @for (employee of employees(); track employee.employeeId) {
            <article class="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-indigo-500 text-[10px] font-extrabold text-white"
                  >
                    {{ initialsOf(planningEmployeeName(employee)) }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-bold text-navy">{{ planningEmployeeName(employee) }}</p>
                    <p class="truncate text-xs text-slate-500">{{ employee.position || '—' }}</p>
                  </div>
                </div>
                <gcc-status-tag
                  [status]="selectedQuestionCount(selection(), employee.employeeId) ? 'ok' : 'gap'"
                  [label]="selectedQuestionCount(selection(), employee.employeeId) + ' question(s)'"
                />
              </div>
              <ul class="mt-auto space-y-1.5">
                @for (line of competenceSummary(employee.employeeId); track line.name) {
                  <li class="flex items-center justify-between gap-3 text-xs text-slate-600">
                    <span class="min-w-0 truncate font-medium">{{ line.name }}</span>
                    <span class="shrink-0 font-bold text-navy">{{ line.count }}</span>
                  </li>
                }
              </ul>
            </article>
          }
        </div>
      </section>
    </div>
  `,
})
export class PlanningSummaryStep {
  employees = input.required<PlanningEmployee[]>();
  types = input.required<EvaluationTypeOption[]>();
  supervisors = input.required<SupervisorOption[]>();
  competenceLines = input.required<Record<number, CompetenceLineOption[]>>();
  selection = input.required<QuestionSelectionMap>();
  evaluationType = input<string | null>(null);
  supervisorIds = input<number[]>([]);
  startDate = input('');
  endDate = input('');
  remindersEnabled = input(false);

  readonly initialsOf = initialsOf;
  readonly planningEmployeeName = planningEmployeeName;
  readonly selectedQuestionCount = selectedQuestionCount;

  readonly typeLabel = computed(() => {
    const id = Number(this.evaluationType());
    return this.types().find((type) => type.evaluationTypeId === id)?.designation || '—';
  });

  readonly supervisorRows = computed(() => {
    const ids = new Set(this.supervisorIds());
    return this.supervisors().filter((row) => ids.has(row.id));
  });

  readonly totalQuestions = computed(() =>
    this.employees().reduce((sum, employee) => sum + selectedQuestionCount(this.selection(), employee.employeeId), 0),
  );

  competenceSummary(employeeId: number): { name: string; count: number }[] {
    const selected = this.selection()[employeeId] ?? {};
    const competences = this.competenceLines()[employeeId] ?? [];
    return Object.entries(selected)
      .filter(([, ids]) => ids.length)
      .map(([competenceId, ids]) => ({
        name: competences.find((row) => row.competenceLineId === Number(competenceId))?.skillName || `Compétence #${competenceId}`,
        count: ids.length,
      }));
  }
}
