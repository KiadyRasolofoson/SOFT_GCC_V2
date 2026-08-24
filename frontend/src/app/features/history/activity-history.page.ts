import { Component, computed, inject, signal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ActivityLogItem, ActivityLogService } from '../../core/activity-log.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';

@Component({
  selector: 'app-activity-history-page',
  imports: [GccPageHeader, GccEmptyState, MatTableModule, MatPaginatorModule],
  template: `
    <gcc-page-header
      title="Historiques des actions"
      subtitle="Consultez l'historique des actions effectuées dans l'application."
      icon="history"
      [crumbs]="crumbs"
    />

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger l'historique"
        [message]="error() ?? 'Une erreur est survenue.'"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement de l'historique…
      </div>
    } @else if (rows().length === 0) {
      <gcc-empty-state
        title="Aucun historique disponible"
        message="Aucune action n'a encore été enregistrée."
      />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h2 class="text-base font-semibold text-navy">Liste des historiques</h2>
            <p class="text-xs text-slate-500">{{ totalCount() }} entrée(s)</p>
          </div>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
            {{ totalCount() }} action(s)
          </span>
        </div>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="pagedRows()" class="w-full min-w-[720px]">
            <ng-container matColumnDef="index">
              <th mat-header-cell *matHeaderCellDef class="!w-16 !text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                #
              </th>
              <td mat-cell *matCellDef="let row; let i = index" class="py-4 text-center text-sm text-slate-500">
                {{ rowNumber(i) }}
              </td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                Description
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm font-medium text-navy">
                {{ row.description || '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                Date et heure
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">
                {{ formatDateTime(row.timestamp) }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayColumns;" class="transition-colors hover:bg-slate-50"></tr>
          </table>
        </div>

        <mat-paginator
          [length]="totalCount()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 25, 50, 100]"
          showFirstLastButtons
          (page)="onPageChange($event)"
        />
      </div>
    }
  `,
})
export class ActivityHistoryPage {
  private readonly service = inject(ActivityLogService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Historiques actions' }, { label: 'Liste' }];
  readonly displayColumns = ['index', 'description', 'timestamp'];

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<ActivityLogItem[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly totalCount = computed(() => this.rows().length);
  readonly pagedRows = computed(() =>
    this.rows().slice(this.pageIndex() * this.pageSize(), (this.pageIndex() + 1) * this.pageSize()),
  );

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.rows.set(await this.service.load());
      this.pageIndex.set(0);
    } catch {
      this.rows.set([]);
      this.error.set('Erreur lors de la récupération des données.');
    } finally {
      this.loading.set(false);
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  rowNumber(index: number): number {
    return this.pageIndex() * this.pageSize() + index + 1;
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed);
  }
}
