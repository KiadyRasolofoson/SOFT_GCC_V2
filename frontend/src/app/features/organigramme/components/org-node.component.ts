import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { OrgChartService, OrgNode } from '../../../core/org-chart.service';

@Component({
  selector: 'app-org-node',
  imports: [MatIconModule],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center">
      <div
        class="relative w-[200px] rounded-xl border p-4 text-center shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
        [class]="cardClass()"
        (mouseenter)="showDetails.set(true)"
        (mouseleave)="showDetails.set(false)"
      >
        <div class="mb-2.5 flex justify-center">
          @if (node().hasPhoto && node().employeeId) {
            <img
              [src]="photoUrl()"
              alt=""
              class="h-[3.25rem] w-[3.25rem] rounded-full border-2 object-cover shadow-sm"
              [class]="isRoot() ? 'border-white/40' : 'border-white ring-1 ring-slate-200'"
              loading="lazy"
            />
          } @else {
            <span
              class="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full text-sm font-extrabold"
              [class]="avatarWrapClass()"
            >
              {{ initials() }}
            </span>
          }
        </div>
        <p class="truncate text-[0.92rem] font-extrabold leading-snug" [class]="nameClass()">
          {{ fullName() }}
        </p>
        <p class="mt-1 truncate text-xs font-semibold leading-snug" [class]="positionClass()">
          {{ node().position || 'Poste non défini' }}
        </p>
        <p class="mt-0.5 truncate text-[11px]" [class]="deptClass()">
          {{ node().department || 'Non assigné' }}
        </p>

        @if (showDetails()) {
          <div class="mt-2 grid gap-1 border-t border-dashed pt-2 text-left text-[11px]" [class]="detailsClass()">
            <div class="flex items-center justify-between gap-2">
              <strong class="font-bold" [class]="detailsStrongClass()">Civilité :</strong>
              <span>{{ node().civilite || '—' }}</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <strong class="font-bold" [class]="detailsStrongClass()">Département :</strong>
              <span>{{ node().department || '—' }}</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <strong class="font-bold" [class]="detailsStrongClass()">Poste :</strong>
              <span>{{ node().position || '—' }}</span>
            </div>
          </div>
        }

        @if (children().length > 0) {
          <button
            type="button"
            class="mt-2.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition"
            [class]="toggleClass()"
            (click)="toggle()"
            [attr.aria-expanded]="expanded()"
          >
            <mat-icon class="!h-4 !w-4 !text-[16px]">{{ expanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ expanded() ? 'Réduire' : children().length + ' N+1' }}
          </button>
        }
      </div>

      @if (children().length > 0 && expanded()) {
        <div class="relative flex items-start justify-center gap-5">
          <div class="absolute top-0 left-1/2 h-4 w-0.5 -translate-x-1/2 bg-slate-300"></div>
          <div class="absolute top-4 left-0 right-0 h-0.5 bg-slate-300"></div>
          @for (child of children(); track trackByNode(child)) {
            <div class="relative flex flex-col items-center">
              <div class="absolute top-4 left-1/2 h-4 w-0.5 -translate-x-1/2 bg-slate-300"></div>
              <div class="h-8"></div>
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

  cardClass(): string {
    return this.isRoot() ? 'border-navy/30 bg-navy text-white' : 'border-slate-200 bg-white';
  }

  avatarWrapClass(): string {
    return this.isRoot() ? 'bg-white/15 text-white' : 'bg-indigo-50 text-accent ring-1 ring-slate-200';
  }

  nameClass(): string {
    return this.isRoot() ? 'text-white' : 'text-navy';
  }

  positionClass(): string {
    return this.isRoot() ? 'text-indigo-200' : 'text-accent';
  }

  deptClass(): string {
    return this.isRoot() ? 'text-indigo-300/80' : 'text-slate-500';
  }

  detailsClass(): string {
    return this.isRoot() ? 'border-white/15 text-indigo-100' : 'border-slate-200 text-slate-500';
  }

  detailsStrongClass(): string {
    return this.isRoot() ? 'text-white' : 'text-slate-700';
  }

  toggleClass(): string {
    return this.isRoot()
      ? 'border-white/20 bg-white/10 text-indigo-100 hover:bg-white/20'
      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-accent/40 hover:bg-indigo-50 hover:text-accent';
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
