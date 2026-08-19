import { Component, computed, input, model, signal, viewChild } from '@angular/core';
import { ConnectedPosition, CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { GccSelectOption } from './gcc.types';

@Component({
  selector: 'gcc-select',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, MatIconModule],
  host: { class: 'block' },
  template: `
    <button
      type="button"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      class="flex h-10 w-full items-center gap-2 rounded-xl border bg-white px-3 text-left text-sm text-navy transition"
      [class]="open() ? 'border-accent shadow-[0_0_0_3px_rgb(99_102_241_/_0.15)]' : 'border-slate-200 hover:border-slate-300'"
      (click)="toggle()"
    >
      <span class="min-w-0 flex-1 truncate">{{ selectedLabel() }}</span>
      <mat-icon class="shrink-0 !h-5 !w-5 !text-[20px] text-slate-400 transition-transform" [class.rotate-180]="open()">
        expand_more
      </mat-icon>
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayWidth]="panelWidth()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="close()"
    >
      <div class="gcc-select-panel" [class.gcc-select-panel--search]="showSearch()">
        @if (showSearch()) {
          <label class="gcc-select-search" (click)="$event.stopPropagation()" (mousedown)="$event.stopPropagation()">
            <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400">search</mat-icon>
            <input
              #searchInput
              class="min-w-0 flex-1 border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
              type="search"
              autocomplete="off"
              [placeholder]="searchPlaceholder()"
              [value]="query()"
              (input)="onQuery($event)"
              (keydown)="$event.stopPropagation()"
              (keydown.escape)="close(); $event.preventDefault()"
            />
          </label>
        }

        <ul class="gcc-select-options" role="listbox">
          @for (opt of filteredOptions(); track opt.value) {
            <li>
              <button
                type="button"
                role="option"
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition"
                [class]="opt.value === value() ? 'bg-indigo-50 font-medium text-navy' : 'text-slate-600 hover:bg-slate-50'"
                (click)="choose(opt.value)"
              >
                <span class="min-w-0 flex-1 truncate">{{ opt.label }}</span>
                @if (opt.value === value()) {
                  <mat-icon class="shrink-0 !h-4 !w-4 !text-[16px] text-accent">check</mat-icon>
                }
              </button>
            </li>
          } @empty {
            <li class="px-3 py-4 text-center text-xs font-medium text-slate-400">Aucun résultat</li>
          }
        </ul>
      </div>
    </ng-template>
  `,
})
export class GccSelect {
  options = input.required<GccSelectOption[]>();
  value = model<string | null>(null);
  placeholder = input('Sélectionner');
  searchable = input<boolean | 'auto'>('auto');
  searchPlaceholder = input('Rechercher…');

  readonly open = signal(false);
  readonly query = signal('');
  readonly panelWidth = signal(0);
  readonly origin = viewChild.required(CdkOverlayOrigin);
  readonly overlay = viewChild(CdkConnectedOverlay);

  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];

  readonly showSearch = computed(() => {
    const mode = this.searchable();
    if (mode === true) return true;
    if (mode === false) return false;
    return this.options().length >= 8;
  });

  readonly filteredOptions = computed(() => {
    const needle = this.normalize(this.query());
    const rows = this.options();
    if (!needle) return rows;
    return rows.filter((opt) => this.normalize(opt.label).includes(needle));
  });

  readonly selectedLabel = computed(() => {
    const current = this.options().find((opt) => opt.value === this.value());
    return current?.label ?? this.placeholder();
  });

  toggle() {
    if (this.open()) {
      this.close();
      return;
    }
    const el = this.origin().elementRef.nativeElement as HTMLElement;
    this.panelWidth.set(Math.max(el.getBoundingClientRect().width, 220));
    this.query.set('');
    this.open.set(true);
    this.focusSearch();
  }

  close() {
    this.open.set(false);
    this.query.set('');
  }

  choose(next: string) {
    this.value.set(next);
    this.close();
  }

  onQuery(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  private focusSearch(): void {
    if (!this.showSearch()) return;
    setTimeout(() => {
      const root = this.overlay()?.overlayRef?.overlayElement;
      root?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    });
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .trim();
  }
}
