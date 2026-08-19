import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

type JsonObject = Record<string, any>;

export interface EmployeeSkillsProfileData {
  skills: JsonObject[];
  education: JsonObject[];
  language: JsonObject[];
  otherSkills: JsonObject[];
}

@Injectable({ providedIn: 'root' })
export class EmployeeSkillsProfileService {
  private readonly http = inject(HttpClient);

  async getProfileData(employeeId: number): Promise<EmployeeSkillsProfileData> {
    const [skills, education, language, otherSkills] = await Promise.all([
      this.getEmployeeSkills(employeeId),
      this.getEmployeeEducation(employeeId),
      this.getEmployeeLanguage(employeeId),
      this.getEmployeeOtherFormation(employeeId),
    ]);

    return { skills, education, language, otherSkills };
  }

  async getSkillLevel(employeeId: number, state: number): Promise<JsonObject[]> {
    try {
      const params = new URLSearchParams({
        employeeId: String(employeeId),
        state: String(state),
      });
      const response = await firstValueFrom(
        this.http.get<JsonObject[]>(`${environment.apiUrl}/EmployeeSkills/skillLevel?${params.toString()}`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  private async getEmployeeSkills(employeeId: number): Promise<JsonObject[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<JsonObject[]>(`${environment.apiUrl}/EmployeeSkills/employee/${employeeId}`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  private async getEmployeeEducation(employeeId: number): Promise<JsonObject[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<JsonObject[]>(`${environment.apiUrl}/EmployeeEducation/employee/${employeeId}`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  private async getEmployeeLanguage(employeeId: number): Promise<JsonObject[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<JsonObject[]>(`${environment.apiUrl}/EmployeeLanguage/employee/${employeeId}`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  private async getEmployeeOtherFormation(employeeId: number): Promise<JsonObject[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<JsonObject[]>(`${environment.apiUrl}/EmployeeOtherFormation/employee/${employeeId}`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }
}
