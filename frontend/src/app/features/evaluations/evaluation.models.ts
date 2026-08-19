export interface EmployeeNotationRow {
  employeeId: number;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  evaluationId: number | null;
  evaluationDate: string | null;
  overallScore: number | null;
  evaluationComments: string | null;
  weaknesses: string | null;
  strengths: string | null;
  isServiceApproved: boolean | null;
  isDgApproved: boolean | null;
  evaluationType: string | null;
  positionId: number | null;
  state: number | null;
}

export interface PaginatedEmployees {
  employees: EmployeeNotationRow[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PositionOption {
  positionId: number;
  positionName: string;
}

export interface DepartmentOption {
  departmentId: number;
  name: string;
}

export interface EvaluationDetails {
  evaluationId: number;
  title: string;
  description: string;
  employeeName: string;
  position: string;
  department: string;
  evaluationTypeId: number;
}

export interface SelectedQuestion {
  questionId: number;
  questionText: string;
  competenceLineId: number | null;
  competenceName: string;
  responseType: string | null;
  responseValue: string | null;
  isCorrect: boolean;
  maxTimeInMinutes: number;
}

export interface QuestionOption {
  optionId: number;
  questionId: number;
  optionText: string;
  isCorrect: boolean;
}

export interface ReferenceAnswer {
  referenceAnswerId: number;
  questionId: number;
  referenceText: string;
  evaluationGuidelines: string;
  expectedKeyPoints: string;
  keyPoints?: string;
}

export interface MultiCriteriaRating {
  questionId: number;
  relevance?: number | null;
  technical?: number | null;
  clarity?: number | null;
  comment?: string | null;
  overallRating: number;
}

export interface EvaluationResultsPayload {
  evaluationId: number;
  ratings: Record<number, number>;
  detailedRatings?: MultiCriteriaRating[];
  overallScore: number;
  strengths: string;
  weaknesses: string;
  generalEvaluation: string;
}

export interface EvaluationValidationPayload {
  evaluationId: number;
  isServiceApproved: boolean;
  isDgApproved: boolean;
  serviceApprovalDate: string | null;
  dgApprovalDate: string | null;
}

export interface TrainingSuggestion {
  training: string;
  details: string;
  question: string;
}

export interface NotationRemarks {
  strengths: string;
  weaknesses: string;
  generalEvaluation: string;
}

export interface NotationValidation {
  serviceApproved: boolean;
  dgApproved: boolean;
  serviceDate: string;
  dgDate: string;
}

export type NotationStatusKey = 'none' | 'toGrade' | 'expert' | 'validated';

export interface NotationStatus {
  key: NotationStatusKey;
  kind: 'pending' | 'gap' | 'processed' | 'validated';
  label: string;
}

export function employeeFullName(row: Pick<EmployeeNotationRow, 'firstName' | 'lastName'>): string {
  return `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || 'Employé';
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function notationStatus(row: EmployeeNotationRow): NotationStatus {
  if (!row.evaluationId) {
    return { key: 'none', kind: 'pending', label: 'Aucune évaluation' };
  }
  if (row.isServiceApproved && row.isDgApproved) {
    return { key: 'validated', kind: 'validated', label: 'Validé' };
  }
  if (row.isServiceApproved) {
    return { key: 'expert', kind: 'processed', label: 'Validé expert' };
  }
  return { key: 'toGrade', kind: 'gap', label: 'À noter' };
}

export function parseEmployeeName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: 'Employé', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function ratingLabel(score: number): string {
  if (score >= 5) return 'Excellent';
  if (score >= 4) return 'Bien';
  if (score >= 3) return 'Moyen';
  if (score >= 2) return 'Faible';
  if (score >= 1) return 'Insuffisant';
  return 'Non noté';
}

export function averageOf(ratings: Record<number, number>): number {
  const values = Object.values(ratings).filter((n) => Number.isFinite(n));
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 100) / 100;
}

export function lookupById<T>(map: Record<string, T> | Record<number, T> | null | undefined, id: number): T | undefined {
  if (!map) return undefined;
  const record = map as Record<string, T>;
  return record[id] ?? record[String(id)];
}

export interface PlanningEmployee {
  employeeId: number;
  firstName: string;
  lastName: string;
  position: string | null;
  positionId: number | null;
  department: string | null;
  departmentId: number | null;
}

export interface PaginatedPlanningEmployees {
  employees?: PlanningEmployee[];
  Employees?: PlanningEmployee[];
  totalPages?: number;
  TotalPages?: number;
  currentPage?: number;
  pageSize?: number;
}

export interface PlannedEvaluation {
  evaluationId: number;
  employeeId: number;
  employeeFirstName: string;
  employeeLastName: string;
  positionName: string;
  departmentName: string;
  evaluationTypeId: number;
  evaluationTypeName: string;
  startDate: string;
  endDate: string;
  state: number;
}

export interface PaginatedPlannedEvaluations {
  evaluations?: PlannedEvaluation[];
  Evaluations?: PlannedEvaluation[];
  totalPages?: number;
  TotalPages?: number;
}

export interface EvaluationTypeOption {
  evaluationTypeId: number;
  designation: string;
}

export interface SupervisorOption {
  id: number;
  firstName: string;
  lastName: string;
}

export interface CompetenceLineOption {
  competenceLineId: number;
  skillName: string;
  description: string | null;
  positionId: number;
}

export interface PlanningQuestion {
  questionId: number;
  question: string;
  competenceLineId: number | null;
}

export interface DurationRecommendation {
  days: number;
  weeks: number;
  remainingDays: number;
  weeksDisplay: string;
  justification: string;
  isCurrentDurationSufficient: boolean;
  factorsConsidered: string[];
}

export interface CalculateDurationRequest {
  employeeCount: number;
  evaluationTypeId: number;
  positionIds: number[];
  currentDurationDays: number | null;
  averageQuestionsPerEmployee: number;
  totalCompetences: number;
  supervisorCount: number;
}

export interface PlanningQuestionPick {
  questionId: number;
  competenceLineId: number | null;
}

export interface CreateEvaluationWithQuestionsPayload {
  evaluationTypeId: number;
  supervisorIds: number[];
  startDate: string;
  endDate: string;
  enableReminders: boolean;
  employeeQuestions: {
    employeeId: number;
    evaluationTypeId: number;
    positionId: number;
    selectedQuestions: PlanningQuestionPick[];
  }[];
}

export interface CreateEvaluationsResult {
  evaluationIds?: number[];
  message?: string;
}

export interface ConfigureRemindersPayload {
  evaluationIds: number[];
  isEnabled: boolean;
}

export type QuestionSelectionMap = Record<number, Record<number, number[]>>;

export function planningEmployeeName(row: Pick<PlanningEmployee, 'firstName' | 'lastName'>): string {
  return `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || 'Employé';
}

export function plannedEmployeeName(row: Pick<PlannedEvaluation, 'employeeFirstName' | 'employeeLastName'>): string {
  return `${row.employeeFirstName ?? ''} ${row.employeeLastName ?? ''}`.trim() || 'Employé';
}

export function toLocalDateTimeInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function datesFromWeeks(weeks: number): { start: string; end: string } {
  const start = new Date();
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + Math.max(weeks, 1) * 7 - 1);
  end.setHours(18, 0, 0, 0);
  return { start: toLocalDateTimeInput(start), end: toLocalDateTimeInput(end) };
}

export function weeksFromDates(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.ceil(days / 7));
}

