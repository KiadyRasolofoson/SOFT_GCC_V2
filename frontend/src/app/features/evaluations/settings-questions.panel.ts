import { Component, computed, DestroyRef, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccFilterBar } from '../../ui/gcc-filter-bar';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccSelect } from '../../ui/gcc-select';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import { GccSelectOption } from '../../ui/gcc.types';
import {
  PositionOption,
  ResponseTypeOption,
  SettingsCompetenceLine,
  SettingsEvalType,
  SettingsQuestion,
  responseTypeMeta,
} from './evaluation.models';
import { EvaluationSettingsService } from './evaluation-settings.service';
import { SettingsConfirmDialog } from './settings-confirm.dialog';
import { SettingsQuestionDialog } from './settings-question.dialog';

@Component({
  selector: 'app-settings-questions-panel',
  imports: [
    GccFilterBar,
    GccSelect,
    GccKpiCard,
    GccStatusTag,
    GccEmptyState,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <gcc-kpi-card label="Questions" [value]="allRows().length.toString()" hint="Référentiel complet" tone="neutral" icon="quiz" />
      <gcc-kpi-card label="Texte" [value]="typeCount('TEXT').toString()" hint="Réponses ouvertes" tone="accent" icon="notes" />
      <gcc-kpi-card label="QCM" [value]="typeCount('QCM').toString()" hint="Choix multiples" tone="up" icon="checklist" />
      <gcc-kpi-card label="Score" [value]="typeCount('SCORE').toString()" hint="Notation / 5" tone="down" icon="star" />
    </div>

    <gcc-filter-bar
      placeholder="Rechercher une question…"
      [(query)]="search"
      (apply)="applyFilters()"
      (reset)="resetFilters()"
    >
      <gcc-select class="w-full shrink-0 lg:w-48" [options]="typeOptions()" [(value)]="typeFilter" placeholder="Tous les types" />
      <gcc-select
        class="w-full shrink-0 lg:w-48"
        [options]="positionOptions()"
        [(value)]="positionFilter"
        placeholder="Tous les postes"
        [searchable]="true"
        searchPlaceholder="Rechercher un poste…"
      />
      <gcc-select class="w-full shrink-0 lg:w-44" [options]="responseOptions()" [(value)]="responseFilter" placeholder="Toutes les réponses" />
    </gcc-filter-bar>

    @if (selected().length) {
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
        <p class="text-xs font-bold text-navy">{{ selected().length }} question(s) sélectionnée(s)</p>
        <div class="flex gap-2">
          <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !text-xs" type="button" (click)="clearSelection()">
            Annuler
          </button>
          <button mat-flat-button class="gcc-btn-primary !rounded-xl !text-xs" type="button" (click)="deleteSelected()">
            <mat-icon class="!mr-1 !h-4 !w-4 !text-[16px]">delete</mat-icon>
            Supprimer
          </button>
        </div>
      </div>
    }

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger les questions"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="reload()"
      />
    } @else if (!loading() && !pagedRows().length) {
      <gcc-empty-state
        title="Aucune question"
        [message]="hasFilters() ? 'Aucun résultat pour ces filtres.' : 'Créez la première question du référentiel.'"
        [actionLabel]="hasFilters() ? 'Réinitialiser les filtres' : 'Nouvelle question'"
        [actionIcon]="hasFilters() ? 'restart_alt' : 'add'"
        (action)="hasFilters() ? resetFilters() : openDialog()"
      />
    } @else {
      <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table mat-table [dataSource]="pagedRows()" class="w-full">
          <ng-container matColumnDef="question">
            <th mat-header-cell *matHeaderCellDef>
              <div class="flex items-center gap-3">
                <input type="checkbox" class="accent-indigo-600" [checked]="allPageSelected()" (change)="togglePage($event)" />
                <span>Question</span>
              </div>
            </th>
            <td mat-cell *matCellDef="let row">
              <div class="flex items-start gap-3 py-2.5">
                <input
                  type="checkbox"
                  class="mt-3 accent-indigo-600"
                  [checked]="isSelected(row.questionId)"
                  (change)="toggleRow(row.questionId)"
                  (click)="$event.stopPropagation()"
                />
                <span
                  class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  [class]="responseIconWrap(row.responseTypeName)"
                >
                  <mat-icon class="!h-5 !w-5 !text-[20px]">{{ responseIcon(row.responseTypeName) }}</mat-icon>
                </span>
                <div class="min-w-0 flex-1">
                  <p
                    class="text-sm font-semibold leading-snug text-navy"
                    [class.line-clamp-2]="!isExpanded(row.questionId)"
                    [title]="row.question"
                  >
                    {{ row.question }}
                  </p>
                  <div class="mt-2 flex flex-wrap items-center gap-1.5">
                    @if (row.evaluationTypeName) {
                      <span class="inline-flex max-w-56 items-center gap-1 rounded-lg bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        <mat-icon class="!h-3.5 !w-3.5 !text-[14px] text-slate-400">category</mat-icon>
                        <span class="truncate">{{ row.evaluationTypeName }}</span>
                      </span>
                    }
                    @if (row.positionName) {
                      <span class="inline-flex max-w-52 items-center gap-1 rounded-lg bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        <mat-icon class="!h-3.5 !w-3.5 !text-[14px] text-slate-400">work</mat-icon>
                        <span class="truncate">{{ row.positionName }}</span>
                      </span>
                    }
                    @if (row.competenceName) {
                      <span class="inline-flex max-w-72 items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        <mat-icon class="!h-3.5 !w-3.5 !text-[14px] text-accent">psychology</mat-icon>
                        <span class="truncate">{{ row.competenceName }}</span>
                      </span>
                    }
                    @if (isLongQuestion(row.question)) {
                      <button
                        type="button"
                        class="text-[11px] font-bold text-accent hover:text-indigo-700"
                        (click)="toggleExpand(row.questionId); $event.stopPropagation()"
                      >
                        {{ isExpanded(row.questionId) ? 'Réduire' : 'Lire la suite' }}
                      </button>
                    }
                  </div>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="response">
            <th mat-header-cell *matHeaderCellDef>Réponse</th>
            <td mat-cell *matCellDef="let row">
              <gcc-status-tag
                [status]="responseTypeMeta(row.responseTypeName).kind"
                [label]="responseTypeMeta(row.responseTypeName).label"
              />
            </td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="text-right">
              <div class="inline-flex items-center justify-end gap-1">
                <button
                  class="gcc-icon-btn"
                  type="button"
                  (click)="openDialog(row); $event.stopPropagation()"
                  aria-label="Modifier"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  class="gcc-icon-btn"
                  type="button"
                  (click)="deleteOne(row); $event.stopPropagation()"
                  aria-label="Supprimer"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: columns"
            class="cursor-pointer transition-colors hover:bg-indigo-50/40"
            [class.bg-indigo-50/50]="isSelected(row.questionId)"
            (click)="openDialog(row)"
          ></tr>
        </table>

        <mat-paginator
          [length]="filteredRows().length"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 20, 50]"
          [disabled]="loading()"
          (page)="onPage($event)"
          showFirstLastButtons
          class="border-t border-slate-100"
        />
      </div>
    }
  `,
})
export class SettingsQuestionsPanel implements OnInit {
  private readonly settings = inject(EvaluationSettingsService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly columns = ['question', 'response', 'action'];
  readonly expanded = signal<number[]>([]);
  readonly search = signal('');
  readonly typeFilter = signal<string | null>('all');
  readonly positionFilter = signal<string | null>('all');
  readonly responseFilter = signal<string | null>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly allRows = signal<SettingsQuestion[]>([]);
  readonly types = signal<SettingsEvalType[]>([]);
  readonly positions = signal<PositionOption[]>([]);
  readonly competenceLines = signal<SettingsCompetenceLine[]>([]);
  readonly responseTypes = signal<ResponseTypeOption[]>([]);
  readonly selected = signal<number[]>([]);
  readonly responseTypeMeta = responseTypeMeta;

  readonly typeOptions = computed<GccSelectOption[]>(() => [
    { label: 'Tous les types', value: 'all' },
    ...this.types().map((item) => ({ label: item.designation, value: String(item.evaluationTypeId) })),
  ]);
  readonly positionOptions = computed<GccSelectOption[]>(() => [
    { label: 'Tous les postes', value: 'all' },
    ...this.positions().map((item) => ({ label: item.positionName, value: String(item.positionId) })),
  ]);
  readonly responseOptions = computed<GccSelectOption[]>(() => [
    { label: 'Toutes les réponses', value: 'all' },
    ...this.responseTypes().map((item) => ({ label: item.typeName, value: String(item.responseTypeId) })),
  ]);

  readonly filteredRows = computed(() => {
    const query = this.search().trim().toLowerCase();
    const type = this.typeFilter();
    const position = this.positionFilter();
    const response = this.responseFilter();
    return this.allRows().filter((row) => {
      if (type && type !== 'all' && row.evaluationTypeId !== Number(type)) return false;
      if (position && position !== 'all' && row.positionId !== Number(position)) return false;
      if (response && response !== 'all' && row.responseTypeId !== Number(response)) return false;
      if (query && !row.question.toLowerCase().includes(query)) return false;
      return true;
    });
  });

  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  readonly allPageSelected = computed(() => {
    const rows = this.pagedRows();
    return rows.length > 0 && rows.every((row) => this.selected().includes(row.questionId));
  });

  private searchPrimed = false;

  constructor() {
    this.search$.pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => {
      this.pageIndex.set(0);
    });
    effect(() => {
      const query = this.search();
      untracked(() => {
        if (!this.searchPrimed) {
          this.searchPrimed = true;
          return;
        }
        this.search$.next(query);
      });
    });
  }

  ngOnInit(): void {
    this.reload();
  }

  typeCount(name: string): number {
    return this.allRows().filter((row) => row.responseTypeName.toUpperCase().includes(name)).length;
  }

  hasFilters(): boolean {
    return Boolean(
      this.search().trim() ||
        (this.typeFilter() && this.typeFilter() !== 'all') ||
        (this.positionFilter() && this.positionFilter() !== 'all') ||
        (this.responseFilter() && this.responseFilter() !== 'all'),
    );
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.clearSelection();
  }

  resetFilters(): void {
    this.search.set('');
    this.typeFilter.set('all');
    this.positionFilter.set('all');
    this.responseFilter.set('all');
    this.pageIndex.set(0);
    this.clearSelection();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.clearSelection();
  }

  isSelected(id: number): boolean {
    return this.selected().includes(id);
  }

  isExpanded(id: number): boolean {
    return this.expanded().includes(id);
  }

  isLongQuestion(text: string): boolean {
    return (text || '').length > 110;
  }

  toggleExpand(id: number): void {
    this.expanded.update((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  responseIcon(name: string | null | undefined): string {
    const key = (name || '').toUpperCase();
    if (key.includes('QCM')) return 'checklist';
    if (key.includes('SCORE')) return 'star';
    return 'notes';
  }

  responseIconWrap(name: string | null | undefined): string {
    const key = (name || '').toUpperCase();
    if (key.includes('QCM')) return 'bg-violet-50 text-accent-violet';
    if (key.includes('SCORE')) return 'bg-amber-50 text-amber-700';
    return 'bg-indigo-50 text-accent';
  }

  toggleRow(id: number): void {
    this.selected.update((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  togglePage(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const ids = this.pagedRows().map((row) => row.questionId);
    this.selected.update((current) => {
      if (checked) return [...new Set([...current, ...ids])];
      return current.filter((id) => !ids.includes(id));
    });
  }

  clearSelection(): void {
    this.selected.set([]);
  }

  openDialog(row?: SettingsQuestion): void {
    this.dialog
      .open(SettingsQuestionDialog, {
        width: '40rem',
        maxWidth: '95vw',
        data: {
          question: row ?? null,
          types: this.types(),
          positions: this.positions(),
          competenceLines: this.competenceLines(),
          responseTypes: this.responseTypes(),
        },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        const request = row
          ? this.settings.updateQuestion(row.questionId, payload)
          : this.settings.createQuestion(payload);
        request.subscribe({
          next: () => this.reload(),
          error: () => this.error.set('L’enregistrement a échoué. Vérifiez les champs et vos droits.'),
        });
      });
  }

  deleteOne(row: SettingsQuestion): void {
    this.confirm(`Supprimer cette question ?`, () => {
      this.settings.deleteQuestion(row.questionId).subscribe({
        next: () => this.reload(),
        error: () => this.error.set('La suppression a échoué.'),
      });
    });
  }

  deleteSelected(): void {
    const ids = this.selected();
    this.confirm(`Supprimer ${ids.length} question(s) ?`, () => {
      this.settings.deleteQuestions(ids).subscribe({
        next: () => this.reload(),
        error: () => this.error.set('La suppression groupée a échoué.'),
      });
    });
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.clearSelection();
    forkJoin({
      questions: this.settings.getQuestions(),
      types: this.settings.getEvaluationTypes(),
      positions: this.settings.getPositions(),
      competenceLines: this.settings.getCompetenceLines(),
      responseTypes: this.settings.getResponseTypes(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ questions, types, positions, competenceLines, responseTypes }) => {
          const typeMap = new Map(types.map((item) => [item.evaluationTypeId, item.designation]));
          const positionMap = new Map(positions.map((item) => [item.positionId, item.positionName]));
          const responseMap = new Map(responseTypes.map((item) => [item.responseTypeId, item.typeName]));
          const competenceMap = new Map(competenceLines.map((item) => [item.competenceLineId, item.skillName]));
          this.allRows.set(
            questions.map((row) => ({
              ...row,
              evaluationTypeName: row.evaluationTypeName || typeMap.get(row.evaluationTypeId) || '',
              positionName: row.positionName || positionMap.get(row.positionId) || '',
              responseTypeName: row.responseTypeName || responseMap.get(row.responseTypeId) || 'TEXT',
              competenceName: row.competenceName || (row.competenceLineId ? competenceMap.get(row.competenceLineId) ?? null : null),
            })),
          );
          this.types.set(types);
          this.positions.set(positions);
          this.competenceLines.set(competenceLines);
          this.responseTypes.set(responseTypes);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Vérifiez vos droits (paramétrage des évaluations) ou réessayez.');
          this.loading.set(false);
        },
      });
  }

  private confirm(message: string, onYes: () => void): void {
    this.dialog
      .open(SettingsConfirmDialog, {
        width: '28rem',
        data: { title: 'Confirmation', message, confirmLabel: 'Supprimer', icon: 'delete' },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) onYes();
      });
  }
}
