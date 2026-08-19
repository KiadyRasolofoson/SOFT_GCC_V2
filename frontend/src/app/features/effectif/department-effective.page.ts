import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DepartmentEffectiveItem, DepartmentEffectiveService } from '../../core/department-effective.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccPageHeader } from '../../ui/gcc-page-header';

@Component({
  selector: 'app-department-effective-page',
  imports: [FormsModule, GccPageHeader, GccKpiCard, GccEmptyState, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Effectifs par département"
      subtitle="Répartition des collaborateurs et accès rapide à l'organigramme."
      icon="groups"
      [crumbs]="crumbs"
      [secondaryLabel]="canImport() ? 'Importer CSV' : ''"
      secondaryIcon="upload"
      (secondaryAction)="goImport()"
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
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <gcc-kpi-card
        label="Collaborateurs"
        [value]="totalEmployeesText()"
        hint="Effectif total consolidé"
        tone="up"
        icon="groups"
      />
      <gcc-kpi-card
        label="Départements"
        [value]="assignedDeptsText()"
        hint="Départements référencés"
        tone="accent"
        icon="domain"
      />
      <gcc-kpi-card
        label="Affichés"
        [value]="shownCountText()"
        hint="Départements affichés"
        tone="neutral"
        icon="visibility"
      />
    </div>

    <!-- Recherche -->
    <div class="mt-6 mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
      <mat-icon class="!h-5 !w-5 !text-[20px] text-slate-400">search</mat-icon>
      <input
        type="search"
        class="w-full border-0 bg-transparent py-2.5 text-sm text-navy outline-none placeholder:text-slate-400"
        placeholder="Rechercher un département…"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
        aria-label="Rechercher un département"
      />
    </div>

    @if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement des effectifs…
      </div>
    } @else if (filtered().length === 0) {
      <gcc-empty-state
        title="Aucun département trouvé"
        message="Ajustez la recherche pour afficher des résultats."
      />
    } @else {
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        @for (item of filtered(); track itemKey(item)) {
          <button
            type="button"
            class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            [disabled]="item.departmentId == null"
            (click)="openDetails(item)"
          >
            <div class="relative h-28 w-full overflow-hidden bg-slate-100">
              @if (item.departmentPhoto && item.departmentId != null) {
                <img [src]="photoUrl(item)" alt="" class="h-full w-full object-cover" loading="lazy" />
              } @else {
                <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                  <mat-icon class="!h-10 !w-10 !text-[40px]">domain</mat-icon>
                </div>
              }
            </div>
            <div class="flex flex-1 flex-col p-4">
              <h3 class="line-clamp-1 text-sm font-semibold text-navy">{{ departmentName(item) }}</h3>
              <p class="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <mat-icon class="!h-4 !w-4 !text-[16px]">groups</mat-icon>
                {{ nEmployee(item) }} {{ employeeWord(item) }}
              </p>
              <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span class="text-xs font-medium text-accent">Voir le détail</span>
                <span class="inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-accent">
                  {{ nEmployee(item) }}
                </span>
              </div>
            </div>
          </button>
        }
      </div>
    }
  `,
})
export class DepartmentEffectivePage {
  private readonly router = inject(Router);
  private readonly service = inject(DepartmentEffectiveService);
  private readonly auth = inject(AuthService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Effectifs' }];

  readonly departments = signal<DepartmentEffectiveItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  readonly canImport = computed(() => this.auth.user()?.permissions?.includes('IMPORT_ORG') ?? false);

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const rows = this.departments();
    if (!query) return rows;
    return rows.filter((item) =>
      (item.departmentName ?? 'Département inconnu').toLowerCase().includes(query),
    );
  });

  readonly totalEmployees = computed(() =>
    this.departments().reduce((sum, item) => sum + (Number(item.nEmployee) || 0), 0),
  );

  readonly assignedDepts = computed(() => this.departments().filter((item) => item.departmentId != null).length);

  readonly shownCount = computed(() => this.filtered().length);

  totalEmployeesText(): string {
    return String(this.totalEmployees());
  }

  assignedDeptsText(): string {
    return String(this.assignedDepts());
  }

  shownCountText(): string {
    return String(this.shownCount());
  }

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.departments.set(await this.service.load());
    } catch (error) {
      this.departments.set([]);
      this.error.set(
        `Erreur lors de la récupération des données : ${error instanceof Error ? error.message : 'erreur inconnue'}`,
      );
    } finally {
      this.loading.set(false);
    }
  }

  itemKey(item: DepartmentEffectiveItem): string {
    return item.departmentId != null ? String(item.departmentId) : `unknown-${item.departmentName ?? ''}`;
  }

  departmentName(item: DepartmentEffectiveItem): string {
    return item.departmentName || 'Département inconnu';
  }

  nEmployee(item: DepartmentEffectiveItem): number {
    return Number(item.nEmployee) || 0;
  }

  employeeWord(item: DepartmentEffectiveItem): string {
    return this.nEmployee(item) > 1 ? 'collaborateurs' : 'collaborateur';
  }

  photoUrl(item: DepartmentEffectiveItem): string {
    return this.service.photoUrl(item.departmentId);
  }

  openDetails(item: DepartmentEffectiveItem): void {
    if (item.departmentId == null) return;
    void this.router.navigate(['/soft-gcc/effectifs/details', item.departmentId]);
  }

  goImport(): void {
    void this.router.navigate(['/soft-gcc/effectifs/importer']);
  }

  goOrgChart(): void {
    void this.router.navigate(['/soft-gcc/organigramme']);
  }
}
