import { Component, Input, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CareerPlanForm } from '../../../core/career-plan-create.models';
import { GccSelectOption } from '../../../ui/gcc.types';
import { GccSelect } from '../../../ui/gcc-select';

@Component({
  selector: 'app-career-advancement-form',
  imports: [FormsModule, MatIconModule, GccSelect],
  template: `
    <section>
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
                [(value)]="form.departmentId"
                placeholder="Sélectionner un département"
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
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">Échelon</label>
              <gcc-select
                [options]="echelonOptions()"
                [(value)]="form.echelonId"
                placeholder="Sélectionner un échelon"
              />
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
          </div>
        </article>
      </div>
    </section>
  `,
})
export class CareerAdvancementFormComponent {
  @Input() form!: CareerPlanForm;
  departmentOptions = input<GccSelectOption[]>([]);
  indicationOptions = input<GccSelectOption[]>([]);
  echelonOptions = input<GccSelectOption[]>([]);
  professionalCategoryOptions = input<GccSelectOption[]>([]);
  legalClassOptions = input<GccSelectOption[]>([]);
}
