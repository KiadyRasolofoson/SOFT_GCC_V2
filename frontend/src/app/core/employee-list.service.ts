import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmployeeListFilter {
  keyWord: string;
  departmentId: string;
  hiringDate1: string;
  hiringDate2: string;
}

export interface EmployeeListItem {
  employeeId: number | null;
  registrationNumber: string | null;
  name: string | null;
  firstName: string | null;
  birthday: string | null;
  departmentId: number | null;
  departmentName: string | null;
  hiringDate: string | null;
  civiliteName: string | null;
  managerId: number | null;
  managerName: string | null;
  managerFirstName: string | null;
  photo?: boolean;
  [key: string]: any;
}

export interface EmployeeListPageResult {
  data: EmployeeListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  success: boolean;
  message: string;
}

export interface DepartmentOption {
  departmentId: number | string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeListService {
  private readonly http = inject(HttpClient);

  async filter(filters: Partial<EmployeeListFilter>, pageNumber = 1, pageSize = 10): Promise<EmployeeListPageResult> {
    let params = new HttpParams()
      .set('page', String(pageNumber))
      .set('pageSize', String(pageSize));

    const cleaned: Record<string, string> = {
      keyWord: String(filters.keyWord ?? '').trim(),
      departmentId: String(filters.departmentId ?? '').trim(),
      hiringDate1: String(filters.hiringDate1 ?? '').trim(),
      hiringDate2: String(filters.hiringDate2 ?? '').trim(),
    };

    for (const [key, value] of Object.entries(cleaned)) {
      if (value) {
        params = params.set(key, value);
      }
    }

    const response = await firstValueFrom(
      this.http.get<Record<string, any>>(`${environment.apiUrl}/Employee/filter`, { params }),
    );

    const data = Array.isArray(response?.['data']) ? (response['data'] as EmployeeListItem[]) : [];
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

  async loadDepartments(): Promise<DepartmentOption[]> {
    try {
      const response = await firstValueFrom(this.http.get<DepartmentOption[]>(`${environment.apiUrl}/Department`));
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async loadAll(): Promise<EmployeeListItem[]> {
    try {
      const response = await firstValueFrom(this.http.get<EmployeeListItem[]>(`${environment.apiUrl}/Employee`));
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  /** Création d'un employé (POST /Employee, multipart/form-data). */
  async create(payload: FormData): Promise<{ ok: boolean; message?: string; status?: number }> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/Employee`, payload));
      return { ok: true };
    } catch (error: any) {
      const status = Number(error?.status ?? 0);
      const body = error?.error;
      const message =
        typeof body?.message === 'string'
          ? body.message
          : body?.errors?.[0]?.description ?? body?.errors?.[0]?.code;
      return { ok: false, message: message || `Erreur lors de l'insertion.`, status };
    }
  }

  /** Import d'employés via CSV (POST /Org/employee/import). */
  async importEmployees(payload: Record<string, any>[]): Promise<{ success: boolean; message: string; errors?: string[] }> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message: string; errors?: string[] }>(
          `${environment.apiUrl}/Org/employee/import`,
          payload,
        ),
      );
      return response ?? { success: false, message: 'Réponse vide du serveur.' };
    } catch (error: any) {
      const body = error?.error;
      if (body?.errors?.length) {
        return { success: false, message: body.errors.join('\n') };
      }
      if (body?.message) {
        return { success: false, message: body.message };
      }
      return { success: false, message: `Erreur lors de l'importation des données.` };
    }
  }

  photoUrl(employeeId: number | null): string {
    return employeeId == null ? '' : `${environment.apiUrl}/Employee/photo/${employeeId}`;
  }

  /** Matricule suivant : EMP + compteur incrémenté, largeur 4. */
  nextRegistrationNumber(employees: EmployeeListItem[]): string {
    const highest = (employees ?? []).reduce((max, employee) => {
      const raw = String(employee?.registrationNumber ?? '');
      const match = raw.trim().match(/^EMP0*(\d+)$/i);
      if (!match) return max;
      const numeric = Number.parseInt(match[1], 10);
      return Number.isNaN(numeric) ? max : Math.max(max, numeric);
    }, 0);
    return `EMP${String(highest + 1).padStart(4, '0')}`;
  }
}
