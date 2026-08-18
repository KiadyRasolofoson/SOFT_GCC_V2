import { Component, computed, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  lookupById,
  QuestionOption,
  ratingLabel,
  ReferenceAnswer,
  SelectedQuestion,
} from './evaluation.models';

const STARS = [1, 2, 3, 4, 5];

@Component({
  selector: 'app-notation-questions-step',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatProgressBarModule, GccStatusTag, GccEmptyState],
  template: `
    <div class="flex flex-col gap-8">
      <!-- Sticky / Fixed Top Progress & Summary Banner -->
      <div class="sticky top-16 z-10 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur-md">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-accent border border-indigo-100">
              <mat-icon class="!h-5 !w-5 !text-[20px]">quiz</mat-icon>
            </div>
            <div>
              <h2 class="text-sm font-bold text-navy">Évaluation des compétences</h2>
              <p class="text-xs text-slate-500 font-medium">
                {{ ratedCount() }} sur {{ questions().length }} questions notées
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Moyenne live</p>
              <span class="inline-flex items-center gap-1 text-sm font-extrabold tabular text-navy">
                <mat-icon class="!h-4 !w-4 !text-[16px] text-amber-400">star</mat-icon>
                {{ averageLabel() }}
              </span>
            </div>
            <div class="min-w-36 w-44 sm:w-52">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Progression</span>
                <span>{{ progress().toFixed(0) }}%</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="progress()" class="h-2 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      @if (!questions().length) {
        <gcc-empty-state
          title="Aucune question attribuée"
          message="Aucune question n’a été sélectionnée ou configurée pour cette évaluation."
        />
      } @else {
        <div class="flex flex-col gap-6 pt-1">
          @for (group of groups(); track group.name) {
            <section class="space-y-3">
              <div class="flex items-center gap-2.5 px-1">
                <span class="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-accent text-xs font-bold">
                  {{ group.items.length }}
                </span>
                <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-500">{{ group.name }}</h3>
                <div class="h-px flex-1 bg-slate-200/80"></div>
              </div>

              <div class="space-y-4">
                @for (question of group.items; track question.questionId) {
                  <article class="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:border-indigo-200 hover:shadow-xs">
                    <!-- Question Header & Score Badge -->
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 mb-1.5">
                          <span class="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                            Question #{{ questionIndex(question.questionId) }}
                          </span>
                          @if (question.competenceName) {
                            <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100/80">
                              {{ question.competenceName }}
                            </span>
                          }
                        </div>
                        <h4 class="text-base font-bold leading-snug text-navy">{{ question.questionText }}</h4>
                      </div>

                      <div
                        class="shrink-0 rounded-2xl border p-2.5 text-center min-w-24 transition-colors"
                        [class]="scoreBoxClass(ratings()[question.questionId])"
                      >
                        <p class="tabular text-xl font-extrabold leading-none">
                          {{ ratings()[question.questionId] != null ? ratings()[question.questionId] : '—' }}
                          <span class="text-xs font-medium opacity-70">/5</span>
                        </p>
                        <p class="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-80">
                          {{ ratingLabel(ratings()[question.questionId] || 0) }}
                        </p>
                      </div>
                    </div>

                    <!-- Employee Answer Box -->
                    @if (employeeAnswer(question); as answer) {
                      <div class="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
                        <div class="flex items-center justify-between gap-2 mb-1.5">
                          <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400">chat_bubble_outline</mat-icon>
                            Réponse transmise par le salarié
                          </span>
                          @if (question.responseType === 'QCM' && !hideCorrectness()) {
                            <gcc-status-tag
                              [status]="question.isCorrect ? 'ok' : 'refused'"
                              [label]="question.isCorrect ? 'QCM Vrai' : 'QCM Faux'"
                            />
                          }
                        </div>
                        <p class="text-sm font-medium leading-relaxed text-navy whitespace-pre-line">{{ answer }}</p>
                      </div>
                    }

                    <!-- Reference Answer Accordion -->
                    @if (referenceOf(question.questionId); as reference) {
                      @if (!(hideCorrectness() && question.responseType === 'QCM')) {
                        <div class="mt-3">
                          <button
                            mat-stroked-button
                            class="gcc-btn-secondary !rounded-xl !text-xs !py-1"
                            type="button"
                            (click)="toggleReference(question.questionId)"
                          >
                            <mat-icon class="!mr-1 !h-4 !w-4 !text-[16px] text-indigo-500">lightbulb</mat-icon>
                            {{ isOpen(question.questionId) ? 'Masquer la réponse repère' : 'Consulter la réponse repère' }}
                          </button>

                          @if (isOpen(question.questionId)) {
                            <div class="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-navy space-y-2">
                              <div>
                                <p class="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-0.5">Réponse attendue</p>
                                <p class="text-xs text-slate-700 leading-relaxed">{{ reference.referenceText }}</p>
                              </div>
                              @if (keyPoints(reference); as points) {
                                <div>
                                  <p class="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1">Points clés d'évaluation</p>
                                  <ul class="list-disc space-y-1 pl-4 text-xs text-slate-600">
                                    @for (point of points; track $index) {
                                      <li>{{ point }}</li>
                                    }
                                  </ul>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    }

                    <!-- Interactive Star Rating Input -->
                    <div class="mt-5 border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Attribution de la note</p>
                        <div class="flex items-center gap-1" role="radiogroup" [attr.aria-label]="'Note question ' + question.questionId">
                          @for (star of stars; track star) {
                            <button
                              type="button"
                              class="rounded-xl p-1.5 transition-all hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                              [disabled]="readonly()"
                              [attr.aria-pressed]="(ratings()[question.questionId] || 0) >= star"
                              (click)="setRating(question.questionId, star)"
                            >
                              <mat-icon
                                class="!h-7 !w-7 !text-[28px] transition-colors"
                                [class]="(ratings()[question.questionId] || 0) >= star ? 'text-amber-400 drop-shadow-2xs' : 'text-slate-300'"
                              >
                                {{ (ratings()[question.questionId] || 0) >= star ? 'star' : 'star_border' }}
                              </mat-icon>
                            </button>
                          }
                          @if (ratings()[question.questionId] != null) {
                            <span class="ml-2 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                              {{ ratings()[question.questionId] }} / 5 · {{ ratingLabel(ratings()[question.questionId] || 0) }}
                            </span>
                          }
                        </div>
                      </div>

                      <!-- Per-question Comment Field -->
                      <div class="flex-1 max-w-lg">
                        <label class="block">
                          <span class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Commentaire explicatif</span>
                          <textarea
                            class="gcc-input min-h-16 !text-xs"
                            rows="2"
                            [disabled]="readonly()"
                            [ngModel]="comments()[question.questionId] || ''"
                            (ngModelChange)="setComment(question.questionId, $event)"
                            placeholder="Avis spécifique ou justification du niveau attribué…"
                          ></textarea>
                        </label>
                      </div>
                    </div>
                  </article>
                }
              </div>
            </section>
          }
        </div>
      }
    </div>
  `,
})
export class NotationQuestionsStep {
  questions = input.required<SelectedQuestion[]>();
  ratings = model<Record<number, number>>({});
  comments = model<Record<number, string>>({});
  references = input<Record<number, ReferenceAnswer>>({});
  options = input<Record<number, QuestionOption[]>>({});
  evaluationTypeId = input<number | null>(null);
  readonly = input(false);

