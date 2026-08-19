import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { OrgChartService, OrgNode } from '../../core/org-chart.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { OrgChartComponent } from './components/org-chart.component';
import { ALL_DEPARTMENTS, collectDepartments, countNodes, getDepartmentBranches } from './org-chart.util';

@Component({
  selector: 'app-org-chart-page',
  imports: [GccPageHeader, GccKpiCard, GccEmptyState, GccSelect, OrgChartComponent, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Organigramme"
      subtitle="Hiérarchie managériale par département. Survolez une fiche pour plus de détails."
      icon="account_tree"
      [crumbs]="crumbs"
      secondaryLabel="Effectifs"
      secondaryIcon="arrow_back"
      (secondaryAction)="goEffectifs()"
      actionLabel="Actualiser"
      actionIcon="refresh"
      (action)="load()"
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
        label="Dans la vue"
        [value]="peopleText()"
        hint="Collaborateurs affichés"
        tone="up"
        icon="badge"
      />
      <gcc-kpi-card
        label="Branches"
        [value]="branchesText()"
        hint="Racines de l'arbre"
        tone="accent"
        icon="account_tree"
      />
      <gcc-kpi-card
        label="Filtre"
        [value]="selectedLabel()"
        hint="Département sélectionné"
        tone="neutral"
        icon="filter_alt"
      />
    </div>

    <!-- Coquille organigramme -->
    <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-canvas shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-4">
          <div class="min-w-[220px]">
            <label class="mb-1 block text-xs font-semibold text-slate-600">Département</label>
            <gcc-select
              [options]="departmentOptions()"
              [value]="selectedDepartment()"
              (valueChange)="onDepartmentChange($event)"
              placeholder="Tous les départements"
            />
          </div>
          <p class="text-xs text-slate-500">Cliquez sur « N+1 » pour développer ou réduire une branche.</p>
        </div>
        <div class="flex items-center gap-1">
          <button
            mat-stroked-button
            type="button"
            class="gcc-btn-secondary !h-9 !min-w-9 !rounded-xl !px-2"
            (click)="zoomOut()"
            title="Zoom arrière"
          >
            <mat-icon>zoom_out</mat-icon>
          </button>
          <button mat-stroked-button type="button" class="gcc-btn-secondary !h-9 !rounded-xl" (click)="zoomReset()">
            {{ scaleText() }}
          </button>
          <button
            mat-stroked-button
            type="button"
            class="gcc-btn-secondary !h-9 !min-w-9 !rounded-xl !px-2"
            (click)="zoomIn()"
            title="Zoom avant"
          >
            <mat-icon>zoom_in</mat-icon>
          </button>
        </div>
      </div>

      <div
        class="overflow-auto p-6"
        style="
          min-height: 420px;
          background-color: #f8fafc;
          background-image: radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0);
          background-size: 20px 20px;
        "
      >
        @if (loading()) {
          <div class="py-16 text-center text-sm text-slate-500">Chargement de l'organigramme…</div>
        } @else if (error()) {
          <gcc-empty-state
            variant="error"
            title="Impossible de charger l'organigramme"
            [message]="error() ?? ''"
          />
        } @else if (filteredRoots().length === 0) {
          <gcc-empty-state
            title="Aucune branche pour ce département"
            message="Changez de filtre ou actualisez les données."
          />
        } @else {
          <app-org-chart [nodes]="filteredRoots()" [scale]="scale()" />
        }
      </div>
    </div>
  `,
})
export class OrgChartPage {
  private readonly router = inject(Router);
  private readonly service = inject(OrgChartService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Effectifs' }, { label: 'Organigramme' }];

  readonly orgRoots = signal<OrgNode[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedDepartment = signal<string>(ALL_DEPARTMENTS);
  readonly scale = signal(1);

  readonly departments = computed(() => collectDepartments(this.orgRoots()));

  readonly departmentOptions = computed(() => [
    { label: 'Tous les départements', value: ALL_DEPARTMENTS },
    ...this.departments().map((dept) => ({ label: dept.label, value: dept.key })),
  ]);

  readonly filteredRoots = computed(() =>
    getDepartmentBranches(this.orgRoots(), this.selectedDepartment()),
  );

  readonly totalPeople = computed(() =>
    this.filteredRoots().reduce((sum, root) => sum + countNodes(root), 0),
  );

  readonly branchCount = computed(() => this.filteredRoots().length);

  readonly selectedLabel = computed(() => {
    if (this.selectedDepartment() === ALL_DEPARTMENTS) return 'Tous les départements';
    return this.departments().find((dept) => dept.key === this.selectedDepartment())?.label || 'Département';
  });

  readonly scaleText = computed(() => `${Math.round(this.scale() * 100)}%`);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const roots = await this.service.load();
      this.orgRoots.set(roots);
    } catch (error) {
      this.orgRoots.set([]);
      this.error.set(
        `Erreur lors de la récupération des données : ${error instanceof Error ? error.message : 'erreur inconnue'}`,
      );
    } finally {
      this.loading.set(false);
    }
  }

  onDepartmentChange(value: string | null): void {
    this.selectedDepartment.set(value ?? ALL_DEPARTMENTS);
  }

  zoomIn(): void {
    this.scale.set(Math.min(1.4, Number((this.scale() + 0.1).toFixed(2))));
  }

  zoomOut(): void {
    this.scale.set(Math.max(0.6, Number((this.scale() - 0.1).toFixed(2))));
  }

  zoomReset(): void {
    this.scale.set(1);
  }

  peopleText(): string {
    return String(this.totalPeople());
  }

  branchesText(): string {
    return String(this.branchCount());
  }

  goEffectifs(): void {
    void this.router.navigate(['/soft-gcc/effectifs']);
  }
}
