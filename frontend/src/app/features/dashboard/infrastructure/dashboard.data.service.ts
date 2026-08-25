import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardSummary } from '../core/dashboard.models';

/**
 * Couche Infrastructure : accès aux données du tableau de bord.
 * Miroir d'un repository backend — le composant (contrôleur) ne doit jamais
 * appeler HttpClient directement.
 */
@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly http = inject(HttpClient);

  /** GET /Dashboard → résumé global des indicateurs. */
  async loadSummary(): Promise<DashboardSummary> {
    return firstValueFrom(this.http.get<DashboardSummary>(`${environment.apiUrl}/Dashboard`));
  }
}
