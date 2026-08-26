import { HttpContextToken } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

export const PORTAL_REQUEST = new HttpContextToken(() => false);

export const EVALUATION_TOKEN_KEY = 'evaluationToken';
export const EVALUATION_ID_KEY = 'evaluationId';

export interface PortalProgress {
  answered: number;
  total: number;
}

export interface PortalAnswerDraft {
  answers: Record<string, string>;
}

interface PortalJwtPayload {
  sub?: string;
  nameid?: string;
  evaluationId?: string | number;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class EvaluationPortalSession {
  readonly token = signal<string | null>(localStorage.getItem(EVALUATION_TOKEN_KEY));
  readonly evaluationId = signal<number | null>(readStoredEvaluationId());
  readonly campaignTitle = signal('Auto-évaluation');
  readonly progress = signal<PortalProgress>({ answered: 0, total: 0 });

  persist(token: string, evaluationId: number): void {
    localStorage.setItem(EVALUATION_TOKEN_KEY, token);
    localStorage.setItem(EVALUATION_ID_KEY, String(evaluationId));
    this.token.set(token);
    this.evaluationId.set(evaluationId);
  }

  clear(): void {
    const evaluationId = this.evaluationId();
    localStorage.removeItem(EVALUATION_TOKEN_KEY);
    localStorage.removeItem(EVALUATION_ID_KEY);
    if (evaluationId) this.clearAnswers(evaluationId);
    this.token.set(null);
    this.evaluationId.set(null);
    this.resetChrome();
  }

  resetChrome(): void {
    this.campaignTitle.set('Auto-évaluation');
    this.progress.set({ answered: 0, total: 0 });
  }

  setCampaignTitle(title: string): void {
    this.campaignTitle.set(title.trim() || 'Auto-évaluation');
  }

  setProgress(answered: number, total: number): void {
    this.progress.set({
      answered: Math.max(0, answered),
      total: Math.max(0, total),
    });
  }

  hasValidSession(): boolean {
    const token = this.token();
    const evaluationId = this.evaluationId();
    return Boolean(token && evaluationId && this.isTokenValid(token));
  }

  isTokenValid(token: string): boolean {
    const payload = decodePortalJwt(token);
    return Boolean(payload?.exp && payload.exp * 1000 > Date.now());
  }

  employeeId(): number | null {
    const payload = decodePortalJwt(this.token());
    if (!payload) return null;
    return toPositiveInt(payload.sub) ?? toPositiveInt(payload.nameid);
  }

  answersStorageKey(evaluationId: number): string {
    return `evaluationAnswers:${evaluationId}`;
  }

  loadAnswers(evaluationId: number): Record<string, string> {
    try {
      const raw = sessionStorage.getItem(this.answersStorageKey(evaluationId));
      if (!raw) return {};
      const parsed = JSON.parse(raw) as PortalAnswerDraft;
      return parsed?.answers && typeof parsed.answers === 'object' ? parsed.answers : {};
    } catch {
      return {};
    }
  }

  saveAnswers(evaluationId: number, answers: Record<number, string>): void {
    const draft: PortalAnswerDraft = {
      answers: Object.fromEntries(
        Object.entries(answers)
          .filter(([, value]) => String(value ?? '').trim().length > 0)
          .map(([key, value]) => [key, String(value)]),
      ),
    };
    sessionStorage.setItem(this.answersStorageKey(evaluationId), JSON.stringify(draft));
  }

  clearAnswers(evaluationId: number): void {
    sessionStorage.removeItem(this.answersStorageKey(evaluationId));
  }
}

function readStoredEvaluationId(): number | null {
  return toPositiveInt(localStorage.getItem(EVALUATION_ID_KEY));
}

function toPositiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function decodePortalJwt(token: string | null): PortalJwtPayload | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as PortalJwtPayload;
  } catch {
    return null;
  }
}
