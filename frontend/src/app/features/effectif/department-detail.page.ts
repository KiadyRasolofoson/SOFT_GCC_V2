import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DepartmentDetail,
  DepartmentDetailService,
  DepartmentEmployeeItem,
} from '../../core/department-detail.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccPageHeader } from '../../ui/gcc-page-header';

@Component({
  selector: 'app-department-detail-page',
  imports: [
    FormsModule,
    GccPageHeader,
    GccKpiCard,
    GccEmptyState,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
  ],
  template: `
    <gcc-page-header
      [title]="title()"
      subtitle="Liste des collaborateurs rattachés à ce département."
      icon="domain"
      [crumbs]="crumbs()"
      secondaryLabel="Retour"
      secondaryIcon="arrow_back"
      (secondaryAction)="goBack()"
      actionLabel="Organigramme"
      actionIcon="account_tree"
      (action)="goOrgChart()"
    />

    @if (error(); as err) {
      <div class="mb-6 rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-xs text-red-900 shadow-xs">
        <div class="flex items-start gap-3">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-red-600 mt-0.5">error_outline</mat-icon>
          <p class="font-bold text-red-900">{{ err }}</p>
        </div>
      </div>
    }

    <!-- KPIs -->
    <div class="grid gap-4 sm:grid-cols-2">
      <gcc-kpi-card
        label="Effectif"
        [value]="effectifText()"
        hint="Collaborateurs du département"
        tone="up"
        icon="groups"
      />
      <gcc-kpi-card
        label="Résultats"
        [value]="resultsText()"
        hint="Après filtrage"
        tone="accent"
        icon="filter_alt"
      />
    </div>

    <!-- Panneau collaborateurs -->
    <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2.5">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <mat-icon class="!h-5 !w-5 !text-[20px]">format_list_bulleted</mat-icon>
          </span>
          <div>
            <h2 class="text-base font-semibold text-navy">Collaborateurs</h2>
            <p class="text-xs text-slate-500">Matricule, poste, date d'embauche et ancienneté.</p>
          </div>
        </div>
        <div class="flex w-full max-w-xs items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
          <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400">search</mat-icon>
          <input
            type="search"
            class="w-full border-0 bg-transparent py-2 text-sm text-navy outline-none placeholder:text-slate-400"
            placeholder="Nom, matricule, poste…"
            [ngModel]="search()"
            (ngModelChange)="onSearchChange($event)"
            aria-label="Filtrer les collaborateurs"
          />
        </div>
      </div>

      @if (loading()) {
        <div class="p-8 text-center text-sm text-slate-500">Chargement des collaborateurs…</div>
      } @else if (filtered().length === 0) {
        <gcc-empty-state
          title="Aucun collaborateur trouvé"
          message="Ajustez la recherche pour afficher des résultats."
        />
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full min-w-[820px]">
            <thead>
              <tr class="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500">
                <th class="px-5 py-3 font-semibold">Collaborateur</th>
                <th class="px-5 py-3 font-semibold">Matricule</th>
                <th class="px-5 py-3 font-semibold">Poste</th>
                <th class="px-5 py-3 font-semibold">Embauche</th>
                <th class="px-5 py-3 font-semibold">Ancienneté</th>
              </tr>
            </thead>
            <tbody>
              @for (item of pagedRows(); track itemKey(item)) {
                <tr class="border-b border-slate-100 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-3">
                      @if (item.photo && item.employeeId != null) {
                        <img
                          [src]="employeePhotoUrl(item)"
                          alt=""
                          class="h-10 w-10 rounded-full object-cover"
                          loading="lazy"
                        />
                      } @else {
                        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-slate-200 text-xs font-bold text-navy">
                          {{ initials(item) }}
                        </span>
                      }
                      <div>
                        <p class="font-semibold text-navy">{{ fullName(item) }}</p>
                        <p class="text-xs text-slate-500">{{ item.civiliteName || '—' }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3">
                    <span class="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {{ item.registrationNumber || '—' }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-slate-600">{{ item.positionName || 'Poste non défini' }}</td>
                  <td class="px-5 py-3 text-slate-600">{{ formatDate(item.hiringDate) }}</td>
                  <td class="px-5 py-3">
                    <span class="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {{ item.seniority || '—' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <mat-paginator
          [length]="resultsCount()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[5, 10, 25]"
          showFirstLastButtons
          (page)="onPageChange($event)"
        />
      }
    </div>
  `,
})
export class DepartmentDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(DepartmentDetailService);

  private readonly departmentId = Number(this.route.snapshot.paramMap.get('departmentId')) || 0;

  readonly employees = signal<DepartmentEmployeeItem[]>([]);
  readonly department = signal<DepartmentDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly pageSize = 10;
  readonly pageIndex = signal(0);

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const rows = this.employees();
    if (!query) return rows;
    return rows.filter((item) => {
      const fullName = `${item.name || ''} ${item.firstName || ''}`.toLowerCase();
      const matricule = (item.registrationNumber || '').toLowerCase();
      const poste = (item.positionName || '').toLowerCase();
      return fullName.includes(query) || matricule.includes(query) || poste.includes(query);
    });
  });

  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  readonly title = computed(() => this.department()?.name || 'Département');

  readonly crumbs = computed(() => [
    { label: 'Accueil' },
    { label: 'Effectifs' },
    { label: this.department()?.name || 'Détails' },
  ]);

  readonly effectif = computed(() => this.employees().length);
  readonly resultsCount = computed(() => this.filtered().length);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    if (!this.departmentId) {
      this.error.set('ID du département introuvable.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.service.load(this.departmentId);
      this.employees.set(result.employees);
      this.department.set(result.department);
    } catch (error) {
      this.employees.set([]);
      this.department.set(null);
      this.error.set(
        `Erreur lors de la récupération des données : ${error instanceof Error ? error.message : 'erreur inconnue'}`,
      );
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  effectifText(): string {
    return String(this.effectif());
  }

  resultsText(): string {
    return String(this.resultsCount());
  }

  fullName(item: DepartmentEmployeeItem): string {
    return [item.name, item.firstName].filter(Boolean).join(' ').trim() || '—';
  }

  initials(item: DepartmentEmployeeItem): string {
    const a = (item.name || '').trim().charAt(0);
    const b = (item.firstName || '').trim().charAt(0);
    return `${a}${b}`.toUpperCase() || '?';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  itemKey(item: DepartmentEmployeeItem): string {
    return item.employeeId != null ? String(item.employeeId) : item.registrationNumber ?? 'row';
  }

  employeePhotoUrl(item: DepartmentEmployeeItem): string {
    return this.service.employeePhotoUrl(item.employeeId);
  }

  goBack(): void {
    void this.router.navigate(['/soft-gcc/effectifs']);
  }

  goOrgChart(): void {
    void this.router.navigate(['/soft-gcc/organigramme']);
  }
}
