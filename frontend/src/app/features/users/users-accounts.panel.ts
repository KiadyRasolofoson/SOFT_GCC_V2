import { Component, computed, effect, inject, input, OnInit, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccFilterBar } from '../../ui/gcc-filter-bar';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccSelect } from '../../ui/gcc-select';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import { GccSelectOption } from '../../ui/gcc.types';
import { UserAdminService } from './user-admin.service';
import { UserDialog } from './user.dialog';
import {
  AdminRole,
  AdminUser,
  userDisplayName,
  userInitials,
} from './user.models';

@Component({
  selector: 'app-users-accounts-panel',
  imports: [
    GccFilterBar,
    GccSelect,
    GccKpiCard,
    GccStatusTag,
    GccEmptyState,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <gcc-kpi-card
        label="Comptes"
        [value]="totalCount().toString()"
        hint="Comptes correspondant à la recherche"
        tone="neutral"
        icon="group"
      />
      <gcc-kpi-card
        label="Rôles"
        [value]="roles().length.toString()"
        hint="Profils d’accès disponibles"
        tone="accent"
        icon="badge"
      />
      <gcc-kpi-card
        label="Actifs"
        [value]="activeRoleCount().toString()"
        hint="Rôles attribuables"
        tone="up"
        icon="verified_user"
      />
      <gcc-kpi-card
        label="Sans e-mail"
        [value]="missingEmailTotal().toString()"
        hint="Comptes sans e-mail (total)"
        tone="down"
        icon="mail"
      />
    </div>

    <gcc-filter-bar
      placeholder="Rechercher un nom, un identifiant ou un e-mail…"
      [(query)]="search"
      (apply)="applyFilters()"
      (reset)="resetFilters()"
    >
      <gcc-select
        class="w-full shrink-0 lg:w-52"
        [options]="roleOptions()"
        [(value)]="roleFilter"
        placeholder="Tous les rôles"
      />
    </gcc-filter-bar>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" class="mb-4" />
    }

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger les comptes"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="reload()"
      />
    } @else if (!loading() && !filteredRows().length) {
      <gcc-empty-state
        title="Aucun compte"
        [message]="hasFilters() ? 'Aucun résultat pour ces filtres.' : 'Créez le premier compte utilisateur.'"
        [actionLabel]="hasFilters() ? 'Réinitialiser les filtres' : canWrite() ? 'Nouveau compte' : ''"
        [actionIcon]="hasFilters() ? 'restart_alt' : 'person_add'"
        (action)="hasFilters() ? resetFilters() : openDialog()"
      />
    } @else {
      <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table mat-table [dataSource]="filteredRows()" class="w-full">
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>Compte</th>
            <td mat-cell *matCellDef="let row">
              <div class="flex items-center gap-3 py-2.5">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-indigo-500 text-[11px] font-extrabold text-white"
                >
                  {{ initials(row) }}
                </span>
                <div class="min-w-0">
                  <p class="truncate text-sm font-bold text-navy">{{ displayName(row) }}</p>
                  <p class="truncate text-[11px] font-medium text-slate-500">{{ row.username || 'Sans identifiant' }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>E-mail</th>
            <td mat-cell *matCellDef="let row">
              <span class="text-sm text-slate-600">{{ row.email || '—' }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Rôle</th>
            <td mat-cell *matCellDef="let row">
              <gcc-status-tag [status]="row.roleId ? 'processed' : 'pending'" [label]="roleTitle(row)" />
            </td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="text-right">
              <div class="inline-flex items-center justify-end gap-1">
                @if (canAccess()) {
                  <button
                    class="gcc-icon-btn"
                    type="button"
                    (click)="openAccess.emit(row.roleId); $event.stopPropagation()"
                    aria-label="Configurer les accès"
                    [disabled]="!row.roleId"
                  >
                    <mat-icon>admin_panel_settings</mat-icon>
                  </button>
                }
                @if (canWrite()) {
                  <button class="gcc-icon-btn" type="button" (click)="openDialog(row); $event.stopPropagation()" aria-label="Modifier">
                    <mat-icon>edit</mat-icon>
                  </button>
                }
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: columns"
            class="cursor-pointer transition-colors hover:bg-indigo-50/40"
            (click)="canWrite() ? openDialog(row) : null"
          ></tr>
        </table>

        <mat-paginator
          [length]="totalLength()"
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
export class UsersAccountsPanel implements OnInit {
  private readonly api = inject(UserAdminService);
  private readonly dialog = inject(MatDialog);
  private readonly search$ = new Subject<string>();

  readonly canWrite = input(false);
  readonly canAccess = input(false);
  readonly openAccess = output<number>();

  readonly columns = ['user', 'email', 'role', 'action'];
  readonly search = signal('');
  readonly roleFilter = signal<string | null>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<AdminUser[]>([]);
  readonly roles = signal<AdminRole[]>([]);
  readonly totalCount = signal(0);
  readonly missingEmailTotal = signal(0);
  readonly initials = userInitials;
  readonly displayName = userDisplayName;

  readonly roleOptions = computed<GccSelectOption[]>(() => [
    { label: 'Tous les rôles', value: 'all' },
    ...this.roles().map((role) => ({ label: role.title, value: String(role.roleId) })),
  ]);

  readonly filteredRows = computed(() => {
    const role = this.roleFilter();
    if (!role || role === 'all') return this.rows();
    return this.rows().filter((row) => row.roleId === Number(role));
  });

  readonly totalLength = computed(() => {
    const count = this.totalCount();
    if (count > 0) return count;
    return Math.max(this.totalPages() * this.pageSize(), this.rows().length);
  });

  private searchPrimed = false;

  constructor() {
    this.search$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => {
      this.pageIndex.set(0);
      this.reloadUsers();
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

  activeRoleCount(): number {
    return this.roles().filter((role) => role.state === 1).length;
  }

  roleTitle(row: AdminUser): string {
    return row.roleTitle || this.roles().find((role) => role.roleId === row.roleId)?.title || 'Sans rôle';
  }

  hasFilters(): boolean {
    return Boolean(this.search().trim() || (this.roleFilter() && this.roleFilter() !== 'all'));
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.reloadUsers();
  }

  resetFilters(): void {
    this.search.set('');
    this.roleFilter.set('all');
    this.pageIndex.set(0);
    this.reloadUsers();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.reloadUsers();
  }

  openDialog(row?: AdminUser): void {
    if (!this.canWrite()) return;
    this.dialog
      .open(UserDialog, {
        width: '40rem',
        maxWidth: '95vw',
        data: { user: row ?? null, roles: this.roles() },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        const request = row ? this.api.updateUser(payload) : this.api.createUser(payload);
        request.subscribe({
          next: () => this.reloadUsers(),
          error: (err) => this.error.set(this.api.httpMessage(err, 'L’enregistrement du compte a échoué.')),
        });
      });
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      page: this.api.getUsers(this.pageIndex() + 1, this.pageSize(), this.search()),
      roles: this.api.getRoles(),
    }).subscribe({
      next: ({ page, roles }) => {
        this.rows.set(page.users);
        this.totalPages.set(Math.max(1, page.totalPages));
        this.totalCount.set(page.totalCount ?? 0);
        this.missingEmailTotal.set(page.missingEmailCount ?? 0);
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.api.httpMessage(err, 'Vérifiez vos droits ou réessayez.'));
        this.loading.set(false);
      },
    });
  }

  private reloadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getUsers(this.pageIndex() + 1, this.pageSize(), this.search()).subscribe({
      next: (page) => {
        this.rows.set(page.users);
        this.totalPages.set(Math.max(1, page.totalPages));
        this.totalCount.set(page.totalCount ?? 0);
        this.missingEmailTotal.set(page.missingEmailCount ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.api.httpMessage(err, 'Impossible de recharger les comptes.'));
        this.loading.set(false);
      },
    });
  }
}
