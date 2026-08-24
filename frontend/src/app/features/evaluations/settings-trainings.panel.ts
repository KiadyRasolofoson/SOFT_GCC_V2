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
import { SettingsEvalType, SettingsQuestion, SettingsTraining } from './evaluation.models';
import { EvaluationSettingsService } from './evaluation-settings.service';
import { SettingsConfirmDialog } from './settings-confirm.dialog';
import { SettingsTrainingDialog } from './settings-training.dialog';

@Component({
  selector: 'app-settings-trainings-panel',
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
      <gcc-kpi-card label="Suggestions" [value]="allRows().length.toString()" hint="Catalogue de formations" tone="neutral" icon="school" />
      <gcc-kpi-card label="Seuil moyen" [value]="averageThreshold()" hint="Score / 5 déclencheur" tone="accent" icon="tune" />
      <gcc-kpi-card label="Types couverts" [value]="coveredTypes().toString()" hint="Campagnes reliées" tone="up" icon="category" />
      <gcc-kpi-card
        label="Filtrées"
        [value]="filteredRows().length.toString()"
        hint="Résultats affichés"
        tone="down"
        icon="filter_alt"
      />
    </div>

    <gcc-filter-bar
      placeholder="Rechercher une formation ou un détail…"
      [(query)]="search"
      (apply)="applyFilters()"
      (reset)="resetFilters()"
    >
      <gcc-select class="w-full shrink-0 lg:w-52" [options]="typeOptions()" [(value)]="typeFilter" placeholder="Tous les types" />
      <gcc-select class="w-full shrink-0 lg:w-40" [options]="thresholdOptions" [(value)]="thresholdFilter" placeholder="Tous les seuils" />
    </gcc-filter-bar>

    @if (selected().length) {
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
        <p class="text-xs font-bold text-navy">{{ selected().length }} suggestion(s) sélectionnée(s)</p>
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
        title="Impossible de charger les formations"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="reload()"
      />
    } @else if (!loading() && !pagedRows().length) {
      <gcc-empty-state
        title="Aucune suggestion"
        [message]="hasFilters() ? 'Aucun résultat pour ces filtres.' : 'Associez une formation à une question mal notée.'"
        [actionLabel]="hasFilters() ? 'Réinitialiser les filtres' : 'Nouvelle suggestion'"
        [actionIcon]="hasFilters() ? 'restart_alt' : 'add'"
        (action)="hasFilters() ? resetFilters() : openDialog()"
      />
    } @else {
      <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table mat-table [dataSource]="pagedRows()" class="w-full">
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef class="w-10">
              <input type="checkbox" class="accent-indigo-600" [checked]="allPageSelected()" (change)="togglePage($event)" />
            </th>
            <td mat-cell *matCellDef="let row">
              <input
                type="checkbox"
                class="accent-indigo-600"
                [checked]="isSelected(row.trainingSuggestionId)"
                (change)="toggleRow(row.trainingSuggestionId)"
                (click)="$event.stopPropagation()"
              />
            </td>
          </ng-container>

          <ng-container matColumnDef="training">
            <th mat-header-cell *matHeaderCellDef>Formation</th>
            <td mat-cell *matCellDef="let row">
              <p class="text-sm font-bold text-navy">{{ row.training }}</p>
              @if (row.details) {
                <p class="mt-1 max-w-lg text-[11px] leading-relaxed text-slate-500">{{ row.details }}</p>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="question">
            <th mat-header-cell *matHeaderCellDef>Question</th>
            <td mat-cell *matCellDef="let row" class="max-w-sm text-xs font-medium leading-snug text-slate-600">
              {{ row.questionText || 'Question #' + row.questionId }}
            </td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let row" class="text-xs font-semibold text-slate-600">
              {{ row.evaluationTypeName || '—' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="threshold">
            <th mat-header-cell *matHeaderCellDef>Seuil</th>
            <td mat-cell *matCellDef="let row">
              <gcc-status-tag status="gap" [label]="'≤ ' + row.scoreThreshold + ' / 5'" />
            </td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="text-right">
              <div class="inline-flex items-center justify-end gap-1">
                <button class="gcc-icon-btn" type="button" (click)="openDialog(row); $event.stopPropagation()" aria-label="Modifier">
                  <mat-icon>edit</mat-icon>
                </button>
                <button class="gcc-icon-btn" type="button" (click)="deleteOne(row); $event.stopPropagation()" aria-label="Supprimer">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns" class="transition-colors hover:bg-indigo-50/30"></tr>
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
export class SettingsTrainingsPanel implements OnInit {
  private readonly settings = inject(EvaluationSettingsService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly columns = ['select', 'training', 'question', 'type', 'threshold', 'action'];
  readonly thresholdOptions: GccSelectOption[] = [
    { label: 'Tous les seuils', value: 'all' },
    ...[1, 2, 3, 4, 5].map((value) => ({ label: `≤ ${value}`, value: String(value) })),
  ];
  readonly search = signal('');
  readonly typeFilter = signal<string | null>('all');
  readonly thresholdFilter = signal<string | null>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly allRows = signal<SettingsTraining[]>([]);
  readonly types = signal<SettingsEvalType[]>([]);
  readonly questions = signal<SettingsQuestion[]>([]);
  readonly selected = signal<number[]>([]);

  readonly typeOptions = computed<GccSelectOption[]>(() => [
    { label: 'Tous les types', value: 'all' },
    ...this.types().map((item) => ({ label: item.designation, value: String(item.evaluationTypeId) })),
  ]);

  readonly filteredRows = computed(() => {
    const query = this.search().trim().toLowerCase();
    const type = this.typeFilter();
    const threshold = this.thresholdFilter();
    return this.allRows().filter((row) => {
      if (type && type !== 'all' && row.evaluationTypeId !== Number(type)) return false;
      if (threshold && threshold !== 'all' && row.scoreThreshold !== Number(threshold)) return false;
      if (query && !(row.training + ' ' + row.details).toLowerCase().includes(query)) return false;
      return true;
    });
  });

  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  readonly allPageSelected = computed(() => {
    const rows = this.pagedRows();
    return rows.length > 0 && rows.every((row) => this.selected().includes(row.trainingSuggestionId));
  });

  readonly coveredTypes = computed(
    () => new Set(this.allRows().map((row) => row.evaluationTypeId).filter(Boolean)).size,
  );

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

  averageThreshold(): string {
    const rows = this.allRows();
    if (!rows.length) return '—';
    const avg = rows.reduce((sum, row) => sum + row.scoreThreshold, 0) / rows.length;
    return avg.toFixed(1) + ' / 5';
  }

  hasFilters(): boolean {
    return Boolean(
      this.search().trim() ||
        (this.typeFilter() && this.typeFilter() !== 'all') ||
        (this.thresholdFilter() && this.thresholdFilter() !== 'all'),
    );
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.clearSelection();
  }

  resetFilters(): void {
    this.search.set('');
    this.typeFilter.set('all');
    this.thresholdFilter.set('all');
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

  toggleRow(id: number): void {
    this.selected.update((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  togglePage(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const ids = this.pagedRows().map((row) => row.trainingSuggestionId);
    this.selected.update((current) => {
      if (checked) return [...new Set([...current, ...ids])];
      return current.filter((id) => !ids.includes(id));
    });
  }

  clearSelection(): void {
    this.selected.set([]);
  }

  openDialog(row?: SettingsTraining): void {
    this.dialog
      .open(SettingsTrainingDialog, {
        width: '40rem',
        maxWidth: '95vw',
        data: { training: row ?? null, types: this.types(), questions: this.questions() },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        const request = row
          ? this.settings.updateTraining(row.trainingSuggestionId, payload)
          : this.settings.createTraining(payload);
        request.subscribe({
          next: () => this.reload(),
          error: () => this.error.set('L’enregistrement a échoué. Vérifiez les champs et vos droits.'),
        });
      });
  }

  deleteOne(row: SettingsTraining): void {
    this.confirm('Supprimer cette suggestion de formation ?', () => {
      this.settings.deleteTraining(row.trainingSuggestionId).subscribe({
        next: () => this.reload(),
        error: () => this.error.set('La suppression a échoué.'),
      });
    });
  }

  deleteSelected(): void {
    const ids = this.selected();
    this.confirm(`Supprimer ${ids.length} suggestion(s) ?`, () => {
      this.settings.deleteTrainings(ids).subscribe({
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
      trainings: this.settings.getTrainings(),
      types: this.settings.getEvaluationTypes(),
      questions: this.settings.getQuestions(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ trainings, types, questions }) => {
          const typeMap = new Map(types.map((item) => [item.evaluationTypeId, item.designation]));
          const questionMap = new Map(questions.map((item) => [item.questionId, item.question]));
          this.allRows.set(
            trainings.map((row) => ({
              ...row,
              evaluationTypeName: row.evaluationTypeName || typeMap.get(row.evaluationTypeId) || '',
              questionText: row.questionText || questionMap.get(row.questionId) || '',
            })),
          );
          this.types.set(types);
          this.questions.set(questions);
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
