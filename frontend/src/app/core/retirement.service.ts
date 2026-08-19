import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RetirementFilter {
  keyWord: string;
  civiliteId: string;
  departmentId: string;
  positionId: string;
  age: string;
  year: string;
}

export interface RetirementItem {
  registrationNumber: string | null;
  civiliteId: number | string | null;
  civiliteName: string | null;
  name: string | null;
  firstName: string | null;
  departmentId: number | string | null;
  departmentName: string | null;
  positionId: number | string | null;
  positionName: string | null;
  age: number | null;
  dateDepart: string | null;
  yearRetirement?: number | null;
  [key: string]: any;
}

export interface RetirementListResult {
  data: RetirementItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  success: boolean;
  message: string;
}

export interface RetirementOption {
  value: string;
  label: string;
}

export interface RetirementParameter {
  retirementParameterId: number | null;
  womanAge: number | null;
  manAge: number | null;
}

@Injectable({ providedIn: 'root' })
export class RetirementService {
  private readonly http = inject(HttpClient);

  async filter(filters: Partial<RetirementFilter>, pageNumber = 1, pageSize = 10): Promise<RetirementListResult> {
    let params = new HttpParams()
      .set('page', String(pageNumber))
      .set('pageSize', String(pageSize));

    const cleaned: Record<string, string> = {
      keyWord: String(filters.keyWord ?? '').trim(),
      civiliteId: String(filters.civiliteId ?? '').trim(),
      departmentId: String(filters.departmentId ?? '').trim(),
      positionId: String(filters.positionId ?? '').trim(),
      age: String(filters.age ?? '').trim(),
      year: String(filters.year ?? '').trim(),
    };

    for (const [key, value] of Object.entries(cleaned)) {
      if (value) {
        params = params.set(key, value);
      }
    }

    const response = await firstValueFrom(
      this.http.get<Record<string, any>>(`${environment.apiUrl}/Retirement/filter`, { params }),
    );

    const data = Array.isArray(response?.['data']) ? (response['data'] as RetirementItem[]) : [];
    const totalCount = Number(response?.['totalCount'] ?? data.length ?? 0);
    const totalPages = Number(response?.['totalPages'] ?? 0);

    return {
      data,
      totalCount,
      totalPages,
      currentPage: Number(response?.['currentPage'] ?? pageNumber),
      pageSize: Number(response?.['pageSize'] ?? pageSize),
      success: Boolean(response?.['success'] ?? true),
      message: String(response?.['message'] ?? ''),
    };
  }

  async loadCivilites(): Promise<RetirementOption[]> {
    const response = await firstValueFrom(this.http.get<Array<{ civiliteId: number | string; civiliteName: string }>>(`${environment.apiUrl}/Civilite`));
    return Array.isArray(response)
      ? response.map((item) => ({ value: String(item.civiliteId), label: item.civiliteName || 'Civilité' }))
      : [];
  }

  async loadDepartments(): Promise<RetirementOption[]> {
    const response = await firstValueFrom(this.http.get<Array<{ departmentId: number | string; name: string }>>(`${environment.apiUrl}/Department`));
    return Array.isArray(response)
      ? response.map((item) => ({ value: String(item.departmentId), label: item.name || 'Département' }))
      : [];
  }

  async loadPositions(): Promise<RetirementOption[]> {
    const response = await firstValueFrom(this.http.get<Array<{ positionId: number | string; positionName: string }>>(`${environment.apiUrl}/Position`));
    return Array.isArray(response)
      ? response.map((item) => ({ value: String(item.positionId), label: item.positionName || 'Poste' }))
      : [];
  }

  async loadParameters(): Promise<RetirementParameter[]> {
    const response = await firstValueFrom(this.http.get<Array<RetirementParameter>>(`${environment.apiUrl}/Retirement/parametre`));
    return Array.isArray(response) ? response : [];
  }

  async saveParameters(payload: RetirementParameter): Promise<void> {
    const id = payload.retirementParameterId ?? 1;
    await firstValueFrom(this.http.put(`${environment.apiUrl}/Retirement/parametre/${id}`, payload));
  }
}
