import { A11yModule } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { Component, computed, input, model, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GccSelectOption } from './gcc.types';

@Component({
  selector: 'gcc-searchable-select',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, A11yModule, FormsModule, MatIconModule],
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
      @if (value()) {
        <span
          class="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
          (click)="clear($event)"
          [attr.aria-label]="'Effacer la sélection'"
        >
          <mat-icon class="!h-4 !w-4 !text-[16px]">close</mat-icon>
        </span>
      }
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
      <div class="gcc-select-panel">
        <div class="flex items-center gap-2 border-b border-slate-100 px-2 pb-2">
          <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400">search</mat-icon>
          <input
            cdkFocusInitial
            class="w-full border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            placeholder="Rechercher…"
            [(ngModel)]="search"
            (keydown.enter)="$event.preventDefault()"
          />
        </div>
        <ul class="max-h-56 overflow-y-auto pt-1" role="listbox">
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
            <li class="px-3 py-4 text-center text-sm text-slate-400">Aucun résultat</li>
          }
        </ul>
      </div>
    </ng-template>
  `,
})
export class GccSearchableSelect {
  options = input.required<GccSelectOption[]>();
  value = model<string | null>(null);
  placeholder = input('Rechercher…');

  readonly search = signal('');
  readonly open = signal(false);
  readonly panelWidth = signal(0);
  readonly origin = viewChild.required(CdkOverlayOrigin);

  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];

  readonly filteredOptions = computed(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) return this.options();
    return this.options().filter((opt) => opt.label.toLowerCase().includes(query));
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
    this.panelWidth.set(el.getBoundingClientRect().width);
    this.open.set(true);
  }

  close() {
    this.open.set(false);
    this.search.set('');
  }

  clear(event: Event) {
    event.stopPropagation();
    this.value.set(null);
  }

  choose(next: string) {
    this.value.set(next);
    this.close();
  }
}
