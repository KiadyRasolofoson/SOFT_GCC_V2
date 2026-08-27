import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {
  CareerPlanForm,
  CareerPlanFormErrors,
  CareerPlanPayload,
  EmployeeOption,
  createEmptyForm,
} from '../../core/career-plan-create.models';
import { CareerPlanCreateService } from '../../core/career-plan-create.service';
import { GccSelectOption } from '../../ui/gcc.types';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSearchableSelect } from '../../ui/gcc-searchable-select';
import { GccSelect } from '../../ui/gcc-select';
import { CareerAdvancementFormComponent } from './components/career-advancement-form.component';
import { CareerAppointmentFormComponent } from './components/career-appointment-form.component';
import { CareerLayoffFormComponent } from './components/career-layoff-form.component';

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

      <!-- UX-03 : situation actuelle de l'employé sélectionné -->
      @if (currentSituationItems().length) {
        <article class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
          <div class="mb-3 flex items-center gap-2">
            <mat-icon class="!text-[22px] text-emerald-700">info</mat-icon>
            <h2 class="text-base font-semibold text-emerald-800">Situation actuelle</h2>
            <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Courant</span>
          </div>
          <div class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            @for (item of currentSituationItems(); track item.label) {
              <div>
                <p class="text-xs font-medium text-emerald-800/70">{{ item.label }}</p>
                <p class="font-semibold text-navy">{{ item.value }}</p>
              </div>
            }
          </div>
        </article>
      }

      <!-- FP-02 : suggestion d'avancement si l'indice choisi dépasse l'indice actuel -->
      @if (selectedType() === '1' && appointmentForm?.advancementSuggested()) {
        <div class="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-900">
          <mat-icon class="!text-[20px] shrink-0 text-emerald-700">trending_up</mat-icon>
          <p class="min-w-0 flex-1">
            <strong>Avancement détecté</strong> — l'indice choisi est supérieur à l'indice actuel de l'employé.
          </p>
          <button mat-stroked-button type="button" class="gcc-btn-secondary !rounded-xl" (click)="switchToAdvancement()">
            <mat-icon>swap_horiz</mat-icon>
            Basculer en Avancement
          </button>
        </div>
      }

      <!-- Sous-formulaire dynamique selon le type d'affectation -->
      @if (selectedType() === '1') {
        <app-career-appointment-form
          class="mt-5"
          [form]="form"
          [employeeRib]="selectedEmployeeRib()"
          [currentIndicationId]="currentIndicationId()"
        />
      } @else if (selectedType() === '2') {
        <app-career-layoff-form class="mt-5" [form]="form" />
      } @else {
        <app-career-advancement-form
          class="mt-5"
          [form]="form"
          [registrationNumber]="form.registrationNumber"
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
  readonly employeeRecords = signal<EmployeeOption[]>([]);
  readonly departmentOptions = signal<GccSelectOption[]>([]);
  readonly positionOptions = signal<GccSelectOption[]>([]);
  readonly indicationOptions = signal<GccSelectOption[]>([]);
  readonly professionalCategoryOptions = signal<GccSelectOption[]>([]);
  readonly legalClassOptions = signal<GccSelectOption[]>([]);
  readonly echelonOptions = signal<GccSelectOption[]>([]);

  readonly form: CareerPlanForm = createEmptyForm();

  @ViewChild(CareerAppointmentFormComponent) appointmentForm!: CareerAppointmentFormComponent;
  @ViewChild(CareerAdvancementFormComponent) advancementForm!: CareerAdvancementFormComponent;

  readonly selectedType = signal<string>('1');
  readonly selectedRegistration = signal<string | null>(null);
  readonly selectedEmployeeRib = computed(
    () => this.employeeRecords().find((e) => e.registrationNumber === this.selectedRegistration())?.ribNumber ?? null,
  );

  /** FP-02 : dernier plan actif de l'employé sélectionné (situation actuelle). */
  readonly lastCareerPlan = signal<Record<string, any> | null>(null);
  /** FP-02 : indice (id) du dernier plan actif, pour comparer avec l'indice saisi. */
  readonly currentIndicationId = computed(() => {
    const id = this.lastCareerPlan()?.['indicationId'];
    return id == null ? null : Number(id);
  });

  /** UX-03 : résumé « Situation actuelle » de l'employé sélectionné (résolu depuis les référentiels). */
  readonly currentSituationItems = computed(() => {
    const plan = this.lastCareerPlan();
    if (!plan) return [];
    const pick = (options: { label: string; value: string }[], id: unknown) =>
      options.find((o) => o.value === String(id))?.label ?? '—';
    return [
      { label: 'Poste', value: pick(this.positionOptions(), plan['positionId']) },
      { label: 'Département', value: pick(this.departmentOptions(), plan['departmentId']) },
      { label: 'Catégorie', value: pick(this.professionalCategoryOptions(), plan['professionalCategoryId']) },
      { label: 'Classe légale', value: pick(this.legalClassOptions(), plan['legalClassId']) },
      { label: 'Indice', value: pick(this.indicationOptions(), plan['indicationId']) },
      { label: 'Salaire de base', value: plan['baseSalary'] != null ? this.formatNumber(plan['baseSalary']) : '—' },
      { label: 'RIB', value: this.selectedEmployeeRib() || 'Non renseigné' },
    ];
  });

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
        departments,
        positions,
        indications,
        professionalCategories,
        legalClasses,
        echelons,
      ] = await Promise.all([
        this.service.loadEmployees(),
        this.service.loadAssignmentTypes(),
        this.service.loadDepartments(),
        this.service.loadPositions(),
        this.service.loadIndications(),
        this.service.loadProfessionalCategories(),
        this.service.loadLegalClasses(),
        this.service.loadEchelons(),
      ]);

      this.employeeRecords.set(employees);

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
      this.departmentOptions.set(
        departments.map((item) => ({ label: item.name, value: String(item.departmentId) })),
      );
      this.positionOptions.set(
        positions.map((item) => ({ label: item.positionName, value: String(item.positionId) })),
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
      this.echelonOptions.set(echelons.map((item) => ({ label: item.echelonName, value: String(item.echelonId) })));
    } catch {
      this.loadError.set('Erreur lors du chargement des données du formulaire.');
    } finally {
      this.loading.set(false);
    }
  }

  onRegistrationNumberChange(value: string | null): void {
    this.form.registrationNumber = value;
    this.selectedRegistration.set(value);
    this.revalidateField('registrationNumber', value);
    void this.refreshLastCareerPlan(value);
  }

  /** FP-02 : charge la situation actuelle de l'employé (auto-classification du type). */
  private async refreshLastCareerPlan(value: string | null): Promise<void> {
    if (!value) {
      this.lastCareerPlan.set(null);
      return;
    }
    try {
      this.lastCareerPlan.set(await this.service.getLastCareerPlan(value));
    } catch {
      this.lastCareerPlan.set(null);
    }
  }

  /** FP-02 : bascule le type d'affectation vers « Avancement » (formulaire pré-rempli). */
  switchToAdvancement(): void {
    this.onAssignmentTypeChange('3');
  }

  onAssignmentTypeChange(value: string | null): void {
    this.form.assignmentTypeId = value ?? '1';
    this.selectedType.set(value ?? '1');
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
    this.revalidateField('assignmentDate', this.form.assignmentDate);
  }

  onAssignmentDateChange(value: string): void {
    this.form.assignmentDate = value;
    this.revalidateField('assignmentDate', value);
    this.revalidateField('decisionDate', this.form.decisionDate);
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    if (!this.validateForm()) return;
    if (this.selectedType() === '1' && this.appointmentForm && !this.appointmentForm.validate()) return;
    if (this.advancementForm && !this.advancementForm.validate()) return;

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
    this.selectedType.set('1');
    this.selectedRegistration.set(null);
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
        if (!value) return 'La date de décision est obligatoire.';
        if (this.form.assignmentDate && value > this.form.assignmentDate) {
          return 'La date de décision doit être antérieure ou égale à la date d’affectation.';
        }
        return undefined;
      case 'assignmentDate':
        if (!value) return 'La date d’affectation est obligatoire.';
        if (this.form.decisionDate && this.form.decisionDate > value) {
          return 'La date de décision doit être antérieure ou égale à la date d’affectation.';
        }
        return undefined;
      default:
        return undefined;
    }
  }

  private validateForm(): boolean {
    const next: CareerPlanFormErrors = {};
    if (!this.form.registrationNumber) next.registrationNumber = 'La matricule est obligatoire.';
    if (!this.form.assignmentTypeId) next.assignmentTypeId = 'Le type d’affectation est obligatoire.';
    if (!this.form.decisionNumber?.trim()) next.decisionNumber = 'Le numéro de décision est obligatoire.';
    if (!this.form.decisionDate) {
      next.decisionDate = 'La date de décision est obligatoire.';
    } else if (this.form.assignmentDate && this.form.decisionDate > this.form.assignmentDate) {
      next.decisionDate = 'La date de décision doit être antérieure ou égale à la date d’affectation.';
    }
    if (!this.form.assignmentDate) {
      next.assignmentDate = 'La date d’affectation est obligatoire.';
    } else if (this.form.decisionDate && this.form.decisionDate > this.form.assignmentDate) {
      next.assignmentDate = 'La date de décision doit être antérieure ou égale à la date d’affectation.';
    }
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

  private formatNumber(value: unknown): string {
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat('fr-FR').format(number) : '—';
  }
}
