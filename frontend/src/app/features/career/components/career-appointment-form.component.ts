import { Component, inject, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  CareerPlanForm,
  DepartmentOption,
  EchelonOption,
  EmployeeTypeOption,
  EstablishmentOption,
  IndicationOption,
  LegalClassOption,
  NewsletterTemplateOption,
  PaymentMethodOption,
  PositionOption,
  ProfessionalCategoryOption,
} from '../../../core/career-plan-create.models';
import { CareerPlanCreateService } from '../../../core/career-plan-create.service';
import { GccSelectOption } from '../../../ui/gcc.types';
import { GccSearchableSelect } from '../../../ui/gcc-searchable-select';
import { GccSelect } from '../../../ui/gcc-select';

@Component({
  selector: 'app-career-appointment-form',
  imports: [FormsModule, MatIconModule, GccSelect, GccSearchableSelect],
  template: `
    <section>
      <div class="grid gap-5 lg:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">business</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Nomination — Organisation</h2>
          </div>
          <div class="grid gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Établissement</label>
              <gcc-select
                [options]="establishmentOptions()"
                [value]="form.establishmentId"
                (valueChange)="onEstablishmentChange($event)"
                placeholder="Sélectionner un établissement"
              />
              @if (errors()['establishmentId']) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ errors()['establishmentId'] }}
                </p>
              }
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Département</label>
              <gcc-select
                [options]="departmentOptions()"
                [value]="form.departmentId"
                (valueChange)="onDepartmentChange($event)"
                placeholder="Sélectionner un département"
              />
              @if (errors()['departmentId']) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ errors()['departmentId'] }}
                </p>
              }
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Poste</label>
              <gcc-searchable-select
                [options]="positionOptions()"
                [value]="form.positionId"
                (valueChange)="onPositionChange($event)"
                placeholder="Rechercher un poste…"
              />
              @if (errors()['positionId']) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ errors()['positionId'] }}
                </p>
              }
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Type de contrat</label>
              <gcc-select
                [options]="employeeTypeOptions()"
                [value]="form.employeeTypeId"
                (valueChange)="onEmployeeTypeChange($event)"
                placeholder="Sélectionner un type de contrat"
              />
              @if (errors()['employeeTypeId']) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ errors()['employeeTypeId'] }}
                </p>
              }
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Indice</label>
              <gcc-select
                [options]="indicationOptions()"
                [value]="form.indicationId"
                (valueChange)="onIndicationChange($event)"
                placeholder="Sélectionner un indice"
              />
              @if (errors()['indicationId']) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ errors()['indicationId'] }}
                </p>
              }
              @if (echelonLabel(); as label) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">verified</mat-icon>
                  Échelon dérivé : {{ label }}
                </p>
              }
            </div>
          </div>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">payments</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Nomination — Rémunération &amp; classification</h2>
          </div>
          <div class="grid gap-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-600">Salaire de base</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="gcc-input"
                  placeholder="0,00"
                  [ngModel]="form.baseSalary"
                  (ngModelChange)="onBaseSalaryChange($event)"
                />
                @if (errors()['baseSalary']) {
                  <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                    <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                    {{ errors()['baseSalary'] }}
                  </p>
                }
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-600">Salaire net (estimé)</label>
                <input
                  type="text"
                  class="gcc-input bg-slate-50"
                  placeholder="—"
                  [value]="netSalaryLabel()"
                  readonly
                />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Catégorie professionnelle</label>
              <gcc-select
                [options]="professionalCategoryOptions()"
                [value]="form.professionalCategoryId"
                (valueChange)="onProfessionalCategoryChange($event)"
                placeholder="Sélectionner une catégorie professionnelle"
              />
              @if (errors()['professionalCategoryId']) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ errors()['professionalCategoryId'] }}
                </p>
              }
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Classe légale</label>
              <gcc-select
                [options]="legalClassOptions()"
                [value]="form.legalClassId"
                (valueChange)="onLegalClassChange($event)"
                placeholder="Sélectionner une classe légale"
              />
              @if (errors()['legalClassId']) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ errors()['legalClassId'] }}
                </p>
              }
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Modèle de bulletin</label>
              <gcc-select
                [options]="newsletterTemplateOptions()"
                [value]="form.newsletterTemplateId"
                (valueChange)="onNewsletterTemplateChange($event)"
                placeholder="Sélectionner un modèle de bulletin"
              />
              @if (errors()['newsletterTemplateId']) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ errors()['newsletterTemplateId'] }}
                </p>
              }
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Mode de paiement</label>
              <gcc-select
                [options]="paymentMethodOptions()"
                [value]="form.paymentMethodId"
                (valueChange)="onPaymentMethodChange($event)"
                placeholder="Sélectionner un mode de paiement"
              />
              @if (errors()['paymentMethodId']) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ errors()['paymentMethodId'] }}
                </p>
              }
              @if (paymentWarning(); as warning) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ warning }}
                </p>
              }
            </div>
            @if (form.employeeTypeId === '1') {
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-600">Fin de contrat</label>
                <input type="date" class="gcc-input" [(ngModel)]="form.endingContract" />
              </div>
            }
          </div>
        </article>
      </div>
    </section>
  `,
})
export class CareerAppointmentFormComponent implements OnInit, OnChanges {
  @Input() form!: CareerPlanForm;
  /** RIB de l'employé sélectionné (contrôle si le mode de paiement est « Virement »). */
  @Input() employeeRib: string | null = null;
  /** FP-02 : indice (id) du dernier plan actif de l'employé (détection d'avancement). */
  @Input() currentIndicationId: number | null = null;

