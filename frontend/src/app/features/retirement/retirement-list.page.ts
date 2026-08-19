import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import { RetirementFilter, RetirementItem, RetirementParameter, RetirementService } from '../../core/retirement.service';

@Component({
  selector: 'app-retirement-list-page',
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
      title="Départ à la retraite"
      subtitle="Anticipez et planifiez les départs en retraite."
      icon="calendar_today"
      [crumbs]="crumbs"
      actionLabel="Paramètres"
      actionIcon="settings"
      (action)="openParameters()"
    />

    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
        <mat-icon class="!h-4 !w-4 !text-[18px] text-slate-500">search</mat-icon>
        <span>Filtre de recherche</span>
      </div>

      <div class="grid gap-3 lg:grid-cols-6">
        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <mat-icon class="!h-5 !w-5 !text-[20px] text-slate-400">search</mat-icon>
          <input
            class="w-full border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            placeholder="Nom, prénom ou matricule"
            [(ngModel)]="filters.keyWord"
            (ngModelChange)="onFilterChange()"
          />
        </label>

        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <input
            class="w-full border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            placeholder="Ex : 24 ou 20-50"
            [(ngModel)]="filters.age"
            (ngModelChange)="onFilterChange()"
          />
        </label>

        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <input
            class="w-full border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            placeholder="Ex : 2024 ou 2030-2040"
            [(ngModel)]="filters.year"
            (ngModelChange)="onFilterChange()"
          />
        </label>

        <div class="min-w-0">
          <gcc-select [options]="civiliteOptions()" [(value)]="filters.civiliteId" placeholder="Civilité" />
        </div>

        <div class="min-w-0">
          <gcc-select [options]="departmentOptions()" [(value)]="filters.departmentId" placeholder="Département" />
        </div>

        <div class="min-w-0">
          <gcc-select [options]="positionOptions()" [(value)]="filters.positionId" placeholder="Poste" />
        </div>
      </div>
    </div>

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger les départs à la retraite"
        [message]="error() ?? 'Une erreur est survenue.'"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement des départs…
      </div>
    } @else if (rows().length === 0) {
      <gcc-empty-state
        title="Aucun départ à la retraite trouvé"
        message="Ajustez les filtres pour afficher des résultats."
      />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h2 class="text-base font-semibold text-navy">Liste des départs prévus</h2>
            <p class="text-xs text-slate-500">{{ totalCount() }} résultat(s)</p>
          </div>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
            {{ totalCount() }} employé(s)
          </span>
        </div>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="sortedRows()" class="w-full min-w-[980px]">
            <ng-container matColumnDef="civiliteName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('civiliteName')">
                  Civilité
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('civiliteName') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ row.civiliteName || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('name')">
                  Nom complet
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('name') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="font-semibold text-navy">{{ fullName(row) }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="registrationNumber">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('registrationNumber')">
                  Matricule
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('registrationNumber') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm font-medium text-navy">{{ row.registrationNumber || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="departmentName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('departmentName')">
                  Département
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('departmentName') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ row.departmentName || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="positionName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('positionName')">
                  Poste
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('positionName') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ row.positionName || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="age">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('age')">
                  Âge
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('age') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="inline-flex min-w-[2.5rem] justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {{ row.age ?? '—' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="dateDepart">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('dateDepart')">
                  Départ à la retraite
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('dateDepart') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm font-medium text-indigo-700">
                {{ formatDate(row.dateDepart) }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayColumns;" class="transition-colors hover:bg-slate-50"></tr>
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

    @if (parameterModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]">
        <div class="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-navy">Paramètres de retraite</h3>
              <p class="text-sm text-slate-500">Règles d’anticipation par sexe</p>
            </div>
            <button mat-icon-button type="button" (click)="closeParameters()" aria-label="Fermer">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Âge femme</span>
              <input
                type="number"
                min="0"
                class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-navy outline-none transition focus:border-accent focus:bg-white"
                [(ngModel)]="parameterForm().womanAge"
              />
            </label>

            <label class="block">
              <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Âge homme</span>
              <input
                type="number"
                min="0"
                class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-navy outline-none transition focus:border-accent focus:bg-white"
                [(ngModel)]="parameterForm().manAge"
              />
            </label>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button mat-stroked-button type="button" class="gcc-btn-secondary !rounded-xl" (click)="closeParameters()">
              Annuler
            </button>
            <button mat-flat-button type="button" class="gcc-btn-primary !rounded-xl" (click)="saveParameters()">
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class RetirementListPage {
  private readonly service = inject(RetirementService);
  private readonly filterDebouncer = new Subject<void>();

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Retraite' }, { label: 'Liste' }];
  readonly displayColumns = ['civiliteName', 'name', 'registrationNumber', 'departmentName', 'positionName', 'age', 'dateDepart'];
  readonly pageSize = 10;

  readonly rows = signal<RetirementItem[]>([]);
  readonly sortedRows = signal<RetirementItem[]>([]);
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly civiliteOptions = signal<GccSelectOption[]>([]);
  readonly departmentOptions = signal<GccSelectOption[]>([]);
  readonly positionOptions = signal<GccSelectOption[]>([]);
  readonly parameterModalOpen = signal(false);
  readonly parameterForm = signal<RetirementParameter>({ retirementParameterId: null, womanAge: null, manAge: null });
  readonly filters: RetirementFilter = {
    keyWord: '',
    civiliteId: '',
    departmentId: '',
    positionId: '',
    age: '',
    year: '',
  };

  readonly sortColumn = signal<keyof RetirementItem | 'dateDepart'>('dateDepart');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

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

  onFilterChange(): void {
    this.filterDebouncer.next();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    void this.loadPage();
  }

  async initLookups(): Promise<void> {
    try {
      const [civilites, departments, positions] = await Promise.all([
        this.service.loadCivilites(),
        this.service.loadDepartments(),
        this.service.loadPositions(),
      ]);

      this.civiliteOptions.set([{ label: 'Toutes les civilités', value: '' }, ...civilites]);
      this.departmentOptions.set([{ label: 'Tous les départements', value: '' }, ...departments]);
      this.positionOptions.set([{ label: 'Tous les postes', value: '' }, ...positions]);
    } catch {
      this.error.set('Les données de filtrage n’ont pas pu être chargées.');
    }
  }

  async loadPage(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.service.filter(this.filters, this.pageIndex() + 1, this.pageSize);
      this.rows.set(response.data ?? []);
      this.totalCount.set(response.totalCount ?? 0);
      this.totalPages.set(response.totalPages ?? 0);
      this.applySorting();
      if (!response.success && response.message) {
        this.error.set(response.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue lors du chargement des données.';
      this.error.set(`Erreur inattendue lors du chargement des données : ${message}`);
      this.rows.set([]);
      this.sortedRows.set([]);
      this.totalCount.set(0);
      this.totalPages.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  handleSort(column: keyof RetirementItem): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.applySorting();
  }

  sortIndicator(column: keyof RetirementItem): string {
    if (this.sortColumn() !== column) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  private applySorting(): void {
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const sorted = [...this.rows()].sort((a, b) => {
      const left = this.getComparableValue(a, column);
      const right = this.getComparableValue(b, column);

      if (left == null && right == null) return 0;
      if (left == null) return 1;
      if (right == null) return -1;

      if (typeof left === 'number' && typeof right === 'number') {
        return direction === 'asc' ? left - right : right - left;
      }

      const textLeft = String(left).toLowerCase();
      const textRight = String(right).toLowerCase();
      if (textLeft < textRight) return direction === 'asc' ? -1 : 1;
      if (textLeft > textRight) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    this.sortedRows.set(sorted);
  }

  private getComparableValue(row: RetirementItem, column: keyof RetirementItem): string | number | null {
    if (column === 'dateDepart') return row.dateDepart ? new Date(row.dateDepart).getTime() : null;
    if (column === 'age') return row.age ?? null;
    if (column === 'civiliteName') return row.civiliteName ?? null;
    if (column === 'departmentName') return row.departmentName ?? null;
    if (column === 'positionName') return row.positionName ?? null;
    if (column === 'registrationNumber') return row.registrationNumber ?? null;
    if (column === 'name') return row.name ?? null;
    return row[column] ?? null;
  }

  fullName(row: RetirementItem): string {
    const parts = [row.name, row.firstName].filter(Boolean);
    return parts.join(' ').trim() || row.registrationNumber || 'Employé';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  async openParameters(): Promise<void> {
    this.parameterModalOpen.set(true);
    try {
      const rows = await this.service.loadParameters();
      if (rows.length > 0) {
        const first = rows[0];
        this.parameterForm.set({
          retirementParameterId: first.retirementParameterId ?? null,
          womanAge: first.womanAge ?? null,
          manAge: first.manAge ?? null,
        });
      } else {
        this.parameterForm.set({ retirementParameterId: null, womanAge: null, manAge: null });
      }
    } catch {
      this.parameterForm.set({ retirementParameterId: null, womanAge: null, manAge: null });
    }
  }

  closeParameters(): void {
    this.parameterModalOpen.set(false);
  }

  async saveParameters(): Promise<void> {
    const payload: RetirementParameter = {
      retirementParameterId: this.parameterForm().retirementParameterId ?? 1,
      womanAge: this.parameterForm().womanAge ?? 0,
      manAge: this.parameterForm().manAge ?? 0,
    };

    try {
      await this.service.saveParameters(payload);
      this.closeParameters();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enregistrement impossible.';
      this.error.set(`Impossible d’enregistrer les paramètres : ${message}`);
    }
  }
}
