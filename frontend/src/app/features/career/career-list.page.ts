import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CareerPlanListFilter, CareerPlanListItem, CareerPlanListService } from '../../core/career-plan-list.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';

@Component({
  selector: 'app-career-list-page',
  imports: [
    FormsModule,
    GccPageHeader,
    GccEmptyState,
    GccSelect,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <gcc-page-header
      title="Plan de carrière"
      subtitle="Suivez les parcours professionnels de vos collaborateurs."
      icon="map"
      [crumbs]="crumbs"
      actionLabel="Nouveau plan"
      actionIcon="add"
      (action)="openCreate()"
    />

    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
        <mat-icon class="!h-4 !w-4 !text-[18px] text-slate-500">search</mat-icon>
        <span>Filtre de recherche</span>
      </div>

      <div class="grid gap-3 lg:grid-cols-5">
        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <mat-icon class="!h-5 !w-5 !text-[20px] text-slate-400">search</mat-icon>
          <input
            class="w-full border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            placeholder="Nom, prénom ou matricule"
            [(ngModel)]="filters.keyWord"
            (ngModelChange)="onFilterChange()"
          />
        </label>

        <div class="min-w-0">
          <gcc-select
            [options]="departmentOptions()"
            [value]="filters.departmentId"
            (valueChange)="onSelectFilterChange('departmentId', $event)"
            placeholder="Département"
          />
        </div>

        <div class="min-w-0">
          <gcc-select
            [options]="positionOptions()"
            [value]="filters.positionId"
            (valueChange)="onSelectFilterChange('positionId', $event)"
            placeholder="Poste"
          />
        </div>

        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <input
            type="date"
            class="w-full border-0 bg-transparent text-sm text-navy outline-none"
            [(ngModel)]="filters.dateAssignmentMin"
            (ngModelChange)="onFilterChange()"
          />
        </label>

        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <input
            type="date"
            class="w-full border-0 bg-transparent text-sm text-navy outline-none"
            [(ngModel)]="filters.dateAssignmentMax"
            (ngModelChange)="onFilterChange()"
          />
        </label>
      </div>
    </div>

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger le plan de carrière"
        [message]="error() ?? 'Une erreur est survenue.'"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement des carrières…
      </div>
    } @else if (rows().length === 0) {
      <gcc-empty-state
        title="Aucun plan de carrière trouvé"
        message="Ajustez les filtres pour afficher des résultats."
      />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h2 class="text-base font-semibold text-navy">Plan de carrière par employé</h2>
            <p class="text-xs text-slate-500">{{ totalCount() }} résultats</p>
          </div>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
            {{ totalCount() }} plan(s)
          </span>
        </div>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="rows()" class="w-full min-w-[920px]">
            <ng-container matColumnDef="registrationNumber">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Matricule</th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm font-medium text-navy">{{ row.registrationNumber || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Nom complet</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="font-semibold text-navy">{{ fullName(row) }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="departmentName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Département</th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ row.departmentName || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="positionName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Poste</th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ row.positionName || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="assignmentDate">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Date d'affectation</th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ formatDate(row.assignmentDate) }}</td>
            </ng-container>

            <ng-container matColumnDef="careerPlanNumber">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Plan de carrière</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="inline-flex min-w-[2.2rem] justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {{ row.careerPlanNumber ?? 0 }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Type</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span [class]="typeBadgeClass(row.assignmentTypeId)">{{ typeLabel(row.assignmentTypeId) }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="state">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">État</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span [class]="stateBadgeClass(row)">{{ stateLabel(row) }}</span>
                  @if (isCurrent(row)) {
                    <span class="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">Courant</span>
                  }
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]"></th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <div class="flex items-center gap-1.5">
                  @if (hasPlan(row)) {
                    <button mat-icon-button type="button" class="!h-8 !w-8" title="Modifier" (click)="$event.stopPropagation(); openEdit(row)">
                      <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">edit</mat-icon>
                    </button>
                    <button mat-icon-button type="button" class="!h-8 !w-8" title="Voir le détail" (click)="$event.stopPropagation(); openDetail(row)">
                      <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-500">visibility</mat-icon>
                    </button>
                  }
                  <button mat-stroked-button type="button" class="gcc-btn-secondary !rounded-xl" (click)="openProfile(row)">
                    <mat-icon class="!mr-1.5 !text-[18px]">route</mat-icon>
                    Voir carrière
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayColumns;" class="cursor-pointer transition-colors hover:bg-slate-50" (click)="openProfile(row)"></tr>
          </table>
        </div>

        <mat-paginator
          [length]="totalCount()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[5, 10, 25]"
          showFirstLastButtons
          (page)="onPageChange($event)"
        />
      </div>
    }
  `,
})
export class CareerListPage {
  private readonly router = inject(Router);
  private readonly service = inject(CareerPlanListService);
  private readonly filterDebouncer = new Subject<void>();

  readonly crumbs = [
    { label: 'Accueil' },
    { label: 'Carrières' },
    { label: 'Liste' },
  ];

  readonly displayColumns = [
    'registrationNumber',
    'fullName',
    'departmentName',
    'positionName',
    'assignmentDate',
    'careerPlanNumber',
    'type',
    'state',
    'actions',
  ];

  readonly rows = signal<CareerPlanListItem[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = 10;
  readonly departmentOptions = signal<{ label: string; value: string }[]>([]);
  readonly positionOptions = signal<{ label: string; value: string }[]>([]);
  readonly filters = {
    keyWord: '',
    departmentId: '',
    positionId: '',
    dateAssignmentMin: '',
    dateAssignmentMax: '',
  };

  constructor() {
    this.filterDebouncer
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => {
        this.pageIndex.set(0);
        void this.loadPage();
      });

    void this.initLookups();
  }

  ngOnInit(): void {
    void this.loadPage();
  }

  async initLookups(): Promise<void> {
    try {
      const [departments, positions] = await Promise.all([
        this.service.loadDepartments(),
        this.service.loadPositions(),
      ]);

      this.departmentOptions.set([
        { label: 'Tous les départements', value: '' },
        ...departments.map((item) => ({ label: item.name, value: String(item.departmentId) })),
      ]);

      this.positionOptions.set([
        { label: 'Tous les postes', value: '' },
        ...positions.map((item) => ({ label: item.positionName, value: String(item.positionId) })),
      ]);
    } catch {
      this.departmentOptions.set([{ label: 'Tous les départements', value: '' }]);
      this.positionOptions.set([{ label: 'Tous les postes', value: '' }]);
    }
  }

  onFilterChange(): void {
    this.filterDebouncer.next();
  }

  onSelectFilterChange(field: string, value: string | null): void {
    (this.filters as Record<string, any>)[field] = value ?? '';
    this.onFilterChange();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await this.service.list(this.filters, this.pageIndex() + 1, this.pageSize);
      this.rows.set(result.data);
      this.totalCount.set(result.totalCount);
      void this.enrichRows();
    } catch {
      this.rows.set([]);
      this.totalCount.set(0);
      this.error.set('Erreur lors de la récupération des données.');
    } finally {
      this.loading.set(false);
    }
  }

  /** UX-01/02 : enrichit chaque ligne avec le dernier plan actif (id, type, état) pour les actions et badges. */
  private async enrichRows(): Promise<void> {
    const rows = this.rows();
    if (rows.length === 0) return;
    try {
      const enriched = await Promise.all(
        rows.map(async (row) => {
          const plan = row.registrationNumber ? await this.service.getLastCareerPlan(row.registrationNumber) : null;
          return {
            ...row,
            careerPlanId: plan?.['careerPlanId'] != null ? Number(plan['careerPlanId']) : null,
            assignmentTypeId: plan?.['assignmentTypeId'] != null ? Number(plan['assignmentTypeId']) : null,
            state: plan?.['state'] != null ? Number(plan['state']) : null,
            endingContract: plan?.['endingContract'] ?? null,
          };
        }),
      );
      this.rows.set(enriched);
    } catch {
      // On garde les lignes brutes si l'enrichissement échoue.
    }
  }

  fullName(row: CareerPlanListItem): string {
    const segments = [row.name, row.firstName].filter(Boolean);
    return segments.join(' ').trim() || row.registrationNumber || 'Employé';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  openProfile(row: CareerPlanListItem): void {
    if (!row.registrationNumber) {
      return;
    }
    void this.router.navigate(['/soft-gcc/employes/fiche', row.registrationNumber], {
      queryParams: { espace: 'carrieres' },
    });
  }

  hasPlan(row: CareerPlanListItem): boolean {
    return Number(row['careerPlanId']) > 0;
  }

  openEdit(row: CareerPlanListItem): void {
    const id = Number(row['careerPlanId']);
    if (!id) return;
    void this.router.navigate(['/soft-gcc/carrieres/fiche/modifier', id]);
  }

  openDetail(row: CareerPlanListItem): void {
    const id = Number(row['careerPlanId']);
    if (!id) return;
    void this.router.navigate(['/soft-gcc/carrieres/fiche/detail', id]);
  }

  typeLabel(id: number | null): string {
    switch (id) {
      case 1:
        return 'Nomination';
      case 2:
        return 'Disponibilité';
      case 3:
        return 'Avancement';
      default:
        return '—';
    }
  }

  typeBadgeClass(id: number | null): string {
    switch (id) {
      case 1:
        return 'inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800';
      case 2:
        return 'inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-800';
      case 3:
        return 'inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800';
      default:
        return 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600';
    }
  }

  stateLabel(row: CareerPlanListItem): string {
    const state = Number(row['state']);
    if (!Number.isFinite(state) || state == null) return '—';
    if (state <= 0) return 'Archivé';
    return row['endingContract'] ? 'Clôturé' : 'Actif';
  }

  stateBadgeClass(row: CareerPlanListItem): string {
    const state = Number(row['state']);
    if (state <= 0 || row['endingContract']) {
      return 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600';
    }
    return 'inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800';
  }

  /** UX-02-bis : le plan courant = actif (state > 0) sans date de fin. */
  isCurrent(row: CareerPlanListItem): boolean {
    return Number(row['state']) > 0 && !row['endingContract'];
  }

  openCreate(): void {
    void this.router.navigate(['/soft-gcc/carrieres/creation']);
  }
}