  readonly stars = STARS;
  readonly ratingLabel = ratingLabel;
  readonly expanded = signal<Record<number, boolean>>({});

  readonly groups = computed(() => {
    const map = new Map<string, SelectedQuestion[]>();
    for (const question of this.questions()) {
      const name = question.competenceName?.trim() || 'Autres compétences';
      const list = map.get(name) ?? [];
      list.push(question);
      map.set(name, list);
    }
    return [...map.entries()].map(([name, items]) => ({ name, items }));
  });

  readonly ratedCount = computed(() =>
    this.questions().filter((question) => this.ratings()[question.questionId] != null).length,
  );

  readonly progress = computed(() => {
    const total = this.questions().length;
    return total ? (this.ratedCount() / total) * 100 : 0;
  });

  readonly averageLabel = computed(() => {
    const values = Object.values(this.ratings()).filter((n) => n > 0 || n === 0);
    if (!values.length) return '—';
    const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
    return `${avg.toFixed(2)} / 5`;
  });

  readonly hideCorrectness = computed(() => this.evaluationTypeId() === 1);

  questionIndex(questionId: number): number {
    return this.questions().findIndex((question) => question.questionId === questionId) + 1;
  }

  setRating(questionId: number, rating: number): void {
    if (this.readonly()) return;
    this.ratings.update((current) => ({ ...current, [questionId]: rating }));
  }

  setComment(questionId: number, comment: string): void {
    if (this.readonly()) return;
    this.comments.update((current) => ({ ...current, [questionId]: comment }));
  }

  toggleReference(questionId: number): void {
    this.expanded.update((current) => ({ ...current, [questionId]: !current[questionId] }));
  }

  isOpen(questionId: number): boolean {
    return Boolean(this.expanded()[questionId]);
  }

  referenceOf(questionId: number): ReferenceAnswer | undefined {
    return lookupById(this.references(), questionId);
  }

  keyPoints(reference: ReferenceAnswer): string[] | null {
    const raw = reference.expectedKeyPoints || reference.keyPoints || '';
    const lines = raw
      .split('\n')
      .map((line) => line.replace(/^[-•]\s*/, '').trim())
      .filter(Boolean);
    return lines.length ? lines : null;
  }

  scoreBoxClass(score: number | undefined): string {
    if (score == null) return 'bg-slate-50 border-slate-200 text-slate-400';
    if (score >= 4) return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    if (score >= 3) return 'bg-indigo-50 border-indigo-200 text-indigo-800';
    return 'bg-amber-50 border-amber-200 text-amber-800';
  }

  employeeAnswer(question: SelectedQuestion): string {
    const raw = (question.responseValue ?? '').replace(/^"|"$/g, '').trim();
    if (question.responseType !== 'QCM') return raw;
    const optionId = Number(raw);
    const options = lookupById(this.options(), question.questionId) ?? [];
    if (Number.isFinite(optionId) && options.length) {
      const option = options.find((item) => item.optionId === optionId);
      if (option) return option.optionText;
    }
    return raw;
  }
}
