import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { InterviewNotes, InterviewSkillGapItem } from './evaluation.models';
import { InterviewSkillGapsPanel } from './interview-skill-gaps.panel';

@Component({
  selector: 'app-interview-review-step',
  imports: [FormsModule, MatIconModule, InterviewSkillGapsPanel],
  template: `
    <div class="mb-5">
      <app-interview-skill-gaps-panel
        [gaps]="skillGaps()"
        [loading]="gapsLoading()"
        [error]="gapsError()"
      />
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div class="mb-3 flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
            <mat-icon class="!h-4 !w-4 !text-[18px]">emoji_events</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-navy">Réalisations notables</h3>
            <p class="text-xs text-slate-500">Succès concrets de la période écoulée</p>
          </div>
        </div>
        <textarea
          class="gcc-input min-h-32 leading-relaxed"
          rows="5"
          placeholder="Livrables, prises d’initiative, impact mesurable…"
          [ngModel]="notes().previousPeriod.achievements"
          (ngModelChange)="patch('achievements', $event)"
        ></textarea>
      </section>

      <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div class="mb-3 flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
            <mat-icon class="!h-4 !w-4 !text-[18px]">warning</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-navy">Défis rencontrés</h3>
            <p class="text-xs text-slate-500">Freins, tensions ou sujets à traiter</p>
          </div>
        </div>
        <textarea
          class="gcc-input min-h-32 leading-relaxed"
          rows="5"
          placeholder="Difficultés opérationnelles, besoins d’appui, sujets sensibles…"
          [ngModel]="notes().previousPeriod.challenges"
          (ngModelChange)="patch('challenges', $event)"
        ></textarea>
      </section>

      <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div class="mb-3 flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-accent">
            <mat-icon class="!h-4 !w-4 !text-[18px]">flag</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-navy">Objectifs précédents</h3>
            <p class="text-xs text-slate-500">Ce qui a été tenu, reporté ou abandonné</p>
          </div>
        </div>
        <textarea
          class="gcc-input min-h-32 leading-relaxed"
          rows="5"
          placeholder="Rappel des objectifs de la période et niveau d’atteinte…"
          [ngModel]="notes().previousPeriod.previousObjectivesAchieved"
          (ngModelChange)="patch('previousObjectivesAchieved', $event)"
        ></textarea>
      </section>

      <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div class="mb-3 flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
            <mat-icon class="!h-4 !w-4 !text-[18px]">forum</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-navy">Feedback des parties prenantes</h3>
            <p class="text-xs text-slate-500">Manager, équipe, clients internes</p>
          </div>
        </div>
        <textarea
          class="gcc-input min-h-32 leading-relaxed"
          rows="5"
          placeholder="Retours reçus, signaux faibles, reconnaissance…"
          [ngModel]="notes().previousPeriod.feedback"
          (ngModelChange)="patch('feedback', $event)"
        ></textarea>
      </section>
    </div>
  `,
})
export class InterviewReviewStep {
  notes = model.required<InterviewNotes>();
  skillGaps = input<InterviewSkillGapItem[]>([]);
  gapsLoading = input(false);
  gapsError = input<string | null>(null);

  patch(
    field: 'achievements' | 'challenges' | 'previousObjectivesAchieved' | 'feedback',
    value: string,
  ): void {
    this.notes.update((current) => ({
      ...current,
      previousPeriod: { ...current.previousPeriod, [field]: value },
    }));
  }
}