export function durationInDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function selectedQuestionCount(selection: QuestionSelectionMap, employeeId: number): number {
  const byCompetence = selection[employeeId] ?? {};
  return Object.values(byCompetence).reduce((sum, ids) => sum + ids.length, 0);
}

export const INTERVIEW_STATUS = {
  planned: 10,
  inProgress: 20,
  pendingValidation: 25,
  completed: 30,
  rejected: 40,
  cancelled: 50,
} as const;

export type InterviewStatusCode = (typeof INTERVIEW_STATUS)[keyof typeof INTERVIEW_STATUS];

export type InterviewStatusKey =
  | 'none'
  | 'planned'
  | 'today'
  | 'missed'
  | 'inProgress'
  | 'pending'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface InterviewEmployeeRow {
  employeeId: number;
  firstName: string;
  lastName: string;
  position: string | null;
  positionId: number | null;
  department: string | null;
  departmentId: number | null;
  evaluationId: number | null;
  interviewDate: string | null;
  interviewStatus: number | null;
  overallScore: number | null;
  managerApproval: boolean | null;
  directorApproval: boolean | null;
  managerComments: string | null;
  directorComments: string | null;
}

export interface PaginatedInterviewEmployees {
  employees?: InterviewEmployeeRow[];
  Employees?: InterviewEmployeeRow[];
  totalPages?: number;
  TotalPages?: number;
  currentPage?: number;
  CurrentPage?: number;
  pageSize?: number;
  PageSize?: number;
}

