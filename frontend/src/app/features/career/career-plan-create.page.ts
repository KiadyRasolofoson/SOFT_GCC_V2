import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {
  CareerPlanForm,
  CareerPlanFormErrors,
  CareerPlanPayload,
} from '../../core/career-plan-create.models';
import { CareerPlanCreateService } from '../../core/career-plan-create.service';
import { GccSelectOption } from '../../ui/gcc.types';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSearchableSelect } from '../../ui/gcc-searchable-select';
import { GccSelect } from '../../ui/gcc-select';
import { CareerAdvancementFormComponent } from './components/career-advancement-form.component';
import { CareerAppointmentFormComponent } from './components/career-appointment-form.component';
import { CareerLayoffFormComponent } from './components/career-layoff-form.component';

function createEmptyForm(): CareerPlanForm {
  return {
    assignmentTypeId: '1',
    registrationNumber: null,
    decisionNumber: null,
    decisionDate: null,
    assignmentDate: null,
    description: null,
    establishmentId: null,
    departmentId: null,
    positionId: null,
    employeeTypeId: null,
    socioCategoryProfessionalId: null,
    indicationId: null,
    baseSalary: null,
    netSalary: null,
    professionalCategoryId: null,
    legalClassId: null,
    newsletterTemplateId: null,
    paymentMethodId: null,
    endingContract: null,
    reason: null,
    assigningInstitution: null,
    startDate: null,
    endDate: null,
    echelonId: null,
    state: 1,
  };
}

