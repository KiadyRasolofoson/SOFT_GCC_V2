import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccSkillGap } from '../../ui/gcc-skill-gap';
import { InterviewSkillGapItem } from './evaluation.models';

@Component({
  selector: 'app-interview-skill-gaps-panel',
  imports: [MatIconModule, MatProgressSpinnerModule, GccEmptyState, GccSkillGap],
  host: { class: 'block' },
  template: `
    <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
      <div class="mb-4 flex items-start gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700"
        >
          <mat-icon class="!h-5 !w-5 !text-[20px]">psychology</mat-icon>
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-bold text-navy">Compétences à discuter</h2>
          <p class="text-xs font-medium text-slate-500">
            Écarts poste · maîtrise 1–4 · critiques en premier.
          </p>
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center gap-2 py-10 text-xs font-semibold text-slate-400">
          <mat-spinner diameter="22" />
          Chargement des écarts…
        </div>
      } @else if (error()) {
        <p class="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-800">
          {{ error() }}
        </p>
      } @else if (discussionItems().length === 0 && okItems().length === 0) {
        <gcc-empty-state
          title="Aucun écart de poste à discuter"
          message="Pas de matrice poste ou aucune compétence à comparer. Vous pouvez poursuivre le compte-rendu."
        />
      } @else {
        <div class="space-y-3">
          @for (item of discussionItems(); track item.label + item.domainName) {
            <gcc-skill-gap
              [skill]="item.label"
              [required]="item.required"
              [acquired]="item.acquired"
              [missing]="item.missing"
              [critical]="item.critical"
            />
          }

          @if (okItems().length > 0) {
            <details class="rounded-xl border border-slate-100 bg-slate-50/80 open:bg-white" [open]="false">
              <summary
                class="cursor-pointer list-none px-3 py-2.5 text-xs font-bold text-slate-600 marker:content-none [&::-webkit-details-marker]:hidden"
              >
                <span class="inline-flex items-center gap-1.5">
                  <mat-icon class="!h-4 !w-4 !text-[16px] text-emerald-600">check_circle</mat-icon>
                  Maîtrise atteinte ({{ okItems().length }})
                </span>
              </summary>
              <div class="space-y-3 border-t border-slate-100 p-3">
                @for (item of okItems(); track item.label + item.domainName) {
                  <gcc-skill-gap
                    [skill]="item.label"
                    [required]="item.required"
                    [acquired]="item.acquired"
                    [missing]="item.missing"
                    [critical]="item.critical"
                  />
                }
              </div>
            </details>
          }
        </div>
      }
    </section>
  `,
})
export class InterviewSkillGapsPanel {
  readonly gaps = input<InterviewSkillGapItem[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly discussionItems = computed(() =>
    this.gaps().filter((item) => item.status === 'gap' || item.status === 'missing'),
  );
  readonly okItems = computed(() => this.gaps().filter((item) => item.status === 'ok'));
}
