import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ActivityLogItem {
  activityLogId: number;
  description: string | null;
  timestamp: string | null;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  private readonly http = inject(HttpClient);

  /** GET /ActivityLog → historique des actions (activity_logs, tri Creation_date DESC). */
  async load(): Promise<ActivityLogItem[]> {
    return await firstValueFrom(
      this.http.get<ActivityLogItem[]>(`${environment.apiUrl}/ActivityLog`),
    );
  }
}
