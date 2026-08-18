import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DepartmentOption,
  EvaluationDetails,
  EvaluationResultsPayload,
  EvaluationValidationPayload,
  PaginatedEmployees,
  PositionOption,
  QuestionOption,
  ReferenceAnswer,
  SelectedQuestion,
  TrainingSuggestion,
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
