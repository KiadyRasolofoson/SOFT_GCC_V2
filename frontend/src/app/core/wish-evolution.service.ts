import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EmployeeOption,
  EmployeeSkillItem,
  PositionOption,
  SkillPositionItem,
  SuggestionPositionItem,
  WishEvolutionDetails,
  WishEvolutionFilters,
  WishEvolutionForm,
  WishEvolutionItem,
  WishEvolutionPageResult,
  WishGraphPoint,
  WishTypeOption,
} from './wish-evolution.models';

@Injectable({ providedIn: 'root' })
export class WishEvolutionService {
  private readonly http = inject(HttpClient);

  async getPage(
    filters: Partial<WishEvolutionFilters>,
    pageNumber = 1,
    pageSize = 10,
  ): Promise<WishEvolutionPageResult> {
    let params = new HttpParams().set('page', String(pageNumber)).set('pageSize', String(pageSize));

    const cleaned = {
      keyWord: String(filters.keyWord ?? '').trim(),
      dateRequestMin: String(filters.dateRequestMin ?? '').trim(),
      dateRequestMax: String(filters.dateRequestMax ?? '').trim(),
      wishTypeId: String(filters.wishTypeId ?? '').trim(),
      positionId: String(filters.positionId ?? '').trim(),
      priority: String(filters.priority ?? '').trim(),
      state: String(filters.state ?? '').trim(),
    };

    for (const [key, value] of Object.entries(cleaned)) {
      if (value) params = params.set(key, value);
    }

    const response = await firstValueFrom(
      this.http.get<Record<string, any>>(`${environment.apiUrl}/WishEvolution/filter`, { params }),
    );

    const rows = Array.isArray(response?.['data']) ? (response['data'] as WishEvolutionItem[]) : [];
    const totalCount = Number(response?.['totalCount'] ?? rows.length ?? 0);

    return {
      data: rows,
      totalCount,
      totalPages: Number(response?.['totalPages'] ?? 0),
      currentPage: Number(response?.['currentPage'] ?? pageNumber),
      pageSize: Number(response?.['pageSize'] ?? pageSize),
    };
  }

  async getGraph(year: number): Promise<WishGraphPoint[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<WishGraphPoint[]>(`${environment.apiUrl}/WishEvolution/graphe/${year}`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async loadWishTypes(): Promise<WishTypeOption[]> {
    const response = await firstValueFrom(this.http.get<WishTypeOption[]>(`${environment.apiUrl}/WishType`));
    return Array.isArray(response) ? response : [];
  }

  async loadPositions(): Promise<PositionOption[]> {
    const response = await firstValueFrom(this.http.get<PositionOption[]>(`${environment.apiUrl}/Position`));
    return Array.isArray(response) ? response : [];
  }

  async loadEmployees(): Promise<EmployeeOption[]> {
    try {
      const response = await firstValueFrom(this.http.get<EmployeeOption[]>(`${environment.apiUrl}/Employee`));
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async create(payload: WishEvolutionForm): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/WishEvolution`, payload));
  }

  async update(id: number, payload: WishEvolutionForm): Promise<void> {
    await firstValueFrom(this.http.put(`${environment.apiUrl}/WishEvolution/${id}`, payload));
  }

  async getDetails(id: number): Promise<WishEvolutionDetails | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<WishEvolutionDetails[] | WishEvolutionDetails>(`${environment.apiUrl}/WishEvolution/${id}`),
      );
      return Array.isArray(response) ? response[0] ?? null : response ?? null;
    } catch {
      return null;
    }
  }

  async getSkillPosition(positionId: number): Promise<SkillPositionItem[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<SkillPositionItem[]>(`${environment.apiUrl}/WishEvolution/skillPosition/${positionId}`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async getEmployeeSkills(employeeId: number): Promise<EmployeeSkillItem[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<EmployeeSkillItem[]>(`${environment.apiUrl}/EmployeeSkills/employee/${employeeId}`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async getSuggestions(employeeId: number): Promise<SuggestionPositionItem[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<SuggestionPositionItem[]>(
          `${environment.apiUrl}/WishEvolution/suggestionPosition/${employeeId}`,
        ),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async updateState(state: number, wishEvolutionId: number): Promise<void> {
    const params = new HttpParams().set('state', String(state)).set('wishEvolutionId', String(wishEvolutionId));
    await firstValueFrom(this.http.put(`${environment.apiUrl}/WishEvolution/UpdateState`, null, { params }));
  }

  async delete(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/WishEvolution/${id}`));
  }
}
