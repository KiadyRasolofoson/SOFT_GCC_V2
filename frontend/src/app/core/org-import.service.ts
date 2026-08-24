import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrgImportResult {
  success: boolean;
  message: string;
  errors?: string[];
}

/**
 * Import d'employés via CSV (miroir React CsvUploader → POST /Org/employee/import).
 * Le contrôleur renvoie un JSON { success, message, errors? } (200) ou BadRequest
 * avec un corps TEXTE (« Le fichier CSV est vide ou invalide. »).
 */
@Injectable({ providedIn: 'root' })
export class OrgImportService {
  private readonly http = inject(HttpClient);

  async importEmployees(payload: Record<string, any>[]): Promise<OrgImportResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<OrgImportResult>(`${environment.apiUrl}/Org/employee/import`, payload),
      );
      return response ?? { success: false, message: 'Réponse vide du serveur.' };
    } catch (error: any) {
      const body = error?.error;
      if (body?.errors?.length) {
        return { success: false, message: body.errors.join('\n'), errors: body.errors };
      }
      if (body?.message) {
        return { success: false, message: body.message };
      }
      if (typeof body === 'string' && body.trim()) {
        return { success: false, message: body.trim() };
      }
      return { success: false, message: "Erreur lors de l'importation des données." };
    }
  }
}
