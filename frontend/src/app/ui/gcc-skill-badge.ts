import { Component, computed, input } from '@angular/core';

export type SkillLevel = 'beginner' | 'application' | 'intermediate' | 'expert';

const TOKENS: Record<SkillLevel, { label: string; bg: string; fg: string }> = {
  beginner: { label: 'Notions', bg: '#E0F2FE', fg: '#0369A1' },
  application: { label: 'Application', bg: '#FFEDD5', fg: '#C2410C' },
  intermediate: { label: 'Maîtrise', bg: '#D1FAE5', fg: '#047857' },
  expert: { label: 'Expert', bg: '#EDE9FE', fg: '#6D28D9' },
};

export function skillLevelFromRank(rank: number | null | undefined): SkillLevel {
  if (rank === 2) return 'application';
  if (rank === 3) return 'intermediate';
  if (rank === 4) return 'expert';
  return 'beginner';
}

export function skillRank(level: SkillLevel): number {
  return { beginner: 1, application: 2, intermediate: 3, expert: 4 }[level];
}

export function skillLevelLabel(level: SkillLevel): string {
  return TOKENS[level].label;
}

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

  readonly token = computed(() => TOKENS[this.level()] ?? TOKENS.intermediate);
}
