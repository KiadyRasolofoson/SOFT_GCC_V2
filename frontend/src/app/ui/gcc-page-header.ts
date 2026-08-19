import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GccCrumb } from './gcc.types';

@Component({
  selector: 'gcc-page-header',
  imports: [MatButtonModule, MatIconModule],
  host: { class: 'block' },
  template: `
    <header class="mb-6">
      @if (crumbs().length) {
        <nav class="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-medium" aria-label="Fil d’Ariane">
          <div class="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
            <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">home</mat-icon>
            <span>SoftTalent</span>
          </div>
          @for (crumb of crumbs(); track $index; let last = $last) {
            <span class="select-none text-slate-300">/</span>
            <span [class]="last ? 'font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]' : 'text-slate-500 hover:text-slate-700'">
              {{ crumb.label }}
            </span>
          }
        </nav>
      }

      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          class="flex min-w-0 gap-3.5"
          [class.items-center]="!subtitle()"
          [class.items-start]="!!subtitle()"
        >
          @if (icon()) {
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-navy to-indigo-950 text-white shadow-md shadow-slate-900/10 ring-1 ring-white/10"
              [class.mt-0.5]="!!subtitle()"
            >
              <mat-icon class="!text-[24px]">{{ icon() }}</mat-icon>
            </div>
          }
          <div class="min-w-0">
            <h1 class="text-2xl font-bold leading-tight tracking-tight text-navy sm:text-[1.75rem]">
              {{ title() }}
            </h1>
            @if (subtitle()) {
              <p class="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 font-normal">{{ subtitle() }}</p>
            }
          </div>
        </div>

        @if (hasActions()) {
          <div class="flex shrink-0 flex-wrap items-center gap-2.5">
            @if (secondaryLabel()) {
              <button
                mat-stroked-button
                class="gcc-btn-secondary !rounded-xl !px-4"
                type="button"
                (click)="secondaryAction.emit()"
              >
                <mat-icon class="!mr-1.5">{{ secondaryIcon() }}</mat-icon>
                {{ secondaryLabel() }}
              </button>
            }
            @if (actionLabel()) {
              <button mat-flat-button class="gcc-btn-primary !rounded-xl !px-4 !shadow-sm hover:!shadow-md transition-shadow" type="button">
                <mat-icon class="!mr-1.5">{{ actionIcon() }}</mat-icon>
                {{ actionLabel() }}
              </button>
            }
          </div>
        }
      </div>

      <div class="mt-5 h-px bg-gradient-to-r from-slate-200 via-indigo-100 to-transparent"></div>
    </header>
  `,
})
export class GccPageHeader {
  title = input.required<string>();
  subtitle = input('');
  icon = input('');
  crumbs = input<GccCrumb[]>([]);
  actionLabel = input('');
  actionIcon = input('add');
  secondaryLabel = input('');
  secondaryIcon = input('download');
  action = output<void>();
  secondaryAction = output<void>();

  readonly hasActions = computed(() => Boolean(this.actionLabel() || this.secondaryLabel()));
}
