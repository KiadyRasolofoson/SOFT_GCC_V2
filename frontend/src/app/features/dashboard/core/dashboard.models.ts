/**
 * Couche Core (domaine) de la feature dashboard.
 * Miroir du dossier Domain du backend : uniquement des modèles et types,
 * aucune dépendance vers une autre couche.
 */

/** Résumé global du tableau de bord renvoyé par GET /Dashboard. */
export interface DashboardSummary {
  employeeTotal: number;
  wishEvolutionTotal: number;
  averageSkill: number;
  skillRepertory: number;
  activePosition: number;
  coverageRatios: number;
  allAttestationNumber: number;
}

/** Ton d'une carte KPI. */
export type KpiTone = 'neutral' | 'up' | 'down' | 'accent';

/** Carte KPI affichée sur le tableau de bord. */
export interface KpiItem {
  label: string;
  value: string;
  hint: string;
  tone: KpiTone;
  icon: string;
}

/** Couverture compétence par département. */
export interface DepartmentStat {
  name: string;
  count: number;
  rate: number;
}

/** Tranche d'âge de la pyramide des âges. */
export interface AgeDistribution {
  range: string;
  percentage: number;
}
