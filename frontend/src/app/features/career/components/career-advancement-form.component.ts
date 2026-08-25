import { Component, inject, Input, OnChanges, OnInit, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  CareerPlanForm,
  DepartmentOption,
  EchelonOption,
  IndicationOption,
  LegalClassOption,
  ProfessionalCategoryOption,
} from '../../../core/career-plan-create.models';
import { CareerPlanCreateService } from '../../../core/career-plan-create.service';
import { GccSelectOption } from '../../../ui/gcc.types';
import { GccSelect } from '../../../ui/gcc-select';

@Component({
  selector: 'app-career-advancement-form',
  imports: [FormsModule, MatIconModule, GccSelect],
  template: `
    <section>
      @if (advancementWarning(); as warning) {
        <div class="mb-5 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs font-medium text-amber-700">
          <mat-icon class="!h-4 !w-4 !text-[18px] shrink-0 mt-0.5">info</mat-icon>
          <p>{{ warning }}</p>
        </div>
      }
      <div class="grid gap-5 lg:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">trending_up</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Avancement — Organisation</h2>
          </div>
          <div class="grid gap-4">
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
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Échelon</label>
              <gcc-select
                [options]="echelonOptions()"
                [value]="form.echelonId"
                (valueChange)="onEchelonChange($event)"
                placeholder="Sélectionner un échelon"
              />
              @if (errors()['echelonId']) {
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                  {{ errors()['echelonId'] }}
                </p>
              }
            </div>
          </div>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">workspace_premium</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Avancement — Classification</h2>
          </div>
          <div class="grid gap-4">
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
          </div>
        </article>
      </div>
    </section>
  `,
})
export class CareerAdvancementFormComponent implements OnInit, OnChanges {
  @Input() form!: CareerPlanForm;
  /** Matricule de l'employé sélectionné (déclenche le pré-remplissage de la situation actuelle). */
  @Input() registrationNumber: string | null = null;

  private readonly service = inject(CareerPlanCreateService);

  readonly errors = signal<Record<string, string>>({});
  readonly departmentOptions = signal<GccSelectOption[]>([]);
  readonly professionalCategoryOptions = signal<GccSelectOption[]>([]);

  private departments: DepartmentOption[] = [];
  private indications: IndicationOption[] = [];
  private echelons: EchelonOption[] = [];
  private professionalCategories: ProfessionalCategoryOption[] = [];
  private legalClasses: LegalClassOption[] = [];

  private lookupsReady = false;
  /** Situation actuelle de l'employé (dernier plan de carrière actif). */
  private lastPlan: Record<string, any> | null = null;
  /** Valeur numérique de l'indice actuel (règle de progression). */
  private currentIndiceValue: number | null = null;
  /** Date d'affectation du dernier plan (avertissement d'ancienneté). */
  private lastAssignmentDate: string | null = null;
  /** Durée minimale (mois) requise dans l'échelon actuel (règle 3). */
  private currentEchelonMinMonths: number | null = null;

