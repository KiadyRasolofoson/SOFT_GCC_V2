import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WishEvolutionFilters, WishEvolutionItem } from '../../core/wish-evolution.models';
import { WishEvolutionService } from '../../core/wish-evolution.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { GccStatusTag, StatusKind } from '../../ui/gcc-status-tag';
import { WishEvolutionGraphComponent, WishGraphSeriesPoint } from './components/wish-evolution-graph.component';

const MONTH_LETTERS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

@Component({
  selector: 'app-wish-evolution-list-page',
  imports: [
    FormsModule,
    GccPageHeader,
    GccEmptyState,
    GccSelect,
    GccStatusTag,
    WishEvolutionGraphComponent,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <gcc-page-header
      title="Souhait d'évolution"
      subtitle="Suivez les demandes d'évolution de carrière."
      icon="trending_up"
      [crumbs]="crumbs"
      actionLabel="Ajouter"
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

        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <input
            type="date"
            class="w-full border-0 bg-transparent text-sm text-navy outline-none"
            [(ngModel)]="filters.dateRequestMin"
            (ngModelChange)="onFilterChange()"
          />
        </label>

        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <input
            type="date"
            class="w-full border-0 bg-transparent text-sm text-navy outline-none"
            [(ngModel)]="filters.dateRequestMax"
            (ngModelChange)="onFilterChange()"
          />
        </label>

        <div class="min-w-0">
          <gcc-select [options]="wishTypeOptions()" [value]="filters.wishTypeId" (valueChange)="onSelectFilterChange('wishTypeId', $event)" placeholder="Type de souhait" />
        </div>

        <div class="min-w-0">
          <gcc-select [options]="positionOptions()" [value]="filters.positionId" (valueChange)="onSelectFilterChange('positionId', $event)" placeholder="Poste souhaité" />
        </div>
      </div>

      <div class="mt-3 grid gap-3 lg:grid-cols-2">
        <div class="min-w-0">
          <gcc-select [options]="priorityOptions" [value]="filters.priority" (valueChange)="onSelectFilterChange('priority', $event)" placeholder="Priorité" />
        </div>
        <div class="min-w-0">
          <gcc-select [options]="stateOptions" [value]="filters.state" (valueChange)="onSelectFilterChange('state', $event)" placeholder="Statut" />
        </div>
      </div>
    </div>

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger les souhaits d'évolution"
        [message]="error() ?? 'Une erreur est survenue.'"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement des souhaits…
      </div>
    } @else if (rows().length === 0) {
      <gcc-empty-state
        title="Aucune demande trouvée"
        message="Ajustez les filtres pour afficher des résultats."
      />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h2 class="text-base font-semibold text-navy">Liste des demandes</h2>
            <p class="text-xs text-slate-500">{{ totalCount() }} résultat(s)</p>
          </div>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
            {{ totalCount() }} demande(s)
          </span>
        </div>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="rows()" class="w-full min-w-[980px]">
            <ng-container matColumnDef="registrationNumber">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Matricule</th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm font-medium text-navy">{{ row.registrationNumber || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="employee">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Employé</th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-700">{{ fullName(row) }}</td>
            </ng-container>

            <ng-container matColumnDef="wishTypeName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Type de souhait</th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ row.wishTypeName || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="wishPositionName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Poste souhaité</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="font-medium text-amber-700">{{ row.wishPositionName || '—' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="priorityLetter">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Priorité</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="inline-flex min-w-[2rem] justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {{ row.priorityLetter || '—' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="requestDate">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Date de demande</th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ formatDate(row.requestDate) }}</td>
            </ng-container>

            <ng-container matColumnDef="state">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Statut</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <gcc-status-tag [status]="mapStatus(row.state)" />
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]"></th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <button mat-stroked-button type="button" class="gcc-btn-secondary !rounded-xl" (click)="openDetails(row)">
                  <mat-icon class="!mr-1.5 !text-[18px]">visibility</mat-icon>
                  Voir demande
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayColumns;" class="cursor-pointer transition-colors hover:bg-slate-50" (click)="openDetails(row)"></tr>
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

    <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-base font-semibold text-navy">Analyse des demandes par mois</h2>
          <p class="text-xs text-slate-500">Un aperçu des demandes au cours de l'année</p>
        </div>
        <div class="w-full max-w-[180px]">
          <gcc-select [options]="yearOptions()" [(value)]="selectedYear" placeholder="Année" />
        </div>
      </div>

      @if (graphLoading()) {
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Chargement du graphique…
        </div>
      } @else {
        <app-wish-evolution-graph [points]="graphPoints()" [year]="selectedYearValue()" />
      }
    </div>
  `,
})
export class WishEvolutionListPage {
  private readonly router = inject(Router);
  private readonly service = inject(WishEvolutionService);
  private readonly filterDebouncer = new Subject<void>();
  private readonly graphDebouncer = new Subject<void>();

  readonly currentYear = new Date().getFullYear();
  readonly crumbs = [{ label: 'Accueil' }, { label: 'Souhait évolution' }, { label: 'Liste' }];

  readonly displayColumns = [
    'registrationNumber',
    'employee',
    'wishTypeName',
    'wishPositionName',
    'priorityLetter',
    'requestDate',
    'state',
    'actions',
  ];

  readonly priorityOptions = [
    { label: 'Toutes les priorités', value: '' },
    { label: 'Bas', value: '1' },
    { label: 'Moyen', value: '5' },
    { label: 'Élevé', value: '10' },
  ];

  readonly stateOptions = [
    { label: 'Tous les statuts', value: '' },
    { label: 'En attente', value: '1' },
    { label: 'En cours', value: '5' },
    { label: 'Validé', value: '10' },
    { label: 'Refusé', value: '0' },
  ];

  readonly rows = signal<WishEvolutionItem[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = 10;
  readonly wishTypeOptions = signal<{ label: string; value: string }[]>([]);
  readonly positionOptions = signal<{ label: string; value: string }[]>([]);

  readonly graphLoading = signal(false);
  readonly graphData = signal<{ month: number; totalRequests: number }[]>([]);
  readonly selectedYear = signal(String(this.currentYear));

  readonly filters: WishEvolutionFilters = {
    keyWord: '',
    dateRequestMin: '',
    dateRequestMax: '',
    wishTypeId: '',
    positionId: '',
    priority: '',
    state: '',
    year: this.currentYear,
  };

  readonly yearOptions = computed(() =>
    Array.from({ length: 7 }, (_, i) => {
      const year = this.currentYear - i;
      return { label: String(year), value: String(year) };
    }),
  );

  readonly selectedYearValue = computed(() => Number(this.selectedYear()) || this.currentYear);

  readonly graphPoints = computed<WishGraphSeriesPoint[]>(() => {
    const raw = this.graphData();
    return MONTH_LETTERS.map((label, idx) => {
      const month = idx + 1;
      const match = raw.find((item) => Number(item.month) === month);
      return { label, value: match ? Number(match.totalRequests) || 0 : 0 };
    });
  });

  constructor() {
    this.filterDebouncer
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => {
        this.pageIndex.set(0);
        void this.loadPage();
      });

    this.graphDebouncer
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => {
        void this.loadGraph();
      });

    void this.initLookups();
  }

  ngOnInit(): void {
    void this.loadPage();
    void this.loadGraph();
  }

  async initLookups(): Promise<void> {
    try {
      const [wishTypes, positions] = await Promise.all([
        this.service.loadWishTypes(),
        this.service.loadPositions(),
      ]);

      this.wishTypeOptions.set([
        { label: 'Tous les types', value: '' },
        ...wishTypes.map((item) => ({ label: item.designation, value: String(item.wishTypeId) })),
      ]);

      this.positionOptions.set([
        { label: 'Tous les postes', value: '' },
        ...positions.map((item) => ({ label: item.positionName, value: String(item.positionId) })),
      ]);
    } catch {
      this.wishTypeOptions.set([{ label: 'Tous les types', value: '' }]);
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
      const result = await this.service.getPage(this.filters, this.pageIndex() + 1, this.pageSize);
      this.rows.set(result.data);
      this.totalCount.set(result.totalCount);
    } catch {
      this.rows.set([]);
      this.totalCount.set(0);
      this.error.set('Erreur lors de la récupération des données.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadGraph(): Promise<void> {
    const year = this.selectedYearValue();
    this.graphLoading.set(true);

    try {
      const response = await this.service.getGraph(year);
      this.graphData.set(response);
    } catch {
      this.graphData.set([]);
    } finally {
      this.graphLoading.set(false);
    }
  }

  fullName(row: WishEvolutionItem): string {
    const segments = [row.firstName, row.name].filter(Boolean);
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

  mapStatus(state: number | null): StatusKind {
    if (state === 10) return 'validated';
    if (state === 0) return 'refused';
    return 'pending';
  }

  openDetails(row: WishEvolutionItem): void {
    if (!row.wishEvolutionCareerId) return;
    void this.router.navigate(['/soft-gcc/souhaits-evolution/details', row.wishEvolutionCareerId]);
  }

  openCreate(): void {
    void this.router.navigate(['/soft-gcc/souhaits-evolution/ajouter']);
  }
}
