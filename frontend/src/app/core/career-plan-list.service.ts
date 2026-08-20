import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CareerPlanListFilter {
  keyWord: string;
  departmentId: string;
  positionId: string;
  dateAssignmentMin: string;
  dateAssignmentMax: string;
}

export interface CareerPlanListItem {
  registrationNumber: string | null;
  name: string | null;
  firstName: string | null;
  departmentName: string | null;
  positionName: string | null;
  assignmentDate: string | null;
  careerPlanNumber: number | null;
  [key: string]: any;
}

export interface CareerPlanListPageResult {
  data: CareerPlanListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface DepartmentOption {
  departmentId: number | string;
  name: string;
}

export interface PositionOption {
  positionId: number | string;
  positionName: string;
}

@Injectable({ providedIn: 'root' })
export class CareerPlanListService {
  private readonly http = inject(HttpClient);

  async list(filters: Partial<CareerPlanListFilter>, pageNumber = 1, pageSize = 10): Promise<CareerPlanListPageResult> {
    const params = new HttpParams();

    let requestParams = params
      .set('pageNumber', String(pageNumber))
      .set('pageSize', String(pageSize));

    const cleaned = {
      keyWord: String(filters.keyWord ?? '').trim(),
      departmentId: String(filters.departmentId ?? '').trim(),
      positionId: String(filters.positionId ?? '').trim(),
      dateAssignmentMin: String(filters.dateAssignmentMin ?? '').trim(),
      dateAssignmentMax: String(filters.dateAssignmentMax ?? '').trim(),
    };

    for (const [key, value] of Object.entries(cleaned)) {
      if (value) {
        requestParams = requestParams.set(key, value);
      }
    }

    const response = await firstValueFrom(
      this.http.get<Record<string, any>>(`${environment.apiUrl}/CareerPlan/filter`, { params: requestParams }),
    );

    const rows = Array.isArray(response?.['data']) ? (response['data'] as CareerPlanListItem[]) : [];
    const totalCount = Number(response?.['totalCount'] ?? rows.length ?? 0);
    const totalPages = Number(response?.['totalPages'] ?? 0);

    return {
      data: rows,
      totalCount,
      totalPages,
      currentPage: Number(response?.['currentPage'] ?? pageNumber),
      pageSize: Number(response?.['pageSize'] ?? pageSize),
    };
  }

  async loadDepartments(): Promise<DepartmentOption[]> {
    const response = await firstValueFrom(this.http.get<DepartmentOption[]>(`${environment.apiUrl}/Department`));
    return Array.isArray(response) ? response : [];
  }

  async loadPositions(): Promise<PositionOption[]> {
    const response = await firstValueFrom(this.http.get<PositionOption[]>(`${environment.apiUrl}/Position`));
    return Array.isArray(response) ? response : [];
  }
}
