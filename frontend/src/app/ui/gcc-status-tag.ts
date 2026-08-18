import { Component, computed, input } from '@angular/core';

export type StatusKind = 'pending' | 'validated' | 'refused' | 'gap' | 'ok' | 'processed';

@Component({
  selector: 'gcc-status-tag',
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      [style.background]="token().bg"
      [style.color]="token().fg"
    >
      <span class="h-1.5 w-1.5 rounded-full" [style.background]="token().fg"></span>
      {{ token().label }}
    </span>
  `,
})
export class GccStatusTag {
  status = input<StatusKind>('pending');

  readonly token = computed(() => {
    switch (this.status()) {
      case 'validated':
      case 'ok':
        return { label: this.status() === 'ok' ? 'Conforme' : 'Validé', bg: '#D1FAE5', fg: '#047857' };
      case 'gap':
        return { label: 'Écart', bg: '#FEF3C7', fg: '#B45309' };
      case 'refused':
        return { label: 'Refusé', bg: '#FEE2E2', fg: '#B91C1C' };
      case 'processed':
        return { label: 'Traité', bg: '#EDE9FE', fg: '#6D28D9' };
      default:
        return { label: 'En attente', bg: '#E0F2FE', fg: '#0369A1' };
    }
  });
}
