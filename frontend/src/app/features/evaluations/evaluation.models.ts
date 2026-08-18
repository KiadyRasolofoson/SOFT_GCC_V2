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
