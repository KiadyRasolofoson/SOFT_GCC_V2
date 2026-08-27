import { Component, computed, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccSkillBadge, skillLevelFromRank } from '../../ui/gcc-skill-badge';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  averageOfRateableQuestions,
  COMPETENCY_SCALE_RANKS,
  isQcmResponseType,
  lookupById,
  parseQcmOptionIds,
  QuestionOption,
  ratingLabel,
  ReferenceAnswer,
  SelectedQuestion,
} from './evaluation.models';

const STARS = [1, 2, 3, 4, 5];

@Component({
  selector: 'app-notation-questions-step',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatProgressBarModule, GccStatusTag, GccEmptyState, GccSkillBadge],
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
              <h2 class="text-sm font-bold text-navy">Notation : performance et maîtrise</h2>
              <p class="text-xs text-slate-500 font-medium">
                Étoiles /5 sur le texte · QCM réussi = 5/5 dans la note de performance · rang 1–4 par compétence
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-right">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Note de performance</p>
              <span class="inline-flex items-center gap-1 text-sm font-extrabold tabular text-navy">
                <mat-icon class="!h-4 !w-4 !text-[16px] text-amber-400">star</mat-icon>
                {{ averageLabel() }}
              </span>
              <p class="mt-0.5 text-[10px] font-medium text-slate-400">
                {{ ratedCount() }} / {{ rateableCount() }} questions · QCM auto 5 ou 0
              </p>
            </div>
            <div class="rounded-xl border border-indigo-100 bg-indigo-50/80 px-3 py-2 text-right">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Niveaux de maîtrise</p>
              <p class="text-sm font-extrabold tabular text-navy">
                {{ ratedCompetenceCount() }} / {{ competenceCount() }} compétences notées
              </p>
              <p class="mt-0.5 text-[10px] font-medium text-slate-400">Échelle 1–4 · pas une moyenne /5</p>
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
          @for (domain of domainGroups(); track domain.key) {
            <section class="space-y-4">
              <div class="flex items-center gap-2.5 px-1">
                <span class="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-700 text-xs font-bold">
                  {{ domain.groups.length }}
                </span>
                <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-500">{{ domain.name }}</h3>
                <div class="h-px flex-1 bg-slate-200/80"></div>
              </div>

              @for (group of domain.groups; track group.key) {
            <div class="space-y-3">
              <div class="flex items-center gap-2.5 px-1">
                <span class="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-accent text-xs font-bold">
                  {{ group.items.length }}
                </span>
                <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-500">{{ group.name }}</h4>
                <div class="h-px flex-1 bg-slate-200/80"></div>
              </div>

              @if (group.competenceLineId > 0) {
                <div class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Maîtrise de la compétence</p>
                      <p class="mt-0.5 text-sm font-semibold text-navy">{{ group.name }}</p>
                      <p class="mt-1 text-xs text-slate-500">Échelle unique 1–4 — un rang pour toutes les questions de ce groupe.</p>
                    </div>
                    @if (competenceRatings()[group.competenceLineId] != null) {
                      <gcc-skill-badge [level]="skillLevelFromRank(competenceRatings()[group.competenceLineId])" />
                    } @else {
                      <gcc-status-tag status="pending" label="Niveau requis" />
                    }
                  </div>
                  <div
                    class="mt-3 flex flex-wrap gap-2"
                    role="radiogroup"
                    [attr.aria-label]="'Maîtrise ' + group.name"
                  >
                    @for (item of competencyRanks; track item.rank) {
                      <button
                        type="button"
                        class="rounded-full border p-0.5 transition disabled:cursor-not-allowed disabled:opacity-60"
                        [class]="
                          competenceRatings()[group.competenceLineId] === item.rank
                            ? 'border-accent ring-2 ring-accent/30'
                            : 'border-transparent hover:border-slate-200'
                        "
                        [disabled]="readonly()"
                        [attr.aria-pressed]="competenceRatings()[group.competenceLineId] === item.rank"
                        (click)="setCompetenceRank(group.competenceLineId, item.rank)"
                      >
                        <gcc-skill-badge [level]="skillLevelFromRank(item.rank)" />
                      </button>
                    }
                  </div>
                </div>
              }

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
                          @if (question.skillName || question.competenceName) {
                            <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100/80">
                              {{ question.skillName || question.competenceName }}
                            </span>
                          }
                        </div>
                        <h4 class="text-base font-bold leading-snug text-navy">{{ question.questionText }}</h4>
                      </div>

                      @if (isQcm(question)) {
                        <div
                          class="shrink-0 rounded-2xl border p-2.5 text-center min-w-24 transition-colors"
                          [class]="scoreBoxClass(ratings()[question.questionId])"
                        >
                          <p class="tabular text-xl font-extrabold leading-none">
                            {{ ratings()[question.questionId] != null ? ratings()[question.questionId] : '—' }}
                            <span class="text-xs font-medium opacity-70">/5</span>
                          </p>
                          <p class="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-80">
                            {{ question.isCorrect ? 'Réussi' : 'Échoué' }}
                          </p>
                        </div>
                      } @else {
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
                      }
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
                        @if (isQcm(question) && !hideCorrectness()) {
                          @if (correctAnswersOf(question.questionId); as correct) {
                            <p class="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Bonnes réponses
                            </p>
                            <ul class="mt-1 list-disc space-y-0.5 pl-4 text-sm text-navy">
                              @for (label of correct; track label) {
                                <li>{{ label }}</li>
                              }
                            </ul>
                          }
                        }
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

                    @if (!isQcm(question)) {
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
                    }
                  </article>
                }
              </div>
            </div>
              }
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
  competenceRatings = model<Record<number, number>>({});
  references = input<Record<number, ReferenceAnswer>>({});
  options = input<Record<number, QuestionOption[]>>({});
  evaluationTypeId = input<number | null>(null);
  readonly = input(false);

  readonly stars = STARS;
  readonly competencyRanks = COMPETENCY_SCALE_RANKS;
  readonly ratingLabel = ratingLabel;
  readonly skillLevelFromRank = skillLevelFromRank;
  readonly expanded = signal<Record<number, boolean>>({});

  readonly groups = computed(() => {
    const map = new Map<string, { key: string; competenceLineId: number; name: string; items: SelectedQuestion[] }>();
    for (const question of this.questions()) {
      const lineId = Number(question.competenceLineId) > 0 ? Number(question.competenceLineId) : 0;
      const name =
        question.skillName?.trim() ||
        question.competenceName?.trim() ||
        (lineId ? `Compétence #${lineId}` : 'Autres compétences');
      const key = lineId > 0 ? `id:${lineId}` : `name:${name}`;
      const group = map.get(key) ?? { key, competenceLineId: lineId, name, items: [] };
      group.items.push(question);
      map.set(key, group);
    }
    return [...map.values()];
  });

  readonly domainGroups = computed(() => {
    const domains = new Map<
      string,
      {
        key: string;
        name: string;
        groups: { key: string; competenceLineId: number; name: string; items: SelectedQuestion[] }[];
      }
    >();
    for (const group of this.groups()) {
      const sample = group.items[0];
      const name = sample?.domainName?.trim() || 'Autres domaines';
      const domainId = Number(sample?.domainId) > 0 ? Number(sample.domainId) : 0;
      const key = domainId > 0 ? `id:${domainId}` : `name:${name}`;
      const domain = domains.get(key) ?? { key, name, groups: [] };
      domain.groups.push(group);
      domains.set(key, domain);
    }
    return [...domains.values()];
  });

  readonly ratedCount = computed(() =>
    this.rateableQuestions().filter((question) => this.ratings()[question.questionId] != null).length,
  );

  readonly rateableCount = computed(() => this.rateableQuestions().length);

  readonly rateableQuestions = computed(() => this.questions());

  readonly competenceCount = computed(
    () => this.groups().filter((group) => group.competenceLineId > 0).length,
  );

  readonly ratedCompetenceCount = computed(() => {
    const ratings = this.competenceRatings();
    return this.groups().filter((group) => {
      const rank = Number(ratings[group.competenceLineId]);
      return group.competenceLineId > 0 && Number.isInteger(rank) && rank >= 1 && rank <= 4;
    }).length;
  });

  readonly progress = computed(() => {
    const total = this.questions().length;
    if (!total) return 0;
    const complete = this.questions().filter(
      (question) => isQcmResponseType(question.responseType) || this.ratings()[question.questionId] != null,
    ).length;
    return (complete / total) * 100;
  });

  readonly averageLabel = computed(() => {
    const rateable = this.rateableQuestions();
    if (!rateable.length) return '—';
    const values = rateable
      .map((question) => this.ratings()[question.questionId])
      .filter((score): score is number => Number.isFinite(score));
    if (!values.length) return '—';
    return `${averageOfRateableQuestions(this.questions(), this.ratings()).toFixed(2)} / 5`;
  });

  readonly hideCorrectness = computed(() => this.evaluationTypeId() === 1);

  isQcm(question: SelectedQuestion): boolean {
    return isQcmResponseType(question.responseType);
  }

  questionIndex(questionId: number): number {
    return this.questions().findIndex((question) => question.questionId === questionId) + 1;
  }

  setRating(questionId: number, rating: number): void {
    if (this.readonly()) return;
    this.ratings.update((current) => ({ ...current, [questionId]: rating }));
  }

  setCompetenceRank(competenceLineId: number, rank: number): void {
    if (this.readonly() || competenceLineId <= 0) return;
    this.competenceRatings.update((current) => ({ ...current, [competenceLineId]: rank }));
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
    if (score <= 0) return 'bg-rose-50 border-rose-200 text-rose-800';
    return 'bg-amber-50 border-amber-200 text-amber-800';
  }

  employeeAnswer(question: SelectedQuestion): string {
    const raw = (question.responseValue ?? '').replace(/^"|"$/g, '').trim();
    if (!raw) return '';

    // JSON stocké par le portail salarié ou l'évaluation multi-critères
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;

        // Réponse texte libre du salarié
        if (typeof parsed['ResponseValue'] === 'string' && parsed['ResponseValue']) {
          return parsed['ResponseValue'] as string;
        }
        if (typeof parsed['responseValue'] === 'string' && parsed['responseValue']) {
          return parsed['responseValue'] as string;
        }

        // Réponse multi-critères (manager) : on affiche la note globale + commentaire
        const overall = parsed['OverallRating'] ?? parsed['overallRating'];
        const comment = parsed['Comment'] ?? parsed['comment'];
        if (overall != null && Number(overall) > 0) {
          const parts: string[] = [`Note de performance : ${overall}/5`];
          if (comment && String(comment).trim()) parts.push(`Commentaire : ${String(comment).trim()}`);
          return parts.join('\n');
        }

        // Fallback : valeur brute la plus informative du JSON
        const fallback = parsed['ResponseValue'] ?? parsed['responseValue'] ?? parsed['Comment'] ?? parsed['comment'];
        if (fallback && String(fallback).trim()) return String(fallback).trim();

        return '';
      } catch {
        // JSON invalide → afficher tel quel
        return raw;
      }
    }

    // Réponse QCM : résoudre le ou les optionId en libellés
    if (isQcmResponseType(question.responseType)) {
      const opts = lookupById(this.options(), question.questionId) ?? [];
      const ids = parseQcmOptionIds(raw);
      if (ids.length && opts.length) {
        return ids
          .map((id) => opts.find((option) => option.optionId === id)?.optionText ?? String(id))
          .join(', ');
      }
    }

    return raw;
  }

  correctAnswersOf(questionId: number): string[] | null {
    const labels = (lookupById(this.options(), questionId) ?? [])
      .filter((option) => option.isCorrect)
      .map((option) => option.optionText.trim())
      .filter(Boolean);
    return labels.length ? labels : null;
  }
}
