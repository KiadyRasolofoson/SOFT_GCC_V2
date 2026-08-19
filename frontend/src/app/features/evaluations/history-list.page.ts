import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  EvaluationHistoryRow,
  formatScore,
  HistoryGlobalStats,
  HistoryListQuery,
  HistoryYearlyPerformance,
  historyEmployeeName,
  historyStatusMeta,
  initialsOf,
  ratingLabel,
  scoreBadgeClass,
  scoreFillPercent,
  scoreToneClass,
  emptyHistoryStats,
} from './evaluation.models';
import { EvaluationService } from './evaluation.service';

type HistoryView = 'dossiers' | 'analyse';

@Component({
  selector: 'app-history-list-page',
  imports: [
    DatePipe,
    DecimalPipe,
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
      title="Historique d’évaluations"
      subtitle="Retrouvez les dossiers, comparez les scores et suivez l’évolution des performances dans le temps."
      icon="history"
      [crumbs]="crumbs"
      secondaryLabel="Exporter PDF"
      secondaryIcon="picture_as_pdf"
      actionLabel="Exporter Excel"
      actionIcon="download"
      (secondary)="export('pdf')"
      (action)="export('excel')"
    />

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <gcc-kpi-card
        label="Dossiers"
        [value]="stats().totalEvaluationsCount.toString()"
        hint="Évaluations correspondant aux filtres"
        tone="neutral"
        icon="folder_open"
      />
      <gcc-kpi-card
        label="Score moyen"
        [value]="formatScore(stats().averageScore, 2) + ' / 5'"
        [hint]="scoreHint()"
        [tone]="stats().averageScore >= 4 ? 'up' : stats().averageScore >= 3 ? 'accent' : 'down'"
        icon="star"
      />
      <gcc-kpi-card
        label="Participation"
        [value]="formatPercent(stats().participationRate)"
        hint="Salariés ayant une évaluation sur la période"
        tone="accent"
        icon="groups"
      />
      <gcc-kpi-card
        label="Taux de clôture"
        [value]="formatPercent(stats().approvalRate)"
        [hint]="trendHint()"
        [tone]="stats().trendData.isIncreasing ? 'up' : 'down'"
        icon="task_alt"
      />
    </div>

    <gcc-filter-bar
      placeholder="Rechercher un salarié…"
      [(query)]="search"
      (apply)="applyFilters()"
      (reset)="resetFilters()"
    >
      <gcc-select
        class="w-full shrink-0 lg:w-40"
        [options]="yearOptions"
        [(value)]="year"
        placeholder="Toutes les années"
      />
      <gcc-select
        class="w-full shrink-0 lg:w-48"
        [options]="typeOptions()"
        [(value)]="evaluationType"
        placeholder="Tous les types"
      />
      <gcc-select
        class="w-full shrink-0 lg:w-52"
        [options]="departmentOptions()"
        [(value)]="department"
        placeholder="Tous les départements"
      />
    </gcc-filter-bar>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs">
        <button
          type="button"
          class="rounded-xl px-3.5 py-2 text-xs font-bold transition"
          [class]="view() === 'dossiers' ? 'bg-navy text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'"
          (click)="setView('dossiers')"
        >
          Dossiers
        </button>
        <button
          type="button"
          class="rounded-xl px-3.5 py-2 text-xs font-bold transition"
          [class]="view() === 'analyse' ? 'bg-navy text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'"
          (click)="setView('analyse')"
        >
          Tendances
        </button>
      </div>

      @if (exporting()) {
        <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <mat-icon class="!h-4 !w-4 !text-[16px] animate-spin">progress_activity</mat-icon>
          Préparation de l’export…
        </span>
      }
    </div>

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger l’historique"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="reload()"
      />
    } @else if (view() === 'dossiers') {
      @if (!loading() && !rows().length) {
        <gcc-empty-state
          title="Aucune évaluation trouvée"
          message="Ajustez l’année, le type ou le département, ou élargissez la recherche salarié."
          actionLabel="Réinitialiser les filtres"
          actionIcon="restart_alt"
          (action)="resetFilters()"
        />
      } @else {
        <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <table mat-table [dataSource]="rows()" class="w-full">
            <ng-container matColumnDef="employee">
              <th mat-header-cell *matHeaderCellDef>Salarié</th>
              <td mat-cell *matCellDef="let row">
                <div class="flex items-center gap-3.5 py-2.5">
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-indigo-500 text-xs font-extrabold text-white shadow-xs shadow-accent/20"
                  >
                    {{ initialsOf(historyEmployeeName(row)) }}
                  </span>
                  <div>
                    <p class="text-sm font-bold leading-snug text-navy">{{ historyEmployeeName(row) }}</p>
                    <p class="text-[11px] font-medium text-slate-400">{{ row.position || 'Poste non renseigné' }}</p>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let row">
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <mat-icon class="!h-4 !w-4 !text-[16px] text-indigo-500">assignment_turned_in</mat-icon>
                  {{ row.evaluationType || '—' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="period">
              <th mat-header-cell *matHeaderCellDef>Période</th>
              <td mat-cell *matCellDef="let row" class="text-xs font-semibold tabular text-slate-500">
                {{ row.startDate ? (row.startDate | date: 'dd MMM yyyy') : '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="score">
              <th mat-header-cell *matHeaderCellDef>Score</th>
              <td mat-cell *matCellDef="let row">
                <div class="min-w-36">
                  <div class="mb-1 flex items-center justify-between gap-2">
                    <span
                      class="inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[11px] font-extrabold tabular"
                      [class]="scoreBadgeClass(row.overallScore)"
                    >
                      {{ formatScore(row.overallScore) }} / 5
                    </span>
                    <span class="text-[10px] font-semibold text-slate-400">{{ ratingLabel(row.overallScore ?? 0) }}</span>
                  </div>
                  <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full transition-all"
                      [class]="scoreToneClass(row.overallScore)"
                      [style.width.%]="scoreFillPercent(row.overallScore)"
                    ></div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let row">
                <gcc-status-tag [status]="historyStatusMeta(row.status).kind" [label]="historyStatusMeta(row.status).label" />
              </td>
            </ng-container>

            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row" class="text-right">
                <button
                  mat-flat-button
                  class="gcc-btn-primary !rounded-xl !py-1.5 !text-xs shadow-xs hover:shadow-md"
                  type="button"
                  (click)="openDetail(row); $event.stopPropagation()"
                >
                  <mat-icon class="!mr-1.5 !h-4 !w-4 !text-[16px]">visibility</mat-icon>
                  Consulter
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: columns"
              class="cursor-pointer transition-colors hover:bg-indigo-50/30"
              (click)="openDetail(row)"
            ></tr>
          </table>

          <mat-paginator
            [length]="totalItems()"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[5, 10, 20, 50]"
            [disabled]="loading()"
            (page)="onPage($event)"
            showFirstLastButtons
            class="border-t border-slate-100"
          />
        </div>
      }
    } @else {
      @if (statsLoading()) {
        <div class="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
          <p class="text-sm font-bold text-navy">Analyse des performances…</p>
        </div>
      } @else if (!hasAnalytics()) {
        <gcc-empty-state
          title="Pas encore de tendance à afficher"
          message="Les graphiques apparaîtront dès qu’au moins une évaluation correspondra aux filtres."
          actionLabel="Voir les dossiers"
          actionIcon="folder_open"
          (action)="setView('dossiers')"
        />
      } @else {
        <div class="grid gap-6 lg:grid-cols-12">
          <section class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-7">
            <div class="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 class="text-base font-bold text-navy">Évolution annuelle</h3>
                <p class="text-xs text-slate-500">Score moyen / 5 et volume de dossiers par année</p>
              </div>
              <span class="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-accent">
                {{ yearly().length }} année(s)
              </span>
            </div>

            <div class="flex items-end gap-3" style="height: 220px">
              @for (item of yearly(); track item.year) {
                <div class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span class="text-[11px] font-extrabold tabular text-navy">{{ formatScore(item.averageScore) }}</span>
                  <div class="flex w-full flex-1 items-end">
                    <div
                      class="mx-auto w-full max-w-12 rounded-t-xl bg-gradient-to-t from-indigo-600 to-accent shadow-xs"
                      [style.height.%]="scoreFillPercent(item.averageScore)"
                      [title]="'Score ' + formatScore(item.averageScore) + ' · ' + item.evaluationCount + ' dossiers'"
                    ></div>
                  </div>
                  <div class="text-center">
                    <p class="text-xs font-bold text-navy">{{ item.year }}</p>
                    <p class="text-[10px] font-medium text-slate-400">{{ item.evaluationCount }} dos.</p>
                  </div>
                </div>
              }
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-5">
            <div class="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 class="text-base font-bold text-navy">Répartition des scores</h3>
                <p class="text-xs text-slate-500">Faible · Satisfaisant · Excellent</p>
              </div>
              <mat-icon class="!h-5 !w-5 !text-[20px] text-slate-400">pie_chart</mat-icon>
            </div>

            <div class="mb-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div class="flex h-full w-full">
                <div class="h-full bg-amber-400" [style.width.%]="scoreShare().low"></div>
                <div class="h-full bg-accent" [style.width.%]="scoreShare().medium"></div>
                <div class="h-full bg-emerald-500" [style.width.%]="scoreShare().high"></div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between text-xs">
                <span class="inline-flex items-center gap-2 font-semibold text-slate-600">
                  <span class="h-2 w-2 rounded-full bg-amber-400"></span>
                  &lt; 2,5 — À renforcer
                </span>
                <span class="font-extrabold tabular text-navy">{{ stats().scoreDistribution.low }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="inline-flex items-center gap-2 font-semibold text-slate-600">
                  <span class="h-2 w-2 rounded-full bg-accent"></span>
                  2,5 à 4 — Satisfaisant
                </span>
                <span class="font-extrabold tabular text-navy">{{ stats().scoreDistribution.medium }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="inline-flex items-center gap-2 font-semibold text-slate-600">
                  <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                  ≥ 4 — Excellent
                </span>
                <span class="font-extrabold tabular text-navy">{{ stats().scoreDistribution.high }}</span>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
              <div>
                <p class="font-medium text-slate-500">Min / Max</p>
                <p class="mt-0.5 font-extrabold tabular text-navy">
                  {{ formatScore(stats().scoreDistribution.min) }} → {{ formatScore(stats().scoreDistribution.max) }}
                </p>
              </div>
              <div>
                <p class="font-medium text-slate-500">Écart-type</p>
                <p class="mt-0.5 font-extrabold tabular text-navy">
                  {{ stats().trendData.standardDeviation | number: '1.2-2' }}
                </p>
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-7">
            <div class="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 class="text-base font-bold text-navy">Performance par département</h3>
                <p class="text-xs text-slate-500">Score moyen et volume de dossiers</p>
              </div>
            </div>

            @if (!rankedDepartments().length) {
              <p class="text-sm text-slate-500">Aucune répartition départementale pour ces filtres.</p>
            } @else {
              <div class="space-y-4">
                @for (dept of rankedDepartments(); track dept.label) {
                  <div>
                    <div class="mb-1.5 flex items-center justify-between text-xs font-semibold">
                      <span class="text-navy">{{ dept.label }}</span>
                      <div class="flex items-center gap-2">
                        <span class="font-normal text-slate-500">{{ dept.value }} dos.</span>
                        <span
                          class="rounded-md px-1.5 py-0.5 text-[11px] font-bold"
                          [class]="dept.averageScore >= 4 ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'"
                        >
                          {{ formatScore(dept.averageScore) }} / 5
                        </span>
                      </div>
                    </div>
                    <div class="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [class]="dept.averageScore >= 4 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-accent to-indigo-500'"
                        [style.width.%]="scoreFillPercent(dept.averageScore)"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            }
          </section>

          <section class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-5">
            <div class="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 class="text-base font-bold text-navy">Types d’évaluation</h3>
                <p class="text-xs text-slate-500">Volume relatif sur la période filtrée</p>
              </div>
            </div>

            @if (!typeShares().length) {
              <p class="text-sm text-slate-500">Aucun type renseigné.</p>
            } @else {
              <div class="space-y-3.5">
                @for (item of typeShares(); track item.label) {
                  <div class="flex items-center gap-3">
                    <span class="w-28 shrink-0 truncate text-xs font-semibold text-slate-600" [title]="item.label">
                      {{ item.label }}
                    </span>
                    <div class="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-navy to-indigo-600"
                        [style.width.%]="item.share"
                      ></div>
                    </div>
                    <span class="w-10 shrink-0 text-right text-xs font-bold tabular text-navy">{{ item.value }}</span>
                  </div>
                }
              </div>
            }
          </section>
        </div>
      }
    }
  `,
})
export class HistoryListPage implements OnInit {
  private readonly evaluations = inject(EvaluationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly crumbs = [{ label: 'Évaluations' }, { label: 'Historique' }];
  readonly columns = ['employee', 'type', 'period', 'score', 'status', 'action'];
  readonly yearOptions: GccSelectOption[] = [
    { label: 'Toutes les années', value: 'all' },
    ...Array.from({ length: 6 }, (_, i) => {
      const year = new Date().getFullYear() - i;
      return { label: String(year), value: String(year) };
    }),
  ];

  readonly view = signal<HistoryView>('dossiers');
  readonly search = signal('');
  readonly year = signal<string | null>('all');
  readonly evaluationType = signal<string | null>('all');
  readonly department = signal<string | null>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = signal(0);
  readonly loading = signal(false);
  readonly statsLoading = signal(false);
  readonly exporting = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<EvaluationHistoryRow[]>([]);
  readonly stats = signal<HistoryGlobalStats>(emptyHistoryStats());
  readonly yearly = signal<HistoryYearlyPerformance[]>([]);
  readonly typeOptions = signal<GccSelectOption[]>([{ label: 'Tous les types', value: 'all' }]);
  readonly departmentOptions = signal<GccSelectOption[]>([{ label: 'Tous les départements', value: 'all' }]);

  readonly totalItems = computed(() => {
    const fromStats = this.stats().totalEvaluationsCount;
    if (fromStats > 0) return fromStats;
    const pages = this.totalPages();
    const size = this.pageSize();
    const index = this.pageIndex();
    const count = this.rows().length;
    if (pages <= 0) return count;
    if (index >= pages - 1) return Math.max((pages - 1) * size + count, count);
    return pages * size;
  });

  readonly hasAnalytics = computed(
    () => this.yearly().length > 0 || this.stats().totalEvaluationsCount > 0,
  );

  readonly rankedDepartments = computed(() =>
    [...this.stats().departmentDistribution].sort((a, b) => b.averageScore - a.averageScore).slice(0, 8),
  );

  readonly typeShares = computed(() => {
    const items = this.stats().evaluationTypeDistribution;
    const max = Math.max(...items.map((item) => item.value), 1);
    return items.map((item) => ({ ...item, share: Math.round((item.value / max) * 100) }));
  });

  readonly scoreShare = computed(() => {
    const dist = this.stats().scoreDistribution;
    const total = dist.low + dist.medium + dist.high;
    if (!total) return { low: 0, medium: 0, high: 0 };
    return {
      low: (dist.low / total) * 100,
      medium: (dist.medium / total) * 100,
      high: (dist.high / total) * 100,
    };
  });

  readonly scoreHint = computed(() => ratingLabel(this.stats().averageScore));
  readonly trendHint = computed(() => {
    const trend = this.stats().trendData;
    if (!this.yearly().length && !trend.percentageChange) return 'Évaluations clôturées';
    const sign = trend.percentageChange >= 0 ? '+' : '';
    return `Tendance ${sign}${trend.percentageChange.toFixed(1)} %`;
  });

  readonly historyEmployeeName = historyEmployeeName;
  readonly initialsOf = initialsOf;
  readonly historyStatusMeta = historyStatusMeta;
  readonly formatScore = formatScore;
  readonly ratingLabel = ratingLabel;
  readonly scoreBadgeClass = scoreBadgeClass;
  readonly scoreFillPercent = scoreFillPercent;
  readonly scoreToneClass = scoreToneClass;

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
      departments: this.evaluations.getHistoryDepartments(),
      types: this.evaluations.getHistoryEvaluationTypes(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ departments, types }) => {
          this.departmentOptions.set([
            { label: 'Tous les départements', value: 'all' },
            ...departments.map((d) => ({ label: d.name, value: d.name })),
          ]);
          this.typeOptions.set([
            { label: 'Tous les types', value: 'all' },
            ...types.map((type) => ({ label: type, value: type })),
          ]);
        },
        error: () => undefined,
      });

    this.reload();
  }

  setView(view: HistoryView): void {
    this.view.set(view);
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.reload();
  }

  resetFilters(): void {
    this.search.set('');
    this.year.set('all');
    this.evaluationType.set('all');
    this.department.set('all');
    this.pageIndex.set(0);
    this.reload();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadRows();
  }

  openDetail(row: EvaluationHistoryRow): void {
    if (!row.evaluationId) return;
    void this.router.navigate(['/soft-gcc/evaluations/historique', row.evaluationId]);
  }

  reload(): void {
    this.loadRows();
    this.loadStats();
  }

  export(format: 'excel' | 'pdf'): void {
    this.exporting.set(true);
    this.evaluations.exportHistory(format, this.filterQuery()).subscribe({
      next: (blob) => {
        const ext = format === 'excel' ? 'xlsx' : 'pdf';
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `historique_evaluations.${ext}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => {
        this.exporting.set(false);
        this.error.set('L’export a échoué. Vérifiez vos droits ou réessayez.');
      },
    });
  }

  formatPercent(value: number): string {
    return `${(Number(value) || 0).toFixed(1)} %`;
  }

  private loadRows(): void {
    this.loading.set(true);
    this.error.set(null);
    this.evaluations
      .getHistoryPaginated({
        ...this.filterQuery(),
        pageNumber: this.pageIndex() + 1,
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (data) => {
          this.rows.set(this.evaluations.unwrapHistoryRows(data));
          this.totalPages.set(data.totalPages ?? data.TotalPages ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Vérifiez vos droits (consultation des évaluations) ou réessayez.');
          this.loading.set(false);
        },
      });
  }

  private loadStats(): void {
    this.statsLoading.set(true);
    const query = this.filterQuery();
    forkJoin({
      stats: this.evaluations.getHistoryGlobalStats(query),
      yearly: this.evaluations.getHistoryYearlyPerformance(query),
    }).subscribe({
      next: ({ stats, yearly }) => {
        this.stats.set(stats);
        this.yearly.set(yearly);
        this.statsLoading.set(false);
      },
      error: () => {
        this.stats.set(emptyHistoryStats());
        this.yearly.set([]);
        this.statsLoading.set(false);
      },
    });
  }

  private filterQuery(): Omit<HistoryListQuery, 'pageNumber' | 'pageSize'> {
    const year = this.year();
    const type = this.evaluationType();
    const department = this.department();
    return {
      employeeName: this.search().trim() || undefined,
      evaluationType: type && type !== 'all' ? type : undefined,
      department: department && department !== 'all' ? department : undefined,
      startDate: year && year !== 'all' ? `${year}-01-01` : undefined,
      endDate: year && year !== 'all' ? `${year}-12-31` : undefined,
    };
  }
}
