import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { EmployeeListItem, EmployeeListService } from '../../core/employee-list.service';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';

interface EmployeeCreateForm {
  registrationNumber: string | null;
  name: string | null;
  firstName: string | null;
  birthday: string | null;
  department_id: string | null;
  hiring_date: string | null;
  civiliteId: string | null;
  managerId: string | null;
  email: string | null;
}

interface EmployeeCreateErrors {
  registrationNumber?: string;
  name?: string;
  firstName?: string;
  birthday?: string;
  department_id?: string;
  hiring_date?: string;
  civiliteId?: string;
  photo?: string;
  email?: string;
}

@Component({
  selector: 'app-employee-create-page',
  imports: [FormsModule, GccPageHeader, GccSelect, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Ajout d'un nouvel employé"
      subtitle="Enregistrez un nouvel employé dans la base RH."
      icon="person_add"
      [crumbs]="crumbs"
    />

    @if (error(); as err) {
      <div class="mb-6 rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-xs text-red-900 shadow-xs">
        <div class="flex items-start gap-3">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-red-600 mt-0.5">error_outline</mat-icon>
          <p class="font-bold text-red-900">{{ err }}</p>
        </div>
      </div>
    }

    @if (success()) {
      <div class="mb-6 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-xs text-emerald-900 shadow-xs">
        <div class="flex items-start gap-3">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-emerald-600 mt-0.5">check_circle</mat-icon>
          <p class="font-bold text-emerald-900">{{ success() }}</p>
        </div>
      </div>
    }

    @if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement du formulaire…
      </div>
    } @else {
      <form (ngSubmit)="submit()" novalidate class="grid items-start gap-5 lg:grid-cols-2">
        <!-- Formulaire 1 -->
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">description</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Formulaire d'ajout 1</h2>
          </div>

          <div class="grid gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="registrationNumber">Numéro de matricule</label>
              <input
                id="registrationNumber"
                name="registrationNumber"
                type="text"
                class="gcc-input"
                [(ngModel)]="form.registrationNumber"
                placeholder="EMP0001"
              />
              @if (formErrors().registrationNumber) {
                <p class="mt-1 text-xs text-red-600">{{ formErrors().registrationNumber }}</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="name">Nom</label>
              <input
                id="name"
                name="name"
                type="text"
                class="gcc-input"
                [(ngModel)]="form.name"
                placeholder="Nom de famille"
              />
              @if (formErrors().name) {
                <p class="mt-1 text-xs text-red-600">{{ formErrors().name }}</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="firstName">Prénom</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                class="gcc-input"
                [(ngModel)]="form.firstName"
                placeholder="Prénom"
              />
              @if (formErrors().firstName) {
                <p class="mt-1 text-xs text-red-600">{{ formErrors().firstName }}</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="birthday">Date de naissance</label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                class="gcc-input"
                [(ngModel)]="form.birthday"
              />
              @if (formErrors().birthday) {
                <p class="mt-1 text-xs text-red-600">{{ formErrors().birthday }}</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="department">Département</label>
              <gcc-select
                [options]="departmentOptions()"
                [(value)]="form.department_id"
                placeholder="Sélectionner un département"
              />
              @if (formErrors().department_id) {
                <p class="mt-1 text-xs text-red-600">{{ formErrors().department_id }}</p>
              }
            </div>
          </div>
        </article>

        <!-- Formulaire 2 -->
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">description</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Formulaire d'ajout 2</h2>
          </div>

          <div class="grid gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="hiringDate">Date d'embauche</label>
              <input
                id="hiringDate"
                name="hiring_date"
                type="date"
                class="gcc-input"
                [(ngModel)]="form.hiring_date"
              />
              @if (formErrors().hiring_date) {
                <p class="mt-1 text-xs text-red-600">{{ formErrors().hiring_date }}</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="civilite">Civilité</label>
              <gcc-select [options]="civiliteOptions" [(value)]="form.civiliteId" placeholder="Sélectionner la civilité" />
              @if (formErrors().civiliteId) {
                <p class="mt-1 text-xs text-red-600">{{ formErrors().civiliteId }}</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="manager">Manager</label>
              <gcc-select [options]="managerOptions()" [(value)]="form.managerId" placeholder="Sélectionner le manager" />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="photo">Photo</label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy outline-none transition focus:border-accent focus:bg-white"
                (change)="onFileSelected($event)"
              />
              @if (formErrors().photo) {
                <p class="mt-1 text-xs text-red-600">{{ formErrors().photo }}</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="email">Email</label>
              <input
                id="email"
                name="email"
                type="text"
                class="gcc-input"
                [(ngModel)]="form.email"
                placeholder="email@entreprise.com"
              />
              @if (formErrors().email) {
                <p class="mt-1 text-xs text-red-600">{{ formErrors().email }}</p>
              }
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Retour
            </button>
            <button mat-flat-button type="submit" class="gcc-btn-primary" [disabled]="submitting()">
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
        </article>
      </form>
    }
  `,
})
export class EmployeeCreatePage {
  private readonly router = inject(Router);
  private readonly service = inject(EmployeeListService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Gestion employés' }, { label: 'Ajout' }];

  readonly civiliteOptions: GccSelectOption[] = [
    { label: 'Monsieur', value: '1' },
    { label: 'Madame', value: '2' },
  ];

  readonly departmentOptions = signal<GccSelectOption[]>([]);
  readonly managerOptions = signal<GccSelectOption[]>([]);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly formErrors = signal<EmployeeCreateErrors>({});

  readonly form: EmployeeCreateForm = {
    registrationNumber: '',
    name: '',
    firstName: '',
    birthday: '',
    department_id: null,
    hiring_date: '',
    civiliteId: null,
    managerId: null,
    email: '',
  };

  private selectedPhoto: File | null = null;

  constructor() {
    void this.initialize();
  }

  async initialize(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [employees, departments] = await Promise.all([
        this.service.loadAll(),
        this.service.loadDepartments(),
      ]);

      this.form.registrationNumber = this.service.nextRegistrationNumber(employees);

      this.departmentOptions.set([
        { label: 'Sélectionner un département', value: '' },
        ...departments.map((item) => ({ label: item.name, value: String(item.departmentId) })),
      ]);

      this.managerOptions.set([
        { label: 'Sélectionner le manager', value: '' },
        ...employees.map((item) => ({
          label: `${item.registrationNumber} - ${item.name} ${item.firstName}`.trim(),
          value: String(item.employeeId),
        })),
      ]);
    } catch {
      this.form.registrationNumber = 'EMP0001';
      this.departmentOptions.set([{ label: 'Sélectionner un département', value: '' }]);
      this.managerOptions.set([{ label: 'Sélectionner le manager', value: '' }]);
    } finally {
      this.loading.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedPhoto = file;
    this.formErrors.update((errors) => {
      const next = { ...errors };
      delete next['photo'];
      return next;
    });
  }

  validateForm(): boolean {
    const errors: EmployeeCreateErrors = {};
    const today = new Date();
    const birthdayDate = this.form.birthday ? new Date(this.form.birthday) : null;
    const hiringDate = this.form.hiring_date ? new Date(this.form.hiring_date) : null;
    const minAgeDate = new Date();
    minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);

    if (!this.form.registrationNumber?.trim()) errors.registrationNumber = 'Le numéro de matricule est requis';
    if (!this.form.name?.trim()) errors.name = 'Le nom est requis';
    if (!this.form.firstName?.trim()) errors.firstName = 'Le prénom est requis';
    if (!this.form.birthday) {
      errors.birthday = 'La date de naissance est requise';
    } else if (birthdayDate && birthdayDate > minAgeDate) {
      errors.birthday = "L'employé doit avoir au moins 18 ans";
    }
    if (!this.form.department_id) {
      errors.department_id = 'Le département est requis';
    }
    if (!this.form.hiring_date) {
      errors.hiring_date = "La date d'embauche est requise";
    } else if (hiringDate && hiringDate > today) {
      errors.hiring_date = "La date d'embauche ne peut pas être dans le futur";
    }
    if (!this.form.civiliteId) errors.civiliteId = 'La civilité est requise';
    if (!this.selectedPhoto) errors.photo = 'La photo est requise';

    this.formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    if (!this.validateForm()) return;

    const form = new FormData();
    form.append('registrationNumber', this.form.registrationNumber ?? '');
    form.append('name', this.form.name ?? '');
    form.append('firstName', this.form.firstName ?? '');
    form.append('birthday', this.form.birthday ?? '');
    form.append('department_id', this.form.department_id ?? '');
    form.append('hiring_date', this.form.hiring_date ?? '');
    form.append('civiliteId', this.form.civiliteId ?? '');
    form.append('email', this.form.email ?? '');
    if (this.form.managerId) {
      form.append('managerId', this.form.managerId);
    }
    if (this.selectedPhoto) {
      form.append('photo', this.selectedPhoto);
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const result = await this.service.create(form);
      if (!result.ok) {
        this.error.set(result.message ?? 'Erreur lors de l\'insertion.');
        return;
      }

      const createdRegistrationNumber = this.form.registrationNumber ?? '';
      this.success.set(`Création du nouvel employé ${createdRegistrationNumber} réussie`);
      this.resetForm();
      setTimeout(() => {
        void this.router.navigate(['/soft-gcc/parametres/employes/liste']);
      }, 1500);
    } finally {
      this.submitting.set(false);
    }
  }

  private async resetForm(): Promise<void> {
    this.form.name = '';
    this.form.firstName = '';
    this.form.birthday = '';
    this.form.department_id = null;
    this.form.hiring_date = '';
    this.form.civiliteId = null;
    this.form.managerId = null;
    this.form.email = '';
    this.selectedPhoto = null;
    this.formErrors.set({});

    const employees = await this.service.loadAll();
    this.form.registrationNumber = this.service.nextRegistrationNumber(employees);
  }

  goBack(): void {
    void this.router.navigate(['/soft-gcc/parametres/employes/liste']);
  }
}
