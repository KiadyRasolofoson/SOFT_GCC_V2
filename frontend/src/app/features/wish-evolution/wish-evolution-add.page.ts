import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { SuggestionPositionItem, WishEvolutionForm } from '../../core/wish-evolution.models';
import { WishEvolutionService } from '../../core/wish-evolution.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';

interface WishEvolutionFormState {
  positionId: string | null;
  employeeId: string | null;
  wishTypeId: string | null;
  motivation: string | null;
  disponibility: string | null;
  priority: string | null;
  requestDate: string | null;
  state: number | null;
}

@Component({
  selector: 'app-wish-evolution-add-page',
  imports: [FormsModule, GccPageHeader, GccEmptyState, GccSelect, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Ajout d'un souhait d'évolution"
      subtitle="Enregistrez une nouvelle demande d'évolution de carrière."
      icon="add_circle_outline"
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
          <p class="font-bold text-emerald-900">Insertion de la nouvelle demande réussie</p>
        </div>
      </div>
    }

    @if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement du formulaire…
      </div>
    } @else {
      <form (ngSubmit)="submit()" novalidate class="grid items-start gap-5 lg:grid-cols-2">
        <!-- Formulaire -->
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">description</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Formulaire d'ajout</h2>
          </div>

          <div class="grid gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="employee">Employé</label>
              <gcc-select
                [options]="employeeOptions()"
                [value]="form.employeeId"
                (valueChange)="onEmployeeChange($event)"
                placeholder="Sélectionner un employé"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="position">Poste souhaité</label>
              <gcc-select
                [options]="positionOptions()"
                [(value)]="form.positionId"
                placeholder="Sélectionner un poste"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="wishType">Type de souhait</label>
              <gcc-select
                [options]="wishTypeOptions()"
                [(value)]="form.wishTypeId"
                placeholder="Sélectionner un type de souhait"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600" for="motivation">Motivation</label>
              <input
                id="motivation"
                name="motivation"
                type="text"
                class="gcc-input"
                placeholder="Motivation de la demande"
                [(ngModel)]="form.motivation"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-600" for="disponibility">Disponibilité</label>
                <input
                  id="disponibility"
                  name="disponibility"
                  type="date"
                  class="gcc-input"
                  [(ngModel)]="form.disponibility"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-600" for="priority">Priorité (/10)</label>
                <input
                  id="priority"
                  name="priority"
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  class="gcc-input"
                  [(ngModel)]="form.priority"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-600" for="requestDate">Date de demande</label>
                <input
                  id="requestDate"
                  name="requestDate"
                  type="date"
                  class="gcc-input"
                  [(ngModel)]="form.requestDate"
                />
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="goBack()">
              <mat-icon>close</mat-icon>
              Annuler
            </button>
            <button mat-flat-button type="submit" class="gcc-btn-primary" [disabled]="submitting()">
              @if (submitting()) {
                <span class="flex items-center gap-2">
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Enregistrement…
                </span>
              } @else {
                <span class="flex items-center gap-2">
                  <mat-icon>check</mat-icon>
                  Enregistrer
                </span>
              }
            </button>
          </div>
        </article>

        <!-- Postes recommandés -->
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">work_search</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Postes recommandés</h2>
          </div>

          @if (suggestions().length === 0) {
            <gcc-empty-state
              title="Aucun poste recommandé"
              message="Sélectionnez un employé pour afficher les postes suggérés."
            />
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                    <th class="px-2 py-2 font-semibold">#</th>
                    <th class="px-2 py-2 font-semibold">Poste suggéré</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of suggestions(); track item.positionId) {
                    <tr class="border-b border-slate-100 text-sm text-slate-700">
                      <td class="px-2 py-2">{{ item.positionId }}</td>
                      <td class="px-2 py-2 font-medium text-navy">{{ item.positionName }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </article>
      </form>
    }
  `,
})
export class WishEvolutionAddPage {
  private readonly router = inject(Router);
  private readonly service = inject(WishEvolutionService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Souhait évolution' }, { label: 'Ajout' }];

  readonly employeeOptions = signal<{ label: string; value: string }[]>([]);
  readonly positionOptions = signal<{ label: string; value: string }[]>([]);
  readonly wishTypeOptions = signal<{ label: string; value: string }[]>([]);
  readonly suggestions = signal<SuggestionPositionItem[]>([]);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  readonly form: WishEvolutionFormState = {
    positionId: null,
    employeeId: null,
    wishTypeId: null,
    motivation: '',
    disponibility: '',
    priority: '',
    requestDate: '',
    state: 1,
  };

  constructor() {
    void this.initLookups();
  }

  async initLookups(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [employees, positions, wishTypes] = await Promise.all([
        this.service.loadEmployees(),
        this.service.loadPositions(),
        this.service.loadWishTypes(),
      ]);

      this.employeeOptions.set(
        employees.map((item) => ({
          label:
            [item.registrationNumber, item.name, item.firstName].filter(Boolean).join(' - ').trim() ||
            `Employé ${item.employeeId}`,
          value: String(item.employeeId),
        })),
      );

      this.positionOptions.set(
        positions.map((item) => ({ label: item.positionName, value: String(item.positionId) })),
      );

      this.wishTypeOptions.set(
        wishTypes.map((item) => ({ label: item.designation, value: String(item.wishTypeId) })),
      );
    } catch (error) {
      this.error.set(
        `Erreur lors de la récupération des données : ${error instanceof Error ? error.message : 'erreur inconnue'}`,
      );
    } finally {
      this.loading.set(false);
    }
  }

  onEmployeeChange(value: string | null): void {
    this.form.employeeId = value;
    const employeeId = value ? Number(value) : null;
    if (!employeeId) {
      this.suggestions.set([]);
      return;
    }
    void this.loadSuggestions(employeeId);
  }

  async loadSuggestions(employeeId: number): Promise<void> {
    try {
      const suggestions = await this.service.getSuggestions(employeeId);
      this.suggestions.set(suggestions);
    } catch (error) {
      this.suggestions.set([]);
      this.error.set(
        `Erreur lors de la récupération des postes suggérés : ${
          error instanceof Error ? error.message : 'erreur inconnue'
        }`,
      );
    }
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.error.set(null);
    this.success.set(false);

    const payload: WishEvolutionForm = {
      positionId: this.toNumber(this.form.positionId),
      employeeId: this.toNumber(this.form.employeeId),
      wishTypeId: this.toNumber(this.form.wishTypeId),
      motivation: this.form.motivation?.trim() || null,
      disponibility: this.form.disponibility || null,
      priority: this.toNumber(this.form.priority),
      requestDate: this.form.requestDate || null,
      state: 1,
      creationDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    this.submitting.set(true);
    try {
      await this.service.create(payload);
      this.success.set(true);
      this.resetForm();
      setTimeout(() => {
        void this.router.navigate(['/soft-gcc/souhaits-evolution']);
      }, 1500);
    } catch (error) {
      this.error.set(
        `Erreur lors de l'insertion : ${error instanceof Error ? error.message : 'erreur inconnue'}`,
      );
    } finally {
      this.submitting.set(false);
    }
  }

  resetForm(): void {
    this.form.positionId = null;
    this.form.employeeId = null;
    this.form.wishTypeId = null;
    this.form.motivation = '';
    this.form.disponibility = '';
    this.form.priority = '';
    this.form.requestDate = '';
    this.form.state = 1;
    this.suggestions.set([]);
  }

  goBack(): void {
    void this.router.navigate(['/soft-gcc/souhaits-evolution']);
  }

  private toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
}
