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
  EmployeeNotationRow,
  employeeFullName,
  initialsOf,
  notationStatus,
  NotationStatistics,
  NotationStatusKey,
} from './evaluation.models';
import { EvaluationService } from './evaluation.service';

@Component({
  selector: 'app-notation-list-page',
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
      title="Notation d’évaluation"
      subtitle="Superviser les évaluations des salariés, attribuer les notes de compétences et valider les rapports."
      icon="fact_check"
      [crumbs]="crumbs"
    />

    <!-- Executive Summary KPIs Grid -->
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <gcc-kpi-card
        label="Évaluations enregistrées"
        [value]="totalItems().toString()"
        hint="Dossiers issus du portail"
        tone="neutral"
        icon="assignment"
      />
      <gcc-kpi-card
        label="À noter"
        [value]="statsToGrade().toString()"
        hint="En attente de notation expert"
        tone="down"
        icon="edit_note"
      />
      <gcc-kpi-card
        label="Validées expert"
        [value]="statsExpert().toString()"
        hint="Attente signature hiérarchique"
        tone="accent"
        icon="verified_user"
      />
      <gcc-kpi-card
        label="Totalement validées"
        [value]="statsValidated().toString()"
        hint="Rapports signés & archivés"
        tone="up"
        icon="task_alt"
      />
    </div>

    <!-- Filter Bar -->
    <gcc-filter-bar
      placeholder="Rechercher par nom, prénom ou poste…"
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
      <gcc-select
        class="w-full shrink-0 lg:w-48"
        [options]="statusOptions"
        [(value)]="status"
        placeholder="Tous les statuts"
      />
    </gcc-filter-bar>

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger la liste"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="load()"
      />
    } @else if (!loading() && !rows().length) {
      <gcc-empty-state
        title="Aucune évaluation trouvée"
        message="Aucun salarié ne correspond aux critères sélectionnés ou aucune évaluation n'a été soumise."
        actionLabel="Réinitialiser les filtres"
        actionIcon="restart_alt"
        (action)="resetFilters()"
      />
    } @else {
      <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table mat-table [dataSource]="rows()" matSort (matSortChange)="onSort($event)" matSortDisableClear class="w-full">
          <!-- Employee Column -->
          <ng-container matColumnDef="employee">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="name">Employé</th>
            <td mat-cell *matCellDef="let row">
              <div class="flex items-center gap-3.5 py-2.5">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-indigo-500 text-xs font-extrabold text-white shadow-xs shadow-accent/20"
                >
                  {{ initialsOf(employeeFullName(row)) }}
                </span>
                <div>
                  <p class="font-bold text-navy text-sm leading-snug">{{ employeeFullName(row) }}</p>
                  <p class="text-[11px] text-slate-400 font-medium">ID #{{ row.employeeId }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Position Column -->
          <ng-container matColumnDef="position">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="position">Poste</th>
            <td mat-cell *matCellDef="let row" class="text-sm font-medium text-slate-700">
              {{ row.position || '—' }}
            </td>
          </ng-container>

          <!-- Department Column -->
          <ng-container matColumnDef="department">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="department">Département</th>
            <td mat-cell *matCellDef="let row">
              <span class="inline-flex items-center rounded-lg bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {{ row.department || '—' }}
              </span>
            </td>
          </ng-container>

          <!-- Type Column -->
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type d'évaluation</th>
            <td mat-cell *matCellDef="let row" class="text-xs font-medium text-slate-600">
              <span class="inline-flex items-center gap-1.5 text-slate-700">
                <mat-icon class="!h-4 !w-4 !text-[16px] text-indigo-500">assignment_turned_in</mat-icon>
                {{ row.evaluationType || 'Évaluation globale' }}
              </span>
            </td>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="evaluationDate">Date Soumission</th>
            <td mat-cell *matCellDef="let row" class="tabular text-xs font-semibold text-slate-500">
              {{ row.evaluationDate ? (row.evaluationDate | date: 'dd MMM yyyy') : '—' }}
            </td>
          </ng-container>

          <!-- Score Column -->
          <ng-container matColumnDef="score">
            <th mat-header-cell *matHeaderCellDef>Note finale</th>
            <td mat-cell *matCellDef="let row">
              @if (row.overallScore != null) {
                <span
                  class="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold tabular"
                  [class]="scoreBadgeClass(row.overallScore)"
                >
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">star</mat-icon>
                  {{ row.overallScore.toFixed(1) }} / 5
                </span>
              } @else {
                <span class="text-xs text-slate-400 font-medium">—</span>
              }
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let row">
              <gcc-status-tag [status]="notationStatus(row).kind" [label]="notationStatus(row).label" />
            </td>
          </ng-container>

          <!-- Action Column -->
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="text-right">
              @if (!row.evaluationId) {
                <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !text-xs" type="button" disabled>
                  Non démarrée
                </button>
              } @else {
                <button
                  mat-flat-button
                  [class]="isValidated(row) ? 'gcc-btn-secondary !rounded-xl !text-xs !py-1.5' : 'gcc-btn-primary !rounded-xl !text-xs !py-1.5 shadow-xs hover:shadow-md'"
                  type="button"
                  (click)="openNotation(row)"
                >
                  <mat-icon class="!mr-1.5 !h-4 !w-4 !text-[16px]">{{ isValidated(row) ? 'visibility' : 'rate_review' }}</mat-icon>
                  {{ isValidated(row) ? 'Consulter' : 'Saisir les notes' }}
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns" class="transition-colors hover:bg-indigo-50/30"></tr>
        </table>

        <mat-paginator
          [length]="totalItems()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 20, 50]"
          [disabled]="loading()"
          (page)="onPage($event)"
          class="border-t border-slate-100"
        />
      </div>
    }
  `,
})
export class NotationListPage implements OnInit {
  private readonly evaluations = inject(EvaluationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly crumbs = [{ label: 'Évaluations' }, { label: 'Notation' }];
  readonly columns = ['employee', 'position', 'department', 'type', 'date', 'score', 'status', 'action'];
  readonly statusOptions: GccSelectOption[] = [
    { label: 'Tous les statuts', value: 'all' },
    { label: 'À noter', value: 'toGrade' },
    { label: 'Validé expert', value: 'expert' },
    { label: 'Validé', value: 'validated' },
    { label: 'Aucune évaluation', value: 'none' },
  ];

  readonly search = signal('');
  readonly position = signal<string | null>('all');
  readonly department = signal<string | null>('all');
  readonly status = signal<string | null>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = signal(0);
  readonly sortBy = signal<string | null>('name');
  readonly sortDirection = signal<string | null>('ascending');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly allRows = signal<EmployeeNotationRow[]>([]);
  readonly positionOptions = signal<GccSelectOption[]>([{ label: 'Tous les postes', value: 'all' }]);
  readonly departmentOptions = signal<GccSelectOption[]>([{ label: 'Tous les départements', value: 'all' }]);
  readonly stats = signal<NotationStatistics>({ totalCount: 0, noneCount: 0, toGradeCount: 0, expertCount: 0, validatedCount: 0 });

  readonly rows = computed(() => {
    const key = (this.status() ?? 'all') as NotationStatusKey | 'all';
    if (key === 'all') return this.allRows();
    return this.allRows().filter((row) => notationStatus(row).key === key);
  });

  readonly statsToGrade = computed(() => this.stats().toGradeCount);
  readonly statsExpert = computed(() => this.stats().expertCount);
  readonly statsValidated = computed(() => this.stats().validatedCount);

  readonly totalItems = computed(() => {
    const fromStats = this.stats().totalCount;
    if (fromStats > 0) return fromStats;
    const pages = this.totalPages();
    const size = this.pageSize();
    const index = this.pageIndex();
    const count = this.allRows().length;
    if (pages <= 0) return count;
    if (index >= pages - 1) return Math.max((pages - 1) * size + count, count);
    return pages * size;
  });

  readonly employeeFullName = employeeFullName;
  readonly initialsOf = initialsOf;
  readonly notationStatus = notationStatus;

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
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.load();
  }

  resetFilters(): void {
    this.search.set('');
    this.position.set('all');
    this.department.set('all');
    this.status.set('all');
    this.pageIndex.set(0);
    this.load();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onSort(sort: Sort): void {
    this.sortBy.set(sort.active || 'name');
    this.sortDirection.set(sort.direction === 'desc' ? 'descending' : 'ascending');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadStats();
    const position = this.position();
    const department = this.department();

    this.evaluations
      .getEmployeesToGrade({
        pageNumber: this.pageIndex() + 1,
        pageSize: this.pageSize(),
        search: this.search().trim() || undefined,
        position: position && position !== 'all' ? Number(position) : null,
        department: department && department !== 'all' ? Number(department) : null,
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection(),
      })
      .subscribe({
        next: (data) => {
          this.allRows.set(data.employees ?? []);
          this.totalPages.set(data.totalPages ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Vérifiez vos droits (liste employés / évaluations) ou réessayez.');
          this.loading.set(false);
        },
      });
  }

  private loadStats(): void {
    const position = this.position();
    const department = this.department();
    this.evaluations
      .getNotationStatistics({
        search: this.search().trim() || undefined,
        position: position && position !== 'all' ? Number(position) : null,
        department: department && department !== 'all' ? Number(department) : null,
      })
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => undefined,
      });
  }

  isValidated(row: EmployeeNotationRow): boolean {
    return notationStatus(row).key === 'validated';
  }

  scoreBadgeClass(score: number): string {
    if (score >= 4.0) return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
    if (score >= 3.0) return 'bg-indigo-50 text-indigo-700 border border-indigo-200/80';
    return 'bg-amber-50 text-amber-700 border border-amber-200/80';
  }

  openNotation(row: EmployeeNotationRow): void {
    if (!row.evaluationId) return;
    void this.router.navigate(['/soft-gcc/evaluations/notation', row.evaluationId], {
      queryParams: this.isValidated(row) ? { view: '1' } : undefined,
    });
  }
}
