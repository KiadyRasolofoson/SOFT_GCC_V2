import { GccSelectOption } from '../../ui/gcc.types';

export type UsersSection = 'utilisateurs' | 'acces';
export type AccessWorkspace = 'pages' | 'permissions' | 'catalogue';

export const USER_VIEW_PERMISSIONS = [
  'VIEW_USERS',
  'CREATE_USERS',
  'EDIT_USERS',
  'DELETE_USERS',
  'MANAGE_PERMISSIONS',
] as const;

export const USER_WRITE_PERMISSIONS = ['CREATE_USERS', 'EDIT_USERS', 'MANAGE_PERMISSIONS'] as const;
export const ACCESS_PERMISSIONS = ['MANAGE_PERMISSIONS'] as const;

export const USERS_SECTIONS: { id: UsersSection; label: string; icon: string }[] = [
  { id: 'utilisateurs', label: 'Comptes', icon: 'group' },
  { id: 'acces', label: 'Accès', icon: 'admin_panel_settings' },
];

export const MODULE_ICON_OPTIONS: GccSelectOption[] = [
  { label: 'Tableau de bord', value: 'dashboard' },
  { label: 'Utilisateurs', value: 'group' },
  { label: 'Personne', value: 'person' },
  { label: 'Badge', value: 'badge' },
  { label: 'Sécurité', value: 'admin_panel_settings' },
  { label: 'Bouclier', value: 'shield' },
  { label: 'Cadenas', value: 'lock' },
  { label: 'Clé', value: 'key' },
  { label: 'Travail', value: 'work' },
  { label: 'Évaluations', value: 'fact_check' },
  { label: 'Organigramme', value: 'account_tree' },
  { label: 'Historique', value: 'history' },
  { label: 'Paramètres', value: 'settings' },
  { label: 'Réglages', value: 'tune' },
  { label: 'Étoile', value: 'star' },
  { label: 'Formation', value: 'school' },
  { label: 'Questionnaire', value: 'quiz' },
  { label: 'Graphique', value: 'bar_chart' },
  { label: 'Camembert', value: 'pie_chart' },
  { label: 'Dossier', value: 'folder' },
  { label: 'Document', value: 'description' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Applications', value: 'apps' },
  { label: 'Accueil', value: 'home' },
  { label: 'Certification', value: 'workspace_premium' },
];

export interface AdminUser {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  roleId: number;
  roleTitle: string;
}

export interface PaginatedUsers {
  users: AdminUser[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AdminRole {
  roleId: number;
  title: string;
  state: number;
}

export interface AdminPermission {
  permissionId: number;
  name: string;
  description: string;
  moduleId: number | null;
  moduleName: string;
  moduleDisplayName: string;
}

export interface AdminModule {
  moduleId: number;
  parentModuleId: number | null;
  name: string;
  displayName: string;
  icon: string;
  route: string;
  sortOrder: number;
  description: string;
  permissions: AdminPermission[];
  childModules: AdminModule[];
}

export interface FlatAdminModule extends AdminModule {
  depth: number;
}

export interface PermissionGroup {
  key: string;
  label: string;
  permissions: AdminPermission[];
}

export interface UserPayload {
  userId?: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  roleId: number;
  password?: string;
}

export interface RolePayload {
  roleId?: number;
  title: string;
  state: number;
}

export interface ModulePayload {
  moduleId?: number;
  name: string;
  displayName: string;
  icon: string;
  route: string;
  parentModuleId: number | null;
  sortOrder: number;
  description: string;
}

export interface PermissionPayload {
  permissionId?: number;
  name: string;
  description: string;
  moduleId: number | null;
}

export function hasAnyPermission(permissions: string[] | undefined, names: readonly string[]): boolean {
  const set = (permissions ?? []).map((item) => String(item).trim().toUpperCase());
  return names.some((name) => set.includes(name.trim().toUpperCase()));
}

export function parseUsersSection(value: string | null | undefined): UsersSection {
  const key = (value || '').trim().toLowerCase();
  if (key === 'acces' || key === 'administration' || key === 'droits' || key === 'roles' || key === 'permissions') {
    return 'acces';
  }
  return 'utilisateurs';
}

export function userInitials(user: Pick<AdminUser, 'firstName' | 'lastName' | 'username'>): string {
  const a = (user.firstName?.[0] ?? '').toUpperCase();
  const b = (user.lastName?.[0] ?? '').toUpperCase();
  return `${a}${b}` || (user.username?.[0] ?? 'U').toUpperCase();
}

export function userDisplayName(user: Pick<AdminUser, 'firstName' | 'lastName' | 'username'>): string {
  return `${user.lastName} ${user.firstName}`.trim() || user.username || 'Utilisateur';
}

export function formatPermissionName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function flattenModuleTree(modules: AdminModule[], depth = 0): FlatAdminModule[] {
  const result: FlatAdminModule[] = [];
  for (const mod of modules) {
    result.push({ ...mod, depth });
    if (mod.childModules.length) result.push(...flattenModuleTree(mod.childModules, depth + 1));
  }
  return result;
}

export function collectAllModuleIds(modules: AdminModule[]): number[] {
  return flattenModuleTree(modules).map((item) => item.moduleId);
}

export function collectDescendantIds(mod: AdminModule): number[] {
  const ids: number[] = [];
  for (const child of mod.childModules) {
    ids.push(child.moduleId, ...collectDescendantIds(child));
  }
  return ids;
}

export function findModuleInTree(modules: AdminModule[], id: number): AdminModule | null {
  for (const mod of modules) {
    if (mod.moduleId === id) return mod;
    const nested = findModuleInTree(mod.childModules, id);
    if (nested) return nested;
  }
  return null;
}

export function buildPermissionGroups(modules: AdminModule[], permissions: AdminPermission[]): PermissionGroup[] {
  const perms = [...permissions];
  const roots = modules.filter((item) => !item.parentModuleId);
  const used = new Set<number>();
  const groups: PermissionGroup[] = [];

  const branchIds = (root: AdminModule) => {
    const ids = new Set<number>([root.moduleId]);
    for (const child of root.childModules) ids.add(child.moduleId);
    return ids;
  };

  for (const root of roots) {
    const ids = branchIds(root);
    const nameKey = (root.name || '').toLowerCase();
    const matched = perms.filter((perm) => {
      if (perm.moduleId != null && ids.has(perm.moduleId)) return true;
      const moduleName = (perm.moduleName || '').toLowerCase();
      return moduleName === nameKey || moduleName.startsWith(`${nameKey}_`) || moduleName.startsWith(`param_${nameKey}`);
    });
    matched.forEach((perm) => used.add(perm.permissionId));
    groups.push({
      key: `mod-${root.moduleId}`,
      label: root.displayName || root.name || `Module #${root.moduleId}`,
      permissions: matched,
    });
  }

  const orphans = perms.filter((perm) => !used.has(perm.permissionId));
  if (orphans.length) {
    const byLabel = new Map<string, AdminPermission[]>();
    for (const perm of orphans) {
      const label = perm.moduleDisplayName || perm.moduleName || 'Autres permissions';
      const list = byLabel.get(label) ?? [];
      list.push(perm);
      byLabel.set(label, list);
    }
    for (const [label, list] of byLabel) {
      groups.push({ key: `orphan-${label}`, label, permissions: list });
    }
  }

  return groups;
}

export function toggleModuleSelection(modules: AdminModule[], selected: number[], moduleId: number): number[] {
  const mod = findModuleInTree(modules, moduleId);
  const descendantIds = mod ? collectDescendantIds(mod) : [];
  const parentId = mod?.parentModuleId ?? null;
  const next = new Set(selected);
  const turningOff = next.has(moduleId);

  if (turningOff) {
    next.delete(moduleId);
    descendantIds.forEach((id) => next.delete(id));
    if (parentId != null) next.delete(parentId);
  } else {
    next.add(moduleId);
    descendantIds.forEach((id) => next.add(id));
    if (parentId != null) {
      const parent = findModuleInTree(modules, parentId);
      const siblingIds = (parent?.childModules ?? []).map((child) => child.moduleId);
      if (siblingIds.length && siblingIds.every((id) => next.has(id))) next.add(parentId);
    }
  }

  return [...next];
}

export function childSelectionState(mod: AdminModule, selected: number[]): { some: boolean; all: boolean } {
  const childIds = (mod.childModules ?? []).map((child) => child.moduleId);
  if (!childIds.length) return { some: false, all: false };
  const count = childIds.filter((id) => selected.includes(id)).length;
  return { some: count > 0 && count < childIds.length, all: count === childIds.length };
}
