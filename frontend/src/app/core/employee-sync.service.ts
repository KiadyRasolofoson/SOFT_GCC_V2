import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type SyncStatus = 'Success' | 'Partial' | 'Failed';

export interface SyncRunResult {
  message: string;
  status: SyncStatus | string;
  recordsInserted: number;
  recordsUpdated: number;
  recordsFailed: number;
  syncDate: string | null;
  error: string | null;
}

export interface SyncLogItem {
  syncLogId: number;
  syncDate: string;
  status: string;
  recordsInserted: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage: string | null;
}

/**
 * Synchronisation des employés depuis la base de paie Sage (p_sw) vers Soft GCC
 * (miroir React EmployeeSyncService.js).
 * POST /EmployeeSync/run → résultat ; GET /EmployeeSync/logs?page&pageSize → tableau de SyncLog.
 */
@Injectable({ providedIn: 'root' })
export class EmployeeSyncService {
  private readonly http = inject(HttpClient);

  async runSync(): Promise<SyncRunResult> {
    const response = await firstValueFrom(
      this.http.post<SyncRunResult>(`${environment.apiUrl}/EmployeeSync/run`, null),
    );
    return (
      response ?? {
        message: '',
        status: 'Failed',
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        syncDate: null,
        error: 'Réponse vide du serveur.',
      }
    );
  }

  async getSyncLogs(page: number, pageSize: number): Promise<SyncLogItem[]> {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    const response = await firstValueFrom(
      this.http.get<SyncLogItem[]>(`${environment.apiUrl}/EmployeeSync/logs`, { params }),
    );
    return Array.isArray(response) ? response : [];
  }
}
