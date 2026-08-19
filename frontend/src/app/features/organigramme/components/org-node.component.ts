import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { OrgChartService, OrgNode } from '../../../core/org-chart.service';

@Component({
  selector: 'app-org-node',
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col items-center">
      <div
        class="relative w-52 rounded-xl border p-3 text-center shadow-sm transition-shadow hover:shadow-md"
        [class]="
          isRoot()
            ? 'border-indigo-200/40 bg-gradient-to-b from-navy to-indigo-950 text-white'
            : 'border-slate-200 bg-white'
        "
        (mouseenter)="showDetails.set(true)"
        (mouseleave)="showDetails.set(false)"
      >
        @if (showDetails()) {
          <div
            class="absolute -top-2 left-1/2 z-10 w-48 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 shadow-lg"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-slate-500">Civilité :</span>
              <span class="font-medium text-navy">{{ node().civilite || '—' }}</span>
            </div>
            <div class="mt-1 flex items-center justify-between gap-2">
              <span class="font-semibold text-slate-500">Département :</span>
              <span class="text-right font-medium text-navy">{{ node().department || '—' }}</span>
            </div>
            <div class="mt-1 flex items-center justify-between gap-2">
              <span class="font-semibold text-slate-500">Poste :</span>
              <span class="text-right font-medium text-navy">{{ node().position || '—' }}</span>
            </div>
          </div>
        }

        <div class="flex justify-center">
          @if (node().hasPhoto && node().employeeId) {
            <img
              [src]="photoUrl()"
              alt=""
              class="h-12 w-12 rounded-full border-2 border-white/60 object-cover shadow-sm"
              loading="lazy"
            />
          } @else {
            <span
              class="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
              [class]="isRoot() ? 'bg-white/15 text-white' : 'bg-gradient-to-br from-indigo-100 to-slate-200 text-navy'"
            >
              {{ initials() }}
            </span>
          }
        </div>
        <p class="mt-2 truncate text-sm font-semibold" [class]="isRoot() ? 'text-white' : 'text-navy'">
          {{ fullName() }}
        </p>
        <p class="truncate text-xs" [class]="isRoot() ? 'text-indigo-200' : 'text-slate-500'">
          {{ node().position || 'Poste non défini' }}
        </p>
        <p class="truncate text-xs" [class]="isRoot() ? 'text-indigo-300/80' : 'text-slate-400'">
          {{ node().department || 'Non assigné' }}
        </p>

        @if (children().length > 0) {
          <button
            type="button"
            class="mt-3 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition"
            [class]="isRoot() ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            (click)="toggle()"
            [attr.aria-expanded]="expanded()"
          >
            <mat-icon class="!h-4 !w-4 !text-[16px]">{{ expanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ expanded() ? 'Réduire' : children().length + ' N+1' }}
          </button>
        }
      </div>

      @if (children().length > 0 && expanded()) {
        <div class="relative mt-2 flex items-start justify-center gap-5 border-t border-slate-200 pt-4">
          @for (child of children(); track trackByNode(child)) {
            <div class="flex flex-col items-center">
              <div class="h-3 w-px bg-slate-300"></div>
              <app-org-node [node]="child" [depth]="depth() + 1" />
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class OrgNodeComponent implements OnInit {
  private readonly service = inject(OrgChartService);

  node = input.required<OrgNode>();
  depth = input(0);
  isRoot = input(false);

  readonly expanded = signal(true);
  readonly showDetails = signal(false);

  readonly children = computed(() => this.node().children || []);

  readonly fullName = computed(
    () => `${this.node().firstName || ''} ${this.node().name || ''}`.trim() || 'Collaborateur',
  );

  readonly initials = computed(() => {
    const a = (this.node().name || '').trim().charAt(0);
    const b = (this.node().firstName || '').trim().charAt(0);
    return `${a}${b}`.toUpperCase() || '?';
  });

  ngOnInit(): void {
    this.expanded.set(this.depth() < 2);
  }

  toggle(): void {
    this.expanded.update((value) => !value);
  }

  trackByNode(child: OrgNode): string {
    return child.employeeId != null ? String(child.employeeId) : child.department || 'node';
  }

  photoUrl(): string {
    return this.service.photoUrl(this.node().employeeId);
  }
}
