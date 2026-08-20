import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Service CRUD générique pour les paramètres (miroir du EntityManager React).
 * Gère les payloads JSON (entités simples) et FormData (entités avec logo/photo).
 */
@Injectable({ providedIn: 'root' })
export class EntityCrudService {
  private readonly http = inject(HttpClient);

  async list<T = Record<string, any>>(endpoint: string): Promise<T[]> {
    try {
      const response = await firstValueFrom(this.http.get<T[]>(`${environment.apiUrl}${endpoint}`));
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async getById<T = Record<string, any>>(endpoint: string, id: number | string): Promise<T | null> {
    try {
      const response = await firstValueFrom(this.http.get<T>(`${environment.apiUrl}${endpoint}/${id}`));
      return response ?? null;
    } catch {
      return null;
    }
  }

  async create(endpoint: string, payload: Record<string, any> | FormData): Promise<void> {
    if (payload instanceof FormData) {
      await firstValueFrom(this.http.post(`${environment.apiUrl}${endpoint}`, payload));
      return;
    }
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}${endpoint}`, payload, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }),
    );
  }

  async update(endpoint: string, id: number | string, payload: Record<string, any> | FormData): Promise<void> {
    if (payload instanceof FormData) {
      await firstValueFrom(this.http.put(`${environment.apiUrl}${endpoint}/${id}`, payload));
      return;
    }
    await firstValueFrom(
      this.http.put(`${environment.apiUrl}${endpoint}/${id}`, payload, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }),
    );
  }

  async delete(endpoint: string, id: number | string): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}${endpoint}/${id}`));
  }

  /** URL absolue d'un endpoint donné (pour images logo/photo). */
  absoluteUrl(endpoint: string): string {
    return `${environment.apiUrl}${endpoint}`;
  }
}
