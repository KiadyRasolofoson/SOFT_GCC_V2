import { Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import {
  DurationRecommendation,
  EvaluationTypeOption,
  initialsOf,
  planningEmployeeName,
  PlanningEmployee,
  SupervisorOption,
} from './evaluation.models';

export interface PlanningConfigErrors {
  evaluationType: string;
  supervisors: string;
  dates: string;
  employees: string;
  duration: string;
}

@Component({
  selector: 'app-planning-config-step',
  imports: [FormsModule, MatButtonModule, MatIconModule, GccSelect],
  template: `
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
      <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div class="mb-5 flex items-start gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-accent border border-indigo-100">
            <mat-icon class="!h-5 !w-5 !text-[20px]">tune</mat-icon>
          </div>
          <div>
            <h2 class="text-sm font-bold text-navy">Paramètres de la campagne</h2>
            <p class="text-xs font-medium text-slate-500">Type, superviseurs et fenêtre de réalisation.</p>
          </div>
        </div>

        <div class="space-y-5">
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Type d’évaluation</span>
            <gcc-select
              [options]="typeOptions()"
              [value]="evaluationType()"
              (valueChange)="evaluationType.set($event)"
              placeholder="Choisir un type"
            />
            @if (errors().evaluationType) {
              <p class="mt-1.5 text-xs font-semibold text-red-600">{{ errors().evaluationType }}</p>
            }
          </label>

          <div>
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Superviseurs</span>
            <gcc-select
              [options]="availableSupervisorOptions()"
              [value]="supervisorPick()"
              (valueChange)="addSupervisor($event)"
              placeholder="Ajouter un superviseur"
            />
            <div class="mt-2 flex flex-wrap gap-2">
              @for (supervisor of selectedSupervisorRows(); track supervisor.id) {
                <span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-navy">
                  {{ supervisor.firstName }} {{ supervisor.lastName }}
                  <button type="button" class="text-slate-400 hover:text-red-600" (click)="removeSupervisor(supervisor.id)">
                    <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">close</mat-icon>
                  </button>
                </span>
              }
            </div>
            @if (errors().supervisors) {
              <p class="mt-1.5 text-xs font-semibold text-red-600">{{ errors().supervisors }}</p>
            }
          </div>

          <div>
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Durée de la campagne</span>
            <div class="mb-3 flex flex-wrap gap-2">
              @for (week of weekPresets; track week) {
                <button
                  type="button"
                  class="rounded-xl border px-3 py-1.5 text-xs font-bold transition"
                  [class]="
                    isPreset(week)
                      ? 'border-accent bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  "
                  (click)="pickWeeks(week)"
                >
                  {{ week }} sem.
                </button>
              }
            </div>
            <gcc-select
              class="max-w-56"
              [options]="weekOptions"
              [value]="durationWeeks()"
              (valueChange)="onWeeksChange($event)"
              placeholder="Autre durée"
            />
            @if (errors().duration) {
              <p class="mt-1.5 text-xs font-semibold text-red-600">{{ errors().duration }}</p>
            }
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Début</span>
              <input class="gcc-input" type="datetime-local" [ngModel]="startDate()" (ngModelChange)="onStartChange($event)" />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Fin</span>
              <input class="gcc-input" type="datetime-local" [ngModel]="endDate()" (ngModelChange)="onEndChange($event)" />
            </label>
          </div>
          @if (errors().dates) {
            <p class="text-xs font-semibold text-red-600">{{ errors().dates }}</p>
          }

          @if (recommendation(); as rec) {
            <div class="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
              <div class="flex items-start gap-3">
                <mat-icon class="!h-5 !w-5 !text-[20px] text-accent">schedule</mat-icon>
                <div>
                  <p class="text-xs font-bold text-navy">
                    Durée recommandée : {{ rec.days }} jours
                    ({{ rec.weeksDisplay || rec.weeks + ' sem.' }})
                  </p>
                  <p class="mt-1 text-xs leading-relaxed text-slate-600">
                    {{ rec.justification || 'Calibrée selon le nombre de salariés, de superviseurs et de questions.' }}
                  </p>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <aside class="space-y-5">
        <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div class="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-bold text-navy">Équipe évaluée</h2>
              <p class="text-xs font-medium text-slate-500">{{ employees().length }} salarié(s)</p>
            </div>
          </div>
          @if (errors().employees) {
            <p class="mb-3 text-xs font-semibold text-red-600">{{ errors().employees }}</p>
          }
          <ul class="space-y-2">
            @for (employee of employees(); track employee.employeeId) {
              <li class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-indigo-500 text-[10px] font-extrabold text-white"
                >
                  {{ initialsOf(planningEmployeeName(employee)) }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-navy">{{ planningEmployeeName(employee) }}</p>
                  <p class="truncate text-[11px] text-slate-500">{{ employee.position || 'Poste non renseigné' }}</p>
                </div>
                <button type="button" class="text-slate-400 hover:text-red-600" (click)="removeEmployee.emit(employee.employeeId)">
                  <mat-icon class="!h-4 !w-4 !text-[16px]">person_remove</mat-icon>
                </button>
              </li>
            }
          </ul>
        </section>

        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition"
          [class]="
            remindersEnabled()
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          "
          (click)="remindersEnabled.set(!remindersEnabled())"
        >
          <mat-icon class="!h-5 !w-5 !text-[20px]" [class]="remindersEnabled() ? 'text-emerald-600' : 'text-slate-400'">
            {{ remindersEnabled() ? 'notifications_active' : 'notifications_off' }}
          </mat-icon>
          <span>
            <span class="block text-sm font-bold text-navy">Rappels automatiques</span>
            <span class="block text-xs text-slate-500">Relances pendant la période d’évaluation</span>
          </span>
        </button>
      </aside>
    </div>
  `,
})
export class PlanningConfigStep {
  employees = input.required<PlanningEmployee[]>();
  types = input.required<EvaluationTypeOption[]>();
  supervisors = input.required<SupervisorOption[]>();
  recommendation = input<DurationRecommendation | null>(null);
  errors = input<PlanningConfigErrors>({
    evaluationType: '',
    supervisors: '',
    dates: '',
    employees: '',
    duration: '',
  });

  evaluationType = model<string | null>(null);
  supervisorIds = model<number[]>([]);
  durationWeeks = model<string | null>(null);
  startDate = model('');
  endDate = model('');
  remindersEnabled = model(false);
  supervisorPick = model<string | null>(null);

  weeksChange = output<number>();
  startChange = output<string>();
  endChange = output<string>();
  removeEmployee = output<number>();

  readonly weekPresets = [1, 2, 3, 4, 6, 8];
  readonly weekOptions: GccSelectOption[] = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1} semaine${i ? 's' : ''}`,
    value: String(i + 1),
  }));

  readonly initialsOf = initialsOf;
  readonly planningEmployeeName = planningEmployeeName;

  readonly typeOptions = computed<GccSelectOption[]>(() =>
    this.types().map((type) => ({ label: type.designation, value: String(type.evaluationTypeId) })),
  );

  readonly selectedSupervisorRows = computed(() => {
    const ids = new Set(this.supervisorIds());
    return this.supervisors().filter((row) => ids.has(row.id));
  });

  readonly availableSupervisorOptions = computed<GccSelectOption[]>(() => {
    const ids = new Set(this.supervisorIds());
    return this.supervisors()
      .filter((row) => !ids.has(row.id))
      .map((row) => ({ label: `${row.firstName} ${row.lastName}`.trim(), value: String(row.id) }));
  });

  addSupervisor(value: string | null): void {
    this.supervisorPick.set(null);
    if (!value) return;
    const id = Number(value);
    if (!Number.isFinite(id) || this.supervisorIds().includes(id)) return;
    this.supervisorIds.update((list) => [...list, id]);
  }

  removeSupervisor(id: number): void {
    this.supervisorIds.update((list) => list.filter((item) => item !== id));
  }

  pickWeeks(weeks: number): void {
    this.durationWeeks.set(String(weeks));
    this.weeksChange.emit(weeks);
  }

  isPreset(week: number): boolean {
    return this.durationWeeks() === String(week);
  }

  onWeeksChange(value: string | null): void {
    this.durationWeeks.set(value);
    const weeks = Number(value);
    if (Number.isFinite(weeks) && weeks > 0) this.weeksChange.emit(weeks);
  }

  onStartChange(value: string): void {
    this.startDate.set(value);
    this.startChange.emit(value);
  }

  onEndChange(value: string): void {
    this.endDate.set(value);
    this.endChange.emit(value);
  }
}
