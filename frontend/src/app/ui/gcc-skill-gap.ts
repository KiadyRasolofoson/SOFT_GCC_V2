import { Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { GccSkillBadge, SkillLevel, skillLevelLabel, skillRank } from './gcc-skill-badge';
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
        @if (missing()) {
          <span
            class="inline-flex items-center rounded-full border border-dashed border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500"
          >
            Non renseigné
          </span>
        } @else {
          <gcc-skill-badge [level]="acquired()" />
        }
        <gcc-status-tag [status]="gap() ? 'gap' : 'ok'" />
      </div>
    </div>
  `,
})
export class GccSkillGap {
  skill = input('Gestion de la paie');
  required = input<SkillLevel>('expert');
  acquired = input<SkillLevel>('intermediate');
  missing = input(false);

  acquiredLabel() {
    return this.missing() ? 'Non renseigné' : skillLevelLabel(this.acquired());
  }
  requiredLabel() {
    return skillLevelLabel(this.required());
  }
  percent() {
    if (this.missing()) return 0;
    return skillRank(this.acquired()) * 25;
  }
  gap() {
    if (this.missing()) return true;
    return skillRank(this.acquired()) < skillRank(this.required());
  }
}
