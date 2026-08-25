import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BulletinSkill {
  skillId: number;
  skillName: string;
  level: number;
  expectedLevel?: number;
  state: number;
  classification: string;
  classificationLabel: string;
  lastUpdated: string | null;
}

export interface BulletinDomain {
  domainId: number | null;
  domainName: string;
  skills: BulletinSkill[];
  masteredCount: number;
  inProgressCount: number;
  notAcquiredCount: number;
}

export interface BulletinResponse {
  employeeId: number;
  employeeName: string;
  employeeFirstName: string;
  registrationNumber: string;
  departmentName: string;
  totalSkills: number;
  masteredCount: number;
  inProgressCount: number;
  notAcquiredCount: number;
  domains: BulletinDomain[];
}

export interface BulletinEmployeeOption {
  employeeId: number | string;
  registrationNumber: string | null;
  name: string | null;
  firstName: string | null;
}

/**
 * Bulletin de compétences individuel (miroir React BulletinCompetencesPage).
 * GET /BulletinCompetence/employee/{employeeId} → BulletinResponse (domaines + classification).
 */
@Injectable({ providedIn: 'root' })
export class BulletinCompetenceService {
  private readonly http = inject(HttpClient);

  async loadEmployees(): Promise<BulletinEmployeeOption[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<BulletinEmployeeOption[]>(`${environment.apiUrl}/Employee`),
      );
      if (Array.isArray(response)) return response;
    } catch {
      // fallback ci-dessous
    }

    try {
      const params = new HttpParams().set('pageNumber', '1').set('pageSize', '500');
      const fallback = await firstValueFrom(
        this.http.get<Record<string, any>[]>(`${environment.apiUrl}/EmployeeSkills/description/1`, {
          params,
        }),
      );
      if (Array.isArray(fallback)) {
        return fallback.map((item) => ({
          employeeId: item['employeeId'] ?? item['employee_id'],
          registrationNumber: item['registrationNumber'] ?? item['registration_number'],
          name: item['name'],
          firstName: item['firstName'] ?? item['first_name'],
        }));
      }
    } catch {
      // ignore
    }
    return [];
  }

  async loadBulletin(employeeId: number): Promise<BulletinResponse | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<BulletinResponse>(`${environment.apiUrl}/BulletinCompetence/employee/${employeeId}`),
      );
      return response ?? null;
    } catch {
      return null;
    }
  }
}
