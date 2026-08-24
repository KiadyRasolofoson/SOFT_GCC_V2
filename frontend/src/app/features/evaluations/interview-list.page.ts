import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { isAdminRole } from '../../core/route-access';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccFilterBar } from '../../ui/gcc-filter-bar';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import { GccSelectOption } from '../../ui/gcc.types';
import {
  employeeFullName,
  hasFunctionalPermission,
  initialsOf,
  INTERVIEW_STATUS,
  InterviewEmployeeRow,
  InterviewParticipantOption,
  interviewStatusMeta,
  InterviewStatistics,
  InterviewStatusKey,
  isValidInterviewDate,
  toLocalDateTimeInput,
} from './evaluation.models';
import { EvaluationService } from './evaluation.service';
import { InterviewScheduleDialog, InterviewScheduleResult } from './interview-schedule.dialog';

@Component({
  selector: 'app-interview-list-page',
  imports: [
    DatePipe,
    GccPageHeader,
    GccFilterBar,
    GccSelect,
    GccKpiCard,
    GccStatusTag,
    GccEmptyState,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <gcc-page-header
      title="Entretien d’évaluation"
      subtitle="Planifiez le créneau, conduisez l’échange et faites valider le compte-rendu par la hiérarchie."
      icon="groups"
      [crumbs]="crumbs"
    />

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <gcc-kpi-card
        label="Dossiers prêts"
        [value]="totalItems().toString()"
        hint="Évaluations terminées, prêtes pour l’entretien"
        tone="neutral"
        icon="assignment_turned_in"
      />
      <gcc-kpi-card
        label="À planifier"
        [value]="statsNone().toString()"
        hint="Sans créneau retenu"
        tone="down"
        icon="event"
      />
      <gcc-kpi-card
        label="Aujourd’hui"
        [value]="statsToday().toString()"
        hint="Entretiens du jour"
        tone="accent"
        icon="today"
      />
      <gcc-kpi-card
        label="En validation"
        [value]="statsPending().toString()"
        hint="Attente manager ou direction"
        tone="up"
        icon="verified_user"
      />
    </div>

    <gcc-filter-bar
      placeholder="Rechercher un salarié, un poste ou un département…"
      [(query)]="search"
      (apply)="applyFilters()"
      (reset)="resetFilters()"
    >
      <gcc-select
        class="w-full shrink-0 lg:w-52"
        [options]="positionOptions()"
        [(value)]="position"
        placeholder="Tous les postes"
      />
      <gcc-select
        class="w-full shrink-0 lg:w-52"
        [options]="departmentOptions()"
        [(value)]="department"
        placeholder="Tous les départements"
      />
      <gcc-select
        class="w-full shrink-0 lg:w-48"
        [options]="statusOptions"
        [(value)]="status"
        placeholder="Tous les statuts"
      />
    </gcc-filter-bar>

    @if (hint()) {
      <div class="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
        <mat-icon class="!h-5 !w-5 !text-[20px] text-amber-600">info</mat-icon>
        <span>{{ hint() }}</span>
      </div>
    }

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger les entretiens"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="load()"
      />
    } @else if (!loading() && !rows().length) {
      <gcc-empty-state
        title="Aucun entretien à afficher"
        message="Aucun salarié ne correspond aux filtres, ou les évaluations n’ont pas encore été notées."
        actionLabel="Réinitialiser les filtres"
        actionIcon="restart_alt"
        (action)="resetFilters()"
      />
    } @else {
      <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table mat-table [dataSource]="rows()" matSort (matSortChange)="onSort($event)" matSortDisableClear class="w-full">
          <ng-container matColumnDef="employee">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="name">Salarié</th>
            <td mat-cell *matCellDef="let row">
              <div class="flex items-center gap-3.5 py-2.5">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-indigo-500 text-xs font-extrabold text-white shadow-xs shadow-accent/20"
                >
                  {{ initialsOf(employeeFullName(row)) }}
                </span>
                <div>
                  <p class="text-sm font-bold leading-snug text-navy">{{ employeeFullName(row) }}</p>
                  <p class="text-[11px] font-medium text-slate-400">Évaluation #{{ row.evaluationId || '—' }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="position">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="position">Poste</th>
            <td mat-cell *matCellDef="let row" class="text-sm font-medium text-slate-700">
              {{ row.position || '—' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="department">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="department">Département</th>
            <td mat-cell *matCellDef="let row">
              <span class="inline-flex items-center rounded-lg bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {{ row.department || '—' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="interviewdate">Créneau</th>
            <td mat-cell *matCellDef="let row" class="text-xs font-semibold text-slate-500">
              @if (isValidInterviewDate(row.interviewDate)) {
                <p class="tabular text-navy">{{ row.interviewDate | date: 'dd MMM yyyy · HH:mm' }}</p>
              } @else {
                <span class="font-medium text-slate-400">Non planifié</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let row">
              <gcc-status-tag [status]="interviewStatusMeta(row).kind" [label]="interviewStatusMeta(row).label" />
            </td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="text-right">
              @if (busyId() === row.employeeId) {
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <mat-icon class="!h-4 !w-4 !text-[16px] animate-pulse">sync</mat-icon>
                  Traitement…
                </span>
              } @else if (cancelTarget()?.employeeId === row.employeeId) {
                <div class="flex flex-wrap items-center justify-end gap-2">
                  <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !text-xs" type="button" (click)="cancelTarget.set(null)">
                    Non
                  </button>
                  <button
                    mat-flat-button
                    class="!rounded-xl !bg-red-600 !text-xs !text-white"
                    type="button"
                    (click)="confirmCancel(row)"
                  >
                    Confirmer
                  </button>
                </div>
              } @else {
                <div class="flex flex-wrap items-center justify-end gap-2">
                  @if (primaryAction(row); as action) {
                    <button
                      mat-flat-button
                      class="gcc-btn-primary !rounded-xl !py-1.5 !text-xs shadow-xs hover:shadow-md"
                      type="button"
                      (click)="runPrimary(row)"
                    >
                      <mat-icon class="!mr-1.5 !h-4 !w-4 !text-[16px]">{{ action.icon }}</mat-icon>
                      {{ action.label }}
                    </button>
                  }
                  @if (canManage() && canEdit(row)) {
                    <button
                      mat-icon-button
                      type="button"
                      class="!text-slate-500"
                      aria-label="Modifier le créneau"
                      (click)="openSchedule(row, 'edit')"
                    >
                      <mat-icon>edit_calendar</mat-icon>
                    </button>
                  }
                  @if (canManage() && canCancel(row)) {
                    <button
                      mat-icon-button
                      type="button"
                      class="!text-slate-500"
                      aria-label="Annuler l’entretien"
                      (click)="askCancel(row)"
                    >
                      <mat-icon>close</mat-icon>
                    </button>
                  }
                </div>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns" class="transition-colors hover:bg-indigo-50/30"></tr>
        </table>

        <mat-paginator
          [length]="totalItems()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 20, 50]"
          [disabled]="loading()"
          (page)="onPage($event)"
          class="border-t border-slate-100"
        />
      </div>
    }
  `,
})
export class InterviewListPage implements OnInit {
  private readonly evaluations = inject(EvaluationService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly crumbs = [{ label: 'Évaluations' }, { label: 'Entretien' }];
  readonly columns = ['employee', 'position', 'department', 'date', 'status', 'action'];
  readonly statusOptions: GccSelectOption[] = [
    { label: 'Tous les statuts', value: 'all' },
    { label: 'À planifier', value: 'none' },
    { label: 'Planifié', value: 'planned' },
    { label: 'Aujourd’hui', value: 'today' },
    { label: 'Manqué', value: 'missed' },
    { label: 'En cours', value: 'inProgress' },
    { label: 'En validation', value: 'pending' },
    { label: 'Terminé', value: 'completed' },
  ];

  readonly search = signal('');
  readonly position = signal<string | null>('all');
  readonly department = signal<string | null>('all');
  readonly status = signal<string | null>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = signal(0);
  readonly sortBy = signal<string | null>('name');
  readonly sortDirection = signal<string | null>('ascending');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hint = signal<string | null>(null);
  readonly allRows = signal<InterviewEmployeeRow[]>([]);
  readonly participants = signal<InterviewParticipantOption[]>([]);
  readonly positionOptions = signal<GccSelectOption[]>([{ label: 'Tous les postes', value: 'all' }]);
  readonly departmentOptions = signal<GccSelectOption[]>([{ label: 'Tous les départements', value: 'all' }]);
  readonly busyId = signal<number | null>(null);
  readonly cancelTarget = signal<InterviewEmployeeRow | null>(null);
  readonly stats = signal<InterviewStatistics>({ totalCount: 0, noneCount: 0, todayCount: 0, pendingCount: 0 });

  readonly employeeFullName = employeeFullName;
  readonly initialsOf = initialsOf;
  readonly interviewStatusMeta = interviewStatusMeta;
  readonly isValidInterviewDate = isValidInterviewDate;

  readonly rows = computed(() => {
    const key = (this.status() ?? 'all') as InterviewStatusKey | 'all';
    if (key === 'all') return this.allRows();
    return this.allRows().filter((row) => interviewStatusMeta(row).key === key);
  });

  readonly statsNone = computed(() => this.stats().noneCount);
  readonly statsToday = computed(() => this.stats().todayCount);
  readonly statsPending = computed(() => this.stats().pendingCount);

  readonly totalItems = computed(() => {
    const fromStats = this.stats().totalCount;
    if (fromStats > 0) return fromStats;
    const pages = this.totalPages();
    const size = this.pageSize();
    const index = this.pageIndex();
    const count = this.allRows().length;
    if (pages <= 0) return count;
    if (index >= pages - 1) return Math.max((pages - 1) * size + count, count);
    return pages * size;
  });

  readonly canManage = computed(() => this.hasPerm('IMPORT_EVALUATION') || this.isAdmin());
  readonly canFill = computed(() => this.hasPerm('FILL_EVALUATION') || this.canManage());
  readonly canValidateManager = computed(() => this.hasPerm('VALIDATE_AS_MANAGER'));
  readonly canValidateDirector = computed(() => this.hasPerm('VALIDATE_AS_DIRECTOR'));

  private searchPrimed = false;

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.pageIndex.set(0);
        this.load();
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
    forkJoin({
      positions: this.evaluations.getInterviewPositions(),
      departments: this.evaluations.getInterviewDepartments(),
      participants: this.evaluations.getInterviewParticipants(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ positions, departments, participants }) => {
          this.positionOptions.set([
            { label: 'Tous les postes', value: 'all' },
            ...positions.map((p) => ({ label: p.positionName, value: String(p.positionId) })),
          ]);
          this.departmentOptions.set([
            { label: 'Tous les départements', value: 'all' },
            ...departments.map((d) => ({ label: d.name, value: String(d.departmentId) })),
          ]);
          this.participants.set(participants);
        },
        error: () => undefined,
      });

    this.load();
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.load();
  }

  resetFilters(): void {
    this.search.set('');
    this.position.set('all');
    this.department.set('all');
    this.status.set('all');
    this.pageIndex.set(0);
    this.load();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onSort(sort: Sort): void {
    this.sortBy.set(sort.active || 'name');
    this.sortDirection.set(sort.direction === 'desc' ? 'descending' : 'ascending');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadStats();
    const position = this.position();
    const department = this.department();

    this.evaluations
      .getInterviewEmployees({
        pageNumber: this.pageIndex() + 1,
        pageSize: this.pageSize(),
        search: this.search().trim() || undefined,
        position: position && position !== 'all' ? Number(position) : null,
        department: department && department !== 'all' ? Number(department) : null,
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection(),
      })
      .subscribe({
        next: (data) => {
          this.allRows.set(this.evaluations.unwrapInterviewEmployees(data));
          this.totalPages.set(data.totalPages ?? data.TotalPages ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Vérifiez vos droits d’accès aux entretiens, ou réessayez.');
          this.loading.set(false);
        },
      });
  }

  private loadStats(): void {
    const position = this.position();
    const department = this.department();
    this.evaluations
      .getInterviewStatistics({
        search: this.search().trim() || undefined,
        position: position && position !== 'all' ? Number(position) : null,
        department: department && department !== 'all' ? Number(department) : null,
      })
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => undefined,
      });
  }

  primaryAction(row: InterviewEmployeeRow): { label: string; icon: string } | null {
    const key = interviewStatusMeta(row).key;
    if (key === 'none' && this.canManage()) return { label: 'Planifier', icon: 'event_available' };
    if (key === 'today' && this.canFill()) return { label: 'Démarrer', icon: 'play_arrow' };
    if (key === 'inProgress' && this.canFill()) return { label: 'Continuer', icon: 'edit_note' };
    if (key === 'pending' && this.canValidate(row)) return { label: 'Valider', icon: 'verified' };
    if (key === 'completed') return { label: 'Consulter', icon: 'visibility' };
    return null;
  }

  canEdit(row: InterviewEmployeeRow): boolean {
    const key = interviewStatusMeta(row).key;
    return key === 'planned' || key === 'today' || key === 'missed';
  }

  canCancel(row: InterviewEmployeeRow): boolean {
    const key = interviewStatusMeta(row).key;
    return key === 'planned' || key === 'today' || key === 'missed' || key === 'pending' || key === 'inProgress';
  }

  canValidate(row: InterviewEmployeeRow): boolean {
    if (this.canValidateManager() && row.managerApproval == null) return true;
    if (this.canValidateDirector() && row.directorApproval == null) return true;
    return false;
  }

  runPrimary(row: InterviewEmployeeRow): void {
    const key = interviewStatusMeta(row).key;
    if (key === 'none') {
      this.openSchedule(row, 'create');
      return;
    }
    if (key === 'today' || key === 'inProgress') {
      this.openFill(row, key === 'today');
      return;
    }
    if (key === 'pending' || key === 'completed') {
      this.openValidation(row);
    }
  }

  openSchedule(row: InterviewEmployeeRow, mode: 'create' | 'edit'): void {
    if (!row.evaluationId) {
      this.hint.set('Impossible de planifier : identifiant d’évaluation manquant.');
      return;
    }

    const open = (selectedIds: number[], scheduledDate: string) => {
      this.dialog
        .open(InterviewScheduleDialog, {
          width: '40rem',
          maxWidth: '95vw',
          data: {
            employee: row,
            participants: this.participants(),
            selectedIds,
            scheduledDate,
            sendEmails: true,
            mode,
          },
        })
        .afterClosed()
        .subscribe((result?: InterviewScheduleResult) => {
          if (!result) return;
          this.evaluations
            .scheduleInterview({
              evaluationId: row.evaluationId!,
              scheduledDate: result.scheduledDate,
              participants: result.participantIds,
              employeeId: row.employeeId,
              sendEmails: result.sendEmails,
            })
            .subscribe({
              next: () => {
                this.hint.set(null);
                this.load();
              },
              error: (err: HttpErrorResponse) => {
                this.hint.set(this.apiMessage(err, 'La planification a échoué.'));
              },
            });
        });
    };

    if (mode === 'edit') {
      this.busyId.set(row.employeeId);
      this.evaluations.getInterviewByParticipant(row.employeeId).subscribe({
        next: (interview) => {
          this.busyId.set(null);
          const date = interview?.interviewDate
            ? toLocalDateTimeInput(new Date(interview.interviewDate))
            : toLocalDateTimeInput(new Date());
          open([], date);
        },
        error: () => {
          this.busyId.set(null);
          this.hint.set('Impossible de récupérer le créneau actuel.');
        },
      });
      return;
    }

    open([], toLocalDateTimeInput(new Date()));
  }

  openFill(row: InterviewEmployeeRow, start: boolean): void {
    this.busyId.set(row.employeeId);
    this.evaluations.getInterviewByParticipant(row.employeeId).subscribe({
      next: (interview) => {
        if (!interview?.interviewId) {
          this.busyId.set(null);
          this.hint.set('Aucun entretien trouvé pour ce salarié.');
          return;
        }
        const go = () => {
          this.busyId.set(null);
          void this.router.navigate(['/soft-gcc/evaluations/entretiens', interview.interviewId], {
            queryParams: { employeeId: row.employeeId },
          });
        };
        if (start && interview.status < INTERVIEW_STATUS.pendingValidation) {
          this.evaluations.startInterview(interview.interviewId).subscribe({
            next: go,
            error: (err: HttpErrorResponse) => {
              this.busyId.set(null);
              this.hint.set(this.apiMessage(err, 'Impossible de démarrer l’entretien.'));
            },
          });
          return;
        }
        go();
      },
      error: () => {
        this.busyId.set(null);
        this.hint.set('Impossible de récupérer l’entretien.');
      },
    });
  }

  openValidation(row: InterviewEmployeeRow): void {
    this.busyId.set(row.employeeId);
    this.evaluations.getInterviewByParticipant(row.employeeId).subscribe({
      next: (interview) => {
        this.busyId.set(null);
        if (!interview?.interviewId) {
          this.hint.set('Aucun entretien trouvé pour ce salarié.');
          return;
        }
        void this.router.navigate(['/soft-gcc/evaluations/entretiens', interview.interviewId, 'validation'], {
          queryParams: { employeeId: row.employeeId },
        });
      },
      error: () => {
        this.busyId.set(null);
        this.hint.set('Impossible de récupérer l’entretien.');
      },
    });
  }

  askCancel(row: InterviewEmployeeRow): void {
    this.cancelTarget.set(row);
  }

  confirmCancel(row: InterviewEmployeeRow): void {
    this.busyId.set(row.employeeId);
    this.evaluations.getInterviewByParticipant(row.employeeId).subscribe({
      next: (interview) => {
        if (!interview?.interviewId) {
          this.busyId.set(null);
          this.cancelTarget.set(null);
          this.hint.set('Aucun entretien à annuler.');
          return;
        }
        this.evaluations.updateInterview(interview.interviewId, { newStatus: INTERVIEW_STATUS.cancelled }).subscribe({
          next: () => {
            this.busyId.set(null);
            this.cancelTarget.set(null);
            this.load();
          },
          error: () => {
            this.busyId.set(null);
            this.cancelTarget.set(null);
            this.hint.set('L’annulation a échoué.');
          },
        });
      },
      error: () => {
        this.busyId.set(null);
        this.cancelTarget.set(null);
        this.hint.set('Impossible de récupérer l’entretien à annuler.');
      },
    });
  }

  private hasPerm(name: string): boolean {
    return hasFunctionalPermission(this.auth.user()?.permissions, name);
  }

  private isAdmin(): boolean {
    return isAdminRole(this.auth.user()?.roleTitle);
  }

  private apiMessage(err: HttpErrorResponse, fallback: string): string {
    const body = err.error as { message?: string } | string | null;
    if (typeof body === 'string' && body.trim()) return body;
    if (body && typeof body === 'object' && body.message) return body.message;
    return fallback;
  }
}
