import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CertificateModel {
  certificateTypeId: number;
  certificateTypeName: string;
}

/**
 * Modèles d'attestation = types de certificat (miroir React ModelList.jsx).
 * CRUD complet sur /CertificateType (GET liste, POST 201, PUT 204, DELETE 204).
 */
@Injectable({ providedIn: 'root' })
export class CertificateModelService {
  private readonly http = inject(HttpClient);

  async loadModels(): Promise<CertificateModel[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<CertificateModel[]>(`${environment.apiUrl}/CertificateType`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async createModel(name: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/CertificateType`, { certificateTypeName: name }),
    );
  }

  async updateModel(id: number, name: string): Promise<void> {
    await firstValueFrom(
      this.http.put(`${environment.apiUrl}/CertificateType/${id}`, {
        certificateTypeId: id,
        certificateTypeName: name,
      }),
    );
  }

  async deleteModel(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/CertificateType/${id}`));
  }
}