export interface InterviewParticipantOption {
  id: number;
  employeeId: number | null;
  firstName: string;
  lastName: string;
  roleId: number | null;
  role: string | null;
}

export interface InterviewRecord {
  interviewId: number;
  evaluationId: number;
  interviewDate: string | null;
  status: number;
  notes: string | null;
  managerApproval: boolean | null;
  managerComments: string | null;
  directorApproval: boolean | null;
  directorComments: string | null;
}

export interface ScheduleInterviewPayload {
  evaluationId: number;
  scheduledDate: string;
  participants: number[];
  employeeId: number;
  sendEmails: boolean;
}

export interface CompleteInterviewPayload {
  managerApproval?: boolean | null;
  managerComments?: string | null;
  directorApproval?: boolean | null;
  directorComments?: string | null;
  notes?: string | null;
  status?: number | null;
}

export interface UpdateInterviewPayload {
  newDate?: string | null;
  newParticipantIds?: number[] | null;
  newStatus?: number | null;
}

export interface InterviewObjective {
  description: string;
  dueDate: string;
  indicator: string;
  status: string;
  completionRate: number;
  lastModified: string;
  progressHistory: InterviewProgressEntry[];
}

export interface InterviewProgressEntry {
  date: string;
  oldStatus: string;
  newStatus: string;
  oldCompletionRate: number;
  newCompletionRate: number;
}

export interface InterviewNotes {
  general: {
    date: string;
    location: string;
    context: string;
  };
  previousPeriod: {
    achievements: string;
    challenges: string;
    previousObjectivesAchieved: string;
    feedback: string;
  };
  skills: unknown[];
  objectives: InterviewObjective[];
  developmentPlan: {
    trainingNeeds: string;
    careerAspiration: string;
    notes: string;
  };
  globalNotes: string;
  overallRating: number;
}

export interface InterviewStatusMeta {
  key: InterviewStatusKey;
  kind: 'pending' | 'validated' | 'refused' | 'gap' | 'ok' | 'processed';
  label: string;
}

export const OBJECTIVE_STATUS_OPTIONS = [
  { label: 'Non commencé', value: 'Non commencé' },
  { label: 'En cours', value: 'En cours' },
  { label: 'Atteint', value: 'Atteint' },
  { label: 'Non atteint', value: 'Non atteint' },
] as const;

export function emptyInterviewNotes(date = todayIsoDate()): InterviewNotes {
  return {
    general: { date, location: '', context: '' },
    previousPeriod: {
      achievements: '',
      challenges: '',
      previousObjectivesAchieved: '',
      feedback: '',
    },
    skills: [],
    objectives: [emptyInterviewObjective()],
    developmentPlan: { trainingNeeds: '', careerAspiration: '', notes: '' },
    globalNotes: '',
    overallRating: 0,
  };
}

