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
      <ul class="gcc-select-panel" role="listbox">
        @for (opt of options(); track opt.value) {
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
        }
      </ul>
    </ng-template>
  `,
})
export class GccSelect {
  options = input.required<GccSelectOption[]>();
  value = model<string | null>(null);
  placeholder = input('Sélectionner');

  readonly open = signal(false);
  readonly panelWidth = signal(0);
  readonly origin = viewChild.required(CdkOverlayOrigin);

  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];

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
  }

  choose(next: string) {
    this.value.set(next);
    this.close();
  }
}
