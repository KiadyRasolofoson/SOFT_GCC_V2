import { Injectable, signal } from '@angular/core';
import { PlanningEmployee } from './evaluation.models';

@Injectable({ providedIn: 'root' })
export class PlanningSessionService {
  readonly employees = signal<PlanningEmployee[]>([]);
  readonly remindersEnabled = signal(false);

  setTeam(employees: PlanningEmployee[]): void {
    const unique = new Map<number, PlanningEmployee>();
    for (const employee of employees) {
      unique.set(employee.employeeId, employee);
    }
    this.employees.set([...unique.values()]);
  }

  toggle(employee: PlanningEmployee): void {
    this.employees.update((list) => {
      const exists = list.some((row) => row.employeeId === employee.employeeId);
      return exists ? list.filter((row) => row.employeeId !== employee.employeeId) : [...list, employee];
    });
  }

  addMany(employees: PlanningEmployee[]): void {
    this.employees.update((list) => {
      const next = new Map(list.map((row) => [row.employeeId, row] as const));
      for (const employee of employees) next.set(employee.employeeId, employee);
      return [...next.values()];
    });
  }

  removeMany(employeeIds: number[]): void {
    const ids = new Set(employeeIds);
    this.employees.update((list) => list.filter((row) => !ids.has(row.employeeId)));
  }

  remove(employeeId: number): void {
    this.employees.update((list) => list.filter((row) => row.employeeId !== employeeId));
  }

  has(employeeId: number): boolean {
    return this.employees().some((row) => row.employeeId === employeeId);
  }

  clear(): void {
    this.employees.set([]);
    this.remindersEnabled.set(false);
  }
}