  ngOnInit(): void {
    void this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['registrationNumber']) {
      if (this.lookupsReady) {
        void this.loadCurrentSituation();
      }
      // Sinon load() déclenchera loadCurrentSituation() une fois les référentiels prêts.
    }
  }

  private async load(): Promise<void> {
    const [departments, indications, echelons, professionalCategories, legalClasses] = await Promise.all([
      this.service.loadDepartments(),
      this.service.loadIndications(),
      this.service.loadEchelons(),
      this.service.loadProfessionalCategories(),
      this.service.loadLegalClasses(),
    ]);

    this.departments = departments;
    this.indications = indications;
    this.echelons = echelons;
    this.professionalCategories = professionalCategories;
    this.legalClasses = legalClasses;

    this.departmentOptions.set(this.toOptions(departments, 'name', 'departmentId'));
    this.professionalCategoryOptions.set(
      this.toOptions(professionalCategories, 'professionalCategoryName', 'professionalCategoryId'),
    );

    this.lookupsReady = true;
    await this.loadCurrentSituation();
  }

  // ---- Filtres en cascade (lisent form.* → à jour, y compris en édition) ----
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

  echelonOptions(): GccSelectOption[] {
    const legalClassId = this.num(this.form.legalClassId);
    const source = legalClassId ? this.echelons.filter((e) => e.legalClassId === legalClassId) : this.echelons;
    return this.toOptions(source, 'echelonName', 'echelonId');
  }

  // ---- Handlers ----
  onDepartmentChange(value: string | null): void {
    this.form.departmentId = value;
    this.clearError('departmentId');
  }

  onProfessionalCategoryChange(value: string | null): void {
    this.form.professionalCategoryId = value;
    this.form.legalClassId = null;
    this.form.indicationId = null;
    this.form.echelonId = null;
    this.clearError('professionalCategoryId', 'legalClassId', 'indicationId', 'echelonId');
  }

  onLegalClassChange(value: string | null): void {
    this.form.legalClassId = value;
    this.form.indicationId = null;
    this.form.echelonId = null;
    this.clearError('legalClassId', 'indicationId', 'echelonId');
  }

  onIndicationChange(value: string | null): void {
    this.form.indicationId = value;
    this.clearError('indicationId');
  }

  onEchelonChange(value: string | null): void {
    this.form.echelonId = value;
    // Règle 2 : la sélection d'un échelon pré-sélectionne l'indice correspondant de la grille.
    const echelon = this.echelons.find((e) => e.echelonId === this.num(value));
    this.form.indicationId = echelon && echelon.indicationId != null ? String(echelon.indicationId) : null;
    this.clearError('echelonId', 'indicationId');
  }

  // ---- Pré-remplissage : situation actuelle de l'employé ----
  private async loadCurrentSituation(): Promise<void> {
    const reg = this.registrationNumber ?? this.form.registrationNumber;
    if (!reg) {
      this.lastPlan = null;
      this.currentIndiceValue = null;
      this.lastAssignmentDate = null;
      this.currentEchelonMinMonths = null;
      return;
    }

    const plan = await this.service.getLastCareerPlan(reg);
    this.lastPlan = plan;
    this.lastAssignmentDate = plan?.['assignmentDate'] ? this.toDateString(plan['assignmentDate']) : null;

    this.form.departmentId = this.toStr(plan?.['departmentId']);
    this.form.professionalCategoryId = this.toStr(plan?.['professionalCategoryId']);
    this.form.legalClassId = this.toStr(plan?.['legalClassId']);
    this.form.indicationId = this.toStr(plan?.['indicationId']);
    this.form.echelonId = this.toStr(plan?.['echelonId']);

    this.currentIndiceValue = this.resolveIndicationValue(plan?.['indicationId']);
    this.currentEchelonMinMonths = this.resolveEchelonMinMonths(plan?.['echelonId']);
    this.errors.set({});
  }

  /** Valeur numérique de l'indice courant (base de la règle de progression). */
  private resolveIndicationValue(indicationId: unknown): number | null {
    const id = this.num(this.toStr(indicationId));
    const indication = this.indications.find((i) => i.indicationId === id);
    return indication?.indicationValue ?? null;
  }

  /** Durée minimale (mois) requise dans l'échelon actuel (règle d'ancienneté). */
  private resolveEchelonMinMonths(echelonId: unknown): number | null {
    const id = this.num(this.toStr(echelonId));
    const echelon = this.echelons.find((e) => e.echelonId === id);
    return echelon?.minMonths ?? null;
  }

  // ---- Règles métier ----
  /** Règle 1 : le nouvel indice doit être strictement supérieur à l'indice actuel. */
  private progressionError(): string | null {
    if (this.currentIndiceValue == null) return null;
    const newIndication = this.indications.find((i) => i.indicationId === this.num(this.form.indicationId));
    const newValue = newIndication?.indicationValue;
    if (newValue == null) return null;
    if (newValue <= this.currentIndiceValue) {
      return `Le nouvel indice (${this.formatDecimal(newValue)}) doit être strictement supérieur à l'indice actuel (${this.formatDecimal(this.currentIndiceValue)}).`;
    }
    return null;
  }

  /**
   * Avertissements (non bloquants) : cohérence temporelle + règle 3
   * (ancienneté minimale dans l'échelon actuel avant avancement).
   */
  advancementWarning(): string | null {
    if (!this.lastAssignmentDate || !this.form.assignmentDate) return null;

    if (this.form.assignmentDate < this.lastAssignmentDate) {
      return `La date d'affectation (${this.form.assignmentDate}) est antérieure à celle du dernier plan de carrière (${this.lastAssignmentDate}).`;
    }

    if (this.currentEchelonMinMonths != null) {
      const months = this.monthsBetween(this.lastAssignmentDate, this.form.assignmentDate);
      if (months < this.currentEchelonMinMonths) {
        return `L'ancienneté dans l'échelon actuel (${months} mois) est inférieure à la durée minimale requise (${this.currentEchelonMinMonths} mois) avant un avancement.`;
      }
    }
    return null;
  }

  /** Validation des champs obligatoires + règles métier. Retourne true si valide. */
  validate(): boolean {
    const next: Record<string, string> = {};

    if (!this.form.departmentId) next['departmentId'] = 'Le département est obligatoire.';
    if (!this.form.professionalCategoryId) next['professionalCategoryId'] = 'La catégorie professionnelle est obligatoire.';
    if (!this.form.legalClassId) next['legalClassId'] = 'La classe légale est obligatoire.';
    if (!this.form.indicationId) next['indicationId'] = "L'indice est obligatoire.";
    if (!this.form.echelonId) next['echelonId'] = "L'échelon est obligatoire.";

    const progression = this.progressionError();
    if (progression) next['indicationId'] = progression;

    this.errors.set(next);
    return Object.keys(next).length === 0;
  }

  // ---- Helpers ----
  private clearError(...fields: string[]): void {
    this.errors.update((current) => {
      const next = { ...current };
      for (const field of fields) delete next[field];
      return next;
    });
  }

  private formatDecimal(value: number): string {
    return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : '';
  }

  private num(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private toStr(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    return String(value);
  }

  private toDateString(value: unknown): string | null {
    if (!value) return null;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Nombre de mois calendaires entre deux dates (borné à 0). */
  private monthsBetween(from: string, to: string): number {
    const start = new Date(from);
    const end = new Date(to);
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) months--;
    return Math.max(0, months);
  }

  private toOptions<T>(rows: T[], labelKey: keyof T, valueKey: keyof T): GccSelectOption[] {
    return rows.map((row) => ({
      label: String(row[labelKey] ?? ''),
      value: String(row[valueKey]),
    }));
  }
}

