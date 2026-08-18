import { Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { GccSkillBadge, SkillLevel } from './gcc-skill-badge';
import { GccStatusTag } from './gcc-status-tag';

@Component({
  selector: 'gcc-skill-gap',
  imports: [MatProgressBarModule, GccSkillBadge, GccStatusTag],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <div class="min-w-0 flex-1">
        <p class="font-medium text-navy">{{ skill() }}</p>
        <p class="text-xs text-slate-500">Requis {{ requiredLabel() }} · Acquis {{ acquiredLabel() }}</p>
        <mat-progress-bar class="mt-2" mode="determinate" [value]="percent()" />
      </div>
      <div class="flex items-center gap-2">
        <gcc-skill-badge [level]="acquired()" />
        <gcc-status-tag [status]="gap() ? 'gap' : 'ok'" />
      </div>
    </div>
  `,
})
export class GccSkillGap {
  skill = input('Gestion de la paie');
  required = input<SkillLevel>('expert');
  acquired = input<SkillLevel>('intermediate');

  acquiredLabel() {
    return this.label(this.acquired());
  }
  requiredLabel() {
    return this.label(this.required());
  }
  percent() {
    const map = { beginner: 33, intermediate: 66, expert: 100 };
    return map[this.acquired()];
  }
  gap() {
    const rank = { beginner: 1, intermediate: 2, expert: 3 };
    return rank[this.acquired()] < rank[this.required()];
  }
  private label(level: SkillLevel) {
    return { beginner: 'Notions', intermediate: 'Autonome', expert: 'Expert' }[level];
  }
}
