import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EmployeeSkillGapResponse,
  PositionSkillItem,
  SkillCatalogNode,
  SkillDetail,
  SkillDraft,
  SkillListItem,
  TaxonomyItem,
} from './skill-referential.models';
import { ReferentialCodeKind } from './referential-code';

@Injectable({ providedIn: 'root' })
export class SkillReferentialService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/skill-referential`;

  getCatalog(filters: {
    q?: string;
    category?: string;
    domainId?: number | null;
    familyId?: number | null;
    state?: string;
  }): Promise<SkillCatalogNode[]> {
    let params = new HttpParams();
    if (filters.q) params = params.set('q', filters.q);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.domainId) params = params.set('domainId', String(filters.domainId));
    if (filters.familyId) params = params.set('familyId', String(filters.familyId));
    if (filters.state) params = params.set('state', filters.state);
    return firstValueFrom(this.http.get<SkillCatalogNode[]>(`${this.base}/catalog`, { params }));
  }

  getSkill(id: number): Promise<SkillDetail> {
    return firstValueFrom(this.http.get<SkillDetail>(`${this.base}/skills/${id}`));
  }

  findSimilar(name: string): Promise<SkillListItem[]> {
    return firstValueFrom(
      this.http.get<SkillListItem[]>(`${this.base}/skills/similar`, { params: { name } }),
    );
  }

  suggestCode(kind: ReferentialCodeKind): Promise<string> {
    const params = new HttpParams().set('kind', kind);
    return firstValueFrom(this.http.get<{ code: string }>(`${this.base}/suggested-code`, { params })).then(
      (row) => row.code,
    );
  }

  createDraft(draft: SkillDraft): Promise<SkillDetail> {
    return firstValueFrom(this.http.post<SkillDetail>(`${this.base}/skills`, draft));
  }

  updateDraft(id: number, draft: SkillDraft): Promise<SkillDetail> {
    return firstValueFrom(this.http.put<SkillDetail>(`${this.base}/skills/${id}`, draft));
  }

  publish(id: number): Promise<SkillDetail> {
    return firstValueFrom(this.http.post<SkillDetail>(`${this.base}/skills/${id}/publish`, {}));
  }

  archive(id: number): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/skills/${id}/archive`, {}));
  }

  getDomains(): Promise<TaxonomyItem[]> {
    return firstValueFrom(this.http.get<TaxonomyItem[]>(`${this.base}/domains`));
  }

  createDomain(payload: Partial<TaxonomyItem>): Promise<TaxonomyItem> {
    return firstValueFrom(this.http.post<TaxonomyItem>(`${this.base}/domains`, payload));
  }

  updateDomain(id: number, payload: Partial<TaxonomyItem>): Promise<TaxonomyItem> {
    return firstValueFrom(this.http.put<TaxonomyItem>(`${this.base}/domains/${id}`, payload));
  }

  archiveDomain(id: number): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/domains/${id}/archive`, {}));
  }

  getFamilies(domainId?: number | null): Promise<TaxonomyItem[]> {
    let params = new HttpParams();
    if (domainId) params = params.set('domainId', String(domainId));
    return firstValueFrom(this.http.get<TaxonomyItem[]>(`${this.base}/families`, { params }));
  }

  createFamily(payload: Record<string, unknown>): Promise<TaxonomyItem> {
    return firstValueFrom(this.http.post<TaxonomyItem>(`${this.base}/families`, payload));
  }

  updateFamily(id: number, payload: Record<string, unknown>): Promise<TaxonomyItem> {
    return firstValueFrom(this.http.put<TaxonomyItem>(`${this.base}/families/${id}`, payload));
  }

  archiveFamily(id: number): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/families/${id}/archive`, {}));
  }

  getPositionSkills(positionId: number): Promise<PositionSkillItem[]> {
    return firstValueFrom(this.http.get<PositionSkillItem[]>(`${this.base}/positions/${positionId}/skills`));
  }

  upsertPositionSkills(
    positionId: number,
    items: { skillId: number; expectedLevel: number; requirementKind: string; weight: number }[],
  ): Promise<PositionSkillItem[]> {
    return firstValueFrom(this.http.put<PositionSkillItem[]>(`${this.base}/positions/${positionId}/skills`, items));
  }

  getEmployeeGaps(employeeId: number, positionId?: number | null): Promise<EmployeeSkillGapResponse> {
    let params = new HttpParams();
    if (positionId) params = params.set('positionId', String(positionId));
    return firstValueFrom(
      this.http.get<EmployeeSkillGapResponse>(`${this.base}/employees/${employeeId}/gaps`, { params }),
    );
  }
}
