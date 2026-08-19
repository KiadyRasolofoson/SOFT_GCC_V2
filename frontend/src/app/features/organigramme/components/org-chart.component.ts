import { Component, input } from '@angular/core';
import { OrgNode } from '../../../core/org-chart.service';
import { GccEmptyState } from '../../../ui/gcc-empty-state';
import { trackByOrgNode as trackNode } from '../org-chart.util';
import { OrgNodeComponent } from './org-node.component';

@Component({
  selector: 'app-org-chart',
  imports: [GccEmptyState, OrgNodeComponent],
  host: { class: 'block' },
  template: `
    @if (nodes().length > 0) {
      <div
        class="flex min-w-full transition-transform duration-200"
        [style.transform]="'scale(' + scale() + ')'"
        [style.transform-origin]="'top center'"
      >
        <!-- mx-auto centre la forêt quand elle tient, sinon s'aligne à gauche
             pour que le débordement reste scrollable (pas de clipping centré) -->
        <div class="mx-auto flex items-start gap-10">
          @for (root of nodes(); track trackByOrgNode(root)) {
            <app-org-node [node]="root" [isRoot]="true" [depth]="0" />
          }
        </div>
      </div>
    } @else {
      <gcc-empty-state
        title="Aucune donnée d'organigramme"
        message="Aucune branche n'est disponible pour l'affichage."
      />
    }
  `,
})
export class OrgChartComponent {
  nodes = input<OrgNode[]>([]);
  scale = input(1);

  trackByOrgNode(node: OrgNode): string {
    return trackNode(node);
  }
}
