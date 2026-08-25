import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DepartmentEmployeeItem {
  employeeId: number | null;
  registrationNumber: string | null;
  name: string | null;
  firstName: string | null;
  departmentName: string | null;
  civiliteName: string | null;
  positionName: string | null;
  hiringDate: string | null;
  seniority: string | null;
  photo: string | null;
  [key: string]: any;
}

export interface DepartmentDetail {
  departmentId: number;
  name: string | null;
  photo: string | null;
  [key: string]: any;
}

export interface DepartmentDetailResult {
  employees: DepartmentEmployeeItem[];
  department: DepartmentDetail | null;
}

@Injectable({ providedIn: 'root' })
export class DepartmentDetailService {
  private readonly http = inject(HttpClient);

  async load(departmentId: number): Promise<DepartmentDetailResult> {
    const [employees, department] = await Promise.all([
      firstValueFrom(
        this.http.get<DepartmentEmployeeItem[]>(`${environment.apiUrl}/Org/detailDepartement/${departmentId}`),
      ),
      firstValueFrom(this.http.get<DepartmentDetail>(`${environment.apiUrl}/Department/${departmentId}`)),
    ]);

    return {
      employees: Array.isArray(employees) ? employees : [],
      department: department ?? null,
    };
  }

  employeePhotoUrl(employeeId: number | null | undefined): string {
    return employeeId == null ? '' : `${environment.apiUrl}/Employee/photo/${employeeId}`;
  }
}