export function emptyInterviewObjective(): InterviewObjective {
  return {
    description: '',
    dueDate: '',
    indicator: '',
    status: 'Non commencé',
    completionRate: 0,
    lastModified: new Date().toISOString(),
    progressHistory: [],
  };
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidInterviewDate(value: string | null | undefined): boolean {
  if (!value || !String(value).trim()) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() >= 2000;
}

export function interviewDayKind(value: string | null | undefined): 'none' | 'past' | 'today' | 'future' {
  if (!isValidInterviewDate(value)) return 'none';
  const date = new Date(value!);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (day === today) return 'today';
  if (day < today) return 'past';
  return 'future';
}

export function interviewStatusMeta(row: Pick<InterviewEmployeeRow, 'interviewDate' | 'interviewStatus'>): InterviewStatusMeta {
  const status = row.interviewStatus;
  const day = interviewDayKind(row.interviewDate);

  if (status == null && !isValidInterviewDate(row.interviewDate)) {
    return { key: 'none', kind: 'pending', label: 'À planifier' };
  }
  if (status === INTERVIEW_STATUS.cancelled) {
    return { key: 'cancelled', kind: 'processed', label: 'Annulé' };
  }
  if (status === INTERVIEW_STATUS.rejected) {
    return { key: 'rejected', kind: 'refused', label: 'Refusé' };
  }
  if (status === INTERVIEW_STATUS.completed) {
    return { key: 'completed', kind: 'validated', label: 'Terminé' };
  }
  if (status === INTERVIEW_STATUS.pendingValidation) {
    return { key: 'pending', kind: 'gap', label: 'En validation' };
  }
  if (status === INTERVIEW_STATUS.inProgress) {
    return { key: 'inProgress', kind: 'processed', label: 'En cours' };
  }
  if (status === INTERVIEW_STATUS.planned || isValidInterviewDate(row.interviewDate)) {
    if (day === 'today') return { key: 'today', kind: 'ok', label: 'Aujourd’hui' };
    if (day === 'past') return { key: 'missed', kind: 'refused', label: 'Manqué' };
    return { key: 'planned', kind: 'pending', label: 'Planifié' };
  }
  return { key: 'none', kind: 'pending', label: 'À planifier' };
}

export function parseInterviewNotes(raw: string | null | undefined): InterviewNotes {
  const fallback = emptyInterviewNotes();
  if (!raw?.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<InterviewNotes>;
    return {
      general: {
        date: parsed.general?.date || fallback.general.date,
        location: parsed.general?.location ?? '',
        context: parsed.general?.context ?? '',
      },
      previousPeriod: {
        achievements: parsed.previousPeriod?.achievements ?? '',
        challenges: parsed.previousPeriod?.challenges ?? '',
        previousObjectivesAchieved: parsed.previousPeriod?.previousObjectivesAchieved ?? '',
        feedback: parsed.previousPeriod?.feedback ?? '',
      },
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      objectives:
        Array.isArray(parsed.objectives) && parsed.objectives.length
          ? parsed.objectives.map((item) => ({
              description: item.description ?? '',
              dueDate: item.dueDate ?? '',
              indicator: item.indicator ?? '',
              status: item.status || 'Non commencé',
              completionRate: Number(item.completionRate) || 0,
              lastModified: item.lastModified || new Date().toISOString(),
              progressHistory: Array.isArray(item.progressHistory) ? item.progressHistory : [],
            }))
          : [emptyInterviewObjective()],
      developmentPlan: {
        trainingNeeds: parsed.developmentPlan?.trainingNeeds ?? '',
        careerAspiration: parsed.developmentPlan?.careerAspiration ?? '',
        notes: parsed.developmentPlan?.notes ?? '',
      },
      globalNotes: parsed.globalNotes ?? '',
      overallRating: Number(parsed.overallRating) || 0,
    };
  } catch {
    return fallback;
  }
}

export function syncObjectiveProgress(objective: InterviewObjective, field: 'status' | 'completionRate'): InterviewObjective {
  const next = { ...objective, lastModified: new Date().toISOString() };
  if (field === 'status') {
    if (next.status === 'Atteint') next.completionRate = 100;
    else if (next.status === 'Non commencé' || next.status === 'Non atteint') next.completionRate = 0;
  }
  if (field === 'completionRate') {
    if (next.completionRate >= 100) {
      next.status = 'Atteint';
      next.completionRate = 100;
    } else if (next.completionRate > 0 && next.status === 'Non commencé') {
      next.status = 'En cours';
    }
  }
  return next;
}

export function participantLabel(row: Pick<InterviewParticipantOption, 'firstName' | 'lastName'>): string {
  return `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || 'Participant';
}

export function roleLabel(roleId: number | null | undefined, fallback?: string | null): string {
  if (fallback?.trim()) return fallback;
  if (roleId === 2) return 'Manager';
  if (roleId === 4) return 'Directeur';
  return 'Participant';
}

export function hasFunctionalPermission(permissions: string[] | undefined, name: string): boolean {
  const needle = name.trim().toUpperCase();
  return (permissions ?? []).some((item) => String(item).trim().toUpperCase() === needle);
}

export const EVALUATION_HISTORY_STATUS = {
  planned: 10,
  inProgress: 20,
  completed: 30,
  cancelled: 40,
} as const;

export interface EvaluationHistoryRow {
  evaluationId: number;
  firstName: string;
  lastName: string;
  position: string | null;
  evaluationType: string | null;
  startDate: string | null;
  endDate: string | null;
  overallScore: number | null;
  status: number | null;
  recommendations: string | null;
}

export interface PaginatedEvaluationHistory {
  evaluations?: EvaluationHistoryRow[];
  Evaluations?: EvaluationHistoryRow[];
  totalPages?: number;
  TotalPages?: number;
  currentPage?: number;
  CurrentPage?: number;
  pageSize?: number;
  PageSize?: number;
}

export interface HistoryQuestionDetail {
  questionId: number;
  question: string;
  score: number | null;
}

export interface EvaluationHistoryDetail {
  evaluationId: number;
  firstName: string;
  lastName: string;
  position: string | null;
  evaluationType: string | null;
  startDate: string | null;
  endDate: string | null;
  overallScore: number | null;
  evaluationComments: string | null;
  strengths: string | null;
  weaknesses: string | null;
  department: string | null;
  interviewDate: string | null;
  interviewStatus: number | null;
  recommendations: string | null;
  participants: string[];
  questionDetails: HistoryQuestionDetail[];
}

export interface HistoryDistributionItem {
  label: string;
  value: number;
  averageScore: number;
}

export interface HistoryScoreDistribution {
  low: number;
  medium: number;
  high: number;
  average: number;
  min: number;
  max: number;
}

export interface HistoryTrend {
  isIncreasing: boolean;
  percentageChange: number;
  startValue: number;
  endValue: number;
  standardDeviation: number;
}

export interface HistoryGlobalStats {
  totalEvaluationsCount: number;
  averageScore: number;
  participationRate: number;
  approvalRate: number;
  departmentDistribution: HistoryDistributionItem[];
  evaluationTypeDistribution: HistoryDistributionItem[];
  trendData: HistoryTrend;
  scoreDistribution: HistoryScoreDistribution;
}

export interface HistoryYearlyPerformance {
  year: number;
  averageScore: number;
  evaluationCount: number;
}

export interface HistoryListQuery {
  pageNumber: number;
  pageSize: number;
  startDate?: string | null;
  endDate?: string | null;
  evaluationType?: string | null;
  department?: string | null;
  employeeName?: string | null;
}

export interface HistoryStatusMeta {
  kind: 'pending' | 'validated' | 'refused' | 'gap' | 'ok' | 'processed';
  label: string;
}

export function historyEmployeeName(row: Pick<EvaluationHistoryRow, 'firstName' | 'lastName'>): string {
  return `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || 'Employé';
}

export function historyStatusMeta(status: number | null | undefined): HistoryStatusMeta {
  switch (status) {
    case EVALUATION_HISTORY_STATUS.planned:
      return { kind: 'pending', label: 'Planifiée' };
    case EVALUATION_HISTORY_STATUS.inProgress:
      return { kind: 'processed', label: 'En cours' };
    case EVALUATION_HISTORY_STATUS.completed:
      return { kind: 'validated', label: 'Terminée' };
    case EVALUATION_HISTORY_STATUS.cancelled:
      return { kind: 'refused', label: 'Annulée' };
    case 50:
      return { kind: 'processed', label: 'Annulée' };
    default:
      return { kind: 'pending', label: 'Non défini' };
  }
}

export function historyInterviewStatusMeta(status: number | null | undefined): HistoryStatusMeta {
  switch (status) {
    case INTERVIEW_STATUS.planned:
      return { kind: 'pending', label: 'Planifié' };
    case INTERVIEW_STATUS.inProgress:
      return { kind: 'processed', label: 'En cours' };
    case INTERVIEW_STATUS.pendingValidation:
      return { kind: 'gap', label: 'En validation' };
    case INTERVIEW_STATUS.completed:
      return { kind: 'validated', label: 'Terminé' };
    case INTERVIEW_STATUS.rejected:
      return { kind: 'refused', label: 'Refusé' };
    case INTERVIEW_STATUS.cancelled:
      return { kind: 'processed', label: 'Annulé' };
    default:
      return { kind: 'pending', label: 'Non renseigné' };
  }
}

export function formatScore(score: number | null | undefined, digits = 1): string {
  if (score == null || Number.isNaN(Number(score))) return '—';
  return Number(score).toFixed(digits);
}

export function scoreFillPercent(score: number | null | undefined): number {
  if (score == null || Number.isNaN(Number(score))) return 0;
  return Math.max(0, Math.min(100, (Number(score) / 5) * 100));
}

export function scoreToneClass(score: number | null | undefined): string {
  if (score == null) return 'bg-slate-200';
  if (score >= 4) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
  if (score >= 3) return 'bg-gradient-to-r from-accent to-indigo-500';
  return 'bg-gradient-to-r from-amber-500 to-orange-500';
}

export function scoreBadgeClass(score: number | null | undefined): string {
  if (score == null) return 'bg-slate-50 text-slate-500 border border-slate-200/80';
  if (score >= 4) return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
  if (score >= 3) return 'bg-indigo-50 text-indigo-700 border border-indigo-200/80';
  return 'bg-amber-50 text-amber-700 border border-amber-200/80';
}

export function emptyHistoryStats(): HistoryGlobalStats {
  return {
    totalEvaluationsCount: 0,
    averageScore: 0,
    participationRate: 0,
    approvalRate: 0,
    departmentDistribution: [],
    evaluationTypeDistribution: [],
    trendData: {
      isIncreasing: false,
      percentageChange: 0,
      startValue: 0,
      endValue: 0,
      standardDeviation: 0,
    },
    scoreDistribution: { low: 0, medium: 0, high: 0, average: 0, min: 0, max: 0 },
  };
}

export interface DirectoryEmployee {
  employeeId: number;
  firstName: string;
  lastName: string;
}

export interface ObjectiveSummaryRow {
  interviewId: number;
  evaluationId: number;
  employeeId: number;
  employeeName: string;
  department: string;
  position: string;
  description: string;
  dueDate: string | null;
  indicator: string | null;
  status: string;
  completionRate: number;
  objectiveIndex: number;
  lastModified: string | null;
  progressHistoryCount: number;
  progressHistory: InterviewProgressEntry[];
}

export interface ObjectivesStatistics {
  totalObjectives: number;
  achievedObjectives: number;
  inProgressObjectives: number;
  notStartedObjectives: number;
  notAchievedObjectives: number;
  averageCompletionRate: number;
  globalAchievementRate: number;
}

export interface PaginatedObjectivesSummary {
  objectives?: ObjectiveSummaryRow[];
  Objectives?: ObjectiveSummaryRow[];
  statistics?: ObjectivesStatistics;
  Statistics?: ObjectivesStatistics;
  totalCount?: number;
  TotalCount?: number;
}

export interface ObjectivesListQuery {
  pageNumber: number;
  pageSize: number;
  departmentId?: number | null;
  employeeId?: number | null;
  statusFilter?: string | null;
  searchQuery?: string | null;
}

export interface UpdateObjectiveStatusPayload {
  objectiveIndex: number;
  status: string;
  completionRate: number;
}

export function emptyObjectivesStats(): ObjectivesStatistics {
  return {
    totalObjectives: 0,
    achievedObjectives: 0,
    inProgressObjectives: 0,
    notStartedObjectives: 0,
    notAchievedObjectives: 0,
    averageCompletionRate: 0,
    globalAchievementRate: 0,
  };
}

export function objectiveRowKey(row: Pick<ObjectiveSummaryRow, 'interviewId' | 'objectiveIndex'>): string {
  return `${row.interviewId}_${row.objectiveIndex}`;
}

export function objectiveStatusMeta(status: string | null | undefined): HistoryStatusMeta {
  switch (status) {
    case 'Atteint':
      return { kind: 'validated', label: 'Atteint' };
    case 'En cours':
      return { kind: 'processed', label: 'En cours' };
    case 'Non atteint':
      return { kind: 'refused', label: 'Non atteint' };
    default:
      return { kind: 'pending', label: 'Non commencé' };
  }
}

export function isObjectiveOverdue(row: Pick<ObjectiveSummaryRow, 'dueDate' | 'status'>): boolean {
  if (!row.dueDate || row.status === 'Atteint' || row.status === 'Non atteint') return false;
  const due = new Date(row.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return day < today;
}

export function progressToneClass(rate: number | null | undefined): string {
  const value = Number(rate) || 0;
  if (value >= 80) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
  if (value >= 40) return 'bg-gradient-to-r from-accent to-indigo-500';
  if (value > 0) return 'bg-gradient-to-r from-amber-500 to-orange-500';
  return 'bg-slate-300';
}

export function directoryEmployeeName(row: Pick<DirectoryEmployee, 'firstName' | 'lastName'>): string {
  return `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || 'Employé';
}
