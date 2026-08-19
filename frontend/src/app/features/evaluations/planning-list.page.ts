import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
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
  initialsOf,
  plannedEmployeeName,
  PlannedEvaluation,
  planningEmployeeName,
  PlanningEmployee,
} from './evaluation.models';
import { EvaluationService } from './evaluation.service';
import { PlanningSessionService } from './planning-session.service';

type PlanningView = 'eligible' | 'planned';

@Component({
  selector: 'app-planning-list-page',
  imports: [
    DatePipe,
    GccPageHeader,
    GccFilterBar,
    GccSelect,
    GccKpiCard,
    GccStatusTag,
    GccEmptyState,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <gcc-page-header
      title="Planification d’évaluations"
      subtitle="Composez une campagne : sélectionnez les salariés, puis définissez le type, les superviseurs et le questionnaire."
      icon="event_available"
      [crumbs]="crumbs"
      [actionLabel]="headerActionLabel()"
      actionIcon="auto_awesome"
      (action)="startCampaign()"
    />

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <gcc-kpi-card
        label="Salariés éligibles"
        [value]="eligibleTotal().toString()"
        hint="Sans évaluation en cours"
        tone="neutral"
        icon="groups"
      />
      <gcc-kpi-card
        label="Équipe de campagne"
        [value]="selectedCount().toString()"
        hint="Salariés retenus pour cette session"
        tone="accent"
        icon="how_to_reg"
      />
      <gcc-kpi-card
        label="Campagnes en cours"
        [value]="plannedTotal().toString()"
        hint="Évaluations à l’état planifié"
        tone="down"
        icon="calendar_month"
      />
      <gcc-kpi-card
        label="Rappels automatiques"
        [value]="session.remindersEnabled() ? 'Activés' : 'Désactivés'"
        hint="Notifications pendant la période"
        [tone]="session.remindersEnabled() ? 'up' : 'neutral'"
        icon="notifications_active"
      />
    </div>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs">
        <button
          type="button"
          class="rounded-xl px-3.5 py-2 text-xs font-bold transition"
          [class]="view() === 'eligible' ? 'bg-navy text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'"
          (click)="setView('eligible')"
        >
          À planifier
        </button>
        <button
          type="button"
          class="rounded-xl px-3.5 py-2 text-xs font-bold transition"
          [class]="view() === 'planned' ? 'bg-navy text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'"
          (click)="setView('planned')"
        >
          Campagnes en cours
        </button>
      </div>

      @if (view() === 'eligible') {
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition"
          [class]="
            session.remindersEnabled()
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          "
          (click)="session.remindersEnabled.set(!session.remindersEnabled())"
        >
          <mat-icon class="!h-4 !w-4 !text-[16px]">
            {{ session.remindersEnabled() ? 'notifications_active' : 'notifications_off' }}
          </mat-icon>
          Rappels {{ session.remindersEnabled() ? 'activés' : 'désactivés' }}
        </button>
      }
    </div>

    <gcc-filter-bar
      placeholder="Rechercher un salarié, un poste ou un département…"
      [(query)]="search"
      (apply)="applyFilters()"
      (reset)="resetFilters()"
    >
      <gcc-select
        class="w-full shrink-0 lg:w-52"
        [options]="positionOptions()"
        [(value)]="position"
        placeholder="Tous les postes"
      />
      <gcc-select
        class="w-full shrink-0 lg:w-52"
        [options]="departmentOptions()"
        [(value)]="department"
        placeholder="Tous les départements"
      />
    </gcc-filter-bar>

    @if (hint()) {
      <div class="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
        <mat-icon class="!h-5 !w-5 !text-[20px] text-amber-600">info</mat-icon>
        <span>{{ hint() }}</span>
      </div>
    }

    @if (view() === 'eligible' && selectedCount()) {
      <div class="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <mat-icon class="!h-5 !w-5 !text-[20px] text-accent">group_add</mat-icon>
            <p class="text-sm font-bold text-navy">Équipe de la campagne</p>
            <span class="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-indigo-700">
              {{ selectedCount() }}
            </span>
          </div>
          <button type="button" class="text-xs font-bold text-slate-500 hover:text-navy" (click)="clearSelection()">
            Vider la sélection
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          @for (employee of session.employees(); track employee.employeeId) {
            <span class="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white py-1 pl-1 pr-2 text-xs font-semibold text-navy">
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-indigo-500 text-[9px] font-extrabold text-white"
              >
                {{ initialsOf(planningEmployeeName(employee)) }}
              </span>
              {{ planningEmployeeName(employee) }}
              <button type="button" class="ml-0.5 text-slate-400 hover:text-red-600" (click)="session.remove(employee.employeeId)">
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">close</mat-icon>
              </button>
            </span>
          }
        </div>
      </div>
    }

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger les données"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="load()"
      />
    } @else if (view() === 'eligible' && !loading() && !rows().length) {
      <gcc-empty-state
        title="Aucun salarié à planifier"
        message="Tous les salariés correspondant aux filtres ont déjà une évaluation, ou aucun profil n’a été trouvé."
        actionLabel="Réinitialiser les filtres"
        actionIcon="restart_alt"
        (action)="resetFilters()"
      />
    } @else if (view() === 'planned' && !loading() && !plannedRows().length) {
      <gcc-empty-state
        title="Aucune campagne en cours"
        message="Les évaluations planifiées apparaîtront ici. Vous pourrez les suivre ou les annuler tant qu’elles n’ont pas démarré."
        actionLabel="Planifier une campagne"
        actionIcon="event_available"
        (action)="setView('eligible')"
      />
    } @else if (view() === 'eligible') {
      <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table mat-table [dataSource]="rows()" matSort (matSortChange)="onSort($event)" matSortDisableClear class="w-full">
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <button
                type="button"
                class="flex h-5 w-5 items-center justify-center rounded-md border transition"
                [class]="allPageSelected() ? 'border-accent bg-accent text-white' : 'border-slate-300 bg-white text-transparent'"
                (click)="togglePage()"
                [attr.aria-pressed]="allPageSelected()"
                aria-label="Sélectionner la page"
              >
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">check</mat-icon>
              </button>
            </th>
            <td mat-cell *matCellDef="let row">
              <button
                type="button"
                class="flex h-5 w-5 items-center justify-center rounded-md border transition"
                [class]="isSelected(row) ? 'border-accent bg-accent text-white' : 'border-slate-300 bg-white text-transparent hover:border-accent'"
                (click)="session.toggle(row); $event.stopPropagation()"
                [attr.aria-pressed]="isSelected(row)"
                [attr.aria-label]="'Sélectionner ' + planningEmployeeName(row)"
              >
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">check</mat-icon>
              </button>
            </td>
          </ng-container>

          <ng-container matColumnDef="employee">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="name">Salarié</th>
            <td mat-cell *matCellDef="let row">
              <div class="flex items-center gap-3.5 py-2.5">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-indigo-500 text-xs font-extrabold text-white shadow-xs shadow-accent/20"
                >
                  {{ initialsOf(planningEmployeeName(row)) }}
                </span>
                <div>
                  <p class="text-sm font-bold leading-snug text-navy">{{ planningEmployeeName(row) }}</p>
                  <p class="text-[11px] font-medium text-slate-400">ID #{{ row.employeeId }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="position">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="position">Poste</th>
            <td mat-cell *matCellDef="let row" class="text-sm font-medium text-slate-700">
              {{ row.position || '—' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="department">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="department">Département</th>
            <td mat-cell *matCellDef="let row" class="text-sm font-medium text-slate-700">
              {{ row.department || '—' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Disponibilité</th>
            <td mat-cell *matCellDef="let row">
              @if (isSelected(row)) {
                <gcc-status-tag status="processed" label="Retenu" />
              } @else {
                <gcc-status-tag status="pending" label="Disponible" />
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="eligibleColumns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: eligibleColumns"
            class="cursor-pointer transition hover:bg-slate-50"
            [class.bg-indigo-50/50]="isSelected(row)"
            (click)="session.toggle(row)"
          ></tr>
        </table>
        <mat-paginator
          [length]="eligibleTotal()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 20, 50]"
          (page)="onPage($event)"
          showFirstLastButtons
        />
      </div>
    } @else {
      <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table mat-table [dataSource]="plannedRows()" matSort (matSortChange)="onSort($event)" matSortDisableClear class="w-full">
          <ng-container matColumnDef="employee">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="employeeLastName">Salarié</th>
            <td mat-cell *matCellDef="let row">
              <div class="flex items-center gap-3.5 py-2.5">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-700 to-navy text-xs font-extrabold text-white"
                >
                  {{ initialsOf(plannedEmployeeName(row)) }}
                </span>
                <div>
                  <p class="text-sm font-bold leading-snug text-navy">{{ plannedEmployeeName(row) }}</p>
                  <p class="text-[11px] font-medium text-slate-400">{{ row.departmentName || '—' }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="evaluationTypeName">Type</th>
            <td mat-cell *matCellDef="let row" class="text-sm font-semibold text-slate-700">
              {{ row.evaluationTypeName || '—' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="window">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="startDate">Période</th>
            <td mat-cell *matCellDef="let row" class="text-sm text-slate-600">
              {{ row.startDate | date: 'dd MMM yyyy' }} → {{ row.endDate | date: 'dd MMM yyyy' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let row">
              <gcc-status-tag status="pending" label="Planifiée" />
            </td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              @if (cancelTarget()?.evaluationId === row.evaluationId) {
                <div class="flex flex-wrap items-center justify-end gap-2">
                  <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !text-xs" type="button" (click)="cancelTarget.set(null)">
                    Non
                  </button>
                  <button
                    mat-flat-button
                    class="!rounded-xl !bg-red-600 !text-xs !text-white"
                    type="button"
                    [disabled]="cancelling()"
                    (click)="confirmCancel()"
                  >
                    {{ cancelling() ? 'Annulation…' : 'Confirmer' }}
                  </button>
                </div>
              } @else {
                <div class="flex justify-end">
                  <button
                    mat-stroked-button
                    class="gcc-btn-secondary !rounded-xl !text-xs !py-1.5"
                    type="button"
                    (click)="askCancel(row); $event.stopPropagation()"
                  >
                    <mat-icon class="!mr-1.5 !h-4 !w-4 !text-[16px]">cancel</mat-icon>
                    Annuler
                  </button>
                </div>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="plannedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: plannedColumns"></tr>
        </table>
        <mat-paginator
          [length]="plannedTotal()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 20, 50]"
          (page)="onPage($event)"
          showFirstLastButtons
        />
      </div>
    }
  `,
})
export class PlanningListPage implements OnInit {
  private readonly evaluations = inject(EvaluationService);
  readonly session = inject(PlanningSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly crumbs = [{ label: 'Évaluations' }, { label: 'Planification' }];
  readonly eligibleColumns = ['select', 'employee', 'position', 'department', 'status'];
  readonly plannedColumns = ['employee', 'type', 'window', 'status', 'action'];

  readonly view = signal<PlanningView>('eligible');
  readonly search = signal('');
  readonly position = signal<string | null>('all');
  readonly department = signal<string | null>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly eligibleTotal = signal(0);
  readonly plannedTotal = signal(0);
  readonly sortBy = signal<string | null>('name');
  readonly sortDirection = signal<string | null>('ascending');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hint = signal<string | null>(null);
  readonly rows = signal<PlanningEmployee[]>([]);
  readonly plannedRows = signal<PlannedEvaluation[]>([]);
  readonly positionOptions = signal<GccSelectOption[]>([{ label: 'Tous les postes', value: 'all' }]);
  readonly departmentOptions = signal<GccSelectOption[]>([{ label: 'Tous les départements', value: 'all' }]);
  readonly cancelTarget = signal<PlannedEvaluation | null>(null);
  readonly cancelling = signal(false);

  readonly selectedCount = computed(() => this.session.employees().length);
  readonly headerActionLabel = computed(() =>
    this.view() === 'eligible' && this.selectedCount()
      ? `Composer la campagne (${this.selectedCount()})`
      : '',
  );


  readonly planningEmployeeName = planningEmployeeName;
  readonly plannedEmployeeName = plannedEmployeeName;
  readonly initialsOf = initialsOf;

  private searchPrimed = false;

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.pageIndex.set(0);
        this.load();
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
      positions: this.evaluations.getPositions(),
      departments: this.evaluations.getDepartments(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ positions, departments }) => {
          this.positionOptions.set([
            { label: 'Tous les postes', value: 'all' },
            ...positions.map((p) => ({ label: p.positionName, value: String(p.positionId) })),
          ]);
          this.departmentOptions.set([
            { label: 'Tous les départements', value: 'all' },
            ...departments.map((d) => ({ label: d.name, value: String(d.departmentId) })),
          ]);
        },
        error: () => undefined,
      });

    this.load();
    this.loadPlannedCount();
  }

  setView(view: PlanningView): void {
    if (this.view() === view) return;
    this.view.set(view);
    this.pageIndex.set(0);
    this.sortBy.set(view === 'planned' ? 'startDate' : 'name');
    this.cancelTarget.set(null);
    this.hint.set(null);
    this.load();
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.load();
  }

  resetFilters(): void {
    this.search.set('');
    this.position.set('all');
    this.department.set('all');
    this.pageIndex.set(0);
    this.load();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onSort(sort: Sort): void {
    this.sortBy.set(sort.active || (this.view() === 'planned' ? 'startDate' : 'name'));
    this.sortDirection.set(sort.direction === 'desc' ? 'descending' : 'ascending');
    this.load();
  }

  isSelected(row: PlanningEmployee): boolean {
    return this.session.has(row.employeeId);
  }

  allPageSelected(): boolean {
    const rows = this.rows();
    return rows.length > 0 && rows.every((row) => this.session.has(row.employeeId));
  }

  togglePage(): void {
    if (this.allPageSelected()) {
      this.session.removeMany(this.rows().map((row) => row.employeeId));
      return;
    }
    this.session.addMany(this.rows());
  }

  clearSelection(): void {
    this.session.setTeam([]);
  }

  startCampaign(): void {
    if (!this.selectedCount()) {
      this.hint.set('Sélectionnez au moins un salarié pour composer une campagne.');
      return;
    }
    this.hint.set(null);
    void this.router.navigate(['/soft-gcc/evaluations/planning/campagne']);
  }

  askCancel(row: PlannedEvaluation): void {
    this.cancelTarget.set(row);
  }

  confirmCancel(): void {
    const target = this.cancelTarget();
    if (!target) return;
    this.cancelling.set(true);
    this.evaluations.cancelEvaluation(target.evaluationId).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.cancelTarget.set(null);
        this.load();
        this.loadPlannedCount();
      },
      error: () => {
        this.cancelling.set(false);
        this.error.set('L’annulation a échoué. Seules les évaluations encore planifiées peuvent être annulées.');
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const query = {
      pageNumber: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      search: this.search().trim() || undefined,
      position: this.numericFilter(this.position()),
      department: this.numericFilter(this.department()),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    if (this.view() === 'planned') {
      this.evaluations.getPlannedEvaluations(query).subscribe({
        next: (data) => {
          const planned = this.evaluations.unwrapPlannedEvaluations(data);
          this.plannedRows.set(planned);
          this.plannedTotal.set(this.estimateTotal(data.totalPages ?? data.TotalPages ?? 0, planned.length));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les campagnes planifiées.');
          this.loading.set(false);
        },
      });
      return;
    }

    this.evaluations.getEmployeesWithoutEvaluations(query).subscribe({
      next: (data) => {
        const employees = this.evaluations.unwrapPlanningEmployees(data);
        this.rows.set(employees);
        this.eligibleTotal.set(this.estimateTotal(data.totalPages ?? data.TotalPages ?? 0, employees.length));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Vérifiez vos droits (planification d’évaluations) ou réessayez.');
        this.loading.set(false);
      },
    });
  }

  private loadPlannedCount(): void {
    this.evaluations
      .getPlannedEvaluations({ pageNumber: 1, pageSize: 1 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.plannedTotal.set(data.totalPages ?? data.TotalPages ?? 0),
        error: () => undefined,
      });
  }

  private numericFilter(value: string | null): number | null {
    return value && value !== 'all' ? Number(value) : null;
  }

  private estimateTotal(pages: number, count: number): number {
    const size = this.pageSize();
    const index = this.pageIndex();
    if (pages <= 0) return count;
    if (index >= pages - 1) return Math.max((pages - 1) * size + count, count);
    return pages * size;
  }
}
