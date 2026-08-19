import { Component, computed, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import {
  emptyInterviewObjective,
  InterviewNotes,
  InterviewObjective,
  OBJECTIVE_STATUS_OPTIONS,
  syncObjectiveProgress,
} from './evaluation.models';

@Component({
  selector: 'app-interview-objectives-step',
  imports: [FormsModule, MatButtonModule, MatIconModule, GccSelect],
  template: `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-sm font-bold text-navy">Objectifs de la prochaine période</h2>
        <p class="text-xs font-medium text-slate-500">
          {{ filledCount() }} objectif{{ filledCount() > 1 ? 's' : '' }} renseigné{{ filledCount() > 1 ? 's' : '' }}.
        </p>
      </div>
      <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="add()">
        <mat-icon class="!mr-1.5">add</mat-icon>
        Ajouter un objectif
      </button>
    </div>

    <div class="space-y-4">
      @for (objective of notes().objectives; track $index; let i = $index) {
        <article class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div class="mb-4 flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-navy text-xs font-extrabold text-white">
                {{ i + 1 }}
              </span>
              <div>
                <h3 class="text-sm font-bold text-navy">Objectif {{ i + 1 }}</h3>
                <p class="text-xs text-slate-500">Description, échéance et indicateur de réussite</p>
              </div>
            </div>
            <button
              type="button"
              class="text-slate-400 hover:text-red-600"
              [disabled]="notes().objectives.length === 1"
              (click)="remove(i)"
              aria-label="Supprimer l’objectif"
            >
              <mat-icon class="!h-5 !w-5 !text-[20px]">delete</mat-icon>
            </button>
          </div>

          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</span>
            <textarea
              class="gcc-input min-h-20 leading-relaxed"
              rows="2"
              placeholder="Ce qui doit être atteint, dans quel périmètre…"
              [ngModel]="objective.description"
              (ngModelChange)="patch(i, 'description', $event)"
            ></textarea>
          </label>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Échéance</span>
              <input
                class="gcc-input"
                type="date"
                [ngModel]="objective.dueDate"
                (ngModelChange)="patch(i, 'dueDate', $event)"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Indicateur</span>
              <input
                class="gcc-input"
                type="text"
                placeholder="Comment mesurer la réussite ?"
                [ngModel]="objective.indicator"
                (ngModelChange)="patch(i, 'indicator', $event)"
              />
            </label>
          </div>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Statut</span>
              <gcc-select
                [options]="statusOptions"
                [value]="objective.status"
                (valueChange)="patch(i, 'status', $event ?? 'Non commencé')"
                placeholder="Statut"
              />
            </label>
            <div>
              <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Réalisation · {{ objective.completionRate }} %
              </span>
              <input
                class="w-full accent-indigo-600"
                type="range"
                min="0"
                max="100"
                step="5"
                [ngModel]="objective.completionRate"
                (ngModelChange)="patchRate(i, $event)"
              />
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-accent transition-all" [style.width.%]="objective.completionRate"></div>
              </div>
            </div>
          </div>
        </article>
      }
    </div>
  `,
})
export class InterviewObjectivesStep {
  notes = model.required<InterviewNotes>();

  readonly statusOptions: GccSelectOption[] = OBJECTIVE_STATUS_OPTIONS.map((item) => ({ ...item }));

  readonly filledCount = computed(
    () => this.notes().objectives.filter((item) => item.description.trim()).length,
  );

  add(): void {
    this.notes.update((current) => ({
      ...current,
      objectives: [...current.objectives, emptyInterviewObjective()],
    }));
  }

  remove(index: number): void {
    this.notes.update((current) => ({
      ...current,
      objectives: current.objectives.filter((_, i) => i !== index),
    }));
  }

  patch(index: number, field: keyof InterviewObjective, value: string): void {
    this.notes.update((current) => {
      const objectives = current.objectives.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [field]: value, lastModified: new Date().toISOString() };
        return field === 'status' ? syncObjectiveProgress(next, 'status') : next;
      });
      return { ...current, objectives };
    });
  }

  patchRate(index: number, value: number): void {
    this.notes.update((current) => {
      const objectives = current.objectives.map((item, i) => {
        if (i !== index) return item;
        return syncObjectiveProgress({ ...item, completionRate: Number(value) }, 'completionRate');
      });
      return { ...current, objectives };
    });
  }
}
