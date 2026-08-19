import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResolvedEmployeeIds } from './employee-fiche.models';

type JsonObject = Record<string, any>;

@Injectable({ providedIn: 'root' })
export class EmployeeFicheService {
  private readonly http = inject(HttpClient);

  async resolveEmployeeIds(employeeKey: string): Promise<ResolvedEmployeeIds> {
    const key = String(employeeKey ?? '').trim();
    if (!key) {
      throw new Error('Identifiant employé manquant.');
    }

    const isNumeric = /^\d+$/.test(key);
    let employeeId: number | null = null;
    let registrationNumber: string | null = null;
    let baseEmployee: JsonObject | null = null;

    if (isNumeric) {
      try {
        const data = await firstValueFrom(this.http.get<JsonObject>(`${environment.apiUrl}/Employee/${key}`));
        if (data) {
          baseEmployee = data;
          employeeId = this.pickEmployeeId(data) ?? Number(key);
          registrationNumber = this.pickRegistrationNumber(data);
        }
      } catch {
        // continue
      }

      if (!registrationNumber) {
        try {
          const data = await firstValueFrom(
            this.http.get<JsonObject | JsonObject[]>(`${environment.apiUrl}/EmployeeSkills/description/${key}`),
          );
          const item = Array.isArray(data) ? data[0] : data;
          if (item) {
            baseEmployee = { ...(baseEmployee ?? {}), ...item };
            employeeId = this.pickEmployeeId(item) ?? Number(key);
            registrationNumber = this.pickRegistrationNumber(item);
          }
        } catch {
          // continue
        }
      }
    }

    if (!registrationNumber || !employeeId) {
      const matriculeCandidate = registrationNumber ?? key;
      try {
        const data = await firstValueFrom(this.http.get<JsonObject[]>(`${environment.apiUrl}/Employee`));
        const found = (data ?? []).find(
          (item) =>
            String(this.pickRegistrationNumber(item) ?? '').toLowerCase() ===
              String(matriculeCandidate).toLowerCase() ||
            (isNumeric && String(this.pickEmployeeId(item) ?? '') === key),
        );

        if (found) {
          baseEmployee = { ...(baseEmployee ?? {}), ...found };
          employeeId = this.pickEmployeeId(found) ?? employeeId;
          registrationNumber =
            this.pickRegistrationNumber(found) ?? registrationNumber ?? String(matriculeCandidate);
        } else if (!registrationNumber) {
          registrationNumber = String(matriculeCandidate);
        }
      } catch {
        if (!registrationNumber) {
          registrationNumber = String(matriculeCandidate);
        }
      }
    }

    if (!employeeId && isNumeric) {
      employeeId = Number(key);
    }

    if (!employeeId && !registrationNumber) {
      throw new Error('Employé introuvable.');
    }

    return { employeeId, registrationNumber, baseEmployee };
  }

  async getSkillsDescription(employeeId: number | null): Promise<JsonObject | null> {
    if (!employeeId) return null;

    try {
      const response = await firstValueFrom(
        this.http.get<JsonObject | JsonObject[]>(`${environment.apiUrl}/EmployeeSkills/description/${employeeId}`),
      );
      return Array.isArray(response) ? response[0] ?? null : response ?? null;
    } catch {
      return null;
    }
  }

  async getCareerData(registrationNumber: string | null): Promise<JsonObject | null> {
    if (!registrationNumber) return null;

    try {
      const [career, advancement, appointment, availability] = await Promise.all([
        firstValueFrom(this.http.get<JsonObject>(`${environment.apiUrl}/CareerPlan/careers/${registrationNumber}`)).catch(
          () => null,
        ),
        firstValueFrom(
          this.http.get<JsonObject[]>(`${environment.apiUrl}/CareerPlan/employee/${registrationNumber}/advancement`),
        ).catch(() => []),
        firstValueFrom(
          this.http.get<JsonObject[]>(`${environment.apiUrl}/CareerPlan/employee/${registrationNumber}/appointment`),
        ).catch(() => []),
        firstValueFrom(
          this.http.get<JsonObject[]>(`${environment.apiUrl}/CareerPlan/employee/${registrationNumber}/availability`),
        ).catch(() => []),
      ]);

      return {
        ...(career ?? {}),
        assignmentAdvancement: advancement ?? [],
        assignmentAppointment: appointment ?? [],
        assignmentAvailability: availability ?? [],
      };
    } catch {
      return null;
    }
  }

  private pickEmployeeId(value: JsonObject | null | undefined): number | null {
    const raw = value?.['employeeId'] ?? value?.['EmployeeId'] ?? value?.['employee']?.employeeId ?? null;
    const number = Number(raw);
    return Number.isFinite(number) ? number : null;
  }

  private pickRegistrationNumber(value: JsonObject | null | undefined): string | null {
    const next = value?.['registrationNumber'] ?? value?.['RegistrationNumber'] ?? null;
    return next == null || next === '' ? null : String(next);
  }
}
