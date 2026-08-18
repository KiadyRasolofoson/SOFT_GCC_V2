import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GccSelect } from './gcc-select';

@Component({
  selector: 'gcc-filter-bar',
  imports: [FormsModule, MatButtonModule, MatIconModule, GccSelect],
  template: `
    <div class="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
      <label class="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
        <mat-icon class="shrink-0 !h-5 !w-5 !text-[20px] leading-none text-slate-400">search</mat-icon>
        <input
          class="min-w-0 flex-1 border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
          placeholder="Rechercher un nom, un matricule…"
          [(ngModel)]="query"
        />
      </label>

      <gcc-select class="w-full shrink-0 lg:w-52" [options]="departments" [(value)]="department" />
      <gcc-select class="w-full shrink-0 lg:w-44" [options]="statuses" [(value)]="status" />

      <button mat-flat-button class="gcc-btn-primary h-10 shrink-0" type="button">
        <mat-icon>filter_list</mat-icon>
        Filtrer
      </button>
    </div>
  `,
})
export class GccFilterBar {
  query = model('');
  department = model<string | null>('all');
  status = model<string | null>('all');

  readonly departments = [
    { label: 'Tous les départements', value: 'all' },
    { label: 'Ressources Humaines', value: 'rh' },
    { label: 'DSI', value: 'dsi' },
    { label: 'Finance', value: 'fin' },
  ];
  readonly statuses = [
    { label: 'Tous les statuts', value: 'all' },
    { label: 'Conforme', value: 'ok' },
    { label: 'Écart', value: 'gap' },
  ];
}
