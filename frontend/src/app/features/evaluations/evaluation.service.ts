import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CalculateDurationRequest,
  CompetenceLineOption,
  CompleteInterviewPayload,
  ConfigureRemindersPayload,
  CreateEvaluationsResult,
  CreateEvaluationWithQuestionsPayload,
  DepartmentOption,
  DirectoryEmployee,
  DurationRecommendation,
  EvaluationDetails,
  EvaluationHistoryDetail,
  EvaluationHistoryRow,
  EvaluationResultsPayload,
  EvaluationTypeOption,
  EvaluationValidationPayload,
  HistoryDistributionItem,
  HistoryGlobalStats,
  HistoryListQuery,
  HistoryQuestionDetail,
  HistoryScoreDistribution,
  HistoryTrend,
  HistoryYearlyPerformance,
  InterviewEmployeeRow,
  InterviewParticipantOption,
  InterviewProgressEntry,
  InterviewRecord,
  InterviewStatistics,
  NotationStatistics,
  ObjectiveSummaryRow,
  ObjectivesListQuery,
  ObjectivesStatistics,
  PaginatedEmployees,
  PaginatedEvaluationHistory,
  PaginatedInterviewEmployees,
  PaginatedObjectivesSummary,
  PaginatedPlannedEvaluations,
  PaginatedPlanningEmployees,
  PlanningEmployee,
  PlanningQuestion,
  PlannedEvaluation,
  PositionOption,
  QuestionOption,
  ReferenceAnswer,
  ScheduleInterviewPayload,
  SelectedQuestion,
  SupervisorOption,
  TrainingSuggestion,
  UpdateInterviewPayload,
  UpdateObjectiveStatusPayload,
  emptyHistoryStats,
  emptyObjectivesStats,
} from './evaluation.models';

export interface EmployeeListQuery {
  pageNumber: number;
  pageSize: number;
  search?: string;
  position?: number | null;
  department?: number | null;
  sortBy?: string | null;
  sortDirection?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getEmployeesToGrade(query: EmployeeListQuery): Observable<PaginatedEmployees> {
    let params = new HttpParams()
      .set('pageNumber', String(query.pageNumber))
      .set('pageSize', String(query.pageSize));

    if (query.search) params = params.set('search', query.search);
    if (query.position) params = params.set('position', String(query.position));
    if (query.department) params = params.set('department', String(query.department));
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortDirection) params = params.set('sortDirection', query.sortDirection);

