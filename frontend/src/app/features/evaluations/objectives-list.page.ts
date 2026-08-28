import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccFilterBar } from '../../ui/gcc-filter-bar';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import { GccSelectOption } from '../../ui/gcc.types';
import {
  OBJECTIVE_STATUS_OPTIONS,
  ObjectiveSummaryRow,
  ObjectivesStatistics,
  directoryEmployeeName,
  emptyObjectivesStats,
  initialsOf,
  isObjectiveOverdue,
  objectiveRowKey,
  objectiveStatusMeta,
  progressToneClass,
  syncObjectiveProgress,
} from './evaluation.models';
import { EvaluationService } from './evaluation.service';

interface StatusChip {
  value: string;
  label: string;
  count: (stats: ObjectivesStatistics) => number;
}

@Component({
  selector: 'app-objectives-list-page',
  imports: [
    DatePipe,
    FormsModule,
    GccPageHeader,
    GccFilterBar,
    GccSelect,
    GccKpiCard,
    GccStatusTag,
    GccEmptyState,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <gcc-page-header
      title="Récapitulatif des objectifs"
      subtitle="Suivez la progression des objectifs fixés en entretien, actualisez les statuts et consultez l’historique."
      icon="flag"
      [crumbs]="crumbs"
      actionLabel="Actualiser"
      actionIcon="refresh"
      (action)="reload()"
    />

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <gcc-kpi-card
        label="Objectifs"
        [value]="stats().totalObjectives.toString()"
        hint="Issus des comptes-rendus d’entretien"
        tone="neutral"
        icon="ads_click"
      />
      <gcc-kpi-card
        label="Atteints"
        [value]="stats().achievedObjectives.toString()"
        [hint]="shareHint(stats().achievedObjectives)"
        tone="up"
        icon="emoji_events"
      />
      <gcc-kpi-card
        label="En cours"
        [value]="stats().inProgressObjectives.toString()"
        [hint]="shareHint(stats().inProgressObjectives)"
        tone="accent"
        icon="timelapse"
      />
      <gcc-kpi-card
        label="Taux de réalisation"
        [value]="formatPercent(stats().globalAchievementRate)"
        [hint]="'Avancement moyen ' + formatPercent(stats().averageCompletionRate)"
        [tone]="stats().globalAchievementRate >= 50 ? 'up' : 'down'"
        icon="track_changes"
      />
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      @for (chip of statusChips; track chip.value) {
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition"
          [class]="
            status() === chip.value
              ? 'border-navy bg-navy text-white shadow-xs'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          "
          (click)="setStatus(chip.value)"
        >
          {{ chip.label }}
          <span
            class="rounded-full px-1.5 py-0.5 text-[10px] tabular"
            [class]="status() === chip.value ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'"
          >
            {{ chip.count(stats()) }}
          </span>
        </button>
      }
    </div>

    <gcc-filter-bar
      placeholder="Rechercher un salarié, un objectif ou un indicateur…"
      [(query)]="search"
      (apply)="applyFilters()"
      (reset)="resetFilters()"
    >
      <gcc-select
        class="w-full shrink-0 lg:w-52"
        [options]="departmentOptions()"
        [(value)]="department"
        placeholder="Tous les départements"
      />
      @if (employeeOptions().length > 1) {
        <gcc-select
          class="w-full shrink-0 lg:w-56"
          [options]="employeeOptions()"
          [(value)]="employee"
          placeholder="Tous les salariés"
        />
      }
    </gcc-filter-bar>

    @if (hint()) {
      <div class="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
        <mat-icon class="!h-5 !w-5 !text-[20px] text-amber-600">info</mat-icon>
        <span>{{ hint() }}</span>
      </div>
    }

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger les objectifs"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="reload()"
      />
    } @else if (!loading() && !rows().length) {
      <gcc-empty-state
        title="Aucun objectif trouvé"
        [message]="
          hasFilters()
            ? 'Aucun résultat ne correspond aux filtres. Essayez d’élargir la recherche.'
            : 'Les objectifs apparaîtront ici dès qu’ils seront saisis dans un entretien.'
        "
        [actionLabel]="hasFilters() ? 'Réinitialiser les filtres' : ''"
        actionIcon="restart_alt"
        (action)="resetFilters()"
      />
    } @else {
      <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table mat-table [dataSource]="rows()" class="w-full" multiTemplateDataRows>
          <ng-container matColumnDef="employee">
            <th mat-header-cell *matHeaderCellDef>Salarié</th>
            <td mat-cell *matCellDef="let row">
              <div class="flex items-center gap-3.5 py-2.5">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-indigo-500 text-xs font-extrabold text-white shadow-xs shadow-accent/20"
                >
                  {{ initialsOf(row.employeeName) }}
                </span>
                <div class="min-w-0">
                  <p class="truncate text-sm font-bold leading-snug text-navy">{{ row.employeeName }}</p>
                  <p class="truncate text-[11px] font-medium text-slate-400">
                    {{ row.position || 'Poste non renseigné' }}
                    @if (row.department) {
                      · {{ row.department }}
                    }
                  </p>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="objective">
            <th mat-header-cell *matHeaderCellDef>Objectif</th>
            <td mat-cell *matCellDef="let row">
              <p class="max-w-sm text-sm font-semibold leading-snug text-navy">{{ row.description }}</p>
              @if (row.indicator) {
                <p class="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px] text-indigo-500">my_location</mat-icon>
                  {{ row.indicator }}
                </p>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="due">
            <th mat-header-cell *matHeaderCellDef>Échéance</th>
            <td mat-cell *matCellDef="let row">
              @if (!row.dueDate) {
                <span class="text-xs font-medium text-slate-400">—</span>
              } @else if (isObjectiveOverdue(row)) {
                <div class="space-y-1">
                  <p class="text-xs font-semibold tabular text-amber-800">{{ row.dueDate | date: 'dd MMM yyyy' }}</p>
                  <gcc-status-tag status="gap" label="En retard" />
                </div>
              } @else {
                <p class="text-xs font-semibold tabular text-slate-500">{{ row.dueDate | date: 'dd MMM yyyy' }}</p>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let row">
              <gcc-status-tag [status]="objectiveStatusMeta(row.status).kind" [label]="objectiveStatusMeta(row.status).label" />
            </td>
          </ng-container>

          <ng-container matColumnDef="progress">
            <th mat-header-cell *matHeaderCellDef>Avancement</th>
            <td mat-cell *matCellDef="let row">
              <div class="min-w-28">
                <div class="mb-1 flex items-center justify-between text-[11px] font-extrabold tabular text-navy">
                  <span>{{ row.completionRate }} %</span>
                </div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all"
                    [class]="progressToneClass(row.completionRate)"
                    [style.width.%]="row.completionRate"
                  ></div>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="text-right">
              <div class="flex justify-end gap-1">
                <button
                  mat-stroked-button
                  class="gcc-btn-secondary !rounded-xl !px-2.5 !py-1 !text-xs"
                  type="button"
                  (click)="toggleHistory(row); $event.stopPropagation()"
                  [attr.aria-expanded]="isHistoryOpen(row)"
                >
                  <mat-icon class="!h-4 !w-4 !text-[16px]">history</mat-icon>
                </button>
                <button
                  mat-flat-button
                  class="gcc-btn-primary !rounded-xl !px-3 !py-1.5 !text-xs shadow-xs"
                  type="button"
                  (click)="startEdit(row); $event.stopPropagation()"
                >
                  <mat-icon class="!mr-1 !h-4 !w-4 !text-[16px]">edit</mat-icon>
                  Mettre à jour
                </button>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="expanded">
            <td mat-cell *matCellDef="let row" [attr.colspan]="columns.length">
              @if (isEditing(row)) {
                <div class="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                  <div class="mb-3 flex items-center justify-between gap-2">
                    <p class="text-sm font-bold text-navy">Mettre à jour la progression</p>
                    <button type="button" class="text-xs font-bold text-slate-500 hover:text-navy" (click)="cancelPanel()">
                      Fermer
                    </button>
                  </div>
                  <div class="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_auto] lg:items-end">
                    <label class="block">
                      <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Statut</span>
                      <gcc-select
                        [options]="statusOptions"
                        [value]="editStatus()"
                        (valueChange)="onEditStatus($event)"
                        placeholder="Statut"
                      />
                    </label>
                    <div>
                      <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Réalisation · {{ editRate() }} %
                      </span>
                      <input
                        class="w-full accent-indigo-600"
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        [ngModel]="editRate()"
                        (ngModelChange)="onEditRate($event)"
                      />
                      <div class="mt-2 flex flex-wrap gap-1.5">
                        @for (preset of ratePresets; track preset) {
                          <button
                            type="button"
                            class="rounded-full border px-2 py-0.5 text-[11px] font-bold"
                            [class]="
                              editRate() === preset
                                ? 'border-navy bg-navy text-white'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                            "
                            (click)="onEditRate(preset)"
                          >
                            {{ preset }} %
                          </button>
                        }
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        mat-stroked-button
                        class="gcc-btn-secondary !rounded-xl !text-xs"
                        type="button"
                        [disabled]="saving()"
                        (click)="cancelPanel()"
                      >
                        Annuler
                      </button>
                      <button
                        mat-flat-button
                        class="gcc-btn-primary !rounded-xl !text-xs"
                        type="button"
                        [disabled]="saving()"
                        (click)="saveEdit(row)"
                      >
                        {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
                      </button>
                    </div>
                  </div>
                </div>
              } @else if (isHistoryOpen(row)) {
                <div class="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p class="text-sm font-bold text-navy">Historique de progression</p>
                    <div class="flex items-center gap-2">
                      <gcc-status-tag [status]="objectiveStatusMeta(row.status).kind" [label]="objectiveStatusMeta(row.status).label" />
                      <span class="text-xs font-extrabold tabular text-navy">{{ row.completionRate }} %</span>
                    </div>
                  </div>
                  @if (historyLoading() === objectiveRowKey(row)) {
                    <p class="text-xs font-medium text-slate-500">Chargement de l’historique…</p>
                  } @else if (!historyOf(row).length) {
                    <p class="text-sm text-slate-500">
                      Aucun changement enregistré pour le moment. Les prochaines mises à jour apparaîtront ici.
                    </p>
                  } @else {
                    <ol class="space-y-3">
                      @for (entry of historyOf(row); track $index) {
                        <li class="flex gap-3">
                          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"></span>
                          <div class="min-w-0 flex-1">
                            <p class="text-[11px] font-semibold tabular text-slate-400">
                              {{ entry.date ? (entry.date | date: 'dd MMM yyyy · HH:mm') : 'Date inconnue' }}
                            </p>
                            <div class="mt-1 flex flex-wrap items-center gap-2">
                              <gcc-status-tag
                                [status]="objectiveStatusMeta(entry.oldStatus).kind"
                                [label]="objectiveStatusMeta(entry.oldStatus).label"
                              />
                              <span class="text-[11px] font-medium text-slate-400">{{ entry.oldCompletionRate }} %</span>
                              <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400">arrow_forward</mat-icon>
                              <gcc-status-tag
                                [status]="objectiveStatusMeta(entry.newStatus).kind"
                                [label]="objectiveStatusMeta(entry.newStatus).label"
                              />
                              <span class="text-[11px] font-extrabold tabular text-navy">{{ entry.newCompletionRate }} %</span>
                            </div>
                          </div>
                        </li>
                      }
                    </ol>
                  }
                  @if (row.interviewId) {
                    <button
                      type="button"
                      class="mt-4 text-xs font-bold text-accent hover:text-indigo-700"
                      (click)="openInterview(row)"
                    >
                      Ouvrir l’entretien
                    </button>
                  }
                </div>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns" class="transition-colors hover:bg-indigo-50/30"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: ['expanded']"
            class="gcc-expand-row"
            [class.hidden]="!isPanelOpen(row)"
          ></tr>
        </table>

        <mat-paginator
          [length]="totalItems()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 20, 50, 100]"
          [disabled]="loading()"
          (page)="onPage($event)"
          showFirstLastButtons
          class="border-t border-slate-100"
        />
      </div>
    }
  `,
  styles: `
    tr.gcc-expand-row {
      height: 0;
    }
    tr.gcc-expand-row td {
      border-bottom-width: 0;
    }
  `,
})
export class ObjectivesListPage implements OnInit {
  private readonly evaluations = inject(EvaluationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly crumbs = [{ label: 'Évaluations' }, { label: 'Objectifs' }];
  readonly columns = ['employee', 'objective', 'due', 'status', 'progress', 'action'];
  readonly ratePresets = [0, 25, 50, 75, 100];
  readonly statusOptions: GccSelectOption[] = OBJECTIVE_STATUS_OPTIONS.map((item) => ({ ...item }));
  readonly statusChips: StatusChip[] = [
    { value: 'all', label: 'Tous', count: (s) => s.totalObjectives },
    { value: 'Atteint', label: 'Atteints', count: (s) => s.achievedObjectives },
    { value: 'En cours', label: 'En cours', count: (s) => s.inProgressObjectives },
    { value: 'Non commencé', label: 'Non commencés', count: (s) => s.notStartedObjectives },
    { value: 'Non atteint', label: 'Non atteints', count: (s) => s.notAchievedObjectives },
  ];

  readonly search = signal('');
  readonly department = signal<string | null>('all');
  readonly employee = signal<string | null>('all');
  readonly status = signal<string>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalItems = signal(0);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly hint = signal<string | null>(null);
  readonly rows = signal<ObjectiveSummaryRow[]>([]);
  readonly stats = signal<ObjectivesStatistics>(emptyObjectivesStats());
  readonly departmentOptions = signal<GccSelectOption[]>([{ label: 'Tous les départements', value: 'all' }]);
  readonly employeeOptions = signal<GccSelectOption[]>([{ label: 'Tous les salariés', value: 'all' }]);

  readonly panelMode = signal<'edit' | 'history' | null>(null);
  readonly panelKey = signal<string | null>(null);
  readonly editStatus = signal('Non commencé');
  readonly editRate = signal(0);
  readonly historyLoading = signal<string | null>(null);
  readonly historyCache = signal<Record<string, ObjectiveSummaryRow['progressHistory']>>({});

  readonly initialsOf = initialsOf;
  readonly objectiveStatusMeta = objectiveStatusMeta;
  readonly isObjectiveOverdue = isObjectiveOverdue;
  readonly progressToneClass = progressToneClass;
  readonly objectiveRowKey = objectiveRowKey;

  private searchPrimed = false;

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.pageIndex.set(0);
        this.reload();
      });

    effect(() => {
      const query = this.search();
      untracked(() => {
        if (!this.searchPrimed) {
          this.searchPrimed = true;
          return;
        }
        this.search$.next(query);
      });
    });
  }

  ngOnInit(): void {
    forkJoin({
      departments: this.evaluations.getInterviewDepartments(),
      employees: this.evaluations.getDirectoryEmployees(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ departments, employees }) => {
          this.departmentOptions.set([
            { label: 'Tous les départements', value: 'all' },
            ...departments.map((d) => ({ label: d.name, value: String(d.departmentId) })),
          ]);
          this.employeeOptions.set([
            { label: 'Tous les salariés', value: 'all' },
            ...employees.map((e) => ({ label: directoryEmployeeName(e), value: String(e.employeeId) })),
          ]);
        },
        error: () => undefined,
      });

    this.reload();
  }

  hasFilters(): boolean {
    return Boolean(
      this.search().trim() ||
        (this.department() && this.department() !== 'all') ||
        (this.employee() && this.employee() !== 'all') ||
        this.status() !== 'all',
    );
  }

  setStatus(value: string): void {
    this.status.set(this.status() === value ? 'all' : value);
    this.pageIndex.set(0);
    this.cancelPanel();
    this.reload();
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.cancelPanel();
    this.reload();
  }

  resetFilters(): void {
    this.search.set('');
    this.department.set('all');
    this.employee.set('all');
    this.status.set('all');
    this.pageIndex.set(0);
    this.cancelPanel();
    this.reload();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cancelPanel();
    this.loadRows();
  }

  isPanelOpen(row: ObjectiveSummaryRow): boolean {
    return this.panelKey() === objectiveRowKey(row);
  }

  isEditing(row: ObjectiveSummaryRow): boolean {
    return this.isPanelOpen(row) && this.panelMode() === 'edit';
  }

  isHistoryOpen(row: ObjectiveSummaryRow): boolean {
    return this.isPanelOpen(row) && this.panelMode() === 'history';
  }

  startEdit(row: ObjectiveSummaryRow): void {
    this.panelKey.set(objectiveRowKey(row));
    this.panelMode.set('edit');
    this.editStatus.set(row.status || 'Non commencé');
    this.editRate.set(row.completionRate || 0);
    this.hint.set(null);
  }

  toggleHistory(row: ObjectiveSummaryRow): void {
    const key = objectiveRowKey(row);
    if (this.isHistoryOpen(row)) {
      this.cancelPanel();
      return;
    }
    this.panelKey.set(key);
    this.panelMode.set('history');
    if (row.progressHistory.length) {
      this.historyCache.update((current) => ({ ...current, [key]: row.progressHistory }));
      return;
    }
    if (this.historyCache()[key]) return;
    this.historyLoading.set(key);
    this.evaluations.getObjectiveProgressHistory(row.interviewId, row.objectiveIndex).subscribe({
      next: (entries) => {
        this.historyCache.update((current) => ({ ...current, [key]: entries }));
        this.historyLoading.set(null);
      },
      error: () => this.historyLoading.set(null),
    });
  }

  historyOf(row: ObjectiveSummaryRow) {
    return this.historyCache()[objectiveRowKey(row)] ?? row.progressHistory ?? [];
  }

  onEditStatus(value: string | null): void {
    const synced = syncObjectiveProgress(
      {
        description: '',
        dueDate: '',
        indicator: '',
        status: value || 'Non commencé',
        completionRate: this.editRate(),
        lastModified: '',
        progressHistory: [],
      },
      'status',
    );
    this.editStatus.set(synced.status);
    this.editRate.set(synced.completionRate);
  }

  onEditRate(value: number): void {
    const synced = syncObjectiveProgress(
      {
        description: '',
        dueDate: '',
        indicator: '',
        status: this.editStatus(),
        completionRate: Number(value),
        lastModified: '',
        progressHistory: [],
      },
      'completionRate',
    );
    this.editStatus.set(synced.status);
    this.editRate.set(synced.completionRate);
  }

  saveEdit(row: ObjectiveSummaryRow): void {
    this.saving.set(true);
    this.hint.set(null);
    this.evaluations
      .updateObjectiveStatus(row.interviewId, {
        objectiveIndex: row.objectiveIndex,
        status: this.editStatus(),
        completionRate: this.editRate(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelPanel();
          this.reload();
        },
        error: () => {
          this.saving.set(false);
          this.hint.set('La mise à jour a échoué. Vérifiez vos droits ou réessayez.');
        },
      });
  }

  cancelPanel(): void {
    this.panelKey.set(null);
    this.panelMode.set(null);
  }

  openInterview(row: ObjectiveSummaryRow): void {
    if (!row.interviewId) return;
    void this.router.navigate(['/soft-gcc/evaluations/entretiens', row.interviewId]);
  }

  reload(): void {
    this.loadRows();
    this.loadStats();
  }

  formatPercent(value: number): string {
    return `${(Number(value) || 0).toFixed(1)} %`;
  }

  shareHint(count: number): string {
    const total = this.stats().totalObjectives;
    if (!total) return 'Aucun dossier filtré';
    return `${Math.round((count / total) * 100)} % du volume filtré`;
  }

  private loadRows(): void {
    this.loading.set(true);
    this.error.set(null);
    this.evaluations.getObjectivesSummary(this.listQuery()).subscribe({
      next: (data) => {
        this.rows.set(data.objectives ?? []);
        this.totalItems.set(data.totalCount ?? data.statistics?.totalObjectives ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Vérifiez vos droits (consultation des entretiens) ou réessayez.');
        this.loading.set(false);
      },
    });
  }

  private loadStats(): void {
    this.evaluations.getObjectivesSummary(this.statsQuery()).subscribe({
      next: (data) => this.stats.set(data.statistics ?? emptyObjectivesStats()),
      error: () => undefined,
    });
  }

  private listQuery() {
    return {
      ...this.baseQuery(),
      statusFilter: this.status() === 'all' ? undefined : this.status(),
      pageNumber: this.pageIndex() + 1,
      pageSize: this.pageSize(),
    };
  }

  private statsQuery() {
    return {
      ...this.baseQuery(),
      statusFilter: undefined,
      pageNumber: 1,
      pageSize: 1,
    };
  }

  private baseQuery() {
    const department = this.department();
    const employee = this.employee();
    return {
      searchQuery: this.search().trim() || undefined,
      departmentId: department && department !== 'all' ? Number(department) : null,
      employeeId: employee && employee !== 'all' ? Number(employee) : null,
    };
  }
}
