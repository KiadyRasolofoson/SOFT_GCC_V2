import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { averageOf, NotationRemarks, ratingLabel } from './evaluation.models';

@Component({
  selector: 'app-notation-comments-step',
  imports: [FormsModule, MatIconModule, GccKpiCard],
  template: `
    <div class="space-y-6">
      <!-- Performance Overview Banner -->
      <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5 border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-base font-bold text-navy">Synthèse & Commentaires d’évaluation</h2>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              Formulez votre appréciation qualitative pour étayer la note de performance (/ 5).
            </p>
          </div>
          <span
            class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold"
            [class]="performanceBadgeClass(average())"
          >
            <mat-icon class="!h-4 !w-4 !text-[16px]">stars</mat-icon>
            Performance {{ ratingLabel(average()) }}
          </span>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <gcc-kpi-card
            label="Note de performance"
            [value]="averageDisplay()"
            hint="Moyenne des questions / 5"
            tone="accent"
            icon="auto_awesome"
          />
          <gcc-kpi-card
            label="Questions évaluées"
            [value]="ratedCount().toString()"
            hint="Toutes les questions sont notées"
            tone="up"
            icon="check_circle"
          />
          <gcc-kpi-card
            label="Prochaine étape"
            value="Validation"
            hint="Avis hiérarchique & rapport PDF"
            tone="neutral"
            icon="verified"
          />
        </div>
      </div>

      <!-- Remarks Inputs Cards -->
      <div class="grid gap-5 lg:grid-cols-2">
        <!-- Strengths Card -->
        <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-emerald-200">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <mat-icon class="!h-4 !w-4 !text-[18px]">thumb_up</mat-icon>
            </div>
            <div>
              <h3 class="text-sm font-bold text-navy">Points forts observés</h3>
              <p class="text-xs text-slate-600">Acquis solides, réussites et compétences maîtrisées</p>
            </div>
          </div>

          <label class="block">
            <textarea
              class="gcc-input min-h-32 leading-relaxed"
              rows="5"
              [disabled]="readonly()"
              [ngModel]="remarks().strengths"
              (ngModelChange)="patch('strengths', $event)"
              placeholder="Décrivez les réussites concrètes, comportements professionnels valorisés et expertises démontrées…"
            ></textarea>
          </label>
        </div>

        <!-- Weaknesses / Improvements Card -->
        <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-amber-200">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <mat-icon class="!h-4 !w-4 !text-[18px]">trending_up</mat-icon>
            </div>
            <div>
              <h3 class="text-sm font-bold text-navy">Axes d’amélioration</h3>
              <p class="text-xs text-slate-600">Points de vigilance, marges de progrès et compétences à renforcer</p>
            </div>
          </div>

          <label class="block">
            <textarea
              class="gcc-input min-h-32 leading-relaxed"
              rows="5"
              [disabled]="readonly()"
              [ngModel]="remarks().weaknesses"
              (ngModelChange)="patch('weaknesses', $event)"
              placeholder="Précisez les axes de progrès ciblés, besoins d'accompagnement ou de formation…"
            ></textarea>
          </label>
        </div>

        <!-- General Evaluation Card (Full Width) -->
        <div class="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-indigo-200">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-accent border border-indigo-100">
              <mat-icon class="!h-4 !w-4 !text-[18px]">rate_review</mat-icon>
            </div>
            <div>
              <h3 class="text-sm font-bold text-navy">Appréciation générale de l'évaluateur</h3>
              <p class="text-xs text-slate-600">Synthèse globale pour le bilan de fin de période</p>
            </div>
          </div>

          <label class="block">
            <textarea
              class="gcc-input min-h-36 leading-relaxed"
              rows="6"
              [disabled]="readonly()"
              [ngModel]="remarks().generalEvaluation"
              (ngModelChange)="patch('generalEvaluation', $event)"
              placeholder="Rédigez une synthèse générale équilibrée de la période d'évaluation, incluant vos recommandations professionnelles…"
            ></textarea>
          </label>
        </div>
      </div>

      <!-- Writing Guidelines Card -->
      <aside class="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs text-slate-700">
        <div class="flex items-center gap-2 mb-2 font-bold text-indigo-900">
          <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">tips_and_updates</mat-icon>
          <span>Bonnes pratiques de rédaction</span>
        </div>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-slate-600">
          <div class="flex items-start gap-1.5">
            <mat-icon class="!h-3.5 !w-3.5 !text-[14px] text-emerald-600 shrink-0 mt-0.5">check_circle</mat-icon>
            <span>Restez factuel et citez des exemples concrets</span>
          </div>
          <div class="flex items-start gap-1.5">
            <mat-icon class="!h-3.5 !w-3.5 !text-[14px] text-emerald-600 shrink-0 mt-0.5">check_circle</mat-icon>
            <span>Équilibrez compliments et points d'effort</span>
          </div>
          <div class="flex items-start gap-1.5">
            <mat-icon class="!h-3.5 !w-3.5 !text-[14px] text-emerald-600 shrink-0 mt-0.5">check_circle</mat-icon>
            <span>Fixez des recommandations constructives</span>
          </div>
          <div class="flex items-start gap-1.5">
            <mat-icon class="!h-3.5 !w-3.5 !text-[14px] text-emerald-600 shrink-0 mt-0.5">check_circle</mat-icon>
            <span>Alignez le texte sur la note attribuée</span>
          </div>
        </div>
      </aside>
    </div>
  `,
})
export class NotationCommentsStep {
  ratings = input<Record<number, number>>({});
  remarks = model<NotationRemarks>({ strengths: '', weaknesses: '', generalEvaluation: '' });
  readonly = input(false);

  readonly average = computed(() => averageOf(this.ratings()));
  readonly averageDisplay = computed(() => `${this.average().toFixed(2)} / 5`);
  readonly ratedCount = computed(() => Object.keys(this.ratings()).length);
  readonly ratingLabel = ratingLabel;

  performanceBadgeClass(score: number): string {
    if (score >= 4.0) return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
    if (score >= 3.0) return 'bg-indigo-50 text-indigo-700 border border-indigo-200/80';
    return 'bg-amber-50 text-amber-700 border border-amber-200/80';
  }

  patch(field: keyof NotationRemarks, value: string): void {
    this.remarks.update((current) => ({ ...current, [field]: value }));
  }
}
