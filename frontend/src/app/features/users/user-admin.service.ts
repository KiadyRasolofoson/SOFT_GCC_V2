import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminModule,
  AdminPermission,
  AdminRole,
  AdminUser,
  ModulePayload,
  PaginatedUsers,
  PermissionPayload,
  RolePayload,
  UserPayload,
} from './user.models';

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getUsers(pageNumber: number, pageSize: number, search: string): Observable<PaginatedUsers> {
    return this.http
      .get<unknown>(`${this.api}/User/paginated`, {
        params: {
          pageNumber,
          pageSize,
          search: search.trim(),
        },
      })
      .pipe(map((raw) => this.normalizeUsersPage(raw, pageNumber, pageSize)));
  }

  getRoles(): Observable<AdminRole[]> {
    return this.http.get<unknown>(`${this.api}/Role`).pipe(
      map((raw) => this.normalizeRoles(raw)),
      catchError(() =>
        this.http.get<unknown>(`${this.api}/User/roles`).pipe(
          map((raw) => this.normalizeRoles(raw)),
          catchError(() => of([])),
        ),
      ),
    );
  }

  createRole(payload: RolePayload): Observable<unknown> {
    return this.http.post(`${this.api}/Role`, { title: payload.title, state: payload.state });
  }

  updateRole(payload: RolePayload): Observable<unknown> {
    return this.http.put(`${this.api}/Role/${payload.roleId}`, {
      roleid: payload.roleId,
      roleId: payload.roleId,
      title: payload.title,
      state: payload.state,
    });
  }

  deleteRole(roleId: number): Observable<unknown> {
    return this.http.delete(`${this.api}/Role/${roleId}`);
  }

  createUser(payload: UserPayload): Observable<unknown> {
    return this.http.post(`${this.api}/Authentification/register`, {
      lastName: payload.lastName,
      firstName: payload.firstName,
      username: payload.username,
      email: payload.email,
      password: payload.password,
      roleId: payload.roleId,
    });
  }

  updateUser(payload: UserPayload): Observable<unknown> {
    return this.http.post(`${this.api}/Authentification/update`, {
      userId: payload.userId,
      lastName: payload.lastName,
      firstName: payload.firstName,
      username: payload.username,
      email: payload.email,
      roleId: payload.roleId,
    });
  }

  getModules(): Observable<AdminModule[]> {
    return this.http.get<unknown>(`${this.api}/Module`).pipe(
      map((raw) => this.normalizeModules(raw)),
      catchError(() => of([])),
    );
  }

  getModulesWithPermissions(): Observable<AdminModule[]> {
    return this.http.get<unknown>(`${this.api}/Module/with-permissions`).pipe(
      map((raw) => this.normalizeModules(raw).filter((item) => !item.parentModuleId)),
      catchError(() => of([])),
    );
  }

  createModule(payload: ModulePayload): Observable<unknown> {
    return this.http.post(`${this.api}/Module`, this.toModuleBody(payload));
  }

  updateModule(payload: ModulePayload): Observable<unknown> {
    return this.http.put(`${this.api}/Module/${payload.moduleId}`, {
      ...this.toModuleBody(payload),
      moduleId: payload.moduleId,
      state: 1,
    });
  }

  deleteModule(moduleId: number): Observable<unknown> {
    return this.http.delete(`${this.api}/Module/${moduleId}`);
  }

  reorderModules(items: { moduleId: number; sortOrder: number; parentModuleId: number | null }[]): Observable<unknown> {
    return this.http.put(`${this.api}/Module/reorder`, { items });
  }

  getRoleModules(roleId: number): Observable<AdminModule[]> {
    return this.http.get<unknown>(`${this.api}/Module/role/${roleId}`).pipe(
      map((raw) => this.normalizeModules(raw)),
      catchError(() => of([])),
    );
  }

  updateRoleModules(roleId: number, moduleIds: number[]): Observable<unknown> {
    return this.http.put(`${this.api}/Module/role/${roleId}`, { moduleIds });
  }

  getPermissions(): Observable<AdminPermission[]> {
    return this.http.get<unknown>(`${this.api}/Permission`).pipe(
      map((raw) => this.normalizePermissions(raw)),
      catchError(() => of([])),
    );
  }

  getRolePermissions(roleId: number): Observable<AdminPermission[]> {
    return this.http.get<unknown>(`${this.api}/Permission/role/${roleId}`).pipe(
      map((raw) => this.normalizePermissions(raw)),
      catchError(() => of([])),
    );
  }

  updateRolePermissions(roleId: number, permissionIds: number[]): Observable<unknown> {
    return this.http.put(`${this.api}/Permission/role/${roleId}`, { permissionIds });
  }

  createPermission(payload: PermissionPayload): Observable<unknown> {
    return this.http.post(`${this.api}/Permission`, {
      name: payload.name,
      description: payload.description,
      moduleId: payload.moduleId,
    });
  }

  updatePermission(payload: PermissionPayload): Observable<unknown> {
    return this.http.put(`${this.api}/Permission/${payload.permissionId}`, {
      permissionId: payload.permissionId,
      name: payload.name,
      description: payload.description,
      moduleId: payload.moduleId,
    });
  }

  httpMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) return fallback;
    const data = err.error;
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (data && typeof data === 'object') {
      const msg = (data as { message?: unknown; Message?: unknown }).message ?? (data as { Message?: unknown }).Message;
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
    }
    return fallback;
  }

  private toModuleBody(payload: ModulePayload) {
    return {
      name: payload.name.trim(),
      displayName: payload.displayName.trim(),
      icon: payload.icon.trim(),
      route: payload.route.trim() || null,
      parentModuleId: payload.parentModuleId,
      sortOrder: payload.sortOrder,
      description: payload.description.trim() || null,
      state: 1,
    };
  }

  private normalizeUsersPage(raw: unknown, pageNumber: number, pageSize: number): PaginatedUsers {
    const row = this.asRecord(raw);
    const users = this.asArray(this.pick(row, 'users', 'Users')).map((item) => this.normalizeUser(item));
    return {
      users: users.filter((item) => item.userId > 0),
      totalPages: this.asNumber(this.pick(row, 'totalPages', 'TotalPages')) || 1,
      currentPage: this.asNumber(this.pick(row, 'currentPage', 'CurrentPage')) || pageNumber,
      pageSize: this.asNumber(this.pick(row, 'pageSize', 'PageSize')) || pageSize,
      totalCount: this.asNumber(this.pick(row, 'totalCount', 'TotalCount')) || 0,
      missingEmailCount: this.asNumber(this.pick(row, 'missingEmailCount', 'MissingEmailCount')) || 0,
    };
  }

  private normalizeUser(raw: unknown): AdminUser {
    const row = this.asRecord(raw);
    const role = this.asRecord(this.pick(row, 'role', 'Role'));
    return {
      userId: this.asNumber(this.pick(row, 'userId', 'UserId', 'id', 'Id')) ?? 0,
      firstName: this.asString(this.pick(row, 'firstName', 'FirstName')) ?? '',
      lastName: this.asString(this.pick(row, 'lastName', 'LastName')) ?? '',
      username: this.asString(this.pick(row, 'username', 'Username', 'userName', 'UserName')) ?? '',
      email: this.asString(this.pick(row, 'email', 'Email')) ?? '',
      roleId: this.asNumber(this.pick(row, 'roleId', 'RoleId')) ?? 0,
      roleTitle:
        this.asString(this.pick(role, 'title', 'Title', 'name', 'Name')) ??
        this.asString(this.pick(row, 'roleTitle', 'RoleTitle', 'roleName', 'RoleName')) ??
        '',
    };
  }

  private normalizeRoles(raw: unknown): AdminRole[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        return {
          roleId: this.asNumber(this.pick(row, 'roleId', 'RoleId', 'roleid', 'Roleid')) ?? 0,
          title: this.asString(this.pick(row, 'title', 'Title', 'name', 'Name')) ?? '',
          state: this.asNumber(this.pick(row, 'state', 'State')) ?? 1,
        };
      })
      .filter((item) => item.roleId > 0 && item.title);
  }

  private normalizePermissions(raw: unknown): AdminPermission[] {
    return this.asArray(raw)
      .map((item) => {
        const row = this.asRecord(item);
        return {
          permissionId: this.asNumber(this.pick(row, 'permissionId', 'PermissionId')) ?? 0,
          name: this.asString(this.pick(row, 'name', 'Name')) ?? '',
          description: this.asString(this.pick(row, 'description', 'Description')) ?? '',
          moduleId: this.asNumber(this.pick(row, 'moduleId', 'ModuleId')),
          moduleName: this.asString(this.pick(row, 'moduleName', 'ModuleName')) ?? '',
          moduleDisplayName:
            this.asString(this.pick(row, 'moduleDisplayName', 'ModuleDisplayName')) ??
            this.asString(this.pick(row, 'moduleName', 'ModuleName')) ??
            '',
        };
      })
      .filter((item) => item.permissionId > 0);
  }

  private normalizeModules(raw: unknown): AdminModule[] {
    return this.asArray(raw)
      .map((item) => this.normalizeModule(item))
      .filter((item): item is AdminModule => item != null);
  }

  private normalizeModule(raw: unknown): AdminModule | null {
    const row = this.asRecord(raw);
    const moduleId = this.asNumber(this.pick(row, 'moduleId', 'ModuleId'));
    if (!moduleId) return null;
    const parentRaw = this.pick(row, 'parentModuleId', 'ParentModuleId');
    const children = this.asArray(this.pick(row, 'childModules', 'ChildModules'))
      .map((item) => this.normalizeModule(item))
      .filter((item): item is AdminModule => item != null);
    return {
      moduleId,
      parentModuleId: parentRaw == null || parentRaw === '' ? null : this.asNumber(parentRaw),
      name: this.asString(this.pick(row, 'name', 'Name')) ?? '',
      displayName: this.asString(this.pick(row, 'displayName', 'DisplayName')) ?? '',
      icon: this.asString(this.pick(row, 'icon', 'Icon')) ?? '',
      route: this.asString(this.pick(row, 'route', 'Route')) ?? '',
      sortOrder: this.asNumber(this.pick(row, 'sortOrder', 'SortOrder')) ?? 0,
      description: this.asString(this.pick(row, 'description', 'Description')) ?? '',
      permissions: this.normalizePermissions(this.pick(row, 'permissions', 'Permissions')),
      childModules: children,
    };
  }

  private pick(raw: Record<string, unknown>, ...keys: string[]): unknown {
    for (const key of keys) {
      if (raw[key] != null && raw[key] !== '') return raw[key];
    }
    return null;
  }

  private asNumber(value: unknown): number | null {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private asString(value: unknown): string | null {
    if (value == null) return null;
    const text = String(value).trim();
    return text && text.toLowerCase() !== 'null' ? text : null;
  }

  private asArray(raw: unknown): unknown[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const row = raw as Record<string, unknown>;
      const nested = row['items'] ?? row['Items'] ?? row['data'] ?? row['Data'];
      if (Array.isArray(nested)) return nested;
    }
    return [];
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }
}
