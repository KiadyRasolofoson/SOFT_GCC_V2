import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'gcc-empty-state',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-14 text-center">
      <div
        class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
        [class]="iconWrap()"
      >
        <mat-icon [class]="iconClass()">{{ iconName() }}</mat-icon>
      </div>
      <h3 class="text-lg font-semibold text-navy">{{ title() }}</h3>
      <p class="mt-1 max-w-md text-sm text-slate-500">{{ message() }}</p>
      @if (actionLabel()) {
        <button mat-flat-button class="gcc-btn-primary mt-5" type="button" (click)="action.emit()">
          <mat-icon>{{ actionIcon() }}</mat-icon>
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class GccEmptyState {
  title = input('Aucun résultat');
  message = input('Ajustez les filtres ou créez une première entrée.');
  actionLabel = input('');
  actionIcon = input('add');
  variant = input<'empty' | 'error' | 'forbidden'>('empty');
  action = output<void>();

  iconName() {
    switch (this.variant()) {
      case 'error':
        return 'warning';
      case 'forbidden':
        return 'lock';
      default:
        return 'inbox';
    }
  }

  iconClass() {
    switch (this.variant()) {
      case 'error':
        return 'text-gap-fg';
      case 'forbidden':
        return 'text-slate-500';
      default:
        return 'text-accent';
    }
  }

  iconWrap() {
    switch (this.variant()) {
      case 'error':
        return 'bg-gap-bg';
      case 'forbidden':
        return 'bg-slate-100';
      default:
        return 'bg-indigo-50';
    }
  }
}
