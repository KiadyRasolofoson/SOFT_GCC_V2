import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'gcc-filter-bar',
  imports: [FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-center">
      <label class="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
        <mat-icon class="shrink-0 !h-5 !w-5 !text-[20px] leading-none text-slate-400">search</mat-icon>
        <input
          class="min-w-0 flex-1 border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
          [placeholder]="placeholder()"
          [(ngModel)]="query"
          (keyup.enter)="apply.emit()"
        />
      </label>

      <ng-content />

      @if (showReset()) {
        <button
          mat-stroked-button
          class="gcc-btn-secondary h-10 shrink-0 !rounded-xl"
          type="button"
          (click)="reset.emit()"
        >
          <mat-icon>restart_alt</mat-icon>
          Réinitialiser
        </button>
      }

      <button mat-flat-button class="gcc-btn-primary h-10 shrink-0" type="button" (click)="apply.emit()">
        <mat-icon>filter_list</mat-icon>
        {{ applyLabel() }}
      </button>
    </div>
  `,
})
export class GccFilterBar {
  query = model('');
  placeholder = input('Rechercher un nom, un matricule…');
  applyLabel = input('Filtrer');
  showReset = input(true);

  apply = output<void>();
  reset = output<void>();
}
