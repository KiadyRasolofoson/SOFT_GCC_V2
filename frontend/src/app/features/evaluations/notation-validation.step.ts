import { Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GccSkillBadge, skillLevelFromRank } from '../../ui/gcc-skill-badge';
import {
  competenceMasteryRows,
  competencyScaleLabel,
  NotationValidation,
  SelectedQuestion,
  TrainingSuggestion,
} from './evaluation.models';

@Component({
  selector: 'app-notation-validation-step',
  imports: [FormsModule, MatButtonModule, MatIconModule, GccSkillBadge],
  template: `
    <div class="space-y-6">
      <div class="grid gap-4 lg:grid-cols-2">
        <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div class="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="text-base font-bold text-navy">Note de performance</h2>
              <p class="mt-0.5 text-xs font-medium text-slate-500">
                Moyenne des notes questions · échelle 1–5. Distincte des niveaux de maîtrise.
              </p>
            </div>
            <div class="rounded-2xl border border-indigo-100/80 bg-indigo-50 px-4 py-2 text-center min-w-28">
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Performance</p>
              <p class="tabular text-xl font-extrabold text-navy">
                {{ average() }} <span class="text-xs font-normal text-slate-400">/ 5</span>
              </p>
            </div>
          </div>

          <p class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Ventilation des notes questions</p>
          <div class="space-y-2.5">
            @for (bucket of distribution(); track bucket.score) {
              <div class="flex items-center gap-3">
                <div class="flex w-14 shrink-0 items-center gap-1">
                  <span class="text-xs font-extrabold tabular text-navy">{{ bucket.score }}</span>
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px] text-amber-400">star</mat-icon>
                </div>
                <div class="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 p-0.5">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    [class]="barClass(bucket.score)"
                    [style.width.%]="bucket.percent"
                  ></div>
                </div>
                <span class="w-12 text-right text-xs font-extrabold tabular text-slate-600">
                  {{ bucket.count }} <span class="text-[10px] text-slate-400">({{ bucket.percent.toFixed(0) }}%)</span>
                </span>
              </div>
            }
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div class="mb-5 border-b border-slate-100 pb-4">
            <h2 class="text-base font-bold text-navy">Niveaux de maîtrise</h2>
            <p class="mt-0.5 text-xs font-medium text-slate-500">
              Rang 1–4 par compétence (Notions → Expert). Jamais affiché en / 5.
            </p>
            <p class="mt-2 text-xs font-semibold tabular text-navy">
              {{ ratedMasteryCount() }} / {{ masteryRows().length }} compétences notées
            </p>
          </div>

          @if (!masteryRows().length) {
            <div class="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
              <p class="text-xs font-medium text-slate-500">
                Aucune compétence rattachée à noter sur l’échelle 1–4.
              </p>
            </div>
          } @else {
            <div class="space-y-2.5">
              @for (row of masteryRows(); track row.competenceLineId) {
                <div class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-navy">{{ row.name }}</p>
                    <p class="text-[11px] font-medium text-slate-400">{{ masteryCaption(row) }}</p>
                  </div>
                  @if (row.rank != null) {
                    <gcc-skill-badge [level]="skillLevelFromRank(row.rank)" />
                  } @else {
                    <span class="text-xs font-medium text-slate-400">—</span>
                  }
                </div>
              }
            </div>
          }
        </section>
      </div>

      <div class="flex justify-end">
        <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !py-1.5 !text-xs" type="button" (click)="preview.emit()">
          <mat-icon class="!mr-1.5 !h-4 !w-4 !text-[16px] text-accent">picture_as_pdf</mat-icon>
          Aperçu PDF du rapport
        </button>
      </div>

      <!-- Training Suggestions Card -->
      <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2.5 mb-1">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-accent-violet border border-violet-100">
            <mat-icon class="!h-4 !w-4 !text-[18px]">school</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-navy">Recommandations de Formation</h3>
            <p class="text-xs font-medium text-slate-500">Formations suggérées automatiquement selon les notes questions / 5</p>
          </div>
        </div>

        @if (!suggestions().length) {
          <div class="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
            <p class="text-xs font-medium text-slate-500">Aucun besoin de formation identifié à partir des notes questions / 5.</p>
          </div>
        } @else {
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            @for (item of suggestions(); track $index) {
              <div class="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1 hover:border-violet-200 transition-colors">
                <div class="flex items-center justify-between gap-2">
                  <span class="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                    <mat-icon class="!h-3 !w-3 !text-[12px]">auto_fix_high</mat-icon>
                    Suggéré
                  </span>
                  <span class="text-[11px] text-slate-400 font-medium">Besoins RH</span>
                </div>
                <p class="text-xs font-bold text-navy leading-snug">{{ item.training }}</p>
                <p class="text-[11px] text-slate-500 font-medium leading-normal">{{ item.question }}</p>
              </div>
            }
          </div>
        }
      </section>

      <!-- Signatures & Validation Workflow Section -->
      <section class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div class="mb-4">
          <h3 class="text-sm font-bold text-navy">Workflow d’approbation & Validation officielle</h3>
          <p class="text-xs text-slate-500 font-medium mt-0.5">
            Validation obligatoire en 2 étapes pour officialiser l’évaluation et verrouiller la modification des notes.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Step 1: Expert Evaluator -->
          <div
            class="rounded-xl border p-4 transition-all"
            [class]="serviceCardClass(validation().serviceApproved)"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold text-navy">
                <mat-icon class="!h-4 !w-4 !text-[16px]" [class]="approvalIconClass(validation().serviceApproved)">
                  {{ approvalIcon(validation().serviceApproved) }}
                </mat-icon>
                Étape 1 · Évaluateur expert
              </span>
              @if (validation().serviceApproved) {
                <span class="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Validé</span>
              }
            </div>

            <label class="flex items-start gap-2.5 cursor-pointer">
              <input
                class="mt-1 h-4 w-4 rounded border-slate-300 accent-indigo-600 focus:ring-indigo-500"
                type="checkbox"
                [disabled]="readonly()"
                [ngModel]="validation().serviceApproved"
                (ngModelChange)="toggleService($event)"
              />
              <span class="text-xs font-semibold text-slate-700 leading-snug">
                Approuver les notes et commentaires techniques
              </span>
            </label>

            @if (validation().serviceApproved) {
              <div class="mt-3 border-t border-emerald-200/60 pt-3">
                <label class="block">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1 block">Date d’approbation</span>
                  <input
                    class="gcc-input !text-xs max-w-48 bg-white"
                    type="date"
                    [max]="today"
                    [disabled]="readonly()"
                    [ngModel]="validation().serviceDate"
                    (ngModelChange)="patch('serviceDate', $event)"
                  />
                </label>
              </div>
            }
          </div>

          <!-- Step 2: Direction / Hierarchy -->
          <div
            class="rounded-xl border p-4 transition-all"
            [class]="dgCardClass(validation().serviceApproved, validation().dgApproved)"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold text-navy">
                <mat-icon class="!h-4 !w-4 !text-[16px]" [class]="approvalIconClass(validation().dgApproved)">
                  {{ dgIcon(validation().dgApproved) }}
                </mat-icon>
                Étape 2 · Direction / Hiérarchie
              </span>
              @if (validation().dgApproved) {
                <span class="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Prise de connaissance</span>
              }
            </div>

            <label class="flex items-start gap-2.5" [class.cursor-not-allowed]="!validation().serviceApproved">
              <input
                class="mt-1 h-4 w-4 rounded border-slate-300 accent-indigo-600 focus:ring-indigo-500"
                type="checkbox"
                [disabled]="readonly() || !validation().serviceApproved"
                [ngModel]="validation().dgApproved"
                (ngModelChange)="toggleDg($event)"
              />
              <span class="text-xs font-semibold text-slate-700 leading-snug">
                Valider la prise de connaissance hiérarchique
              </span>
            </label>

            @if (!validation().serviceApproved) {
              <p class="mt-2 text-[11px] font-medium text-slate-400 italic">
                Requiert préalablement la validation de l’évaluateur expert.
              </p>
            }

            @if (validation().dgApproved) {
              <div class="mt-3 border-t border-emerald-200/60 pt-3">
                <label class="block">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1 block">Date de signature hiérarchique</span>
                  <input
                    class="gcc-input !text-xs max-w-48 bg-white"
                    type="date"
                    [max]="today"
                    [disabled]="readonly()"
                    [ngModel]="validation().dgDate"
                    (ngModelChange)="patch('dgDate', $event)"
                  />
                </label>
              </div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
})
export class NotationValidationStep {
  ratings = input<Record<number, number>>({});
  questions = input<SelectedQuestion[]>([]);
  competenceRatings = input<Record<number, number>>({});
  average = input('0.00');
  suggestions = input<TrainingSuggestion[]>([]);
  validation = model<NotationValidation>({
    serviceApproved: false,
    dgApproved: false,
    serviceDate: '',
    dgDate: '',
  });
  readonly = input(false);
  preview = output<void>();

  readonly today = new Date().toISOString().slice(0, 10);

  readonly masteryRows = computed(() => competenceMasteryRows(this.questions(), this.competenceRatings()));
  readonly ratedMasteryCount = computed(() => this.masteryRows().filter((row) => row.rank != null).length);
  readonly skillLevelFromRank = skillLevelFromRank;
  readonly competencyScaleLabel = competencyScaleLabel;

  masteryCaption(row: { rank: number | null }): string {
    return row.rank != null ? `Rang ${row.rank} · ${competencyScaleLabel(row.rank)}` : 'Non noté';
  }

  serviceCardClass(approved: boolean): string {
    return approved
      ? 'border-emerald-200 bg-emerald-50/30'
      : 'border-slate-200 bg-white hover:border-indigo-200';
  }

  dgCardClass(serviceApproved: boolean, dgApproved: boolean): string {
    if (!serviceApproved) return 'border-slate-200 bg-slate-50/70 opacity-60';
    return dgApproved
      ? 'border-emerald-200 bg-emerald-50/30'
      : 'border-slate-200 bg-white hover:border-indigo-200';
  }

  approvalIconClass(approved: boolean): string {
    return approved ? 'text-emerald-600' : 'text-slate-400';
  }

  approvalIcon(approved: boolean): string {
    return approved ? 'check_circle' : 'verified_user';
  }

  dgIcon(approved: boolean): string {
    return approved ? 'check_circle' : 'gavel';
  }

  readonly distribution = computed(() => {
    const values = Object.values(this.ratings());
    const total = values.length || 1;
    return [5, 4, 3, 2, 1].map((score) => {
      const count = values.filter((value) => value === score).length;
      return { score, count, percent: (count / total) * 100 };
    });
  });

  barClass(score: number): string {
    switch (score) {
      case 5:
        return 'bg-emerald-500';
      case 4:
        return 'bg-indigo-500';
      case 3:
        return 'bg-sky-500';
      case 2:
        return 'bg-amber-500';
      default:
        return 'bg-rose-500';
    }
  }

  toggleService(checked: boolean): void {
    this.validation.update((current) => ({
      ...current,
      serviceApproved: checked,
      serviceDate: checked ? current.serviceDate || this.today : '',
      dgApproved: checked ? current.dgApproved : false,
      dgDate: checked ? current.dgDate : '',
    }));
  }

  toggleDg(checked: boolean): void {
    if (!this.validation().serviceApproved) return;
    this.validation.update((current) => ({
      ...current,
      dgApproved: checked,
      dgDate: checked ? current.dgDate || this.today : '',
    }));
  }

  patch(field: 'serviceDate' | 'dgDate', value: string): void {
    this.validation.update((current) => ({ ...current, [field]: value }));
  }
}
