import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EvaluationDetails,
  QuestionOption,
  SelectedQuestion,
} from '../evaluations/evaluation.models';
import { PORTAL_REQUEST } from './evaluation-portal-session';

export interface PortalLoginResponse {
  success: boolean;
  token?: string;
  evaluationId?: number;
  message?: string;
}

export interface PortalStoredResponse {
  responseId: number;
  questionId: number;
  responseType: string;
  responseValue: string;
}

export interface PortalAnswerPayload {
  evaluationId: number;
  questionId: number;
  responseType: string;
  responseValue: string;
  timeSpent: number;
  startTime: string;
  endTime: string;
  isCorrect: boolean;
}

export interface PortalSubmissionPayload {
  responses: Array<{
    questionId: number;
    responseType: string;
    responseValue: string;
    timeSpent: number;
    startTime: string;
    endTime: string;
  }>;
  overallFeedback: string;
  averageScore: number;
  completionDate: string;
}

@Injectable({ providedIn: 'root' })
export class EvaluationPortalService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  login(tempLogin: string, tempPassword: string): Observable<PortalLoginResponse> {
    return this.http.post<PortalLoginResponse>(
      `${this.api}/EvaluationLogin/login`,
      { tempLogin, tempPassword, ipAddress: '' },
      { context: portalContext() },
    );
  }

  validateToken(): Observable<boolean> {
    return this.http
      .get<{ valid?: boolean }>(`${this.api}/Evaluation/validate-token`, { context: portalContext() })
      .pipe(map((body) => body?.valid === true));
  }

  getEvaluation(evaluationId: number): Observable<EvaluationDetails> {
    return this.http
      .get<unknown>(`${this.api}/Evaluation/${evaluationId}`, { context: portalContext() })
      .pipe(map((raw) => normalizeEvaluation(raw, evaluationId)));
  }

  getSelectedQuestions(evaluationId: number): Observable<SelectedQuestion[]> {
    return this.http
      .get<unknown>(`${this.api}/Evaluation/evaluation/${evaluationId}/selected-questions`, {
        context: portalContext(),
      })
      .pipe(map(normalizeSelectedQuestions));
  }

  getQuestionOptions(evaluationId: number): Observable<Record<number, QuestionOption[]>> {
    return this.http
      .get<Record<string, unknown>>(`${this.api}/Evaluation/${evaluationId}/options`, {
        context: portalContext(),
      })
      .pipe(
        map(normalizeOptionsMap),
        catchError(() => of({})),
      );
  }

  getResponses(evaluationId: number): Observable<PortalStoredResponse[]> {
    return this.http
      .get<unknown>(`${this.api}/Evaluation/evaluation/${evaluationId}/responses`, {
        context: portalContext(),
      })
      .pipe(
        map(normalizeResponses),
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) return of([]);
          return of([]);
        }),
      );
  }

  saveAnswer(payload: PortalAnswerPayload, existingResponseId?: number): Observable<number | null> {
    if (existingResponseId && existingResponseId > 0) {
      return this.http
        .put(
          `${this.api}/Evaluation/responses/${existingResponseId}`,
          payload,
          { context: portalContext() },
        )
        .pipe(
          map(() => existingResponseId),
          catchError(() => of(existingResponseId)),
        );
    }

    return this.http
      .post(`${this.api}/Evaluation/evaluation/${payload.evaluationId}/responses`, payload, {
        context: portalContext(),
      })
      .pipe(
        switchMap(() =>
          this.http.get<unknown>(
            `${this.api}/Evaluation/evaluation/${payload.evaluationId}/responses/${payload.questionId}`,
            { context: portalContext() },
          ),
        ),
        map((raw) => normalizeResponse(raw)?.responseId ?? null),
        catchError(() => of(null)),
      );
  }

  saveProgress(
    evaluationId: number,
    body: {
      employeeId: number;
      totalQuestions: number;
      answeredQuestions: number;
      progressPercentage: number;
    },
  ): Observable<unknown> {
    return this.http.post(`${this.api}/Evaluation/${evaluationId}/save-progress`, body, {
      context: portalContext(),
    });
  }

  updatePortalProgress(evaluationId: number, employeeId: number, answeredQuestions: number): Observable<unknown> {
    return this.http
      .put(
        `${this.api}/EvaluationPortal/progress/update`,
        { evaluationId, employeeId, answeredQuestions },
        { context: portalContext() },
      )
      .pipe(catchError(() => of(null)));
  }

  submit(evaluationId: number, payload: PortalSubmissionPayload): Observable<unknown> {
    return this.http.post(`${this.api}/Evaluation/${evaluationId}/submit`, payload, {
      context: portalContext(),
    });
  }
}

