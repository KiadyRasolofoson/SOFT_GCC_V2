import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CareerPlanForm } from '../../../core/career-plan-create.models';

@Component({
  selector: 'app-career-layoff-form',
  imports: [FormsModule, MatIconModule],
  template: `
    <section>
      <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
          <mat-icon class="!text-[22px] text-amber-700">event_busy</mat-icon>
          <h2 class="text-base font-semibold text-amber-700">Mise en disponibilité</h2>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">Motif</label>
            <input type="text" class="gcc-input" [(ngModel)]="form.reason" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">Institution d'affectation</label>
            <input type="text" class="gcc-input" [(ngModel)]="form.assigningInstitution" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">Date début</label>
            <input type="date" class="gcc-input" [(ngModel)]="form.startDate" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">Date fin</label>
            <input type="date" class="gcc-input" [(ngModel)]="form.endDate" />
          </div>
        </div>
      </article>
    </section>
  `,
})
export class CareerLayoffFormComponent {
  @Input() form!: CareerPlanForm;
}
