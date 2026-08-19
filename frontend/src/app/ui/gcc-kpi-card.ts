import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'gcc-kpi-card',
  imports: [MatIconModule],
  host: { class: 'block h-full' },
  template: `
    <article
      class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-5"
    >
      <!-- Top subtle gradient line on hover -->
      <div
        class="absolute inset-x-0 top-0 h-1 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
        [class]="topBarClass()"
      ></div>

      <div class="flex min-h-0 flex-1 items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ label() }}</p>
          <p
            class="tabular mt-1.5 line-clamp-2 min-h-10 text-xl font-extrabold leading-tight tracking-tight text-navy sm:min-h-12 sm:text-2xl"
            [title]="value()"
          >
            {{ value() }}
          </p>
        </div>
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
          [class]="iconWrapClass()"
        >
          <mat-icon class="!h-5 !w-5 !text-[20px]">{{ iconName() }}</mat-icon>
        </div>
      </div>

      @if (hint()) {
        <div class="mt-auto flex min-h-8 items-center gap-1.5 pt-2.5 border-t border-slate-100 text-xs font-medium" [class]="hintClass()">
          @if (tone() === 'up') {
            <mat-icon class="!h-4 !w-4 !text-[16px]">trending_up</mat-icon>
          } @else if (tone() === 'down') {
            <mat-icon class="!h-4 !w-4 !text-[16px]">trending_down</mat-icon>
          } @else if (tone() === 'accent') {
            <mat-icon class="!h-4 !w-4 !text-[16px]">auto_awesome</mat-icon>
          } @else {
            <mat-icon class="!h-4 !w-4 !text-[16px]">info</mat-icon>
          }
          <span class="line-clamp-1">{{ hint() }}</span>
        </div>
      }
    </article>
  `,
})
export class GccKpiCard {
  label = input.required<string>();
  value = input.required<string>();
  hint = input('');
  tone = input<'neutral' | 'up' | 'down' | 'accent'>('neutral');
  icon = input<string>('');

  readonly iconName = computed(() => {
    if (this.icon()) return this.icon();
    switch (this.tone()) {
      case 'up':
        return 'group';
      case 'accent':
        return 'auto_awesome';
      case 'down':
        return 'insights';
      default:
        return 'analytics';
    }
  });

  iconWrapClass() {
    switch (this.tone()) {
      case 'up':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100/80';
      case 'accent':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-100/80';
      case 'down':
        return 'bg-amber-50 text-amber-600 border border-amber-100/80';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200/80';
    }
  }

  topBarClass() {
    switch (this.tone()) {
      case 'up':
        return 'bg-gradient-to-r from-emerald-400 to-teal-500';
      case 'accent':
        return 'bg-gradient-to-r from-accent to-indigo-500';
      case 'down':
        return 'bg-gradient-to-r from-amber-400 to-orange-500';
      default:
        return 'bg-gradient-to-r from-slate-400 to-slate-600';
    }
  }

  hintClass() {
    switch (this.tone()) {
      case 'up':
        return 'text-emerald-700';
      case 'down':
        return 'text-amber-700';
      case 'accent':
        return 'text-indigo-600';
      default:
        return 'text-slate-500';
    }
  }
}
