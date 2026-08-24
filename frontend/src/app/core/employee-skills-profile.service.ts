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

  /** GET /DomainSkill → référentiel des domaines de compétence ({ domainSkillId, name }). */
  async loadDomainSkills(): Promise<JsonObject[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<JsonObject[]>(`${environment.apiUrl}/DomainSkill`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  /** GET /Skill → référentiel des compétences ({ skillId, name }). */
  async loadSkills(): Promise<JsonObject[]> {
    try {
      const response = await firstValueFrom(this.http.get<JsonObject[]>(`${environment.apiUrl}/Skill`));
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  /** POST /EmployeeSkills → crée une compétence pour l'employé (retour 201 JSON, logging interne). */
  async createSkill(payload: Record<string, any>): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/EmployeeSkills`, payload));
  }

  async updateSkill(id: number, payload: Record<string, any>): Promise<void> {
    await firstValueFrom(this.http.put(`${environment.apiUrl}/EmployeeSkills/${id}`, payload));
  }

  async deleteSkill(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/EmployeeSkills/${id}`));
  }

  // ---- Référentiels diplômes & formations ----
  async loadStudyPaths(): Promise<JsonObject[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<JsonObject[]>(`${environment.apiUrl}/StudyPath`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async loadDegrees(): Promise<JsonObject[]> {
    try {
      const response = await firstValueFrom(this.http.get<JsonObject[]>(`${environment.apiUrl}/Degree`));
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async loadSchools(): Promise<JsonObject[]> {
    try {
      const response = await firstValueFrom(this.http.get<JsonObject[]>(`${environment.apiUrl}/School`));
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async loadLanguages(): Promise<JsonObject[]> {
    try {
      const response = await firstValueFrom(this.http.get<JsonObject[]>(`${environment.apiUrl}/Language`));
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  // ---- Diplômes & formations (EmployeeEducation) ----
  async createEducation(payload: Record<string, any>): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/EmployeeEducation`, payload));
  }

  async updateEducation(id: number, payload: Record<string, any>): Promise<void> {
    await firstValueFrom(this.http.put(`${environment.apiUrl}/EmployeeEducation/${id}`, payload));
  }

  async deleteEducation(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/EmployeeEducation/${id}`));
  }

  // ---- Langues (EmployeeLanguage) — NOTA : champ `language_id` (underscore) côté entité ----
  async createLanguage(payload: Record<string, any>): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/EmployeeLanguage`, payload));
  }

  async updateLanguage(id: number, payload: Record<string, any>): Promise<void> {
    await firstValueFrom(this.http.put(`${environment.apiUrl}/EmployeeLanguage/${id}`, payload));
  }

  async deleteLanguage(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/EmployeeLanguage/${id}`));
  }

  // ---- Autres formations (EmployeeOtherFormation) ----
  async createOtherSkill(payload: Record<string, any>): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/EmployeeOtherFormation`, payload));
  }

  async updateOtherSkill(id: number, payload: Record<string, any>): Promise<void> {
    await firstValueFrom(this.http.put(`${environment.apiUrl}/EmployeeOtherFormation/${id}`, payload));
  }

  async deleteOtherSkill(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/EmployeeOtherFormation/${id}`));
  }
}
