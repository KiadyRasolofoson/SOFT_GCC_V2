import { Component, Input, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CareerPlanForm } from '../../../core/career-plan-create.models';
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
                [(value)]="form.establishmentId"
                placeholder="Sélectionner un établissement"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Département</label>
              <gcc-select
                [options]="departmentOptions()"
                [(value)]="form.departmentId"
                placeholder="Sélectionner un département"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Poste</label>
              <gcc-searchable-select
                [options]="positionOptions()"
                [(value)]="form.positionId"
                placeholder="Rechercher un poste…"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Type de contrat</label>
              <gcc-select
                [options]="employeeTypeOptions()"
                [(value)]="form.employeeTypeId"
                placeholder="Sélectionner un type de contrat"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Indice</label>
              <gcc-select
                [options]="indicationOptions()"
                [(value)]="form.indicationId"
                placeholder="Sélectionner un indice"
              />
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
                  [(ngModel)]="form.baseSalary"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-600">Salaire net</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="gcc-input"
                  placeholder="0,00"
                  [(ngModel)]="form.netSalary"
                />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Catégorie professionnelle</label>
              <gcc-select
                [options]="professionalCategoryOptions()"
                [(value)]="form.professionalCategoryId"
                placeholder="Sélectionner une catégorie professionnelle"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Classe légale</label>
              <gcc-select
                [options]="legalClassOptions()"
                [(value)]="form.legalClassId"
                placeholder="Sélectionner une classe légale"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Modèle de bulletin</label>
              <gcc-select
                [options]="newsletterTemplateOptions()"
                [(value)]="form.newsletterTemplateId"
                placeholder="Sélectionner un modèle de bulletin"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Mode de paiement</label>
              <gcc-select
                [options]="paymentMethodOptions()"
                [(value)]="form.paymentMethodId"
                placeholder="Sélectionner un mode de paiement"
              />
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
export class CareerAppointmentFormComponent {
  @Input() form!: CareerPlanForm;
  establishmentOptions = input<GccSelectOption[]>([]);
  departmentOptions = input<GccSelectOption[]>([]);
  positionOptions = input<GccSelectOption[]>([]);
  employeeTypeOptions = input<GccSelectOption[]>([]);
  indicationOptions = input<GccSelectOption[]>([]);
  professionalCategoryOptions = input<GccSelectOption[]>([]);
  legalClassOptions = input<GccSelectOption[]>([]);
  newsletterTemplateOptions = input<GccSelectOption[]>([]);
  paymentMethodOptions = input<GccSelectOption[]>([]);
}
