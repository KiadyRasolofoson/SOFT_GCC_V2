import { inject, Injectable, signal } from '@angular/core';
import { DashboardDataService } from '../infrastructure/dashboard.data.service';
import { AgeDistribution, DashboardSummary, DepartmentStat, KpiItem } from '../core/dashboard.models';

/**
 * Couche Application : cas d'usage du tableau de bord.
 * Ordonnance le chargement, mappe les données brutes (DTO) en modèles
 * d'affichage et expose l'état (signals) aux composants de présentation.
 */
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly data = inject(DashboardDataService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly kpis = signal<KpiItem[]>([]);

  /** Données de démonstration — à remplacer par GET /Dashboard/employeeSkillByDepartment. */
  readonly departmentStats = signal<DepartmentStat[]>([
    { name: 'Ressources Humaines', count: 24, rate: 92 },
    { name: 'DSI / Informatique', count: 86, rate: 85 },
    { name: 'Finance & Comptabilité', count: 42, rate: 78 },
    { name: 'Direction & Management', count: 18, rate: 95 },
    { name: 'Opérations & Production', count: 120, rate: 71 },
  ]);

  /** Données de démonstration — à remplacer par GET /Dashboard/employeeAgeDistribution. */
  readonly ageDistribution = signal<AgeDistribution[]>([
    { range: '< 25 ans', percentage: 12 },
    { range: '25-35 ans', percentage: 38 },
    { range: '35-45 ans', percentage: 28 },
    { range: '45-55 ans', percentage: 16 },
    { range: '55+ ans', percentage: 6 },
  ]);

  readonly currentYear = new Date().getFullYear();

  /** Charge le résumé global puis mappe les cartes KPI. */
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const summary = await this.data.loadSummary();
      this.kpis.set(this.toKpis(summary));
    } catch {
      this.error.set('Le serveur n’a pas pu renvoyer les indicateurs. Vérifiez vos droits ou réessayez.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Mappe le résumé brut de l'API en cartes KPI d'affichage. */
  private toKpis(data: DashboardSummary): KpiItem[] {
    return [
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
    ];
  }

  private formatNumber(value: number | null | undefined): string {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('fr-FR').format(Number(value));
  }
}
