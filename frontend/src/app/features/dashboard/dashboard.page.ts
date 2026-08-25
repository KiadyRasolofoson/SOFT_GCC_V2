import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';
import { DashboardFacade } from './application/dashboard.facade';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccPageHeader } from '../../ui/gcc-page-header';

@Component({
  selector: 'app-dashboard-page',
  imports: [GccPageHeader, GccKpiCard, GccEmptyState, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Tableau de bord RH"
      subtitle="Vue d'ensemble et indicateurs de performance des compétences et carrières."
      icon="dashboard"
      [crumbs]="crumbs"
      actionLabel="Exporter le bilan"
      actionIcon="download"
    />

    <!-- Welcome & Context Banner -->
    <div class="mb-6 rounded-2xl bg-gradient-to-r from-navy via-slate-900 to-indigo-950 p-6 text-white shadow-md relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-accent/20 blur-2xl pointer-events-none"></div>
      <div class="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-md mb-2">
            <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Système Synchro & Référentiel Actif</span>
          </div>
          <h2 class="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Bienvenue, {{ auth.displayName() }}
          </h2>
          <p class="mt-1 text-xs text-slate-300 max-w-xl">
            Consultez ci-dessous les métriques consolidées des effectifs, le taux de couverture des compétences et le suivi des demandes d'évolution.
          </p>
        </div>
        <div class="shrink-0">
          <div class="rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/10 text-center">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-300">Période Active</p>
            <p class="text-sm font-extrabold text-white mt-0.5">Année {{ currentYear }}</p>
          </div>
        </div>
      </div>
    </div>

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger le tableau de bord"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="facade.load()"
      />
    } @else {
      <!-- KPI Cards Grid -->
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (kpi of kpis(); track kpi.label) {
          <gcc-kpi-card
            [label]="kpi.label"
            [value]="kpi.value"
            [hint]="kpi.hint"
            [tone]="kpi.tone"
            [icon]="kpi.icon"
          />
        }
      </div>

      <!-- Graphical Analytics & Breakdown Widgets -->
      <div class="mt-8 grid gap-6 lg:grid-cols-12">
        <!-- Widget 1: Competence Coverage by Department -->
        <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-7">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h3 class="text-base font-bold text-navy">Couverture par Département</h3>
              <p class="text-xs text-slate-500">Taux moyen des compétences acquises vs requises</p>
            </div>
            <span class="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-accent">
              5 Départements
            </span>
          </div>

          <div class="space-y-4">
            @for (dept of departmentStats(); track dept.name) {
              <div>
                <div class="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span class="text-navy">{{ dept.name }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-slate-500 font-normal">{{ dept.count }} employés</span>
                    <span
                      class="rounded-md px-1.5 py-0.5 text-[11px] font-bold"
                      [class]="dept.rate >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                    >
                      {{ dept.rate }}%
                    </span>
                  </div>
                </div>
                <div class="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    [class]="dept.rate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'"
                    [style.width.%]="dept.rate"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Widget 2: Age Distribution & Tenure -->
        <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-5">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h3 class="text-base font-bold text-navy">Pyramide des Âges</h3>
              <p class="text-xs text-slate-500">Répartition des effectifs par tranche d'âge</p>
            </div>
            <mat-icon class="!h-5 !w-5 !text-[20px] text-slate-400">pie_chart</mat-icon>
          </div>

          <div class="space-y-3.5">
            @for (age of ageDistribution(); track age.range) {
              <div class="flex items-center gap-3">
                <span class="w-20 text-xs font-semibold text-slate-600 shrink-0">{{ age.range }}</span>
                <div class="flex-1 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-accent to-indigo-500"
                    [style.width.%]="age.percentage"
                  ></div>
                </div>
                <span class="w-12 text-right text-xs font-bold text-navy shrink-0">{{ age.percentage }}%</span>
              </div>
            }
          </div>

          <div class="mt-6 rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between text-xs">
            <span class="text-slate-600 font-medium">Ancienneté Moyenne</span>
            <span class="font-bold text-navy text-sm">4.8 ans</span>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardPage implements OnInit {
  /** Couche présentation (contrôleur) : n'expose que l'état de la facade. */
  readonly facade = inject(DashboardFacade);
  readonly auth = inject(AuthService);

  readonly currentYear = this.facade.currentYear;
  readonly kpis = this.facade.kpis;
  readonly error = this.facade.error;
  readonly departmentStats = this.facade.departmentStats;
  readonly ageDistribution = this.facade.ageDistribution;
  readonly crumbs = [{ label: 'Tableau de bord' }];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<DashboardSummary>(`${environment.apiUrl}/Dashboard`).subscribe({
      next: (data) => {
        this.kpis.set([
          {
            label: 'Total employés',
            value: this.formatNumber(data.employeeTotal),
            hint: 'Effectif global consolidé',
            tone: 'up',
            icon: 'groups',
          },
          {
            label: 'Compétences répertoriées',
            value: this.formatNumber(data.skillRepertory),
            hint: 'Référentiel d’entreprise active',
            tone: 'accent',
            icon: 'star',
          },
          {
            label: 'Postes actifs',
            value: this.formatNumber(data.activePosition),
            hint: 'Positions RH ouvertes',
            tone: 'neutral',
            icon: 'work',
          },
          {
            label: 'Taux de couverture',
            value: `${this.formatNumber(data.coverageRatios)} %`,
            hint: 'Titulaires à niveau (critiques et requises)',
            tone: 'down',
            icon: 'insights',
          },
          {
            label: 'Demandes d’évolution',
            value: this.formatNumber(data.wishEvolutionTotal),
            hint: 'Souhaits de carrière en cours',
            tone: 'accent',
            icon: 'trending_up',
          },
          {
            label: 'Attestations générées',
            value: this.formatNumber(data.allAttestationNumber),
            hint: 'Documents officiels produits',
            tone: 'neutral',
            icon: 'workspace_premium',
          },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Le serveur n’a pas pu renvoyer les indicateurs. Vérifiez vos droits ou réessayez.');
        this.loading.set(false);
      },
    });
  }

  private formatNumber(value: number | null | undefined): string {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(value));
  }
}