function portalContext(): HttpContext {
  return new HttpContext().set(PORTAL_REQUEST, true);
}

function normalizeEvaluation(raw: unknown, fallbackId: number): EvaluationDetails {
  const row = asRecord(raw);
  return {
    evaluationId: asNumber(pick(row, 'evaluationId', 'EvaluationId')) ?? fallbackId,
    title: asString(pick(row, 'title', 'Title')) ?? 'Auto-évaluation',
    description: asString(pick(row, 'description', 'Description')) ?? '',
    employeeName: asString(pick(row, 'employeeName', 'EmployeeName')) ?? 'Salarié',
    position: asString(pick(row, 'position', 'Position')) ?? '',
    department: asString(pick(row, 'department', 'Department')) ?? '',
    evaluationTypeId: asNumber(pick(row, 'evaluationTypeId', 'EvaluationTypeId')) ?? 0,
  };
}

function normalizeSelectedQuestions(raw: unknown): SelectedQuestion[] {
  const rows = Array.isArray(raw) ? raw : [];
  return rows
    .map((item) => {
      const row = asRecord(item);
      const competence = pick(row, 'competenceLineId', 'CompetenceLineId');
      return {
        questionId: asNumber(pick(row, 'questionId', 'QuestionId')) ?? 0,
        questionText: asString(pick(row, 'questionText', 'QuestionText', 'question', 'Question')) ?? '',
        competenceLineId: competence == null || competence === '' ? null : asNumber(competence),
        competenceName:
          asString(pick(row, 'skillName', 'SkillName', 'competenceName', 'CompetenceName')) ?? '',
        skillId: asNumber(pick(row, 'skillId', 'SkillId')),
        skillName: asString(pick(row, 'skillName', 'SkillName')),
        familyId: asNumber(pick(row, 'familyId', 'FamilyId')),
        familyName: asString(pick(row, 'familyName', 'FamilyName')),
        domainId: asNumber(pick(row, 'domainId', 'DomainId')),
        domainName: asString(pick(row, 'domainName', 'DomainName')),
        responseType: asString(pick(row, 'responseType', 'ResponseType')),
        responseValue: asString(pick(row, 'responseValue', 'ResponseValue')),
        isCorrect: false,
        maxTimeInMinutes: asNumber(pick(row, 'maxTimeInMinutes', 'MaxTimeInMinutes')) ?? 15,
      };
    })
    .filter((item) => item.questionId > 0);
}

function normalizeOptionsMap(raw: Record<string, unknown> | null | undefined): Record<number, QuestionOption[]> {
  const next: Record<number, QuestionOption[]> = {};
  if (!raw) return next;
  for (const [key, value] of Object.entries(raw)) {
    const id = Number(key);
    if (!Number.isFinite(id)) continue;
    const list = Array.isArray(value) ? value : [];
    next[id] = list
      .map((item) => {
        const row = asRecord(item);
        return {
          optionId: asNumber(pick(row, 'optionId', 'OptionId')) ?? 0,
          questionId: asNumber(pick(row, 'questionId', 'QuestionId')) ?? id,
          optionText: asString(pick(row, 'optionText', 'OptionText')) ?? '',
          isCorrect: false,
        };
      })
      .filter((item) => item.optionId > 0);
  }
  return next;
}

function normalizeResponses(raw: unknown): PortalStoredResponse[] {
  const rows = Array.isArray(raw) ? raw : [];
  return rows
    .map((item) => normalizeResponse(item))
    .filter((item): item is PortalStoredResponse => item != null && item.questionId > 0);
}

function normalizeResponse(raw: unknown): PortalStoredResponse | null {
  const row = asRecord(raw);
  const questionId = asNumber(pick(row, 'questionId', 'QuestionId'));
  if (!questionId) return null;
  return {
    responseId: asNumber(pick(row, 'responseId', 'ResponseId')) ?? 0,
    questionId,
    responseType: asString(pick(row, 'responseType', 'ResponseType')) ?? '',
    responseValue: asString(pick(row, 'responseValue', 'ResponseValue')) ?? '',
  };
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function pick(raw: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (raw[key] != null && raw[key] !== '') return raw[key];
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text && text.toLowerCase() !== 'null' ? text : null;
}
