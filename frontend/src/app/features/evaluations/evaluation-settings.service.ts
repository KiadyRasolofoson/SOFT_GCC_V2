import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompetenceDomainNode,
  EvaluationTemplate,
  PositionOption,
  QuestionTimeUpdate,
  ResponseTypeOption,
  SettingsCompetenceLine,
  SettingsEvalType,
  SettingsQuestion,
  SettingsQuestionOption,
  SettingsQuestionPayload,
  SettingsTraining,
  SettingsTrainingPayload,
  TemplateQuestion,
} from './evaluation.models';

@Injectable({ providedIn: 'root' })
export class EvaluationSettingsService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getQuestions(): Observable<SettingsQuestion[]> {
    return this.http.get<unknown>(`${this.api}/Evaluation/questionsAll`).pipe(
      map((raw) => this.normalizeQuestions(raw)),
    );
  }

  createQuestion(payload: SettingsQuestionPayload): Observable<unknown> {
    return this.http.post(`${this.api}/Evaluation/questions`, this.toQuestionBody(payload));
  }

  updateQuestion(id: number, payload: SettingsQuestionPayload): Observable<unknown> {
    return this.http.put(`${this.api}/Evaluation/questions/${id}`, this.toQuestionBody({ ...payload, questionId: id }));
  }

  getQuestionOptions(questionId: number): Observable<SettingsQuestionOption[]> {
    return this.http.get<unknown>(`${this.api}/Evaluation/questions/${questionId}/options`).pipe(
      map((raw) => this.normalizeQuestionOptions(raw)),
      catchError(() => of([])),
    );
  }

  getQuestionOptionSummaries(): Observable<Record<number, { optionCount: number; correctCount: number }>> {
    return this.http.get<unknown>(`${this.api}/Evaluation/question-option-summaries`).pipe(
      map((raw) => this.normalizeOptionSummaries(raw)),
      catchError(() => of({})),
    );
  }

  deleteQuestion(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/Evaluation/questions/${id}`);
  }

  deleteQuestions(ids: number[]): Observable<unknown> {
    if (!ids.length) return of(null);
    return forkJoin(ids.map((id) => this.deleteQuestion(id).pipe(catchError(() => of(null)))));
  }

  getTrainings(): Observable<SettingsTraining[]> {
    return this.http.get<unknown>(`${this.api}/Evaluation/training-suggestions`).pipe(
      map((raw) => this.normalizeTrainings(raw)),
    );
  }

  createTraining(payload: SettingsTrainingPayload): Observable<unknown> {
    return this.http.post(`${this.api}/Evaluation/create-training-suggestion`, this.toTrainingBody(payload));
  }

  updateTraining(id: number, payload: SettingsTrainingPayload): Observable<unknown> {
    return this.http.put(`${this.api}/Evaluation/training-suggestions/${id}`, this.toTrainingBody(payload));
  }

  deleteTraining(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/Evaluation/training-suggestions/${id}`);
  }

  deleteTrainings(ids: number[]): Observable<unknown> {
    if (!ids.length) return of(null);
    return forkJoin(ids.map((id) => this.deleteTraining(id).pipe(catchError(() => of(null)))));
  }

  getEvaluationTypes(): Observable<SettingsEvalType[]> {
    return this.http.get<unknown>(`${this.api}/EvaluationType`).pipe(
      map((raw) => this.normalizeTypes(raw)),
      catchError(() =>
        this.http.get<unknown>(`${this.api}/Evaluation/types`).pipe(
          map((raw) => this.normalizeTypes(raw)),
          catchError(() => of([])),
        ),
      ),
    );
  }

  createEvaluationType(designation: string): Observable<unknown> {
    return this.http.post(`${this.api}/EvaluationType`, { designation: designation.trim(), state: 1 });
  }

  updateEvaluationType(id: number, designation: string): Observable<unknown> {
    return this.http.put(`${this.api}/EvaluationType/${id}`, {
      evaluationTypeId: id,
      designation: designation.trim(),
    });
  }

  deleteEvaluationType(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/EvaluationType/${id}`);
  }

  getPositions(): Observable<PositionOption[]> {
    return this.http.get<unknown>(`${this.api}/Evaluation/postes`).pipe(
      map((raw) => this.normalizePositions(raw)),
      catchError(() => of([])),
    );
  }

  getCompetenceDomains(): Observable<CompetenceDomainNode[]> {
    return this.http.get<unknown>(`${this.api}/Evaluation/competence-domains`).pipe(
      map((raw) => this.normalizeCompetenceDomains(raw)),
      catchError(() => of([])),
    );
  }

  getCompetenceLines(): Observable<SettingsCompetenceLine[]> {
    return this.http.get<unknown>(`${this.api}/Evaluation/competence-lines`).pipe(
      map((raw) => this.normalizeCompetenceLines(raw)),
      catchError(() =>
        this.http.get<unknown>(`${this.api}/CompetenceLine`).pipe(
          map((raw) => this.normalizeCompetenceLines(raw)),
          catchError(() => of([])),
        ),
      ),
    );
  }

  getResponseTypes(): Observable<ResponseTypeOption[]> {
    return this.http.get<unknown>(`${this.api}/Evaluation/response-types`).pipe(
      map((raw) => this.normalizeResponseTypes(raw)),
      catchError(() =>
        this.http.get<unknown>(`${this.api}/ResponseType`).pipe(
          map((raw) => this.normalizeResponseTypes(raw)),
          catchError(() => of([])),
        ),
      ),
    );
  }

  getTemplates(): Observable<EvaluationTemplate[]> {
    return this.http.get<unknown>(`${this.api}/Evaluation/templates`).pipe(
      map((raw) => this.normalizeTemplates(raw)),
    );
  }

  getTemplateQuestions(evaluationTypeId: number): Observable<TemplateQuestion[]> {
    return this.http.get<unknown>(`${this.api}/Evaluation/${evaluationTypeId}/questions`).pipe(
      map((raw) => this.normalizeTemplateQuestions(raw)),
    );
  }

  updateQuestionTimes(payload: QuestionTimeUpdate[]): Observable<unknown> {
    return this.http.post(`${this.api}/Evaluation/questions/update-time`, payload);
  }

  private toQuestionBody(payload: SettingsQuestionPayload) {
    return {
      QuestionId: payload.questionId ?? null,
      Question: payload.question.trim(),
      EvaluationTypeId: payload.evaluationTypeId,
      SkillId: payload.skillId,
      PositionId: payload.positionId && payload.positionId > 0 ? payload.positionId : null,
      CompetenceLineId: payload.competenceLineId,
      ResponseTypeId: payload.responseTypeId,
      State: payload.state || 1,
      Options: (payload.options ?? []).map((item, index) => ({
        OptionId: item.optionId && item.optionId > 0 ? item.optionId : null,
        OptionText: item.optionText.trim(),
        IsCorrect: item.isCorrect,
        SortOrder: item.sortOrder || index + 1,
      })),
    };
  }

  private toTrainingBody(payload: SettingsTrainingPayload) {
    return {
      EvaluationTypeId: payload.evaluationTypeId,
      QuestionId: payload.questionId,
      Training: payload.training.trim(),
      Details: payload.details.trim(),
      ScoreThreshold: payload.scoreThreshold,
      State: payload.state || 1,
    };
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

  private asArray(raw: unknown): unknown[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const row = raw as Record<string, unknown>;
      const nested = row['items'] ?? row['Items'] ?? row['data'] ?? row['Data'];
      if (Array.isArray(nested)) return nested;
    }
    return [];
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private normalizeQuestions(raw: unknown): SettingsQuestion[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        const type = this.asRecord(this.pick(row, 'evaluationType', 'EvaluationType'));
        const position = this.asRecord(this.pick(row, 'position', 'Position'));
        const skill = this.asRecord(this.pick(row, 'skill', 'Skill'));
        const family = this.asRecord(this.pick(skill, 'family', 'Family'));
        const domain = this.asRecord(this.pick(family, 'domain', 'Domain'));
        const competence = this.asRecord(this.pick(row, 'competenceLine', 'CompetenceLine'));
        const response = this.asRecord(this.pick(row, 'responseType', 'ResponseType'));
        const skillName =
          this.asString(this.pick(skill, 'name', 'Name', 'skillName', 'SkillName')) ??
          this.asString(this.pick(row, 'skillName', 'SkillName'));
        return {
          questionId: this.asNumber(this.pick(row, 'questionId', 'QuestionId', 'id', 'Id')) ?? 0,
          question: this.asString(this.pick(row, 'question', 'Question')) ?? '',
          evaluationTypeId: this.asNumber(this.pick(row, 'evaluationTypeId', 'EvaluationTypeId')) ?? 0,
          evaluationTypeName:
            this.asString(this.pick(type, 'designation', 'Designation')) ??
            this.asString(this.pick(row, 'evaluationTypeName', 'EvaluationTypeName')) ??
            '',
          skillId: this.asNumber(this.pick(row, 'skillId', 'SkillId')) ?? this.asNumber(this.pick(skill, 'skillId', 'SkillId')),
          skillName,
          familyId:
            this.asNumber(this.pick(row, 'familyId', 'FamilyId')) ??
            this.asNumber(this.pick(skill, 'familyId', 'FamilyId')) ??
            this.asNumber(this.pick(family, 'familyId', 'FamilyId')),
          familyName:
            this.asString(this.pick(row, 'familyName', 'FamilyName')) ??
            this.asString(this.pick(family, 'name', 'Name')),
          domainId:
            this.asNumber(this.pick(row, 'domainId', 'DomainId')) ??
            this.asNumber(this.pick(family, 'domainSkillId', 'DomainSkillId')) ??
            this.asNumber(this.pick(domain, 'domainSkillId', 'DomainSkillId')),
          domainName:
            this.asString(this.pick(row, 'domainName', 'DomainName')) ??
            this.asString(this.pick(domain, 'name', 'Name')),
          positionId: this.asNumber(this.pick(row, 'positionId', 'PositionId')),
          positionName:
            this.asString(this.pick(position, 'positionName', 'PositionName')) ??
            this.asString(this.pick(row, 'positionName', 'PositionName')) ??
            '',
          competenceLineId: this.asNumber(this.pick(row, 'competenceLineId', 'CompetenceLineId')),
          competenceName:
            skillName ??
            this.asString(this.pick(competence, 'skillName', 'SkillName', 'description', 'Description')) ??
            this.asString(this.pick(row, 'competenceName', 'CompetenceName')),
          responseTypeId: this.asNumber(this.pick(row, 'responseTypeId', 'ResponseTypeId')) ?? 1,
          responseTypeName:
            this.asString(this.pick(response, 'typeName', 'TypeName')) ??
            this.asString(this.pick(row, 'responseTypeName', 'ResponseTypeName')) ??
            'TEXT',
          optionCount: this.asNumber(this.pick(row, 'optionCount', 'OptionCount')) ?? 0,
          correctOptionCount: this.asNumber(this.pick(row, 'correctOptionCount', 'CorrectOptionCount')) ?? 0,
          state: this.asNumber(this.pick(row, 'state', 'State')) ?? 1,
        };
      })
      .filter((item) => item.questionId > 0);
  }

  private normalizeQuestionOptions(raw: unknown): SettingsQuestionOption[] {
    return this.asArray(raw)
      .map((item, index) => {
        const row = this.asRecord(item);
        return {
          optionId: this.asNumber(this.pick(row, 'optionId', 'OptionId')),
          optionText: this.asString(this.pick(row, 'optionText', 'OptionText')) ?? '',
          isCorrect: Boolean(this.pick(row, 'isCorrect', 'IsCorrect')),
          sortOrder: this.asNumber(this.pick(row, 'sortOrder', 'SortOrder')) ?? index + 1,
        };
      })
      .filter((item) => item.optionText || item.optionId);
  }

  private normalizeOptionSummaries(raw: unknown): Record<number, { optionCount: number; correctCount: number }> {
    const next: Record<number, { optionCount: number; correctCount: number }> = {};
    for (const item of this.asArray(raw)) {
      const row = this.asRecord(item);
      const questionId = this.asNumber(this.pick(row, 'questionId', 'QuestionId'));
      if (!questionId) continue;
      next[questionId] = {
        optionCount: this.asNumber(this.pick(row, 'optionCount', 'OptionCount')) ?? 0,
        correctCount: this.asNumber(this.pick(row, 'correctCount', 'CorrectCount')) ?? 0,
      };
    }
    return next;
  }

  private normalizeTrainings(raw: unknown): SettingsTraining[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        const type = this.asRecord(this.pick(row, 'evaluationType', 'EvaluationType'));
        const question = this.asRecord(this.pick(row, 'evaluationQuestion', 'EvaluationQuestion'));
        return {
          trainingSuggestionId:
            this.asNumber(this.pick(row, 'trainingSuggestionId', 'TrainingSuggestionId')) ?? 0,
          training: this.asString(this.pick(row, 'training', 'Training')) ?? '',
          details: this.asString(this.pick(row, 'details', 'Details')) ?? '',
          evaluationTypeId: this.asNumber(this.pick(row, 'evaluationTypeId', 'EvaluationTypeId')) ?? 0,
          evaluationTypeName:
            this.asString(this.pick(type, 'designation', 'Designation')) ??
            this.asString(this.pick(row, 'evaluationTypeName', 'EvaluationTypeName')) ??
            '',
          questionId: this.asNumber(this.pick(row, 'questionId', 'QuestionId')) ?? 0,
          questionText:
            this.asString(this.pick(question, 'question', 'Question')) ??
            this.asString(this.pick(row, 'questionText', 'QuestionText')) ??
            '',
          scoreThreshold: this.asNumber(this.pick(row, 'scoreThreshold', 'ScoreThreshold')) ?? 0,
          state: this.asNumber(this.pick(row, 'state', 'State')) ?? 1,
        };
      })
      .filter((item) => item.trainingSuggestionId > 0);
  }

  private normalizeTypes(raw: unknown): SettingsEvalType[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        return {
          evaluationTypeId: this.asNumber(this.pick(row, 'evaluationTypeId', 'EvaluationTypeId')) ?? 0,
          designation: this.asString(this.pick(row, 'designation', 'Designation')) ?? '',
          state: this.asNumber(this.pick(row, 'state', 'State')),
        };
      })
      .filter((item) => item.evaluationTypeId > 0 && item.designation);
  }

  private normalizePositions(raw: unknown): PositionOption[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        return {
          positionId: this.asNumber(this.pick(row, 'positionId', 'PositionId')) ?? 0,
          positionName: this.asString(this.pick(row, 'positionName', 'PositionName', 'name', 'Name')) ?? '',
        };
      })
      .filter((item) => item.positionId > 0 && item.positionName);
  }

  private normalizeCompetenceDomains(raw: unknown): CompetenceDomainNode[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        return {
          domainId: this.asNumber(this.pick(row, 'domainId', 'DomainId')) ?? 0,
          domainCode: this.asString(this.pick(row, 'domainCode', 'DomainCode')) ?? '',
          domainName: this.asString(this.pick(row, 'domainName', 'DomainName')) ?? '',
          families: this.asArray(this.pick(row, 'families', 'Families')).map((familyRaw) => {
            const family = this.asRecord(familyRaw);
            return {
              familyId: this.asNumber(this.pick(family, 'familyId', 'FamilyId')) ?? 0,
              familyCode: this.asString(this.pick(family, 'familyCode', 'FamilyCode')) ?? '',
              familyName: this.asString(this.pick(family, 'familyName', 'FamilyName')) ?? '',
              skills: this.asArray(this.pick(family, 'skills', 'Skills'))
                .map((skillRaw) => {
                  const skill = this.asRecord(skillRaw);
                  return {
                    skillId: this.asNumber(this.pick(skill, 'skillId', 'SkillId')) ?? 0,
                    skillCode: this.asString(this.pick(skill, 'skillCode', 'SkillCode')) ?? '',
                    skillName: this.asString(this.pick(skill, 'skillName', 'SkillName')) ?? '',
                    category: this.asString(this.pick(skill, 'category', 'Category')) ?? '',
                  };
                })
                .filter((skill) => skill.skillId > 0),
            };
          }).filter((family) => family.familyId > 0),
        };
      })
      .filter((domain) => domain.domainId > 0 && domain.domainName);
  }

  private normalizeCompetenceLines(raw: unknown): SettingsCompetenceLine[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        return {
          competenceLineId: this.asNumber(this.pick(row, 'competenceLineId', 'CompetenceLineId')) ?? 0,
          skillName:
            this.asString(this.pick(row, 'skillName', 'SkillName')) ??
            this.asString(this.pick(row, 'description', 'Description')) ??
            'Compétence',
          description: this.asString(this.pick(row, 'description', 'Description')) ?? '',
          positionId: this.asNumber(this.pick(row, 'positionId', 'PositionId')) ?? 0,
          positionName: this.asString(this.pick(row, 'positionName', 'PositionName')) ?? '',
        };
      })
      .filter((item) => item.competenceLineId > 0);
  }

  private normalizeResponseTypes(raw: unknown): ResponseTypeOption[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        return {
          responseTypeId: this.asNumber(this.pick(row, 'responseTypeId', 'ResponseTypeId')) ?? 0,
          typeName: this.asString(this.pick(row, 'typeName', 'TypeName', 'name', 'Name')) ?? 'TEXT',
          description: this.asString(this.pick(row, 'description', 'Description')),
        };
      })
      .filter((item) => item.responseTypeId > 0);
  }

  private normalizeTemplates(raw: unknown): EvaluationTemplate[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        return {
          id: this.asNumber(this.pick(row, 'id', 'Id', 'evaluationTypeId', 'EvaluationTypeId')) ?? 0,
          title:
            this.asString(this.pick(row, 'title', 'Title', 'designation', 'Designation', 'name', 'Name')) ??
            'Type',
          description: this.asString(this.pick(row, 'description', 'Description')) ?? '',
          questionCount: this.asNumber(this.pick(row, 'questionCount', 'QuestionCount')) ?? 0,
        };
      })
      .filter((item) => item.id > 0);
  }

  private normalizeTemplateQuestions(raw: unknown): TemplateQuestion[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        const responseType =
          this.asString(this.pick(row, 'responseType', 'ResponseType')) ??
          this.responseTypeFromId(this.asNumber(this.pick(row, 'responseTypeId', 'ResponseTypeId')));
        return {
          questionId: this.asNumber(this.pick(row, 'questionId', 'QuestionId')) ?? 0,
          text: this.asString(this.pick(row, 'text', 'Text', 'question', 'Question')) ?? '',
          positionId: this.asNumber(this.pick(row, 'positionId', 'PositionId')),
          competenceLineId: this.asNumber(this.pick(row, 'competenceLineId', 'CompetenceLineId')),
          responseType,
          maxTimeInMinutes: this.asNumber(this.pick(row, 'maxTimeInMinutes', 'MaxTimeInMinutes')) ?? 15,
        };
      })
      .filter((item) => item.questionId > 0);
  }

  private responseTypeFromId(id: number | null): string {
    if (id === 2) return 'QCM';
    if (id === 3) return 'SCORE';
    return 'TEXT';
  }
}
