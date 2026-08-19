import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DepartmentEffectiveItem {
  departmentId: number | null;
  departmentName: string | null;
  nEmployee: number | null;
  departmentPhoto: string | null;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class DepartmentEffectiveService {
  private readonly http = inject(HttpClient);

  async load(): Promise<DepartmentEffectiveItem[]> {
    const response = await firstValueFrom(
      this.http.get<DepartmentEffectiveItem[]>(`${environment.apiUrl}/Org/effectifDepartement`),
    );
    return Array.isArray(response) ? response : [];
  }

  photoUrl(departmentId: number | null | undefined): string {
    return departmentId == null ? '' : `${environment.apiUrl}/Department/photo/${departmentId}`;
  }
}
