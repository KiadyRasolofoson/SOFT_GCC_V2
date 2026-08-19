import { Component, computed, effect, inject, input, OnInit, signal, untracked } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { toMaterialIcon } from '../../core/icon-map';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import { UserAdminService } from './user-admin.service';
import { UsersConfirmDialog } from './users-confirm.dialog';
import { RoleDialog } from './role.dialog';
import { ModuleDialog } from './module.dialog';
import { PermissionDialog } from './permission.dialog';
import {
  AccessWorkspace,
  AdminModule,
  AdminPermission,
  AdminRole,
  AdminUser,
  buildPermissionGroups,
  childSelectionState,
  collectAllModuleIds,
  flattenModuleTree,
  formatPermissionName,
  PermissionGroup,
  toggleModuleSelection,
  userDisplayName,
  userInitials,
} from './user.models';

const RECONNECT_HINT =
  'Les utilisateurs concernés doivent se reconnecter pour voir le nouveau menu et les nouvelles permissions.';

@Component({
  selector: 'app-users-access-panel',
  imports: [GccKpiCard, GccEmptyState, GccStatusTag, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <gcc-kpi-card label="Rôles" [value]="roles().length.toString()" hint="Profils configurables" tone="neutral" icon="badge" />
      <gcc-kpi-card label="Pages" [value]="flatModules().length.toString()" hint="Modules du menu" tone="accent" icon="view_module" />
      <gcc-kpi-card
        label="Permissions"
        [value]="permissions().length.toString()"
        hint="Droits métier"
        tone="up"
        icon="verified_user"
      />
      <gcc-kpi-card
        label="Comptes liés"
        [value]="members().length.toString()"
        [hint]="selectedRole() ? 'Rôle sélectionné' : 'Choisissez un rôle'"
        tone="down"
        icon="group"
      />
    </div>

    <div class="mb-5 flex flex-wrap gap-2">
      @for (item of workspaces; track item.id) {
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition"
          [class]="
            workspace() === item.id
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          "
          (click)="workspace.set(item.id)"
        >
          <mat-icon class="!h-4 !w-4 !text-[16px]">{{ item.icon }}</mat-icon>
          {{ item.label }}
        </button>
      }
    </div>

    @if (notice()) {
      <div class="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-xs font-semibold leading-relaxed text-indigo-800">
        {{ notice() }}
      </div>
    }

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" class="mb-4" />
    }

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger les accès"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="reload()"
      />
    } @else if (workspace() === 'catalogue') {
      <div class="grid gap-5 xl:grid-cols-2">
        <section class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <header class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p class="text-sm font-bold text-navy">Modules & pages</p>
              <p class="text-[11px] font-medium text-slate-500">Ordre d’affichage du menu</p>
            </div>
            <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !text-xs" type="button" (click)="openModuleDialog()">
              <mat-icon class="!mr-1 !h-4 !w-4 !text-[16px]">add</mat-icon>
              Racine
            </button>
          </header>
          @if (!catalogRoots().length) {
            <div class="p-4">
              <gcc-empty-state title="Aucun module" message="Créez un module racine pour structurer le menu." actionLabel="Nouveau module" actionIcon="add" (action)="openModuleDialog()" />
            </div>
          } @else {
            <ul class="divide-y divide-slate-100">
              @for (root of catalogRoots(); track root.moduleId) {
                <li>
                  <div class="flex items-center gap-3 px-4 py-3">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                      <mat-icon class="!h-5 !w-5 !text-[20px]">{{ iconOf(root.icon) }}</mat-icon>
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-bold text-navy">{{ root.displayName }}</p>
                      <p class="truncate text-[11px] font-medium text-slate-400">{{ root.route || root.name }}</p>
                    </div>
                    <span class="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                      {{ root.permissions.length }} perm.
                    </span>
                    <button class="gcc-icon-btn" type="button" (click)="openModuleDialog(root)" aria-label="Modifier">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button class="gcc-icon-btn" type="button" (click)="openModuleDialog(null, root.moduleId)" aria-label="Ajouter une page">
                      <mat-icon>add</mat-icon>
                    </button>
                    <button class="gcc-icon-btn" type="button" (click)="deleteModule(root)" aria-label="Supprimer">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                  @for (child of root.childModules; track child.moduleId) {
                    <div class="flex items-center gap-3 border-t border-slate-50 bg-slate-50/60 py-2.5 pr-4 pl-12">
                      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500">
                        <mat-icon class="!h-4 !w-4 !text-[16px]">{{ iconOf(child.icon) }}</mat-icon>
                      </span>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-semibold text-navy">{{ child.displayName }}</p>
                        <p class="truncate text-[11px] text-slate-400">{{ child.route || 'Sans route' }}</p>
                      </div>
                      <button class="gcc-icon-btn" type="button" (click)="moveChild(root, child, -1)" aria-label="Monter">
                        <mat-icon>keyboard_arrow_up</mat-icon>
                      </button>
                      <button class="gcc-icon-btn" type="button" (click)="moveChild(root, child, 1)" aria-label="Descendre">
                        <mat-icon>keyboard_arrow_down</mat-icon>
                      </button>
                      <button class="gcc-icon-btn" type="button" (click)="openModuleDialog(child)" aria-label="Modifier">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button class="gcc-icon-btn" type="button" (click)="deleteModule(child)" aria-label="Supprimer">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  }
                </li>
              }
            </ul>
          }
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <header class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p class="text-sm font-bold text-navy">Catalogue des permissions</p>
              <p class="text-[11px] font-medium text-slate-500">Clés métier rattachées aux modules</p>
            </div>
            <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !text-xs" type="button" (click)="openPermissionDialog()">
              <mat-icon class="!mr-1 !h-4 !w-4 !text-[16px]">add</mat-icon>
              Permission
            </button>
          </header>
          <div class="max-h-[36rem] space-y-3 overflow-y-auto p-4">
            @for (group of permissionGroups(); track group.key) {
              <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">{{ group.label }}</p>
                  <span class="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">{{ group.permissions.length }}</span>
                </div>
                @if (!group.permissions.length) {
                  <p class="text-xs text-slate-400">Aucune permission liée à ce module.</p>
                } @else {
                  <ul class="space-y-1.5">
                    @for (perm of group.permissions; track perm.permissionId) {
                      <li class="flex items-start justify-between gap-2 rounded-xl bg-white px-3 py-2">
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-navy">{{ formatName(perm.name) }}</p>
                          <p class="font-mono text-[10px] text-slate-400">{{ perm.name }}</p>
                          @if (perm.description) {
                            <p class="mt-0.5 text-[11px] text-slate-500">{{ perm.description }}</p>
                          }
                        </div>
                        <button class="gcc-icon-btn" type="button" (click)="openPermissionDialog(perm)" aria-label="Modifier">
                          <mat-icon>edit</mat-icon>
                        </button>
                      </li>
                    }
                  </ul>
                }
              </div>
            }
          </div>
        </section>
      </div>
    } @else {
      <div class="grid gap-5 lg:grid-cols-12">
        <aside class="lg:col-span-4">
          <section class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <header class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <p class="text-sm font-bold text-navy">Rôles</p>
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !text-xs" type="button" (click)="openRoleDialog()">
                <mat-icon class="!mr-1 !h-4 !w-4 !text-[16px]">add</mat-icon>
                Rôle
              </button>
            </header>
            <label class="mx-4 mt-3 flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3">
              <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400">search</mat-icon>
              <input
                class="min-w-0 flex-1 border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
                placeholder="Filtrer un rôle…"
                [value]="roleQuery()"
                (input)="roleQuery.set($any($event.target).value)"
              />
            </label>
            <ul class="max-h-[32rem] overflow-y-auto p-2">
              @for (role of filteredRoles(); track role.roleId) {
                <li>
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                    [class]="selectedRole()?.roleId === role.roleId ? 'bg-indigo-50 ring-1 ring-indigo-100' : 'hover:bg-slate-50'"
                    (click)="selectRole(role)"
                  >
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold text-navy">{{ role.title }}</span>
                      <gcc-status-tag class="mt-1 inline-flex" [status]="role.state === 1 ? 'ok' : 'pending'" [label]="role.state === 1 ? 'Actif' : 'Inactif'" />
                    </span>
                    <span class="inline-flex gap-1" (click)="$event.stopPropagation()">
                      <button class="gcc-icon-btn" type="button" (click)="openRoleDialog(role)" aria-label="Modifier">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button class="gcc-icon-btn" type="button" (click)="deleteRole(role)" aria-label="Supprimer">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </span>
                  </button>
                </li>
              } @empty {
                <li class="px-3 py-8 text-center text-xs font-medium text-slate-400">Aucun rôle</li>
              }
            </ul>
          </section>
        </aside>

        <div class="lg:col-span-8">
          @if (!selectedRole()) {
            <gcc-empty-state
              title="Sélectionnez un rôle"
              message="Choisissez un rôle à gauche pour composer ses pages visibles et ses permissions, et voir les comptes qui l’utilisent."
            />
          } @else if (loadingAccess()) {
            <div class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <mat-progress-bar mode="indeterminate" class="mx-auto max-w-xs" />
              <p class="mt-4 text-sm text-slate-500">Chargement des droits de {{ selectedRole()!.title }}…</p>
            </div>
          } @else {
            <div class="mb-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-lg font-bold text-navy">{{ selectedRole()!.title }}</p>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ selectedModuleIds().length }} page(s) · {{ selectedPermissionIds().length }} permission(s)
                  </p>
                </div>
                <gcc-status-tag [status]="selectedRole()!.state === 1 ? 'ok' : 'pending'" [label]="selectedRole()!.state === 1 ? 'Actif' : 'Inactif'" />
              </div>
              @if (members().length) {
                <div class="mt-4 flex flex-wrap gap-2">
                  @for (user of members(); track user.userId) {
                    <span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pr-2.5 pl-1">
                      <span class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-indigo-500 text-[9px] font-extrabold text-white">
                        {{ initials(user) }}
                      </span>
                      <span class="text-[11px] font-semibold text-navy">{{ displayName(user) }}</span>
                    </span>
                  }
                </div>
              } @else {
                <p class="mt-3 text-xs text-slate-400">Aucun compte chargé n’utilise encore ce rôle.</p>
              }
            </div>

            @if (workspace() === 'pages') {
              <section class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div>
                    <p class="text-sm font-bold text-navy">Pages visibles dans le menu</p>
                    <p class="text-[11px] font-medium text-slate-500">Cocher un parent sélectionne toutes ses pages.</p>
                  </div>
                  <div class="flex gap-2">
                    <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !text-xs" type="button" (click)="toggleAllModules()">
                      {{ modulesAllSelected() ? 'Tout désélectionner' : 'Tout sélectionner' }}
                    </button>
                    <button mat-flat-button class="gcc-btn-primary !rounded-xl !text-xs" type="button" [disabled]="savingModules()" (click)="saveModules()">
                      {{ savingModules() ? 'Enregistrement…' : 'Enregistrer' }}
                    </button>
                  </div>
                </header>
                <div class="max-h-[28rem] overflow-y-auto p-3">
                  @for (mod of flatModules(); track mod.moduleId) {
                    <button
                      type="button"
                      class="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                      [class]="isModuleChecked(mod.moduleId) ? 'bg-indigo-50' : 'hover:bg-slate-50'"
                      [style.padding-left.px]="12 + mod.depth * 20"
                      (click)="toggleModule(mod.moduleId)"
                    >
                      <span
                        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
                        [class]="
                          isModuleIndeterminate(mod)
                            ? 'border-indigo-300 bg-indigo-100'
                            : isModuleChecked(mod.moduleId)
                              ? 'border-accent bg-accent text-white'
                              : 'border-slate-300 bg-white'
                        "
                      >
                        @if (isModuleChecked(mod.moduleId)) {
                          <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">check</mat-icon>
                        } @else if (isModuleIndeterminate(mod)) {
                          <span class="block h-0.5 w-2.5 rounded bg-indigo-600"></span>
                        }
                      </span>
                      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-100">
                        <mat-icon class="!h-4 !w-4 !text-[16px]">{{ iconOf(mod.icon) }}</mat-icon>
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-semibold text-navy">{{ mod.displayName || mod.name }}</span>
                        <span class="truncate text-[11px] text-slate-400">{{ mod.route || (mod.parentModuleId ? 'Sans route' : 'Module racine') }}</span>
                      </span>
                    </button>
                  }
                </div>
              </section>
            } @else {
              <section class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div>
                    <p class="text-sm font-bold text-navy">
                      Permissions ({{ selectedPermissionIds().length }}/{{ permissionIds().length }})
                    </p>
                    <p class="text-[11px] font-medium text-slate-500">Droits fins, indépendants de la visibilité du menu.</p>
                  </div>
                  <div class="flex gap-2">
                    <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !text-xs" type="button" (click)="toggleAllPermissions()">
                      {{ permissionsAllSelected() ? 'Tout décocher' : 'Tout cocher' }}
                    </button>
                    <button mat-flat-button class="gcc-btn-primary !rounded-xl !text-xs" type="button" [disabled]="savingPerms()" (click)="savePermissions()">
                      {{ savingPerms() ? 'Enregistrement…' : 'Enregistrer' }}
                    </button>
                  </div>
                </header>
                <div class="max-h-[28rem] space-y-3 overflow-y-auto p-4">
                  @for (group of permissionGroups(); track group.key) {
                    <div class="rounded-2xl border border-slate-100">
                      <div class="flex items-center justify-between gap-2 px-3 py-2">
                        <button type="button" class="flex min-w-0 items-center gap-2 text-left" (click)="toggleGroup(group.label)">
                          <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400">
                            {{ expandedGroups()[group.label] === false ? 'chevron_right' : 'expand_more' }}
                          </mat-icon>
                          <span class="truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">{{ group.label }}</span>
                          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{{ group.permissions.length }}</span>
                        </button>
                        <button
                          mat-stroked-button
                          class="gcc-btn-secondary !rounded-lg !text-[11px]"
                          type="button"
                          [disabled]="!group.permissions.length"
                          (click)="toggleGroupPermissions(group)"
                        >
                          {{ groupAllSelected(group) ? 'Décocher' : 'Tout cocher' }}
                        </button>
                      </div>
                      @if (expandedGroups()[group.label] !== false) {
                        <div class="grid gap-2 border-t border-slate-100 p-3 sm:grid-cols-2">
                          @for (perm of group.permissions; track perm.permissionId) {
                            <button
                              type="button"
                              class="flex items-start gap-2 rounded-xl border px-3 py-2 text-left transition"
                              [class]="isPermissionChecked(perm.permissionId) ? 'border-indigo-200 bg-indigo-50' : 'border-slate-100 bg-white hover:border-slate-200'"
                              (click)="togglePermission(perm.permissionId)"
                            >
                              <span
                                class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                                [class]="isPermissionChecked(perm.permissionId) ? 'border-accent bg-accent text-white' : 'border-slate-300'"
                              >
                                @if (isPermissionChecked(perm.permissionId)) {
                                  <mat-icon class="!h-3 !w-3 !text-[12px]">check</mat-icon>
                                }
                              </span>
                              <span class="min-w-0">
                                <span class="block text-xs font-bold text-navy">{{ formatName(perm.name) }}</span>
                                <span class="block font-mono text-[10px] text-slate-400">{{ perm.name }}</span>
                              </span>
                            </button>
                          } @empty {
                            <p class="col-span-2 text-xs text-slate-400">Aucune permission liée.</p>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </section>
            }
          }
        </div>
      </div>
    }
  `,
})
export class UsersAccessPanel implements OnInit {
  private readonly api = inject(UserAdminService);
  private readonly dialog = inject(MatDialog);

  readonly focusRoleId = input<number | null>(null);
  readonly workspace = signal<AccessWorkspace>('pages');
  readonly workspaces: { id: AccessWorkspace; label: string; icon: string }[] = [
    { id: 'pages', label: 'Pages visibles', icon: 'menu' },
    { id: 'permissions', label: 'Permissions', icon: 'lock' },
    { id: 'catalogue', label: 'Catalogue', icon: 'view_module' },
  ];

  readonly loading = signal(false);
  readonly loadingAccess = signal(false);
  readonly savingModules = signal(false);
  readonly savingPerms = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly roleQuery = signal('');
  readonly roles = signal<AdminRole[]>([]);
  readonly modules = signal<AdminModule[]>([]);
  readonly catalogRoots = signal<AdminModule[]>([]);
  readonly permissions = signal<AdminPermission[]>([]);
  readonly users = signal<AdminUser[]>([]);
  readonly selectedRole = signal<AdminRole | null>(null);
  readonly selectedModuleIds = signal<number[]>([]);
  readonly selectedPermissionIds = signal<number[]>([]);
  readonly expandedGroups = signal<Record<string, boolean>>({});
  readonly iconOf = toMaterialIcon;
  readonly formatName = formatPermissionName;
  readonly initials = userInitials;
  readonly displayName = userDisplayName;

  readonly filteredRoles = computed(() => {
    const q = this.roleQuery().trim().toLowerCase();
    return this.roles().filter((role) => !q || role.title.toLowerCase().includes(q));
  });
  readonly flatModules = computed(() => flattenModuleTree(this.modules()));
  readonly permissionGroups = computed(() => buildPermissionGroups(this.modules(), this.permissions()));
  readonly permissionIds = computed(() => this.permissions().map((item) => item.permissionId));
  readonly members = computed(() => {
    const role = this.selectedRole();
    if (!role) return [];
    return this.users().filter((user) => user.roleId === role.roleId);
  });
  readonly modulesAllSelected = computed(() => {
    const ids = collectAllModuleIds(this.modules());
    return ids.length > 0 && ids.every((id) => this.selectedModuleIds().includes(id));
  });
  readonly permissionsAllSelected = computed(() => {
    const ids = this.permissionIds();
    return ids.length > 0 && ids.every((id) => this.selectedPermissionIds().includes(id));
  });

  constructor() {
    effect(() => {
      const id = this.focusRoleId();
      const roles = this.roles();
      if (!id || !roles.length) return;
      const role = roles.find((item) => item.roleId === id);
      if (role && this.selectedRole()?.roleId !== id) {
        untracked(() => this.selectRole(role));
      }
    });
  }

  ngOnInit(): void {
    this.reload();
  }

  isModuleChecked(id: number): boolean {
    return this.selectedModuleIds().includes(id);
  }

  isModuleIndeterminate(mod: AdminModule): boolean {
    if (mod.parentModuleId || this.isModuleChecked(mod.moduleId)) return false;
    return childSelectionState(mod, this.selectedModuleIds()).some;
  }

  isPermissionChecked(id: number): boolean {
    return this.selectedPermissionIds().includes(id);
  }

  groupAllSelected(group: PermissionGroup): boolean {
    const ids = group.permissions.map((item) => item.permissionId);
    return ids.length > 0 && ids.every((id) => this.selectedPermissionIds().includes(id));
  }

  toggleModule(id: number): void {
    this.selectedModuleIds.set(toggleModuleSelection(this.modules(), this.selectedModuleIds(), id));
  }

  toggleAllModules(): void {
    const ids = collectAllModuleIds(this.modules());
    this.selectedModuleIds.set(this.modulesAllSelected() ? [] : ids);
  }

  togglePermission(id: number): void {
    this.selectedPermissionIds.update((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  toggleAllPermissions(): void {
    this.selectedPermissionIds.set(this.permissionsAllSelected() ? [] : [...this.permissionIds()]);
  }

  toggleGroup(label: string): void {
    this.expandedGroups.update((current) => ({ ...current, [label]: current[label] === false }));
  }

  toggleGroupPermissions(group: PermissionGroup): void {
    const ids = group.permissions.map((item) => item.permissionId);
    const all = this.groupAllSelected(group);
    this.selectedPermissionIds.update((current) =>
      all ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])],
    );
  }

  selectRole(role: AdminRole): void {
    this.selectedRole.set(role);
    this.loadingAccess.set(true);
    this.notice.set(null);
    forkJoin({
      modules: this.api.getRoleModules(role.roleId),
      permissions: this.api.getRolePermissions(role.roleId),
    }).subscribe({
      next: ({ modules, permissions }) => {
        this.selectedModuleIds.set(modules.map((item) => item.moduleId));
        this.selectedPermissionIds.set(permissions.map((item) => item.permissionId));
        this.loadingAccess.set(false);
      },
      error: () => {
        this.selectedModuleIds.set([]);
        this.selectedPermissionIds.set([]);
        this.loadingAccess.set(false);
      },
    });
  }

  saveModules(): void {
    const role = this.selectedRole();
    if (!role) return;
    this.savingModules.set(true);
    this.api.updateRoleModules(role.roleId, this.selectedModuleIds()).subscribe({
      next: () => {
        this.savingModules.set(false);
        this.notice.set(`${this.selectedModuleIds().length} page(s) associées à « ${role.title } ». ${RECONNECT_HINT}`);
      },
      error: (err) => {
        this.savingModules.set(false);
        this.error.set(this.api.httpMessage(err, 'La sauvegarde des pages a échoué.'));
      },
    });
  }

  savePermissions(): void {
    const role = this.selectedRole();
    if (!role) return;
    this.savingPerms.set(true);
    this.api.updateRolePermissions(role.roleId, this.selectedPermissionIds()).subscribe({
      next: () => {
        this.savingPerms.set(false);
        const extra = this.selectedModuleIds().length === 0
          ? ' Cochez aussi des pages visibles, sinon le menu restera vide.'
          : '';
        this.notice.set(
          `${this.selectedPermissionIds().length} permission(s) assignée(s) à « ${role.title } ». ${RECONNECT_HINT}${extra}`,
        );
      },
      error: (err) => {
        this.savingPerms.set(false);
        this.error.set(this.api.httpMessage(err, 'La sauvegarde des permissions a échoué.'));
      },
    });
  }

  openRoleDialog(role?: AdminRole): void {
    this.dialog
      .open(RoleDialog, { width: '28rem', maxWidth: '95vw', data: { role: role ?? null } })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        const request = role ? this.api.updateRole(payload) : this.api.createRole(payload);
        request.subscribe({
          next: () => this.reload(true),
          error: (err) => this.error.set(this.api.httpMessage(err, 'L’enregistrement du rôle a échoué.')),
        });
      });
  }

  deleteRole(role: AdminRole): void {
    this.confirm(`Supprimer le rôle « ${role.title } » ?`, () => {
      this.api.deleteRole(role.roleId).subscribe({
        next: () => {
          if (this.selectedRole()?.roleId === role.roleId) this.selectedRole.set(null);
          this.reload(true);
        },
        error: (err) => this.error.set(this.api.httpMessage(err, 'La suppression du rôle a échoué.')),
      });
    });
  }

  openModuleDialog(mod?: AdminModule | null, parentId?: number): void {
    const parents = flattenModuleTree(this.catalogRoots());
    this.dialog
      .open(ModuleDialog, {
        width: '40rem',
        maxWidth: '95vw',
        data: { module: mod ?? null, parents, presetParentId: parentId ?? null },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        const request = mod ? this.api.updateModule(payload) : this.api.createModule(payload);
        request.subscribe({
          next: () => this.reload(true),
          error: (err) => this.error.set(this.api.httpMessage(err, 'L’enregistrement du module a échoué.')),
        });
      });
  }

  deleteModule(mod: AdminModule): void {
    this.confirm(`Supprimer « ${mod.displayName } » et ses sous-pages ?`, () => {
      this.api.deleteModule(mod.moduleId).subscribe({
        next: () => this.reload(true),
        error: (err) => this.error.set(this.api.httpMessage(err, 'Impossible de supprimer ce module.')),
      });
    });
  }

  moveChild(parent: AdminModule, child: AdminModule, direction: -1 | 1): void {
    const siblings = [...parent.childModules];
    const index = siblings.findIndex((item) => item.moduleId === child.moduleId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= siblings.length) return;
    const [moved] = siblings.splice(index, 1);
    siblings.splice(next, 0, moved);
    const items = siblings.map((item, sortOrder) => ({
      moduleId: item.moduleId,
      sortOrder: sortOrder + 1,
      parentModuleId: parent.moduleId,
    }));
    this.api.reorderModules(items).subscribe({
      next: () => this.reload(true),
      error: (err) => this.error.set(this.api.httpMessage(err, 'Le réordonnancement a échoué.')),
    });
  }

  openPermissionDialog(perm?: AdminPermission): void {
    this.dialog
      .open(PermissionDialog, {
        width: '32rem',
        maxWidth: '95vw',
        data: { permission: perm ?? null, modules: this.modules() },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        const request = perm ? this.api.updatePermission(payload) : this.api.createPermission(payload);
        request.subscribe({
          next: () => this.reload(true),
          error: (err) => this.error.set(this.api.httpMessage(err, 'L’enregistrement de la permission a échoué.')),
        });
      });
  }

  reload(keepSelection = false): void {
    const selectedId = keepSelection ? this.selectedRole()?.roleId ?? null : this.focusRoleId();
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      roles: this.api.getRoles(),
      modules: this.api.getModules(),
      catalog: this.api.getModulesWithPermissions(),
      permissions: this.api.getPermissions(),
      users: this.api.getUsers(1, 50, ''),
    }).subscribe({
      next: ({ roles, modules, catalog, permissions, users }) => {
        this.roles.set(roles);
        this.modules.set(modules);
        this.catalogRoots.set(catalog);
        this.permissions.set(permissions);
        this.users.set(users.users);
        const expanded: Record<string, boolean> = {};
        buildPermissionGroups(modules, permissions).forEach((group) => {
          expanded[group.label] = true;
        });
        this.expandedGroups.set(expanded);
        this.loading.set(false);
        const next = roles.find((role) => role.roleId === selectedId) ?? this.selectedRole();
        if (next && roles.some((role) => role.roleId === next.roleId)) this.selectRole(next);
      },
      error: (err) => {
        this.error.set(this.api.httpMessage(err, 'Vérifiez le droit MANAGE_PERMISSIONS ou réessayez.'));
        this.loading.set(false);
      },
    });
  }

  private confirm(message: string, action: () => void): void {
    this.dialog
      .open(UsersConfirmDialog, {
        width: '28rem',
        data: { title: 'Confirmer', message, confirmLabel: 'Supprimer', icon: 'delete' },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) action();
      });
  }
}
