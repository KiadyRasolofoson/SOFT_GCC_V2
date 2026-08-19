import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AssignmentTypeOption,
  CareerPlanPayload,
  DepartmentOption,
  EchelonOption,
  EmployeeOption,
  EmployeeTypeOption,
  EstablishmentOption,
  IndicationOption,
  LegalClassOption,
  NewsletterTemplateOption,
  PaymentMethodOption,
  PositionOption,
  ProfessionalCategoryOption,
} from './career-plan-create.models';

@Injectable({ providedIn: 'root' })
export class CareerPlanCreateService {
  private readonly http = inject(HttpClient);

  async loadEmployees(): Promise<EmployeeOption[]> {
    return this.getList<EmployeeOption>('/Employee');
  }

  async loadAssignmentTypes(): Promise<AssignmentTypeOption[]> {
    return this.getList<AssignmentTypeOption>('/AssignmentType');
  }

  async loadEstablishments(): Promise<EstablishmentOption[]> {
    return this.getList<EstablishmentOption>('/Establishment');
  }

  async loadDepartments(): Promise<DepartmentOption[]> {
    return this.getList<DepartmentOption>('/Department');
  }

  async loadPositions(): Promise<PositionOption[]> {
    return this.getList<PositionOption>('/Position');
  }

  async loadEmployeeTypes(): Promise<EmployeeTypeOption[]> {
    return this.getList<EmployeeTypeOption>('/EmployeeType');
  }

  async loadIndications(): Promise<IndicationOption[]> {
    return this.getList<IndicationOption>('/Indication');
  }

  async loadProfessionalCategories(): Promise<ProfessionalCategoryOption[]> {
    return this.getList<ProfessionalCategoryOption>('/ProfessionalCategory');
  }

  async loadLegalClasses(): Promise<LegalClassOption[]> {
    return this.getList<LegalClassOption>('/LegalClass');
  }

  async loadNewsletterTemplates(): Promise<NewsletterTemplateOption[]> {
    return this.getList<NewsletterTemplateOption>('/NewsLetterTemplate');
  }

  async loadPaymentMethods(): Promise<PaymentMethodOption[]> {
    return this.getList<PaymentMethodOption>('/PaymentMethod');
  }

  async loadEchelons(): Promise<EchelonOption[]> {
    return this.getList<EchelonOption>('/Echelon');
  }

  async create(payload: CareerPlanPayload): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/CareerPlan`, payload));
  }

  private async getList<T>(endpoint: string): Promise<T[]> {
    try {
      const response = await firstValueFrom(this.http.get<T[]>(`${environment.apiUrl}${endpoint}`));
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }
}
