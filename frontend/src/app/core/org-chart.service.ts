import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrgNode {
  employeeId: number;
  departmentId: number | null;
  name: string;
  firstName: string;
  department: string;
  civilite: string;
  position: string;
  hasPhoto: boolean;
  children: OrgNode[];
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class OrgChartService {
  private readonly http = inject(HttpClient);

  async load(): Promise<OrgNode[]> {
    const response = await firstValueFrom(this.http.get<OrgNode[]>(`${environment.apiUrl}/Org/organigramme`));
    return Array.isArray(response) ? response : [];
  }

  photoUrl(employeeId: number | null | undefined): string {
    return employeeId == null ? '' : `${environment.apiUrl}/Employee/photo/${employeeId}`;
  }
}
