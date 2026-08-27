import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { InterviewNotes, InterviewSkillGapItem } from './evaluation.models';
import { InterviewSkillGapsPanel } from './interview-skill-gaps.panel';

@Component({
  selector: 'app-interview-context-step',
  imports: [FormsModule, MatIconModule, InterviewSkillGapsPanel],
  template: `
    <div class="grid gap-5 lg:grid-cols-2">
      <div class="grid gap-5">
        <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div class="mb-4 flex items-start gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-accent">
              <mat-icon class="!h-5 !w-5 !text-[20px]">place</mat-icon>
            </div>
            <div>
              <h2 class="text-sm font-bold text-navy">Cadre de l’échange</h2>
              <p class="text-xs font-medium text-slate-500">Date, lieu et intention de l’entretien.</p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Date</span>
              <input
                class="gcc-input"
                type="date"
                [ngModel]="notes().general.date"
                (ngModelChange)="patchGeneral('date', $event)"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Lieu</span>
              <input
                class="gcc-input"
                type="text"
                placeholder="Salle, visio, site…"
                [ngModel]="notes().general.location"
                (ngModelChange)="patchGeneral('location', $event)"
              />
            </label>
          </div>

          <label class="mt-4 block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Contexte</span>
            <textarea
              class="gcc-input min-h-28 leading-relaxed"
              rows="4"
              placeholder="Pourquoi cet entretien a lieu maintenant, ce que vous souhaitez clarifier…"
              [ngModel]="notes().general.context"
              (ngModelChange)="patchGeneral('context', $event)"
            ></textarea>
          </label>
        </section>

        <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div class="mb-4 flex items-start gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
              <mat-icon class="!h-5 !w-5 !text-[20px]">notes</mat-icon>
            </div>
            <div>
              <h2 class="text-sm font-bold text-navy">Notes d’ouverture</h2>
              <p class="text-xs font-medium text-slate-500">Points à garder en tête pendant l’échange.</p>
            </div>
          </div>
          <textarea
            class="gcc-input min-h-48 leading-relaxed"
            rows="8"
            placeholder="Observations, rappels, éléments déjà partagés avec le salarié…"
            [ngModel]="notes().globalNotes"
            (ngModelChange)="patchNotes('globalNotes', $event)"
          ></textarea>
        </section>
      </div>

      <app-interview-skill-gaps-panel
        [gaps]="skillGaps()"
        [loading]="gapsLoading()"
        [error]="gapsError()"
      />
    </div>
  `,
})
export class InterviewContextStep {
  notes = model.required<InterviewNotes>();
  skillGaps = input<InterviewSkillGapItem[]>([]);
  gapsLoading = input(false);
  gapsError = input<string | null>(null);

  patchGeneral(field: 'date' | 'location' | 'context', value: string): void {
    this.notes.update((current) => ({
      ...current,
      general: { ...current.general, [field]: value },
    }));
  }

  patchNotes(field: 'globalNotes', value: string): void {
    this.notes.update((current) => ({ ...current, [field]: value }));
  }
}
