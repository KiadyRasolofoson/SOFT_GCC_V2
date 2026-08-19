import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { UsersAccessPanel } from './users-access.panel';
import { UsersAccountsPanel } from './users-accounts.panel';
import {
  ACCESS_PERMISSIONS,
  USER_VIEW_PERMISSIONS,
  USER_WRITE_PERMISSIONS,
  USERS_SECTIONS,
  UsersSection,
  hasAnyPermission,
  parseUsersSection,
} from './user.models';

@Component({
  selector: 'app-users-page',
  imports: [GccPageHeader, GccEmptyState, MatTabsModule, MatIconModule, UsersAccountsPanel, UsersAccessPanel],
  template: `
    <gcc-page-header
      title="Utilisateurs & accès"
      subtitle="Un seul espace pour les comptes, les rôles, les pages du menu et les permissions."
      icon="admin_panel_settings"
      [crumbs]="crumbs"
      [actionLabel]="actionLabel()"
      [actionIcon]="actionIcon()"
      (action)="onHeaderAction()"
    />

    @if (!canView()) {
      <gcc-empty-state
        variant="forbidden"
        title="Accès restreint"
        message="Cette administration est réservée aux profils autorisés à gérer les comptes ou les permissions."
      />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
        <mat-tab-group
          class="gcc-tabs"
          animationDuration="0"
          [selectedIndex]="tabIndex()"
          (selectedIndexChange)="onTabChange($event)"
        >
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="inline-flex items-center gap-1.5">
                <mat-icon class="!h-4 !w-4 !text-[16px]">group</mat-icon>
                Comptes
              </span>
            </ng-template>
            <div class="pt-5">
              @if (section() === 'utilisateurs') {
                <app-users-accounts-panel
                  [canWrite]="canWrite()"
                  [canAccess]="canAccess()"
                  (openAccess)="openAccess($event)"
                />
              }
            </div>
          </mat-tab>
          @if (canAccess()) {
            <mat-tab>
              <ng-template mat-tab-label>
                <span class="inline-flex items-center gap-1.5">
                  <mat-icon class="!h-4 !w-4 !text-[16px]">admin_panel_settings</mat-icon>
                  Accès
                </span>
              </ng-template>
              <div class="pt-5">
                @if (section() === 'acces') {
                  <app-users-access-panel [focusRoleId]="focusRoleId()" />
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      </div>
    }
  `,
})
export class UsersPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly accountsPanel = viewChild(UsersAccountsPanel);
  private readonly accessPanel = viewChild(UsersAccessPanel);

  readonly crumbs = [{ label: 'Paramètres' }, { label: 'Utilisateurs' }];
  readonly section = signal<UsersSection>('utilisateurs');
  readonly focusRoleId = signal<number | null>(null);

  readonly canView = computed(() =>
    hasAnyPermission(this.auth.user()?.permissions, USER_VIEW_PERMISSIONS),
  );
  readonly canWrite = computed(() =>
    hasAnyPermission(this.auth.user()?.permissions, USER_WRITE_PERMISSIONS),
  );
  readonly canAccess = computed(() =>
    hasAnyPermission(this.auth.user()?.permissions, ACCESS_PERMISSIONS),
  );

  readonly tabIndex = computed(() => {
    const visible = this.visibleSections();
    const index = visible.findIndex((item) => item.id === this.section());
    return Math.max(0, index);
  });

  readonly actionLabel = computed(() => {
    if (this.section() === 'utilisateurs') return this.canWrite() ? 'Nouveau compte' : '';
    if (!this.canAccess()) return '';
    switch (this.accessPanel()?.workspace()) {
      case 'catalogue':
        return 'Nouveau module';
      default:
        return 'Nouveau rôle';
    }
  });

  readonly actionIcon = computed(() => (this.section() === 'utilisateurs' ? 'person_add' : 'add'));

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.applySection(parseUsersSection(params.get('section')));
    });
  }

  ngOnInit(): void {
    this.applySection(parseUsersSection(this.route.snapshot.paramMap.get('section')));
  }

  onTabChange(index: number): void {
    const next = this.visibleSections()[index];
    if (next && next.id !== this.section()) this.selectSection(next.id);
  }

  selectSection(section: UsersSection): void {
    const path =
      section === 'utilisateurs'
        ? '/soft-gcc/parametres/utilisateurs'
        : '/soft-gcc/parametres/utilisateurs/acces';
    void this.router.navigateByUrl(path);
  }

  openAccess(roleId: number): void {
    if (!this.canAccess() || !roleId) return;
    this.focusRoleId.set(roleId);
    this.selectSection('acces');
  }

  onHeaderAction(): void {
    if (this.section() === 'utilisateurs') {
      this.accountsPanel()?.openDialog();
      return;
    }
    const panel = this.accessPanel();
    if (!panel) return;
    switch (panel.workspace()) {
      case 'catalogue':
        panel.openModuleDialog();
        break;
      default:
        panel.openRoleDialog();
        break;
    }
  }

  private visibleSections() {
    return USERS_SECTIONS.filter((item) => item.id !== 'acces' || this.canAccess());
  }

  private applySection(section: UsersSection): void {
    if (section === 'acces' && !this.canAccess()) {
      this.section.set('utilisateurs');
      return;
    }
    this.section.set(section);
  }
}