    return this.http.get<PaginatedEmployees>(`${this.api}/User/vemployee-details-paginated`, { params });
  }

  getPositions(): Observable<PositionOption[]> {
    return this.http.get<PositionOption[]>(`${this.api}/EvaluationPlanning/positions`);
  }

  getDepartments(): Observable<DepartmentOption[]> {
    return this.http.get<DepartmentOption[]>(`${this.api}/EvaluationPlanning/departments`);
  }

  getEvaluation(evaluationId: number): Observable<EvaluationDetails> {
    return this.http.get<EvaluationDetails>(`${this.api}/Evaluation/${evaluationId}`);
  }

  getSelectedQuestions(evaluationId: number): Observable<SelectedQuestion[]> {
    return this.http.get<SelectedQuestion[]>(
      `${this.api}/Evaluation/evaluation/${evaluationId}/selected-questions`,
    );
  }

  getQuestionOptions(evaluationId: number): Observable<Record<number, QuestionOption[]>> {
    return this.http
      .get<Record<string, QuestionOption[]>>(`${this.api}/Evaluation/${evaluationId}/options`)
      .pipe(
        map((raw) => this.normalizeIdMap(raw)),
        catchError(() => of({})),
      );
  }

  getReferenceAnswers(questionIds: number[]): Observable<Record<number, ReferenceAnswer>> {
    if (!questionIds.length) return of({});
    return this.http.post<Record<string, ReferenceAnswer>>(`${this.api}/ReferenceAnswer/questions`, questionIds).pipe(
      map((raw) => this.normalizeIdMap(raw)),
      catchError(() => of({})),
    );
  }

  saveResults(payload: EvaluationResultsPayload): Observable<unknown> {
    return this.http.post(`${this.api}/Evaluation/save-evaluation-results`, payload);
  }

  validateEvaluation(payload: EvaluationValidationPayload): Observable<unknown> {
    return this.http.post(`${this.api}/Evaluation/validate-evaluation`, payload);
  }

  getTrainingSuggestions(ratings: Record<number, number>): Observable<TrainingSuggestion[]> {
    return this.http
      .post<TrainingSuggestion[]>(`${this.api}/Evaluation/suggestions`, { ratings })
      .pipe(catchError(() => of([])));
  }

  getEmployeesWithoutEvaluations(query: EmployeeListQuery): Observable<PaginatedPlanningEmployees> {
    let params = new HttpParams()
      .set('pageNumber', String(query.pageNumber))
      .set('pageSize', String(query.pageSize));

    if (query.search) params = params.set('search', query.search);
    if (query.position) params = params.set('position', String(query.position));
    if (query.department) params = params.set('department', String(query.department));
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortDirection) params = params.set('sortDirection', query.sortDirection);

    return this.http.get<PaginatedPlanningEmployees>(
      `${this.api}/EvaluationPlanning/employees-without-evaluations-paginated`,
      { params },
    );
  }

  getPlannedEvaluations(query: EmployeeListQuery): Observable<PaginatedPlannedEvaluations> {
    let params = new HttpParams()
      .set('pageNumber', String(query.pageNumber))
      .set('pageSize', String(query.pageSize));

    if (query.search) params = params.set('search', query.search);
    if (query.position) params = params.set('position', String(query.position));
    if (query.department) params = params.set('department', String(query.department));
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortDirection) params = params.set('sortDirection', query.sortDirection);

    return this.http.get<PaginatedPlannedEvaluations>(`${this.api}/EvaluationPlanning/planned-evaluations`, {
      params,
    });
  }

  getNotationStatistics(
    query: Pick<EmployeeListQuery, 'search' | 'position' | 'department'>,
  ): Observable<NotationStatistics> {
    return this.http.get<NotationStatistics>(`${this.api}/User/employee-notation-statistics`, {
      params: this.statsParams(query),
    });
  }

  getInterviewStatistics(
    query: Pick<EmployeeListQuery, 'search' | 'position' | 'department'>,
  ): Observable<InterviewStatistics> {
    return this.http.get<InterviewStatistics>(`${this.api}/EvaluationInterview/interview-statistics`, {
      params: this.statsParams(query),
    });
  }

  private statsParams(query: Pick<EmployeeListQuery, 'search' | 'position' | 'department'>): HttpParams {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.position) params = params.set('position', String(query.position));
    if (query.department) params = params.set('department', String(query.department));
    return params;
  }

  getEvaluationTypes(): Observable<EvaluationTypeOption[]> {
    return this.http.get<EvaluationTypeOption[]>(`${this.api}/EvaluationPlanning/evaluation-types`).pipe(
      catchError(() =>
        this.http.get<EvaluationTypeOption[]>(`${this.api}/Evaluation/types`).pipe(catchError(() => of([]))),
      ),
    );
  }

  getSupervisors(): Observable<SupervisorOption[]> {
    return this.http.get<SupervisorOption[]>(`${this.api}/User/managers-directors`).pipe(catchError(() => of([])));
  }

  getCompetenceLinesByPosition(positionId: number): Observable<CompetenceLineOption[]> {
    return this.http.get<unknown>(`${this.api}/EvaluationPlanning/competence-lines`, {
      params: { positionId: String(positionId) },
    }).pipe(
      map((raw) => this.normalizeCompetenceLines(raw)),
      catchError(() =>
        this.http.get<unknown>(`${this.api}/CompetenceLine/position/${positionId}`).pipe(
          map((raw) => this.normalizeCompetenceLines(raw)),
          catchError(() => of([])),
        ),
      ),
    );
  }

  getPlanningQuestions(
    evaluationTypeId: number,
    positionId: number,
    competenceLineId?: number | null,
  ): Observable<PlanningQuestion[]> {
    let params = new HttpParams()
      .set('evaluationTypeId', String(evaluationTypeId))
      .set('positionId', String(positionId));
    if (competenceLineId != null && competenceLineId > 0) {
      params = params.set('competenceLineId', String(competenceLineId));
    }

    return this.http.get<unknown>(`${this.api}/EvaluationPlanning/questions`, { params }).pipe(
      map((raw) => this.normalizePlanningQuestions(raw)),
      catchError(() =>
        this.http.get<unknown>(`${this.api}/Evaluation/questions`, { params }).pipe(
          map((raw) => this.normalizePlanningQuestions(raw)),
          catchError(() => of([])),
        ),
      ),
    );
  }

  calculateRecommendedDuration(payload: CalculateDurationRequest): Observable<DurationRecommendation | null> {
    return this.http
      .post<DurationRecommendation>(`${this.api}/EvaluationPlanning/calculate-recommended-duration`, payload)
      .pipe(catchError(() => of(null)));
  }

  createEvaluationWithQuestions(payload: CreateEvaluationWithQuestionsPayload): Observable<CreateEvaluationsResult> {
    return this.http.post<CreateEvaluationsResult>(
      `${this.api}/EvaluationPlanning/create-evaluation-with-questions`,
      payload,
    );
  }

  configureReminders(payload: ConfigureRemindersPayload): Observable<unknown> {
    return this.http.post(`${this.api}/EvaluationPlanning/configure-reminders`, payload);
  }

  cancelEvaluation(evaluationId: number): Observable<unknown> {
    return this.http.put(`${this.api}/EvaluationPlanning/cancel-evaluation/${evaluationId}`, {});
  }

  getInterviewEmployees(query: EmployeeListQuery): Observable<PaginatedInterviewEmployees> {
    let params = new HttpParams()
      .set('pageNumber', String(query.pageNumber))
      .set('pageSize', String(query.pageSize));

    if (query.search) params = params.set('search', query.search);
    if (query.position) params = params.set('position', String(query.position));
    if (query.department) params = params.set('department', String(query.department));
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortDirection) params = params.set('sortDirection', query.sortDirection);

    return this.http.get<PaginatedInterviewEmployees>(
      `${this.api}/EvaluationInterview/employees-finished-evaluations-paginated`,
      { params },
    );
  }

  getInterviewPositions(): Observable<PositionOption[]> {
    return this.http.get<PositionOption[]>(`${this.api}/EvaluationInterview/positions`).pipe(
      catchError(() => this.getPositions()),
    );
  }

  getInterviewDepartments(): Observable<DepartmentOption[]> {
    return this.http.get<DepartmentOption[]>(`${this.api}/EvaluationInterview/departments`).pipe(
      catchError(() => this.getDepartments()),
    );
  }

  getInterviewParticipants(): Observable<InterviewParticipantOption[]> {
    return this.http.get<unknown>(`${this.api}/User/managers-directors`).pipe(
      map((raw) => this.normalizeParticipants(raw)),
      catchError(() => of([])),
    );
  }

  scheduleInterview(payload: ScheduleInterviewPayload): Observable<{ interviewId?: number }> {
    return this.http.post<{ interviewId?: number; InterviewId?: number }>(
      `${this.api}/EvaluationInterview/schedule-interview`,
      payload,
    ).pipe(map((raw) => ({ interviewId: raw.interviewId ?? raw.InterviewId })));
  }

  startInterview(interviewId: number): Observable<unknown> {
    return this.http.put(`${this.api}/EvaluationInterview/start-interview/${interviewId}`, {});
  }

  completeInterview(interviewId: number, payload: CompleteInterviewPayload): Observable<unknown> {
    return this.http.put(`${this.api}/EvaluationInterview/complete-interview/${interviewId}`, payload);
  }

  updateInterview(interviewId: number, payload: UpdateInterviewPayload): Observable<unknown> {
    return this.http.put(`${this.api}/EvaluationInterview/update-interview/${interviewId}`, payload);
  }

  getInterviewByParticipant(employeeId: number): Observable<InterviewRecord | null> {
    return this.http.get<unknown>(`${this.api}/EvaluationInterview/get-interview-by-participant/${employeeId}`).pipe(
      map((raw) => this.normalizeInterview(raw)),
      catchError(() => of(null)),
    );
  }

  getInterviewDetails(interviewId: number): Observable<InterviewRecord | null> {
    return this.http.get<unknown>(`${this.api}/EvaluationInterview/interview-details/${interviewId}`).pipe(
      map((raw) => this.normalizeInterview(raw)),
      catchError(() => of(null)),
    );
  }

  unwrapInterviewEmployees(data: PaginatedInterviewEmployees | null | undefined): InterviewEmployeeRow[] {
    const rows = data?.employees ?? data?.Employees ?? [];
    return rows.map((row) => this.normalizeInterviewEmployee(row));
  }

  unwrapPlanningEmployees(data: PaginatedPlanningEmployees | null | undefined): PlanningEmployee[] {
    const rows = data?.employees ?? data?.Employees ?? [];
    return rows.map((row) => this.normalizePlanningEmployee(row));
  }

  unwrapPlannedEvaluations(data: PaginatedPlannedEvaluations | null | undefined): PlannedEvaluation[] {
    return data?.evaluations ?? data?.Evaluations ?? [];
  }

  getHistoryPaginated(query: HistoryListQuery): Observable<PaginatedEvaluationHistory> {
    return this.http.get<PaginatedEvaluationHistory>(
      `${this.api}/EvaluationHistory/evaluation-history-paginated`,
      { params: this.historyParams(query) },
    );
  }

  getHistoryGlobalStats(query: Omit<HistoryListQuery, 'pageNumber' | 'pageSize'>): Observable<HistoryGlobalStats> {
    return this.http.get<unknown>(`${this.api}/EvaluationHistory/global-statistics`, {
      params: this.historyParams(query),
    }).pipe(
      map((raw) => this.normalizeGlobalStats(raw)),
      catchError(() => of(emptyHistoryStats())),
    );
  }

  getHistoryYearlyPerformance(
    query: Omit<HistoryListQuery, 'pageNumber' | 'pageSize'>,
  ): Observable<HistoryYearlyPerformance[]> {
    return this.http.get<unknown>(`${this.api}/EvaluationHistory/global-performance`, {
      params: this.historyParams(query),
    }).pipe(
      map((raw) => this.normalizeYearlyPerformance(raw)),
      catchError(() => of([])),
    );
  }

  getHistoryDetail(evaluationId: number): Observable<EvaluationHistoryDetail | null> {
    return this.http.get<unknown>(`${this.api}/EvaluationHistory/detail/${evaluationId}`).pipe(
      map((raw) => this.normalizeHistoryDetail(raw)),
      catchError(() => of(null)),
    );
  }

  getHistoryDepartments(): Observable<DepartmentOption[]> {
    return this.http.get<unknown>(`${this.api}/EvaluationHistory/departments`).pipe(
      map((raw) => this.normalizeDepartments(raw)),
      catchError(() => this.getDepartments()),
    );
  }

  getHistoryEvaluationTypes(): Observable<string[]> {
    return this.http.get<unknown>(`${this.api}/EvaluationHistory/evaluation-types`).pipe(
      map((raw) => this.normalizeHistoryTypes(raw)),
      catchError(() => of(['Annuelle', 'Trimestrielle', 'Probatoire', 'Promotion'])),
    );
  }

  exportHistory(
    format: 'excel' | 'pdf' | 'csv',
    query: Omit<HistoryListQuery, 'pageNumber' | 'pageSize'>,
  ): Observable<Blob> {
    return this.http.get(`${this.api}/EvaluationHistory/export`, {
      params: this.historyParams(query).set('format', format),
      responseType: 'blob',
    });
  }

  unwrapHistoryRows(data: PaginatedEvaluationHistory | null | undefined): EvaluationHistoryRow[] {
    const rows = data?.evaluations ?? data?.Evaluations ?? [];
    return rows.filter(Boolean).map((row) => this.normalizeHistoryRow(row));
  }

  getObjectivesSummary(query: ObjectivesListQuery): Observable<PaginatedObjectivesSummary> {
    return this.http.get<unknown>(`${this.api}/EvaluationInterview/objectives-summary`, {
      params: this.objectivesParams(query),
    }).pipe(map((raw) => this.normalizeObjectivesPage(raw)));
  }

  updateObjectiveStatus(interviewId: number, payload: UpdateObjectiveStatusPayload): Observable<unknown> {
    return this.http.put(`${this.api}/EvaluationInterview/objectives/${interviewId}`, payload);
  }

  getObjectiveProgressHistory(
    interviewId: number,
    objectiveIndex: number,
  ): Observable<InterviewProgressEntry[]> {
    return this.http
      .get<unknown>(`${this.api}/EvaluationInterview/objectives/${interviewId}/history/${objectiveIndex}`)
      .pipe(
        map((raw) => this.normalizeProgressHistory(raw)),
        catchError(() => of([])),
      );
  }

  getDirectoryEmployees(): Observable<DirectoryEmployee[]> {
    return this.http.get<unknown>(`${this.api}/Employee`).pipe(
      map((raw) => this.normalizeDirectoryEmployees(raw)),
      catchError(() => of([])),
    );
  }

  private normalizePlanningEmployee(row: PlanningEmployee | Record<string, unknown>): PlanningEmployee {
    const raw = row as Record<string, unknown>;
    const pick = (...keys: string[]) => {
      for (const key of keys) {
        if (raw[key] != null && raw[key] !== '') return raw[key];
      }
      return null;
    };
    return {
      employeeId: Number(pick('employeeId', 'EmployeeId') ?? 0),
      firstName: String(pick('firstName', 'FirstName') ?? ''),
      lastName: String(pick('lastName', 'LastName') ?? ''),
      position: (pick('position', 'Position') as string | null) ?? null,
      positionId: Number(pick('positionId', 'PositionId') ?? 0) || null,
      department: (pick('department', 'Department') as string | null) ?? null,
      departmentId: Number(pick('departmentId', 'DepartmentId') ?? 0) || null,
    };
  }

  private normalizeCompetenceLines(raw: unknown): CompetenceLineOption[] {
    const rows = Array.isArray(raw) ? raw : [];
    return rows.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        competenceLineId: Number(row['competenceLineId'] ?? row['CompetenceLineId'] ?? 0),
        skillName: String(row['skillName'] ?? row['SkillName'] ?? 'Compétence'),
        description: (row['description'] ?? row['Description'] ?? null) as string | null,
        positionId: Number(row['positionId'] ?? row['PositionId'] ?? 0),
      };
    }).filter((row) => row.competenceLineId > 0);
  }

  private normalizePlanningQuestions(raw: unknown): PlanningQuestion[] {
    const source = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object' && Array.isArray((raw as { questions?: unknown[] }).questions)
        ? (raw as { questions: unknown[] }).questions
        : [];
    return source.map((item) => {
      const row = item as Record<string, unknown>;
      const competence = row['competenceLineId'] ?? row['CompetenceLineId'];
      return {
        questionId: Number(row['questionId'] ?? row['QuestionId'] ?? 0),
        question: String(row['question'] ?? row['Question'] ?? ''),
        competenceLineId: competence == null || competence === '' ? null : Number(competence),
      };
    }).filter((row) => row.questionId > 0 && row.question.trim());
  }

  private normalizeInterviewEmployee(row: InterviewEmployeeRow | Record<string, unknown>): InterviewEmployeeRow {
    const raw = row as Record<string, unknown>;
    const pick = (...keys: string[]) => {
      for (const key of keys) {
        if (raw[key] != null && raw[key] !== '') return raw[key];
      }
      return null;
    };
    const asBool = (value: unknown): boolean | null => {
      if (value == null || value === '') return null;
      if (typeof value === 'boolean') return value;
      if (value === 1 || value === '1' || value === 'true') return true;
      if (value === 0 || value === '0' || value === 'false') return false;
      return null;
    };
    return {
      employeeId: Number(pick('employeeId', 'EmployeeId') ?? 0),
      firstName: String(pick('firstName', 'FirstName') ?? ''),
      lastName: String(pick('lastName', 'LastName') ?? ''),
      position: (pick('position', 'Position') as string | null) ?? null,
      positionId: Number(pick('positionId', 'PositionId') ?? 0) || null,
      department: (pick('department', 'Department') as string | null) ?? null,
      departmentId: Number(pick('departmentId', 'DepartmentId') ?? 0) || null,
      evaluationId: Number(pick('evaluationId', 'EvaluationId') ?? 0) || null,
      interviewDate: (pick('interviewDate', 'InterviewDate') as string | null) ?? null,
      interviewStatus: pick('interviewStatus', 'InterviewStatus') == null
        ? null
        : Number(pick('interviewStatus', 'InterviewStatus')),
      overallScore: pick('overallScore', 'OverallScore') == null ? null : Number(pick('overallScore', 'OverallScore')),
      managerApproval: asBool(pick('managerApproval', 'ManagerApproval')),
      directorApproval: asBool(pick('directorApproval', 'DirectorApproval')),
      managerComments: (pick('managerComments', 'ManagerComments') as string | null) ?? null,
      directorComments: (pick('directorComments', 'DirectorComments') as string | null) ?? null,
    };
  }

  private normalizeInterview(raw: unknown): InterviewRecord | null {
    if (!raw || typeof raw !== 'object') return null;
    const row = raw as Record<string, unknown>;
    const pick = (...keys: string[]) => {
      for (const key of keys) {
        if (row[key] != null && row[key] !== '') return row[key];
      }
      return null;
    };
    const interviewId = Number(pick('interviewId', 'InterviewId') ?? 0);
    if (!interviewId) return null;
    const asBool = (value: unknown): boolean | null => {
      if (value == null || value === '') return null;
      if (typeof value === 'boolean') return value;
      if (value === 1 || value === '1' || value === 'true') return true;
      if (value === 0 || value === '0' || value === 'false') return false;
      return null;
    };
    return {
      interviewId,
      evaluationId: Number(pick('evaluationId', 'EvaluationId') ?? 0),
      interviewDate: (pick('interviewDate', 'InterviewDate', 'scheduledDate', 'ScheduledDate') as string | null) ?? null,
      status: Number(pick('status', 'Status') ?? 0),
      notes: (pick('notes', 'Notes') as string | null) ?? null,
      managerApproval: asBool(pick('managerApproval', 'ManagerApproval')),
      managerComments: (pick('managerComments', 'ManagerComments') as string | null) ?? null,
      directorApproval: asBool(pick('directorApproval', 'DirectorApproval')),
      directorComments: (pick('directorComments', 'DirectorComments') as string | null) ?? null,
    };
  }

  private normalizeParticipants(raw: unknown): InterviewParticipantOption[] {
    const rows = Array.isArray(raw) ? raw : [];
    return rows
      .map((item) => {
        const row = item as Record<string, unknown>;
        const id = Number(row['id'] ?? row['Id'] ?? row['userId'] ?? row['UserId'] ?? 0);
        const employeeId = Number(row['employeeId'] ?? row['EmployeeId'] ?? 0) || null;
        const roleId = Number(row['roleId'] ?? row['RoleId'] ?? 0) || null;
        return {
          id,
          employeeId,
          firstName: String(row['firstName'] ?? row['FirstName'] ?? ''),
          lastName: String(row['lastName'] ?? row['LastName'] ?? ''),
          roleId,
          role: (row['role'] ?? row['Role'] ?? null) as string | null,
        };
      })
      .filter((row) => row.id > 0);
  }

  private normalizeIdMap<T>(raw: Record<string, T> | null | undefined): Record<number, T> {
    const next: Record<number, T> = {};
    if (!raw) return next;
    for (const [key, value] of Object.entries(raw)) {
      const id = Number(key);
      if (Number.isFinite(id)) next[id] = value;
    }
    return next;
  }

  private historyParams(query: Partial<HistoryListQuery>): HttpParams {
    let params = new HttpParams();
    if (query.pageNumber) params = params.set('pageNumber', String(query.pageNumber));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));
    if (query.startDate) params = params.set('startDate', query.startDate);
    if (query.endDate) params = params.set('endDate', query.endDate);
    if (query.evaluationType) params = params.set('evaluationType', query.evaluationType);
    if (query.department) params = params.set('department', query.department);
    if (query.employeeName) params = params.set('employeeName', query.employeeName);
    return params;
  }

  private pick(raw: Record<string, unknown>, ...keys: string[]): unknown {
    for (const key of keys) {
      if (raw[key] != null && raw[key] !== '') return raw[key];
    }
    return null;
  }

  private asNumber(value: unknown): number | null {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private asString(value: unknown): string | null {
    if (value == null) return null;
    const text = String(value).trim();
    return text && text.toLowerCase() !== 'null' ? text : null;
  }

  private normalizeHistoryRow(row: EvaluationHistoryRow | Record<string, unknown>): EvaluationHistoryRow {
    const raw = row as Record<string, unknown>;
    return {
      evaluationId: this.asNumber(this.pick(raw, 'evaluationId', 'EvaluationId')) ?? 0,
      firstName: this.asString(this.pick(raw, 'firstName', 'FirstName')) ?? '',
      lastName: this.asString(this.pick(raw, 'lastName', 'LastName')) ?? '',
      position: this.asString(this.pick(raw, 'position', 'Position')),
      evaluationType: this.asString(this.pick(raw, 'evaluationType', 'EvaluationType')) ?? 'Non définie',
      startDate: this.asString(this.pick(raw, 'startDate', 'StartDate')),
      endDate: this.asString(this.pick(raw, 'endDate', 'EndDate')),
      overallScore: this.asNumber(this.pick(raw, 'overallScore', 'OverallScore')),
      status: this.asNumber(this.pick(raw, 'status', 'Status')) ?? 10,
      recommendations: this.asString(this.pick(raw, 'recommendations', 'Recommendations')),
    };
  }

  private normalizeHistoryDetail(raw: unknown): EvaluationHistoryDetail | null {
    if (!raw || typeof raw !== 'object') return null;
    const row = raw as Record<string, unknown>;
    const evaluationId = this.asNumber(this.pick(row, 'evaluationId', 'EvaluationId')) ?? 0;
    if (!evaluationId) return null;
    const participantsRaw = this.pick(row, 'participants', 'Participants');
    const participants = Array.isArray(participantsRaw)
      ? participantsRaw.map((item) => String(item).trim()).filter(Boolean)
      : typeof participantsRaw === 'string'
        ? participantsRaw.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
    return {
      evaluationId,
      firstName: this.asString(this.pick(row, 'firstName', 'FirstName')) ?? '',
      lastName: this.asString(this.pick(row, 'lastName', 'LastName')) ?? '',
      position: this.asString(this.pick(row, 'position', 'Position')),
      evaluationType: this.asString(this.pick(row, 'evaluationType', 'EvaluationType')),
      startDate: this.asString(this.pick(row, 'startDate', 'StartDate')),
      endDate: this.asString(this.pick(row, 'endDate', 'EndDate')),
      overallScore: this.asNumber(this.pick(row, 'overallScore', 'OverallScore')),
      evaluationComments: this.asString(this.pick(row, 'evaluationComments', 'EvaluationComments')),
      strengths: this.asString(this.pick(row, 'strengths', 'Strengths')),
      weaknesses: this.asString(this.pick(row, 'weaknesses', 'Weaknesses')),
      department: this.asString(this.pick(row, 'department', 'Department')),
      interviewDate: this.asString(this.pick(row, 'interviewDate', 'InterviewDate')),
      interviewStatus: this.asNumber(this.pick(row, 'interviewStatus', 'InterviewStatus')),
      recommendations: this.asString(this.pick(row, 'recommendations', 'Recommendations')),
      participants,
      questionDetails: this.normalizeQuestionDetails(
        this.pick(row, 'questionDetails', 'QuestionDetails'),
      ),
    };
  }

  private normalizeQuestionDetails(raw: unknown): HistoryQuestionDetail[] {
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          return {
            questionId: this.asNumber(this.pick(row, 'questionId', 'QuestionId')) ?? 0,
            question: this.asString(this.pick(row, 'question', 'Question', 'questionText', 'QuestionText')) ?? 'Question',
            score: this.asNumber(this.pick(row, 'score', 'Score')),
          };
        })
        .filter((item) => item.question.trim());
    }
    if (typeof raw === 'string' && raw.trim()) {
      return raw
        .split(';')
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => {
          const scorePart = chunk.match(/Score\s*:\s*(\d+(\.\d+)?)/i);
          const questionPart = chunk.match(/Question\s*:\s*(.*?)(?:,|$)/i);
          return {
            questionId: 0,
            question: questionPart?.[1]?.trim() || chunk,
            score: scorePart ? Number(scorePart[1]) : null,
          };
        });
    }
    return [];
  }

  private normalizeGlobalStats(raw: unknown): HistoryGlobalStats {
    const fallback = emptyHistoryStats();
    if (!raw || typeof raw !== 'object') return fallback;
    const row = raw as Record<string, unknown>;
    const trendRaw = (this.pick(row, 'trendData', 'TrendData') ?? {}) as Record<string, unknown>;
    const scoreRaw = (this.pick(row, 'scoreDistribution', 'ScoreDistribution') ?? {}) as Record<string, unknown>;
    return {
      totalEvaluationsCount: this.asNumber(this.pick(row, 'totalEvaluationsCount', 'TotalEvaluationsCount')) ?? 0,
      averageScore: this.asNumber(this.pick(row, 'averageScore', 'AverageScore')) ?? 0,
      participationRate: this.asNumber(this.pick(row, 'participationRate', 'ParticipationRate')) ?? 0,
      approvalRate: this.asNumber(this.pick(row, 'approvalRate', 'ApprovalRate')) ?? 0,
      departmentDistribution: this.normalizeDistribution(
        this.pick(row, 'departmentDistribution', 'DepartmentDistribution'),
      ),
      evaluationTypeDistribution: this.normalizeDistribution(
        this.pick(row, 'evaluationTypeDistribution', 'EvaluationTypeDistribution'),
      ),
      trendData: {
        isIncreasing: Boolean(this.pick(trendRaw, 'isIncreasing', 'IsIncreasing')),
        percentageChange: this.asNumber(this.pick(trendRaw, 'percentageChange', 'PercentageChange')) ?? 0,
        startValue: this.asNumber(this.pick(trendRaw, 'startValue', 'StartValue')) ?? 0,
        endValue: this.asNumber(this.pick(trendRaw, 'endValue', 'EndValue')) ?? 0,
        standardDeviation: this.asNumber(this.pick(trendRaw, 'standardDeviation', 'StandardDeviation')) ?? 0,
      } satisfies HistoryTrend,
      scoreDistribution: {
        low: this.asNumber(this.pick(scoreRaw, 'low', 'Low')) ?? 0,
        medium: this.asNumber(this.pick(scoreRaw, 'medium', 'Medium')) ?? 0,
        high: this.asNumber(this.pick(scoreRaw, 'high', 'High')) ?? 0,
        average: this.asNumber(this.pick(scoreRaw, 'average', 'Average')) ?? 0,
        min: this.asNumber(this.pick(scoreRaw, 'min', 'Min')) ?? 0,
        max: this.asNumber(this.pick(scoreRaw, 'max', 'Max')) ?? 0,
      } satisfies HistoryScoreDistribution,
    };
  }

  private normalizeDistribution(raw: unknown): HistoryDistributionItem[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return {
          label: this.asString(this.pick(row, 'label', 'Label')) ?? 'Non défini',
          value: this.asNumber(this.pick(row, 'value', 'Value')) ?? 0,
          averageScore: this.asNumber(this.pick(row, 'averageScore', 'AverageScore')) ?? 0,
        };
      })
      .filter((item) => item.label);
  }

  private normalizeYearlyPerformance(raw: unknown): HistoryYearlyPerformance[] {
    const source = Array.isArray(raw) ? raw : [];
    return source
      .map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return {
          year: this.asNumber(this.pick(row, 'year', 'Year')) ?? 0,
          averageScore: this.asNumber(this.pick(row, 'averageScore', 'AverageScore')) ?? 0,
          evaluationCount: this.asNumber(this.pick(row, 'evaluationCount', 'EvaluationCount', 'count', 'Count')) ?? 0,
        };
      })
      .filter((item) => item.year > 0)
      .sort((a, b) => a.year - b.year);
  }

  private normalizeDepartments(raw: unknown): DepartmentOption[] {
    const rows = Array.isArray(raw) ? raw : [];
    return rows
      .map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return {
          departmentId: this.asNumber(this.pick(row, 'departmentId', 'DepartmentId')) ?? 0,
          name: this.asString(this.pick(row, 'name', 'Name', 'departmentName', 'DepartmentName')) ?? '',
        };
      })
      .filter((item) => item.name);
  }

  private normalizeHistoryTypes(raw: unknown): string[] {
    if (!Array.isArray(raw) || !raw.length) {
      return ['Annuelle', 'Trimestrielle', 'Probatoire', 'Promotion'];
    }
    if (typeof raw[0] === 'string') {
      return (raw as string[]).map((item) => item.trim()).filter(Boolean);
    }
    return raw
      .map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return this.asString(this.pick(row, 'designation', 'Designation', 'name', 'Name', 'label', 'Label'));
      })
      .filter((item): item is string => Boolean(item));
  }

  private objectivesParams(query: Partial<ObjectivesListQuery>): HttpParams {
    let params = new HttpParams();
    if (query.pageNumber) params = params.set('pageNumber', String(query.pageNumber));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));
    if (query.departmentId) params = params.set('departmentId', String(query.departmentId));
    if (query.employeeId) params = params.set('employeeId', String(query.employeeId));
    if (query.statusFilter) params = params.set('statusFilter', query.statusFilter);
    if (query.searchQuery) params = params.set('searchQuery', query.searchQuery);
    return params;
  }

  private normalizeObjectivesPage(raw: unknown): PaginatedObjectivesSummary {
    const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const list = this.pick(row, 'objectives', 'Objectives');
    const statsRaw = this.pick(row, 'statistics', 'Statistics');
    return {
      objectives: Array.isArray(list) ? list.map((item) => this.normalizeObjectiveRow(item)) : [],
      statistics: this.normalizeObjectivesStats(statsRaw),
      totalCount: this.asNumber(this.pick(row, 'totalCount', 'TotalCount')) ?? 0,
    };
  }

  private normalizeObjectivesStats(raw: unknown): ObjectivesStatistics {
    const fallback = emptyObjectivesStats();
    if (!raw || typeof raw !== 'object') return fallback;
    const row = raw as Record<string, unknown>;
    return {
      totalObjectives: this.asNumber(this.pick(row, 'totalObjectives', 'TotalObjectives')) ?? 0,
      achievedObjectives: this.asNumber(this.pick(row, 'achievedObjectives', 'AchievedObjectives')) ?? 0,
      inProgressObjectives: this.asNumber(this.pick(row, 'inProgressObjectives', 'InProgressObjectives')) ?? 0,
      notStartedObjectives: this.asNumber(this.pick(row, 'notStartedObjectives', 'NotStartedObjectives')) ?? 0,
      notAchievedObjectives: this.asNumber(this.pick(row, 'notAchievedObjectives', 'NotAchievedObjectives')) ?? 0,
      averageCompletionRate: this.asNumber(this.pick(row, 'averageCompletionRate', 'AverageCompletionRate')) ?? 0,
      globalAchievementRate: this.asNumber(this.pick(row, 'globalAchievementRate', 'GlobalAchievementRate')) ?? 0,
    };
  }

  private normalizeObjectiveRow(raw: unknown): ObjectiveSummaryRow {
    const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      interviewId: this.asNumber(this.pick(row, 'interviewId', 'InterviewId')) ?? 0,
      evaluationId: this.asNumber(this.pick(row, 'evaluationId', 'EvaluationId')) ?? 0,
      employeeId: this.asNumber(this.pick(row, 'employeeId', 'EmployeeId')) ?? 0,
      employeeName: this.asString(this.pick(row, 'employeeName', 'EmployeeName')) ?? 'Employé',
      department: this.asString(this.pick(row, 'department', 'Department')) ?? '',
      position: this.asString(this.pick(row, 'position', 'Position')) ?? '',
      description: this.asString(this.pick(row, 'description', 'Description')) ?? '',
      dueDate: this.asString(this.pick(row, 'dueDate', 'DueDate')),
      indicator: this.asString(this.pick(row, 'indicator', 'Indicator')),
      status: this.asString(this.pick(row, 'status', 'Status')) ?? 'Non commencé',
      completionRate: this.asNumber(this.pick(row, 'completionRate', 'CompletionRate')) ?? 0,
      objectiveIndex: this.asNumber(this.pick(row, 'objectiveIndex', 'ObjectiveIndex')) ?? 0,
      lastModified: this.asString(this.pick(row, 'lastModified', 'LastModified')),
      progressHistoryCount: this.asNumber(this.pick(row, 'progressHistoryCount', 'ProgressHistoryCount')) ?? 0,
      progressHistory: this.normalizeProgressEntries(
        this.pick(row, 'progressHistory', 'ProgressHistory'),
      ),
    };
  }

  private normalizeProgressHistory(raw: unknown): InterviewProgressEntry[] {
    if (!raw || typeof raw !== 'object') return [];
    const row = raw as Record<string, unknown>;
    return this.normalizeProgressEntries(this.pick(row, 'progressHistory', 'ProgressHistory'));
  }

  private normalizeProgressEntries(raw: unknown): InterviewProgressEntry[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        date: this.asString(this.pick(row, 'date', 'Date')) ?? '',
        oldStatus: this.asString(this.pick(row, 'oldStatus', 'OldStatus')) ?? '',
        newStatus: this.asString(this.pick(row, 'newStatus', 'NewStatus')) ?? '',
        oldCompletionRate: this.asNumber(this.pick(row, 'oldCompletionRate', 'OldCompletionRate')) ?? 0,
        newCompletionRate: this.asNumber(this.pick(row, 'newCompletionRate', 'NewCompletionRate')) ?? 0,
      };
    });
  }

  private normalizeDirectoryEmployees(raw: unknown): DirectoryEmployee[] {
    const rows = Array.isArray(raw) ? raw : [];
    return rows
      .map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return {
          employeeId: this.asNumber(this.pick(row, 'employeeId', 'EmployeeId')) ?? 0,
          firstName: this.asString(this.pick(row, 'firstName', 'FirstName')) ?? '',
          lastName: this.asString(this.pick(row, 'lastName', 'LastName', 'name', 'Name')) ?? '',
        };
      })
      .filter((item) => item.employeeId > 0)
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr'));
  }
}
