import { Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SafeResourceUrl } from '@angular/platform-browser';
import { InterviewNotes } from './evaluation.models';

@Component({
  selector: 'app-interview-summary-step',
  imports: [FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <div class="space-y-5">
        <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div class="mb-4 flex items-start gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-accent">
              <mat-icon class="!h-5 !w-5 !text-[20px]">school</mat-icon>
            </div>
            <div>
              <h2 class="text-sm font-bold text-navy">Plan de développement</h2>
              <p class="text-xs font-medium text-slate-500">Formations, aspirations et suites à donner.</p>
            </div>
          </div>

          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Besoins de formation</span>
            <textarea
              class="gcc-input min-h-24 leading-relaxed"
              rows="3"
              placeholder="Compétences à renforcer, formats souhaités…"
              [ngModel]="notes().developmentPlan.trainingNeeds"
              (ngModelChange)="patchPlan('trainingNeeds', $event)"
            ></textarea>
          </label>

          <label class="mt-4 block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Aspirations de carrière</span>
            <textarea
              class="gcc-input min-h-24 leading-relaxed"
              rows="3"
              placeholder="Évolution, mobilité, responsabilités visées…"
              [ngModel]="notes().developmentPlan.careerAspiration"
              (ngModelChange)="patchPlan('careerAspiration', $event)"
            ></textarea>
          </label>

          <label class="mt-4 block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Notes complémentaires</span>
            <textarea
              class="gcc-input min-h-24 leading-relaxed"
              rows="3"
              placeholder="Accords, points de vigilance, prochain rendez-vous…"
              [ngModel]="notes().developmentPlan.notes"
              (ngModelChange)="patchPlan('notes', $event)"
            ></textarea>
          </label>
        </section>

        <section class="rounded-2xl border border-slate-200/90 bg-slate-50 p-5">
          <h3 class="text-sm font-bold text-navy">Récapitulatif</h3>
          <dl class="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lieu</dt>
              <dd class="mt-0.5 text-sm font-semibold text-navy">{{ notes().general.location || 'Non renseigné' }}</dd>
            </div>
            <div>
              <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Objectifs</dt>
              <dd class="mt-0.5 text-sm font-semibold text-navy">{{ objectiveCount() }} défini{{ objectiveCount() > 1 ? 's' : '' }}</dd>
            </div>
          </dl>
          @if (notes().general.context) {
            <p class="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
              {{ notes().general.context }}
            </p>
          }
        </section>
      </div>

      <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div class="mb-4 flex items-start gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
            <mat-icon class="!h-5 !w-5 !text-[20px]">picture_as_pdf</mat-icon>
          </div>
          <div>
            <h2 class="text-sm font-bold text-navy">Document de séance</h2>
            <p class="text-xs font-medium text-slate-500">
              Support visuel local : il n’est pas archivé sur le serveur.
            </p>
          </div>
        </div>

        <label class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-accent">
          <mat-icon class="mb-2 text-slate-400">upload_file</mat-icon>
          <span class="text-xs font-bold text-navy">Importer un PDF</span>
          <span class="mt-1 text-[11px] text-slate-500">Fiche d’évaluation, notes préparatoires…</span>
          <input class="sr-only" type="file" accept="application/pdf" (change)="onFile($event)" />
        </label>

        @if (fileName()) {
          <p class="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            <mat-icon class="!h-4 !w-4 !text-[16px]">check_circle</mat-icon>
            {{ fileName() }}
          </p>
        }

        @if (previewUrl()) {
          <div class="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <iframe class="h-72 w-full border-0" [src]="previewUrl()" title="Aperçu du document d’entretien"></iframe>
          </div>
          <button
            mat-stroked-button
            class="gcc-btn-secondary mt-3 w-full !rounded-xl"
            type="button"
            (click)="clearFile.emit()"
          >
            Retirer le document
          </button>
        }
      </section>
    </div>
  `,
})
export class InterviewSummaryStep {
  notes = model.required<InterviewNotes>();
  fileName = input('');
  previewUrl = input<SafeResourceUrl | null>(null);
  fileSelected = output<File>();
  clearFile = output<void>();

  readonly objectiveCount = computed(
    () => this.notes().objectives.filter((item) => item.description.trim()).length,
  );

  patchPlan(field: 'trainingNeeds' | 'careerAspiration' | 'notes', value: string): void {
    this.notes.update((current) => ({
      ...current,
      developmentPlan: { ...current.developmentPlan, [field]: value },
    }));
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.fileSelected.emit(file);
    input.value = '';
  }
}
