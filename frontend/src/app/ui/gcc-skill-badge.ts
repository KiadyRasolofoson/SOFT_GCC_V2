import { Component, computed, input } from '@angular/core';

export type SkillLevel = 'beginner' | 'intermediate' | 'expert';

@Component({
  selector: 'gcc-skill-badge',
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      [style.background]="token().bg"
      [style.color]="token().fg"
    >
      {{ token().label }}
    </span>
  `,
})
export class GccSkillBadge {
  level = input<SkillLevel>('intermediate');

  readonly token = computed(() => {
    switch (this.level()) {
      case 'beginner':
        return { label: 'Notions', bg: '#E0F2FE', fg: '#0369A1' };
      case 'expert':
        return { label: 'Expert', bg: '#EDE9FE', fg: '#6D28D9' };
      default:
        return { label: 'Autonome', bg: '#D1FAE5', fg: '#047857' };
    }
  });
}
