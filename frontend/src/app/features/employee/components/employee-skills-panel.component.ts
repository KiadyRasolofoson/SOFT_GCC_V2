import { Component, input } from '@angular/core';
import { EmployeeSkillGapItem } from '../../../core/employee-fiche.models';
import { GccEmptyState } from '../../../ui/gcc-empty-state';
import { GccSkillGap } from '../../../ui/gcc-skill-gap';

@Component({
  selector: 'app-employee-skills-panel',
  imports: [GccSkillGap, GccEmptyState],
  template: `
    <section class="space-y-4">
      @if (skillGaps().length) {
        @for (item of skillGaps(); track item.label) {
          <gcc-skill-gap [skill]="item.label" [required]="item.required" [acquired]="item.acquired" />
        }
      } @else {
        <gcc-empty-state
          title="Aucune compétence renseignée"
          message="Le référentiel de compétences n’est pas encore disponible pour ce profil."
        />
      }
    </section>
  `,
})
export class EmployeeSkillsPanelComponent {
  readonly skillGaps = input<EmployeeSkillGapItem[]>([]);
}