@Component({
  selector: 'app-career-plan-create-page',
  imports: [
    FormsModule,
    GccPageHeader,
    GccSelect,
    GccSearchableSelect,
    CareerAppointmentFormComponent,
    CareerLayoffFormComponent,
    CareerAdvancementFormComponent,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <gcc-page-header
      title="Création d'un plan de carrière"
      subtitle="Enregistrez une nomination, un avancement ou une mise en disponibilité."
      icon="route"
      [crumbs]="crumbs"
      secondaryLabel="Réinitialiser"
      secondaryIcon="refresh"
      (secondaryAction)="resetAll()"
    />

    @if (loadError(); as err) {
      <div class="mb-6 rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-xs text-red-900 shadow-xs">
        <div class="flex items-start gap-3">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-red-600 mt-0.5">error_outline</mat-icon>
          <p class="font-bold text-red-900">{{ err }}</p>
        </div>
      </div>
    }

    @if (submitError(); as err) {
      <div class="mb-6 rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-xs text-red-900 shadow-xs">
        <div class="flex items-start gap-3">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-red-600 mt-0.5">error_outline</mat-icon>
          <p class="font-bold text-red-900">{{ err }}</p>
        </div>
      </div>
    }

    @if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement du formulaire…
      </div>
    } @else {
      <!-- Identification -->
      <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
          <mat-icon class="!text-[22px] text-amber-700">account_circle</mat-icon>
          <h2 class="text-base font-semibold text-amber-700">Identification</h2>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">Employé</label>
            <gcc-searchable-select
              [options]="employeeOptions()"
              [value]="form.registrationNumber"
              (valueChange)="onRegistrationNumberChange($event)"
              placeholder="Rechercher par matricule ou nom…"
            />
            @if (formErrors().registrationNumber) {
              <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                {{ formErrors().registrationNumber }}
              </p>
            }
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">Type d'affectation</label>
            <gcc-select
              [options]="assignmentTypeOptions()"
              [value]="form.assignmentTypeId"
              (valueChange)="onAssignmentTypeChange($event)"
              placeholder="Sélectionner une affectation"
            />
            @if (formErrors().assignmentTypeId) {
              <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                {{ formErrors().assignmentTypeId }}
              </p>
            }
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">Numéro de décision</label>
            <input
              type="text"
              class="gcc-input"
              placeholder="Ex. DEC-2026-001"
              [ngModel]="form.decisionNumber"
              (ngModelChange)="onDecisionNumberChange($event)"
            />
            @if (formErrors().decisionNumber) {
              <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                {{ formErrors().decisionNumber }}
              </p>
            }
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Date de décision</label>
              <input
                type="date"
                class="gcc-input"
                [ngModel]="form.decisionDate"
                (ngModelChange)="onDecisionDateChange($event)"
              />
              @if (formErrors().decisionDate) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ formErrors().decisionDate }}
                </p>
              }
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Date d'affectation</label>
              <input
                type="date"
                class="gcc-input"
                [ngModel]="form.assignmentDate"
                (ngModelChange)="onAssignmentDateChange($event)"
              />
              @if (formErrors().assignmentDate) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ formErrors().assignmentDate }}
                </p>
              }
            </div>
          </div>

          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium text-slate-600">Description</label>
            <textarea
              rows="3"
              class="gcc-input min-h-24"
              placeholder="Informations complémentaires (optionnel)"
              [(ngModel)]="form.description"
            ></textarea>
          </div>
        </div>
      </article>

      <!-- Sous-formulaire dynamique selon le type d'affectation -->
      @if (selectedType() === '1') {
        <app-career-appointment-form
          class="mt-5"
          [form]="form"
          [establishmentOptions]="establishmentOptions()"
          [departmentOptions]="departmentOptions()"
          [positionOptions]="positionOptions()"
          [employeeTypeOptions]="employeeTypeOptions()"
          [indicationOptions]="indicationOptions()"
          [professionalCategoryOptions]="professionalCategoryOptions()"
          [legalClassOptions]="legalClassOptions()"
          [newsletterTemplateOptions]="newsletterTemplateOptions()"
          [paymentMethodOptions]="paymentMethodOptions()"
        />
      } @else if (selectedType() === '2') {
        <app-career-layoff-form class="mt-5" [form]="form" />
      } @else {
        <app-career-advancement-form
          class="mt-5"
          [form]="form"
          [departmentOptions]="departmentOptions()"
          [indicationOptions]="indicationOptions()"
          [echelonOptions]="echelonOptions()"
          [professionalCategoryOptions]="professionalCategoryOptions()"
          [legalClassOptions]="legalClassOptions()"
        />
      }

      <!-- Actions -->
      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="goBack()">
          <mat-icon>close</mat-icon>
          Annuler
        </button>
        <button mat-flat-button type="button" class="gcc-btn-primary" [disabled]="submitting()" (click)="submit()">
          @if (submitting()) {
            <span class="flex items-center gap-2">
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Enregistrement…
            </span>
          } @else {
            <span class="flex items-center gap-2">
              <mat-icon>save</mat-icon>
              Enregistrer
            </span>
          }
        </button>
      </div>
    }
  `,
})
export class CareerPlanCreatePage {
  private readonly router = inject(Router);
  private readonly service = inject(CareerPlanCreateService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Plan de carrière' }, { label: 'Création' }];

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly formErrors = signal<CareerPlanFormErrors>({});

  readonly employeeOptions = signal<GccSelectOption[]>([]);
  readonly assignmentTypeOptions = signal<GccSelectOption[]>([]);
  readonly establishmentOptions = signal<GccSelectOption[]>([]);
  readonly departmentOptions = signal<GccSelectOption[]>([]);
  readonly positionOptions = signal<GccSelectOption[]>([]);
  readonly employeeTypeOptions = signal<GccSelectOption[]>([]);
  readonly indicationOptions = signal<GccSelectOption[]>([]);
  readonly professionalCategoryOptions = signal<GccSelectOption[]>([]);
  readonly legalClassOptions = signal<GccSelectOption[]>([]);
  readonly newsletterTemplateOptions = signal<GccSelectOption[]>([]);
  readonly paymentMethodOptions = signal<GccSelectOption[]>([]);
  readonly echelonOptions = signal<GccSelectOption[]>([]);

  readonly form: CareerPlanForm = createEmptyForm();

  readonly selectedType = computed(() => this.form.assignmentTypeId ?? '1');

  constructor() {
    void this.initLookups();
  }

  async initLookups(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const [
        employees,
        assignmentTypes,
        establishments,
        departments,
        positions,
        employeeTypes,
        indications,
        professionalCategories,
        legalClasses,
        newsletterTemplates,
        paymentMethods,
        echelons,
      ] = await Promise.all([
        this.service.loadEmployees(),
        this.service.loadAssignmentTypes(),
        this.service.loadEstablishments(),
        this.service.loadDepartments(),
        this.service.loadPositions(),
        this.service.loadEmployeeTypes(),
        this.service.loadIndications(),
        this.service.loadProfessionalCategories(),
        this.service.loadLegalClasses(),
        this.service.loadNewsletterTemplates(),
        this.service.loadPaymentMethods(),
        this.service.loadEchelons(),
      ]);

      this.employeeOptions.set(
        employees.map((item) => ({
          label:
            [item.registrationNumber, item.name, item.firstName].filter(Boolean).join(' - ').trim() ||
            `Employé ${item.employeeId}`,
          value: String(item.registrationNumber ?? item.employeeId),
        })),
      );

      this.assignmentTypeOptions.set([
        { label: 'Sélectionner une affectation', value: '' },
        ...assignmentTypes.map((item) => ({ label: item.assignmentTypeName, value: String(item.assignmentTypeId) })),
      ]);
      this.establishmentOptions.set(
        establishments.map((item) => ({ label: item.establishmentName, value: String(item.establishmentId) })),
      );
      this.departmentOptions.set(
        departments.map((item) => ({ label: item.name, value: String(item.departmentId) })),
      );
      this.positionOptions.set(
        positions.map((item) => ({ label: item.positionName, value: String(item.positionId) })),
      );
      this.employeeTypeOptions.set(
        employeeTypes.map((item) => ({ label: item.employeeTypeName, value: String(item.employeeTypeId) })),
      );
      this.indicationOptions.set(
        indications.map((item) => ({ label: item.indicationName, value: String(item.indicationId) })),
      );
      this.professionalCategoryOptions.set(
        professionalCategories.map((item) => ({
          label: item.professionalCategoryName,
          value: String(item.professionalCategoryId),
        })),
      );
      this.legalClassOptions.set(
        legalClasses.map((item) => ({ label: item.legalClassName, value: String(item.legalClassId) })),
      );
      this.newsletterTemplateOptions.set(
        newsletterTemplates.map((item) => ({
          label: item.newsletterTemplateName,
          value: String(item.newsletterTemplateId),
        })),
      );
      this.paymentMethodOptions.set(
        paymentMethods.map((item) => ({ label: item.paymentMethodName, value: String(item.paymentMethodId) })),
      );
      this.echelonOptions.set(echelons.map((item) => ({ label: item.echelonName, value: String(item.echelonId) })));
    } catch {
      this.loadError.set('Erreur lors du chargement des données du formulaire.');
    } finally {
      this.loading.set(false);
    }
  }

  onRegistrationNumberChange(value: string | null): void {
    this.form.registrationNumber = value;
    this.revalidateField('registrationNumber', value);
  }

  onAssignmentTypeChange(value: string | null): void {
    this.form.assignmentTypeId = value ?? '1';
    this.resetSubFormFields();
    this.revalidateField('assignmentTypeId', this.form.assignmentTypeId);
  }

  onDecisionNumberChange(value: string): void {
    this.form.decisionNumber = value;
    this.revalidateField('decisionNumber', value);
  }

  onDecisionDateChange(value: string): void {
    this.form.decisionDate = value;
    this.revalidateField('decisionDate', value);
  }

  onAssignmentDateChange(value: string): void {
    this.form.assignmentDate = value;
    this.revalidateField('assignmentDate', value);
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    if (!this.validateForm()) return;

    this.submitError.set(null);
    this.submitting.set(true);
    try {
      await this.service.create(this.buildPayload());
      void this.router.navigate(['/soft-gcc/carrieres']);
    } catch (error) {
      this.submitError.set(
        `Erreur lors de l'insertion : ${error instanceof Error ? error.message : 'erreur inconnue'}`,
      );
    } finally {
      this.submitting.set(false);
    }
  }

  resetAll(): void {
    Object.assign(this.form, createEmptyForm());
    this.formErrors.set({});
    this.submitError.set(null);
    this.loadError.set(null);
  }

  goBack(): void {
    void this.router.navigate(['/soft-gcc/carrieres']);
  }

  private resetSubFormFields(): void {
    this.form.establishmentId = null;
    this.form.departmentId = null;
    this.form.positionId = null;
    this.form.employeeTypeId = null;
    this.form.socioCategoryProfessionalId = null;
    this.form.indicationId = null;
    this.form.baseSalary = null;
    this.form.netSalary = null;
    this.form.professionalCategoryId = null;
    this.form.legalClassId = null;
    this.form.newsletterTemplateId = null;
    this.form.paymentMethodId = null;
    this.form.endingContract = null;
    this.form.reason = null;
    this.form.assigningInstitution = null;
    this.form.startDate = null;
    this.form.endDate = null;
    this.form.echelonId = null;
  }

  private revalidateField(field: keyof CareerPlanFormErrors, value: string | null | undefined): void {
    if (!this.formErrors()[field]) return;
    this.validateField(field, value);
  }

  private validateField(field: keyof CareerPlanFormErrors, value: string | null | undefined): void {
    const error = this.computeError(field, value);
    this.formErrors.update((current) => {
      const next = { ...current };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  private computeError(field: keyof CareerPlanFormErrors, value: string | null | undefined): string | undefined {
    switch (field) {
      case 'registrationNumber':
        return value ? undefined : 'La matricule est obligatoire.';
      case 'assignmentTypeId':
        return value ? undefined : 'Le type d’affectation est obligatoire.';
      case 'decisionNumber':
        return value?.trim() ? undefined : 'Le numéro de décision est obligatoire.';
      case 'decisionDate':
      case 'assignmentDate':
        return value ? undefined : 'La date est obligatoire.';
      default:
        return undefined;
    }
  }

  private validateForm(): boolean {
    const next: CareerPlanFormErrors = {};
    if (!this.form.registrationNumber) next.registrationNumber = 'La matricule est obligatoire.';
    if (!this.form.assignmentTypeId) next.assignmentTypeId = 'Le type d’affectation est obligatoire.';
    if (!this.form.decisionNumber?.trim()) next.decisionNumber = 'Le numéro de décision est obligatoire.';
    if (!this.form.decisionDate) next.decisionDate = 'La date de décision est obligatoire.';
    if (!this.form.assignmentDate) next.assignmentDate = 'La date d’affectation est obligatoire.';
    this.formErrors.set(next);
    return Object.keys(next).length === 0;
  }

  private buildPayload(): CareerPlanPayload {
    const f = this.form;
    return {
      assignmentTypeId: this.toNum(f.assignmentTypeId) ?? 0,
      registrationNumber: f.registrationNumber?.trim() || null,
      decisionNumber: f.decisionNumber?.trim() || null,
      decisionDate: f.decisionDate || null,
      assignmentDate: f.assignmentDate || null,
      description: f.description?.trim() || null,
      establishmentId: this.toNum(f.establishmentId),
      departmentId: this.toNum(f.departmentId),
      positionId: this.toNum(f.positionId),
      employeeTypeId: this.toNum(f.employeeTypeId),
      socioCategoryProfessionalId: this.toNum(f.socioCategoryProfessionalId),
      indicationId: this.toNum(f.indicationId),
      baseSalary: this.toNum(f.baseSalary),
      netSalary: this.toNum(f.netSalary),
      professionalCategoryId: this.toNum(f.professionalCategoryId),
      legalClassId: this.toNum(f.legalClassId),
      newsletterTemplateId: this.toNum(f.newsletterTemplateId),
      paymentMethodId: this.toNum(f.paymentMethodId),
      endingContract: f.endingContract || null,
      reason: f.reason?.trim() || null,
      assigningInstitution: f.assigningInstitution?.trim() || null,
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      echelonId: this.toNum(f.echelonId),
      state: f.state,
      creationDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };
  }

  private toNum(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
}
