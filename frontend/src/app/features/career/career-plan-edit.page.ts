import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CareerPlanForm,
  CareerPlanFormErrors,
  EmployeeOption,
  createEmptyForm,
} from '../../core/career-plan-create.models';
import { CareerPlanCreateService } from '../../core/career-plan-create.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSearchableSelect } from '../../ui/gcc-searchable-select';
import { GccSelectOption } from '../../ui/gcc.types';
import { CareerAdvancementFormComponent } from './components/career-advancement-form.component';
import { CareerAppointmentFormComponent } from './components/career-appointment-form.component';
import { CareerLayoffFormComponent } from './components/career-layoff-form.component';

/**
 * Édition / Détail d'un plan de carrière.
 * Miroir React : EditAffectation.jsx (mode 'edit') + DetailAssignment.jsx (mode 'detail').
 * Mode piloté par `data.mode` de la route (detail = lecture clôturée, pas d'enregistrement).
 */
@Component({
  selector: 'app-career-plan-edit-page',
  imports: [
    FormsModule,
    GccPageHeader,
    GccSearchableSelect,
    CareerAppointmentFormComponent,
    CareerLayoffFormComponent,
    CareerAdvancementFormComponent,
    GccEmptyState,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <gcc-page-header
      [title]="title()"
      [subtitle]="subtitle()"
      [icon]="icon()"
      [crumbs]="crumbs()"
      [secondaryLabel]="secondaryLabel()"
      [secondaryIcon]="secondaryIcon()"
      (secondaryAction)="goBack()"
      [actionLabel]="isDetail() ? '' : 'Enregistrer'"
      actionIcon="save"
      (action)="submit()"
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

    @if (isDetail()) {
      <div class="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-xs">
        <div class="flex items-start gap-3">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-amber-700 mt-0.5">lock</mat-icon>
          <p class="font-bold">Le plan de carrière est clôturé.</p>
        </div>
      </div>
    }

    @if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement du plan de carrière…
      </div>
    } @else if (notFound()) {
      <gcc-empty-state
        title="Plan de carrière introuvable"
        message="Le plan de carrière demandé n'existe pas ou a été supprimé."
      />
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
            @if (isDetail()) {
              <div class="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                {{ form.registrationNumber || '—' }}
              </div>
            } @else {
              <gcc-searchable-select
                [options]="employeeOptions()"
                [value]="form.registrationNumber"
                (valueChange)="onRegistrationNumberChange($event)"
                placeholder="Rechercher par matricule ou nom…"
              />
            }
            @if (formErrors().registrationNumber) {
              <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                {{ formErrors().registrationNumber }}
              </p>
            }
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">Type d'affectation</label>
            <div class="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
              {{ assignmentTypeName() || '—' }}
            </div>
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
          [employeeRib]="selectedEmployeeRib()"
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
    }
  `,
})
export class CareerPlanEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(CareerPlanCreateService);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly notFound = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly formErrors = signal<CareerPlanFormErrors>({});

  readonly careerPlanId = signal<number | null>(null);
  readonly isDetail = signal(false);
  readonly assignmentTypeName = signal('');
  readonly selectedType = signal<string>('1');

  readonly employeeOptions = signal<GccSelectOption[]>([]);
  readonly employeeRecords = signal<EmployeeOption[]>([]);
  readonly departmentOptions = signal<GccSelectOption[]>([]);
  readonly indicationOptions = signal<GccSelectOption[]>([]);
  readonly professionalCategoryOptions = signal<GccSelectOption[]>([]);
  readonly legalClassOptions = signal<GccSelectOption[]>([]);
  readonly echelonOptions = signal<GccSelectOption[]>([]);

  readonly form: CareerPlanForm = createEmptyForm();

  @ViewChild(CareerAppointmentFormComponent) appointmentForm!: CareerAppointmentFormComponent;
  @ViewChild(CareerAdvancementFormComponent) advancementForm!: CareerAdvancementFormComponent;

  readonly selectedRegistration = signal<string | null>(null);
  readonly selectedEmployeeRib = computed(
    () => this.employeeRecords().find((e) => e.registrationNumber === this.selectedRegistration())?.ribNumber ?? null,
  );

  readonly title = computed(() =>
    this.isDetail() ? "Détails du plan de carrière" : "Modification du plan de carrière",
  );
  readonly subtitle = computed(() =>
    this.isDetail()
      ? 'Consultez les informations du plan de carrière.'
      : 'Modifiez les informations du plan de carrière.',
  );
  readonly icon = computed(() => (this.isDetail() ? 'visibility' : 'edit'));
  readonly crumbs = computed(() => [
    { label: 'Accueil' },
    { label: 'Plan de carrière' },
    { label: this.isDetail() ? 'Détails' : 'Modification' },
  ]);
  readonly secondaryLabel = computed(() => (this.isDetail() ? 'Retour' : 'Annuler'));
  readonly secondaryIcon = computed(() => (this.isDetail() ? 'arrow_back' : 'close'));

  constructor() {
    const raw = this.route.snapshot.paramMap.get('careerPlanId');
    const id = Number(raw);
    this.careerPlanId.set(Number.isFinite(id) ? id : null);
    this.isDetail.set(this.route.snapshot.data['mode'] === 'detail');
    void this.init();
  }

  async init(): Promise<void> {
    const id = this.careerPlanId();
    if (!id) {
      this.notFound.set(true);
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);
    try {
      const assignment = await this.service.getById(id);
      if (!assignment) {
        this.notFound.set(true);
        return;
      }
      this.prefill(assignment);

      const [
        employees,
        departments,
        indications,
        professionalCategories,
        legalClasses,
        echelons,
        assignmentTypes,
      ] = await Promise.all([
        this.service.loadEmployees(),
        this.service.loadDepartments(),
        this.service.loadIndications(),
        this.service.loadProfessionalCategories(),
        this.service.loadLegalClasses(),
        this.service.loadEchelons(),
        this.service.loadAssignmentTypes(),
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
      this.departmentOptions.set(
        departments.map((item) => ({ label: item.name, value: String(item.departmentId) })),
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
      this.echelonOptions.set(
        echelons.map((item) => ({ label: item.echelonName, value: String(item.echelonId) })),
      );

      const type = assignmentTypes.find(
        (item) => String(item.assignmentTypeId) === String(assignment['assignmentTypeId']),
      );
      this.assignmentTypeName.set(type?.assignmentTypeName ?? '');
    } catch {
      this.loadError.set('Erreur lors du chargement du plan de carrière.');
    } finally {
      this.loading.set(false);
    }
  }

  private prefill(assignment: Record<string, any>): void {
    this.selectedType.set(String(assignment['assignmentTypeId'] ?? '1'));
    this.form.assignmentTypeId = String(assignment['assignmentTypeId'] ?? '1');
    this.form.registrationNumber = assignment['registrationNumber'] ?? null;
    this.selectedRegistration.set(assignment['registrationNumber'] ?? null);
    this.form.decisionNumber = assignment['decisionNumber'] ?? null;
    this.form.decisionDate = this.toInputDate(assignment['decisionDate']);
    this.form.assignmentDate = this.toInputDate(assignment['assignmentDate']);
    this.form.description = assignment['description'] ?? null;
    this.form.establishmentId = this.toStrId(assignment['establishmentId']);
    this.form.departmentId = this.toStrId(assignment['departmentId']);
    this.form.positionId = this.toStrId(assignment['positionId']);
    this.form.employeeTypeId = this.toStrId(assignment['employeeTypeId']);
    this.form.socioCategoryProfessionalId = this.toStrId(assignment['socioCategoryProfessionalId']);
    this.form.indicationId = this.toStrId(assignment['indicationId']);
    this.form.baseSalary = this.toStrId(assignment['baseSalary']);
    this.form.netSalary = this.toStrId(assignment['netSalary']);
    this.form.professionalCategoryId = this.toStrId(assignment['professionalCategoryId']);
    this.form.legalClassId = this.toStrId(assignment['legalClassId']);
    this.form.newsletterTemplateId = this.toStrId(assignment['newsletterTemplateId']);
    this.form.paymentMethodId = this.toStrId(assignment['paymentMethodId']);
    this.form.endingContract = this.toInputDate(assignment['endingContract']);
    this.form.reason = assignment['reason'] ?? null;
    this.form.assigningInstitution = assignment['assigningInstitution'] ?? null;
    this.form.startDate = this.toInputDate(assignment['startDate']);
    this.form.endDate = this.toInputDate(assignment['endDate']);
    this.form.echelonId = this.toStrId(assignment['echelonId']);
    this.form.state = assignment['state'] ?? 1;
  }

  onRegistrationNumberChange(value: string | null): void {
    this.form.registrationNumber = value;
    this.selectedRegistration.set(value);
    this.revalidateField('registrationNumber', value);
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
    if (this.submitting() || this.isDetail()) return;
    const id = this.careerPlanId();
    if (!id) return;
    if (!this.validateForm()) return;
    if (this.selectedType() === '1' && this.appointmentForm && !this.appointmentForm.validate()) return;
    if (this.advancementForm && !this.advancementForm.validate()) return;

    this.submitError.set(null);
    this.submitting.set(true);
    try {
      await this.service.update(id, this.buildUpdatePayload());
      this.goBack();
    } catch (error) {
      this.submitError.set(
        `Erreur lors de la modification : ${error instanceof Error ? error.message : 'erreur inconnue'}`,
      );
    } finally {
      this.submitting.set(false);
    }
  }

  goBack(): void {
    const registrationNumber = this.form.registrationNumber;
    if (registrationNumber) {
      void this.router.navigate(['/soft-gcc/employes/fiche', registrationNumber], {
        queryParams: { espace: 'carrieres' },
      });
    } else {
      void this.router.navigate(['/soft-gcc/carrieres']);
    }
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
    if (!this.form.decisionNumber?.trim()) next.decisionNumber = 'Le numéro de décision est obligatoire.';
    if (!this.form.decisionDate) {
      next.decisionDate = 'La date de décision est obligatoire.';
    } else if (this.form.assignmentDate && this.form.decisionDate > this.form.assignmentDate) {
      next.decisionDate = 'La date de décision doit être antérieure ou égale à la date d’affectation.';
    }
    if (!this.form.assignmentDate) {
      next.assignmentDate = "La date d'affectation est obligatoire.";
    } else if (this.form.decisionDate && this.form.decisionDate > this.form.assignmentDate) {
      next.assignmentDate = 'La date de décision doit être antérieure ou égale à la date d’affectation.';
    }
    this.formErrors.set(next);
    return Object.keys(next).length === 0;
  }

  private buildUpdatePayload(): Record<string, any> {
    const f = this.form;
    return {
      careerPlanId: this.careerPlanId(),
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
      updatedDate: new Date().toISOString(),
    };
  }

  private toStrId(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    return String(value);
  }

  private toInputDate(value: unknown): string | null {
    if (!value) return null;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toNum(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
