import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CertificateTypeItem {
  certificateTypeId: number;
  certificateTypeName: string;
}

export interface CertificateHistoryItem {
  id: number;
  fileName: string | null;
  createdAt: string | null;
  state: number | null;
  fileSize: number | null;
}

@Injectable({ providedIn: 'root' })
export class EmployeeAttestationService {
  private readonly http = inject(HttpClient);

  async loadCertificateTypes(): Promise<CertificateTypeItem[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<CertificateTypeItem[]>(`${environment.apiUrl}/CertificateType`),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async generateReference(): Promise<string> {
    const fallback = this.createReference(1);

    try {
      const response = await firstValueFrom(
        this.http.get<Array<{ id?: number }>>(`${environment.apiUrl}/CareerPlan/Certificate/GetAll`),
      );
      if (!Array.isArray(response) || response.length === 0) return this.createReference(1);

      const maxId = response.reduce((acc, item) => {
        const current = Number(item?.id ?? 0);
        return Number.isFinite(current) ? Math.max(acc, current) : acc;
      }, 0);
      return this.createReference(maxId + 1);
    } catch {
      return fallback;
    }
  }

  async saveCertificate(payload: {
    file: File;
    registrationNumber: string;
    certificateTypeId: number;
    reference: string;
    state: number;
    token: string;
  }): Promise<void> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('registrationNumber', payload.registrationNumber);
    formData.append('certificateTypeId', String(payload.certificateTypeId));
    formData.append('reference', payload.reference);
    formData.append('state', String(payload.state));
    formData.append('token', payload.token);

    await firstValueFrom(this.http.post(`${environment.apiUrl}/CareerPlan/Certificate/Save`, formData));
  }

  async getHistory(registrationNumber: string): Promise<CertificateHistoryItem[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<CertificateHistoryItem[]>(
          `${environment.apiUrl}/CareerPlan/Certificate/Get/${registrationNumber}`,
        ),
      );
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async getPdfBlob(id: number): Promise<Blob | null> {
    try {
      return await firstValueFrom(
        this.http.get(`${environment.apiUrl}/CareerPlan/Certificate/GetPdfFilebyId/${id}`, {
          responseType: 'blob',
        }),
      );
    } catch {
      return null;
    }
  }

  async deleteCertificate(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/CareerPlan/Certificate/Delete/${id}`));
  }

  async sendCertificateEmail(payload: {
    recipientEmail: string;
    subject: string;
    body: string;
    fileName: string;
    base64Pdf: string;
  }): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/Email/send-pdf`, payload));
  }

  private createReference(counter: number): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `ATT-${yyyy}${mm}${dd}-${hh}${mi}${ss}-0RF0${counter}`;
  }
}
