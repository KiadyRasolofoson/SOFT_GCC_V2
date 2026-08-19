import { Component, computed, input } from '@angular/core';

export interface WishGraphSeriesPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-wish-evolution-graph',
  template: `
    <div class="w-full">
      @if (points().length === 0) {
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Aucune donnée pour l'année {{ year() }}.
        </div>
      } @else {
        <svg
          viewBox="0 0 800 320"
          class="w-full"
          role="img"
          [attr.aria-label]="'Demandes de souhaits par mois en ' + year()"
        >
          <!-- grille horizontale + étiquettes -->
          @for (line of yGrid(); track line.value) {
            <line
              [attr.x1]="pad.left"
              [attr.y1]="line.y"
              [attr.x2]="chartW - pad.right"
              [attr.y2]="line.y"
              stroke="#E2E8F0"
              stroke-width="1"
            />
            <text [attr.x]="pad.left - 10" [attr.y]="line.y + 4" text-anchor="end" font-size="11" fill="#94A3B8">
              {{ line.value }}
            </text>
          }

          <defs>
            <linearGradient id="wishGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6366F1" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#6366F1" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- aire remplie -->
          <path [attr.d]="areaPath()" fill="url(#wishGradient)" />

          <!-- ligne principale -->
          <path
            [attr.d]="linePath()"
            fill="none"
            stroke="#6366F1"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- points + valeurs + mois -->
          @for (p of renderedPoints(); track $index) {
            <g>
              <circle [attr.cx]="p.x" [attr.cy]="p.y" r="5" fill="#fff" stroke="#6366F1" stroke-width="2.5">
                <title>{{ p.label }} : {{ p.value }} demande(s)</title>
              </circle>
              <text [attr.x]="p.x" [attr.y]="p.y - 12" text-anchor="middle" font-size="12" font-weight="600" fill="#0F172A">
                {{ p.value }}
              </text>
              <text [attr.x]="p.x" [attr.y]="chartH - pad.bottom + 18" text-anchor="middle" font-size="12" fill="#64748B">
                {{ p.label }}
              </text>
            </g>
          }
        </svg>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class WishEvolutionGraphComponent {
  readonly points = input<WishGraphSeriesPoint[]>([]);
  readonly year = input<number>(new Date().getFullYear());

  readonly pad = { left: 44, right: 16, top: 20, bottom: 36 };
  readonly chartW = 800;
  readonly chartH = 320;

  readonly renderedPoints = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return [];

    const max = Math.max(1, ...pts.map((p) => p.value));
    const yMax = Math.max(5, Math.ceil(max / 5) * 5);
    const innerW = this.chartW - this.pad.left - this.pad.right;
    const innerH = this.chartH - this.pad.top - this.pad.bottom;
    const stepX = pts.length > 1 ? innerW / (pts.length - 1) : 0;

    return pts.map((p, i) => ({
      ...p,
      x: this.pad.left + i * stepX,
      y: this.pad.top + innerH - (p.value / yMax) * innerH,
      yMax,
    }));
  });

  readonly yGrid = computed(() => {
    const pts = this.renderedPoints();
    const yMax = pts.length ? pts[0].yMax : 5;
    const steps = 4;
    const innerH = this.chartH - this.pad.top - this.pad.bottom;

    return Array.from({ length: steps + 1 }, (_, i) => {
      const val = (yMax / steps) * i;
      return {
        value: Math.round(val),
        y: this.chartH - this.pad.bottom - (val / yMax) * innerH,
      };
    });
  });

  readonly linePath = computed(() => {
    const pts = this.renderedPoints();
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });

  readonly areaPath = computed(() => {
    const pts = this.renderedPoints();
    if (pts.length === 0) return '';
    const baseY = this.chartH - this.pad.bottom;
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${line} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;
  });
}
