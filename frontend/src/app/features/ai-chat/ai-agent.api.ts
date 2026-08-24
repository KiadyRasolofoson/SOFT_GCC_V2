import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AiAgentSettings,
  AiChatRequest,
  AiChatResponse,
  AiConversationDetail,
  AiConversationSummary,
  AiProviderCatalog,
  AiProviderConfig,
  AiProviderTestResult,
  AiToolInfo,
  AiToolPermission,
  UpdateAiAgentSettings,
  UpdateAiProviderConfig,
  UpsertAiToolPermission,
} from './ai-agent.models';

@Injectable({ providedIn: 'root' })
export class AiAgentApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ai-agent`;

  chat(body: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.base}/chat`, body);
  }

  listConversations(): Observable<AiConversationSummary[]> {
    return this.http.get<AiConversationSummary[]>(`${this.base}/conversations`);
  }

  getConversation(id: number): Observable<AiConversationDetail> {
    return this.http.get<AiConversationDetail>(`${this.base}/conversations/${id}`);
  }

  deleteConversation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/conversations/${id}`);
  }

  getTools(): Observable<{ tools: AiToolInfo[] }> {
    return this.http.get<{ tools: AiToolInfo[] }>(`${this.base}/tools`);
  }

  getProviders(): Observable<AiProviderCatalog[]> {
    return this.http.get<AiProviderCatalog[]>(`${this.base}/providers`);
  }

  getSettings(): Observable<AiAgentSettings> {
    return this.http.get<AiAgentSettings>(`${this.base}/settings`);
  }

  updateSettings(body: UpdateAiAgentSettings): Observable<AiAgentSettings> {
    return this.http.put<AiAgentSettings>(`${this.base}/settings`, body);
  }

  updateProvider(provider: string, body: UpdateAiProviderConfig): Observable<AiProviderConfig> {
    return this.http.put<AiProviderConfig>(`${this.base}/providers/${encodeURIComponent(provider)}`, body);
  }

  testProvider(provider: string): Observable<AiProviderTestResult> {
    return this.http.post<AiProviderTestResult>(`${this.base}/providers/${encodeURIComponent(provider)}/test`, {});
  }

  getToolPermissions(): Observable<AiToolPermission[]> {
    return this.http.get<AiToolPermission[]>(`${this.base}/tool-permissions`);
  }

  replaceToolPermissions(items: UpsertAiToolPermission[]): Observable<AiToolPermission[]> {
    return this.http.put<AiToolPermission[]>(`${this.base}/tool-permissions`, { items });
  }
}

export function apiErrorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string; error?: string } | string | null;
    if (body && typeof body === 'object') {
      const text = (body.message || body.error || '').trim();
      if (text) return text;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (err.status === 0) return 'Impossible de joindre le serveur.';
    if (err.status === 403) return "Vous n'avez pas les droits pour cette action.";
    if (err.status === 401) return 'Session expirée. Reconnectez-vous.';
  }
  return fallback;
}