  private readonly service = inject(CareerPlanCreateService);

  readonly establishmentOptions = signal<GccSelectOption[]>([]);
  readonly employeeTypeOptions = signal<GccSelectOption[]>([]);
  readonly professionalCategoryOptions = signal<GccSelectOption[]>([]);
  readonly paymentMethodOptions = signal<GccSelectOption[]>([]);
  /** Erreurs de validation des champs obligatoires / règles métier. */
  readonly errors = signal<Record<string, string>>({});
  /** FP-02 : true si l'indice choisi est supérieur à l'indice actuel (suggestion d'avancement). */
  readonly advancementSuggested = signal(false);

  private departments: DepartmentOption[] = [];
  private positions: PositionOption[] = [];
  private legalClasses: LegalClassOption[] = [];
  private indications: IndicationOption[] = [];
  private echelons: EchelonOption[] = [];
  private newsletterTemplates: NewsletterTemplateOption[] = [];

  ngOnInit(): void {
    void this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentIndicationId']) {
      this.computeAdvancementSuggestion();
    }
  }

  private async load(): Promise<void> {
    const [
      establishments,
      employeeTypes,
      professionalCategories,
      paymentMethods,
      departments,
      positions,
      legalClasses,
      indications,
      echelons,
      newsletterTemplates,
    ] = await Promise.all([
      this.service.loadEstablishments(),
      this.service.loadEmployeeTypes(),
      this.service.loadProfessionalCategories(),
      this.service.loadPaymentMethods(),
      this.service.loadDepartments(),
      this.service.loadPositions(),
      this.service.loadLegalClasses(),
      this.service.loadIndications(),
      this.service.loadEchelons(),
      this.service.loadNewsletterTemplates(),
    ]);

    this.establishmentOptions.set(this.toOptions(establishments, 'establishmentName', 'establishmentId'));
    this.employeeTypeOptions.set(this.toOptions(employeeTypes, 'employeeTypeName', 'employeeTypeId'));
    this.professionalCategoryOptions.set(
      this.toOptions(professionalCategories, 'professionalCategoryName', 'professionalCategoryId'),
    );
    this.paymentMethodOptions.set(this.toOptions(paymentMethods, 'paymentMethodName', 'paymentMethodId'));

    this.departments = departments;
    this.positions = positions;
    this.legalClasses = legalClasses;
    this.indications = indications;
    this.echelons = echelons;
    this.newsletterTemplates = newsletterTemplates;
  }

  // ---- Filtres en cascade (lisent form.* → toujours à jour, y compris en édition) ----
  departmentOptions(): GccSelectOption[] {
    const establishmentId = this.num(this.form.establishmentId);
    const source = establishmentId
      ? this.departments.filter((d) => d.establishmentId === establishmentId)
      : this.departments;
    return this.toOptions(source, 'name', 'departmentId');
  }

  positionOptions(): GccSelectOption[] {
    const departmentId = this.num(this.form.departmentId);
    const source = departmentId ? this.positions.filter((p) => p.departmentId === departmentId) : this.positions;
    return this.toOptions(source, 'positionName', 'positionId');
  }

  legalClassOptions(): GccSelectOption[] {
    const professionalCategoryId = this.num(this.form.professionalCategoryId);
    const source = professionalCategoryId
      ? this.legalClasses.filter((l) => l.professionalCategoryId === professionalCategoryId)
      : this.legalClasses;
    return this.toOptions(source, 'legalClassName', 'legalClassId');
  }

  indicationOptions(): GccSelectOption[] {
    const legalClassId = this.num(this.form.legalClassId);
    const source = legalClassId ? this.indications.filter((i) => i.legalClassId === legalClassId) : this.indications;
    return this.toOptions(source, 'indicationName', 'indicationId');
  }

  newsletterTemplateOptions(): GccSelectOption[] {
    const employeeTypeId = this.num(this.form.employeeTypeId);
    const source = employeeTypeId
      ? this.newsletterTemplates.filter((t) => t.employeeTypeId === employeeTypeId)
      : this.newsletterTemplates;
    return this.toOptions(source, 'newsletterTemplateName', 'newsletterTemplateId');
  }

  // ---- Handlers de cascade ----
  onEstablishmentChange(value: string | null): void {
    this.form.establishmentId = value;
    this.form.departmentId = null;
    this.form.positionId = null;
    this.clearClassification();
    this.clearError('establishmentId', 'departmentId', 'positionId', 'professionalCategoryId', 'legalClassId', 'indicationId', 'baseSalary', 'newsletterTemplateId');
  }

  onDepartmentChange(value: string | null): void {
    this.form.departmentId = value;
    this.form.positionId = null;
    this.clearClassification();
    this.clearError('departmentId', 'positionId', 'professionalCategoryId', 'legalClassId', 'indicationId', 'baseSalary', 'newsletterTemplateId');
  }

  onPositionChange(value: string | null): void {
    this.form.positionId = value;
    this.clearClassification();
    this.clearError('positionId', 'professionalCategoryId', 'legalClassId', 'indicationId', 'baseSalary', 'newsletterTemplateId');
    const position = this.positions.find((p) => p.positionId === this.num(value));
    if (position) {
      this.form.professionalCategoryId =
        position.professionalCategoryId != null ? String(position.professionalCategoryId) : null;
      this.form.legalClassId = position.legalClassId != null ? String(position.legalClassId) : null;
    }
  }

  onProfessionalCategoryChange(value: string | null): void {
    this.form.professionalCategoryId = value;
    this.form.legalClassId = null;
    this.form.indicationId = null;
    this.form.echelonId = null;
    this.form.baseSalary = null;
    this.recomputeNet();
    this.clearError('professionalCategoryId', 'legalClassId', 'indicationId', 'baseSalary');
  }

  onLegalClassChange(value: string | null): void {
    this.form.legalClassId = value;
    this.form.indicationId = null;
    this.form.echelonId = null;
    this.form.baseSalary = null;
    this.recomputeNet();
    this.clearError('legalClassId', 'indicationId', 'baseSalary');
  }

  onIndicationChange(value: string | null): void {
    this.form.indicationId = value;
    this.clearError('indicationId', 'baseSalary');
    const indication = this.indications.find((i) => i.indicationId === this.num(value));
    if (indication && indication.indicationValue != null && indication.pointValue != null) {
      this.form.baseSalary = this.formatDecimal(indication.indicationValue * indication.pointValue);
    } else {
      this.form.baseSalary = null;
    }
    this.deriveEchelonFromIndice();
    this.computeAdvancementSuggestion();
    this.recomputeNet();
  }

  onEmployeeTypeChange(value: string | null): void {
    this.form.employeeTypeId = value;
    this.form.newsletterTemplateId = null;
    this.recomputeNet();
    this.clearError('employeeTypeId', 'newsletterTemplateId');
  }

  onNewsletterTemplateChange(value: string | null): void {
    this.form.newsletterTemplateId = value;
    this.recomputeNet();
    this.clearError('newsletterTemplateId');
  }

  onBaseSalaryChange(value: string): void {
    this.form.baseSalary = value;
    this.recomputeNet();
    this.clearError('baseSalary');
  }

  onPaymentMethodChange(value: string | null): void {
    this.form.paymentMethodId = value;
    this.clearError('paymentMethodId');
  }

  // ---- Calculs ----
  netSalaryLabel(): string {
    return this.form.netSalary != null && this.form.netSalary !== '' ? this.form.netSalary : '—';
  }

  paymentWarning(): string | null {
    const method = this.paymentMethodOptions().find((o) => o.value === this.form.paymentMethodId);
    if (!method || !method.label.toLowerCase().includes('virement')) return null;
    return this.employeeRib?.trim()
      ? null
      : "Le mode de paiement « Virement » est sélectionné mais l'employé n'a pas de RIB renseigné.";
  }

  /** Libellé de l'échelon dérivé de l'indice (FP-09, transparence). */
  echelonLabel(): string | null {
    const id = this.num(this.form.echelonId);
    const echelon = this.echelons.find((e) => e.echelonId === id);
    return echelon ? echelon.echelonName : null;
  }

  /**
   * FP-09 : dérive l'échelon depuis l'indice choisi (grille R2, Echelon.Indication_id),
   * filtré par la classe légale pour lever l'ambiguïté si plusieurs classes partagent un indice.
   */
  private deriveEchelonFromIndice(): void {
    const indicationId = this.num(this.form.indicationId);
    const legalClassId = this.num(this.form.legalClassId);
    const echelon = this.echelons.find(
      (e) => e.indicationId === indicationId && (legalClassId == null || e.legalClassId === legalClassId),
    );
    this.form.echelonId = echelon ? String(echelon.echelonId) : null;
  }

  /**
   * FP-02 : détecte si l'indice choisi dans la nomination est supérieur à l'indice actuel
   * de l'employé (dernier plan actif) → suggestion de bascule vers un avancement.
   */
  private computeAdvancementSuggestion(): void {
    if (this.currentIndicationId == null) {
      this.advancementSuggested.set(false);
      return;
    }
    const current = this.indications.find((i) => i.indicationId === this.currentIndicationId)?.indicationValue;
    const next = this.indications.find((i) => i.indicationId === this.num(this.form.indicationId))?.indicationValue;
    this.advancementSuggested.set(current != null && next != null && next > current);
  }

  /**
   * Valide les champs obligatoires de la section Nomination + les règles métier
   * (grille salariale). Retourne true si le formulaire est valide.
   */
  validate(): boolean {
    const next: Record<string, string> = {};

    if (!this.form.establishmentId) {
      next['establishmentId'] = "L'établissement est obligatoire.";
    } else {
      if (!this.form.departmentId) {
        next['departmentId'] = 'Le département est obligatoire.';
      } else if (!this.form.positionId) {
        next['positionId'] = 'Le poste est obligatoire.';
      }
    }

    if (!this.form.employeeTypeId) {
      next['employeeTypeId'] = 'Le type de contrat est obligatoire.';
    }

    if (!this.form.professionalCategoryId) {
      next['professionalCategoryId'] = 'La catégorie professionnelle est obligatoire.';
    } else {
      if (!this.form.legalClassId) {
        next['legalClassId'] = 'La classe légale est obligatoire.';
      } else if (!this.form.indicationId) {
        next['indicationId'] = "L'indice est obligatoire.";
      }
    }

    if (this.form.baseSalary == null || this.form.baseSalary === '') {
      next['baseSalary'] = 'Le salaire de base est obligatoire.';
    }

    if (!this.form.newsletterTemplateId) {
      next['newsletterTemplateId'] = 'Le modèle de bulletin est obligatoire.';
    }

    if (!this.form.paymentMethodId) {
      next['paymentMethodId'] = 'Le mode de paiement est obligatoire.';
    }

    const minError = this.minSalaryError();
    if (minError) next['baseSalary'] = minError;

    this.errors.set(next);
    return Object.keys(next).length === 0;
  }

  /** Règle : salaire de base >= MinSalary de la classe légale (grille minima). */
  private minSalaryError(): string | null {
    const legalClassId = this.num(this.form.legalClassId);
    const legalClass = this.legalClasses.find((l) => l.legalClassId === legalClassId);
    const base = this.num(this.form.baseSalary);
    if (legalClass && legalClass.minSalary != null && base != null && base < legalClass.minSalary) {
      return `Le salaire de base (${this.formatDecimal(base)}) est inférieur au minimum de la classe légale (${this.formatDecimal(legalClass.minSalary)}).`;
    }
    return null;
  }

  /** Efface les erreurs d'un ou plusieurs champs (UX en direct). */
  private clearError(...fields: string[]): void {
    this.errors.update((current) => {
      const next = { ...current };
      for (const field of fields) delete next[field];
      return next;
    });
  }

  private clearClassification(): void {
    this.form.professionalCategoryId = null;
    this.form.legalClassId = null;
    this.form.indicationId = null;
    this.form.echelonId = null;
    this.form.baseSalary = null;
    this.form.newsletterTemplateId = null;
    this.form.netSalary = null;
    this.computeAdvancementSuggestion();
  }

  private recomputeNet(): void {
    const base = Number(this.form.baseSalary);
    const template = this.newsletterTemplates.find(
      (t) => t.newsletterTemplateId === this.num(this.form.newsletterTemplateId),
    );
    if (Number.isFinite(base) && template?.deductionRate != null) {
      this.form.netSalary = this.formatDecimal(base * (1 - template.deductionRate / 100));
    } else {
      this.form.netSalary = this.form.baseSalary;
    }
  }

  private formatDecimal(value: number): string {
    return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : '';
  }

  private num(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private toOptions<T>(rows: T[], labelKey: keyof T, valueKey: keyof T): GccSelectOption[] {
    return rows.map((row) => ({
      label: String(row[labelKey] ?? ''),
      value: String(row[valueKey]),
    }));
  }
}
