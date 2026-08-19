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
  DurationRecommendation,
  EvaluationDetails,
  EvaluationResultsPayload,
  EvaluationTypeOption,
  EvaluationValidationPayload,
  InterviewEmployeeRow,
  InterviewParticipantOption,
  InterviewRecord,
  PaginatedEmployees,
  PaginatedInterviewEmployees,
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
}
