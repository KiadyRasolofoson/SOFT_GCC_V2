import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmployeeSkillListItem {
  employeeId: number | null;
  registrationNumber: string | null;
  name: string | null;
  firstName: string | null;
  updatedDate: string | null;
  educationNumber: number | null;
  skillNumber: number | null;
  languageNumber: number | null;
  otherFormationNumber: number | null;
  departmentName?: string | null;
  state?: string | null;
  [key: string]: any;
}

export interface EmployeeSkillListPageResult {
  data: EmployeeSkillListItem[];
  totalRecords: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeSkillListService {
  private readonly http = inject(HttpClient);

  async getPage(keyword = '', pageNumber = 1, pageSize = 10): Promise<EmployeeSkillListPageResult> {
    const trimmedKeyword = String(keyword ?? '').trim();
    const endpoint = trimmedKeyword ? `${environment.apiUrl}/EmployeeSkills/filter` : `${environment.apiUrl}/EmployeeSkills/list`;
    const params = new HttpParams()
      .set('pageNumber', String(pageNumber))
      .set('pageSize', String(pageSize))
      .set('keyWord', trimmedKeyword || '');

    const response = await firstValueFrom(
      this.http.get<Record<string, any>>(endpoint, { params }),
    );

    const data = Array.isArray(response?.['data']) ? (response['data'] as EmployeeSkillListItem[]) : [];
    const totalRecords = Number(response?.['totalRecords'] ?? data.length ?? 0);
    const currentPage = Number(response?.['currentPage'] ?? pageNumber);
    const pageSizeValue = Number(response?.['pageSize'] ?? pageSize);
    const totalPages = Number(response?.['totalPages'] ?? Math.max(1, Math.ceil(totalRecords / Math.max(pageSizeValue, 1))));

    return {
      data,
      totalRecords,
      pageSize: pageSizeValue,
      currentPage,
      totalPages,
    };
  }
}
