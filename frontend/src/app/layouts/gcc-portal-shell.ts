import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterOutlet } from '@angular/router';
import { EvaluationPortalSession } from '../features/evaluation-portal/evaluation-portal-session';

@Component({
  selector: 'gcc-portal-shell',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, RouterOutlet],
  host: { class: 'block min-h-screen' },
  template: `
    <div class="flex min-h-screen flex-col overflow-x-clip bg-canvas font-sans">
      <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div class="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          <img
            src="assets/logo/logo.png"
            alt="SoftTalent"
            class="h-8 w-auto shrink-0 object-contain sm:h-10"
          />
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-bold uppercase tracking-widest text-accent">Portail salarié</p>
            <p class="truncate text-sm font-semibold text-navy">{{ session.campaignTitle() }}</p>
          </div>
          @if (session.progress().total > 0) {
            <div class="hidden w-40 shrink-0 sm:block">
              <p class="mb-1 text-right text-[11px] font-medium tabular text-slate-500">
                {{ session.progress().answered }} / {{ session.progress().total }}
              </p>
              <mat-progress-bar mode="determinate" [value]="progressPercent()" />
            </div>
          }
          @if (session.hasValidSession()) {
            <button
              mat-stroked-button
              class="gcc-btn-secondary !min-h-10 !rounded-xl !px-2.5 !text-xs !font-semibold sm:!px-3"
              type="button"
              (click)="quit()"
              title="Quitter le questionnaire"
            >
              <mat-icon class="!mr-0 !h-4 !w-4 !text-[18px] sm:!mr-1.5">logout</mat-icon>
              <span class="hidden sm:inline">Quitter</span>
            </button>
          }
        </div>
        @if (session.progress().total > 0) {
          <div class="sm:hidden">
            <div class="flex items-center justify-between px-4 pb-1.5">
              <span class="text-[11px] font-medium text-slate-500">Progression</span>
              <span class="text-[11px] font-semibold tabular text-navy">
                {{ session.progress().answered }} / {{ session.progress().total }}
              </span>
            </div>
            <mat-progress-bar mode="determinate" [value]="progressPercent()" />
          </div>
        }
      </header>

      <main
        class="mx-auto flex w-full max-w-3xl min-w-0 flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 lg:py-10"
      >
        <router-outlet />
      </main>
    </div>
  `,
})
export class GccPortalShell {
  readonly session = inject(EvaluationPortalSession);
  private readonly router = inject(Router);

  readonly progressPercent = computed(() => {
    const { answered, total } = this.session.progress();
    if (total <= 0) return 0;
    return Math.min(100, Math.round((answered / total) * 100));
  });

  quit(): void {
    this.session.clear();
    void this.router.navigateByUrl('/soft-gcc/evaluation/connexion');
  }
}
