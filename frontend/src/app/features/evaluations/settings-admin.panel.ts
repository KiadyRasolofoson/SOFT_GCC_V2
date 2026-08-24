import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  EvaluationTemplate,
  TemplateQuestion,
  durationFillPercent,
  formatMinutes,
  responseTypeMeta,
} from './evaluation.models';
import { EvaluationSettingsService } from './evaluation-settings.service';

const DEFAULT_TIMES = { TEXT: 10, QCM: 2, SCORE: 20 } as const;

@Component({
  selector: 'app-settings-admin-panel',
  imports: [
    FormsModule,
    GccKpiCard,
    GccStatusTag,
    GccEmptyState,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    @if (!selected()) {
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <gcc-kpi-card label="Modèles" [value]="templates().length.toString()" hint="Types d’évaluation actifs" tone="neutral" icon="inventory_2" />
        <gcc-kpi-card label="Questions" [value]="totalQuestions().toString()" hint="À chronométrer" tone="accent" icon="quiz" />
        <gcc-kpi-card
          label="Moyenne"
          [value]="templates().length ? (totalQuestions() / templates().length).toFixed(0) : '0'"
          hint="Questions par type"
          tone="up"
          icon="stacked_bar_chart"
        />
      </div>

      @if (error()) {
        <gcc-empty-state
          variant="error"
          title="Impossible de charger les modèles"
          [message]="error()!"
          actionLabel="Réessayer"
          actionIcon="refresh"
          (action)="reloadTemplates()"
        />
      } @else if (!loading() && !templates().length) {
        <gcc-empty-state
          title="Aucun modèle à chronométrer"
          message="Créez d’abord un type d’évaluation et des questions, puis revenez régler les durées."
        />
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (item of templates(); track item.id) {
            <button
              type="button"
              class="rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-2xs transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              (click)="selectTemplate(item)"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-bold text-navy">{{ item.title }}</p>
                  <p class="mt-1 text-xs text-slate-500">Régler le temps alloué à chaque question</p>
                </div>
                <span class="rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-extrabold tabular text-accent">
                  {{ item.questionCount }}
                </span>
              </div>
              <span class="mt-4 inline-flex items-center gap-1 text-xs font-bold text-accent">
                Configurer
                <mat-icon class="!h-4 !w-4 !text-[16px]">arrow_forward</mat-icon>
              </span>
            </button>
          }
        </div>
      }
    } @else {
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-navy"
          (click)="backToList()"
        >
          <mat-icon class="!h-4 !w-4 !text-[16px]">arrow_back</mat-icon>
          Tous les modèles
        </button>
        @if (dirty()) {
          <span class="text-xs font-semibold text-amber-700">Modifications non enregistrées</span>
        }
      </div>

      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <gcc-kpi-card label="Questions" [value]="questions().length.toString()" [hint]="selected()!.title" tone="neutral" icon="quiz" />
        <gcc-kpi-card label="Durée totale" [value]="formatMinutes(totalMinutes())" hint="Somme des temps alloués" tone="accent" icon="schedule" />
        <gcc-kpi-card
          label="Moyenne"
          [value]="questions().length ? formatMinutes(Math.round(totalMinutes() / questions().length)) : '—'"
          hint="Par question"
          tone="up"
          icon="avg_pace"
        />
        <gcc-kpi-card
          label="Plus longue"
          [value]="questions().length ? formatMinutes(maxMinutes()) : '—'"
          hint="Question la plus chronométrée"
          tone="down"
          icon="hourglass_top"
        />
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-2">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Appliquer par type</span>
        @for (preset of presets; track preset.key) {
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
            (click)="applyPreset(preset.key, preset.minutes)"
          >
            {{ preset.label }} · {{ preset.minutes }} min
          </button>
        }
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          (click)="resetDefaults()"
        >
          Réinitialiser à 15 min
        </button>
      </div>

      @if (saveError()) {
        <p class="mb-4 text-xs font-semibold text-red-600">{{ saveError() }}</p>
      }

      @if (questionsLoading()) {
        <div class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-navy">
          Chargement des questions…
        </div>
      } @else if (!questions().length) {
        <gcc-empty-state
          title="Aucune question pour ce type"
          message="Ajoutez des questions dans l’onglet Questionnaires, puis revenez régler les durées."
        />
      } @else {
        <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <table mat-table [dataSource]="pagedQuestions()" class="w-full">
            <ng-container matColumnDef="question">
              <th mat-header-cell *matHeaderCellDef>Question</th>
              <td mat-cell *matCellDef="let row">
                <p class="max-w-xl text-sm font-semibold leading-snug text-navy">{{ row.text }}</p>
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Réponse</th>
              <td mat-cell *matCellDef="let row">
                <gcc-status-tag
                  [status]="responseTypeMeta(row.responseType).kind"
                  [label]="responseTypeMeta(row.responseType).label"
                />
              </td>
            </ng-container>

            <ng-container matColumnDef="duration">
              <th mat-header-cell *matHeaderCellDef>Durée</th>
              <td mat-cell *matCellDef="let row">
                <div class="min-w-48">
                  <div class="mb-1 flex items-center justify-between text-[11px] font-extrabold tabular text-navy">
                    <span>{{ times()[row.questionId] || 15 }} min</span>
                  </div>
                  <input
                    class="w-full accent-indigo-600"
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    [ngModel]="times()[row.questionId] || 15"
                    (ngModelChange)="setTime(row.questionId, $event)"
                  />
                  <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-accent to-indigo-500"
                      [style.width.%]="durationFillPercent(times()[row.questionId] || 15)"
                    ></div>
                  </div>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>

          <mat-paginator
            [length]="questions().length"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPage($event)"
            showFirstLastButtons
            class="border-t border-slate-100"
          />
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="backToList()">
            Annuler
          </button>
          <button
            mat-flat-button
            class="gcc-btn-primary !rounded-xl"
            type="button"
            [disabled]="saving() || !dirty()"
            (click)="save()"
          >
            {{ saving() ? 'Enregistrement…' : 'Enregistrer les durées' }}
          </button>
        </div>
      }
    }
  `,
})
export class SettingsAdminPanel implements OnInit {
  private readonly settings = inject(EvaluationSettingsService);

  readonly columns = ['question', 'type', 'duration'];
  readonly presets = [
    { key: 'QCM', label: 'QCM', minutes: DEFAULT_TIMES.QCM },
    { key: 'TEXT', label: 'Texte', minutes: DEFAULT_TIMES.TEXT },
    { key: 'SCORE', label: 'Score', minutes: DEFAULT_TIMES.SCORE },
  ] as const;

  readonly loading = signal(false);
  readonly questionsLoading = signal(false);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly templates = signal<EvaluationTemplate[]>([]);
  readonly selected = signal<EvaluationTemplate | null>(null);
  readonly questions = signal<TemplateQuestion[]>([]);
  readonly times = signal<Record<number, number>>({});
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly Math = Math;
  readonly formatMinutes = formatMinutes;
  readonly durationFillPercent = durationFillPercent;
  readonly responseTypeMeta = responseTypeMeta;

  readonly totalQuestions = computed(() =>
    this.templates().reduce((sum, item) => sum + (item.questionCount || 0), 0),
  );
  readonly totalMinutes = computed(() =>
    Object.values(this.times()).reduce((sum, value) => sum + (Number(value) || 0), 0),
  );
  readonly maxMinutes = computed(() => Math.max(0, ...Object.values(this.times())));
  readonly pagedQuestions = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.questions().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.reloadTemplates();
  }

  reloadTemplates(): void {
    this.loading.set(true);
    this.error.set(null);
    this.settings.getTemplates().subscribe({
      next: (rows) => {
        this.templates.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Vérifiez vos droits (paramétrage des évaluations) ou réessayez.');
        this.loading.set(false);
      },
    });
  }

  selectTemplate(item: EvaluationTemplate): void {
    this.selected.set(item);
    this.pageIndex.set(0);
    this.dirty.set(false);
    this.saveError.set(null);
    this.questionsLoading.set(true);
    this.settings.getTemplateQuestions(item.id).subscribe({
      next: (rows) => {
        this.questions.set(rows);
        const times: Record<number, number> = {};
        for (const row of rows) times[row.questionId] = row.maxTimeInMinutes || 15;
        this.times.set(times);
        this.questionsLoading.set(false);
      },
      error: () => {
        this.questions.set([]);
        this.questionsLoading.set(false);
        this.saveError.set('Impossible de charger les questions de ce modèle.');
      },
    });
  }

  backToList(): void {
    this.selected.set(null);
    this.questions.set([]);
    this.times.set({});
    this.dirty.set(false);
    this.saveError.set(null);
  }

  setTime(questionId: number, value: number): void {
    const minutes = Math.max(1, Math.min(60, Number(value) || 1));
    this.times.update((current) => ({ ...current, [questionId]: minutes }));
    this.dirty.set(true);
  }

  applyPreset(type: string, minutes: number): void {
    this.times.update((current) => {
      const next = { ...current };
      for (const row of this.questions()) {
        if (row.responseType.toUpperCase() === type) next[row.questionId] = minutes;
      }
      return next;
    });
    this.dirty.set(true);
  }

  resetDefaults(): void {
    this.times.update((current) => {
      const next = { ...current };
      for (const row of this.questions()) next[row.questionId] = 15;
      return next;
    });
    this.dirty.set(true);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  save(): void {
    this.saving.set(true);
    this.saveError.set(null);
    const payload = this.questions().map((row) => ({
      questionId: row.questionId,
      maxTimeInMinutes: this.times()[row.questionId] || 15,
    }));
    this.settings.updateQuestionTimes(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.dirty.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('La sauvegarde des durées a échoué.');
      },
    });
  }
}
