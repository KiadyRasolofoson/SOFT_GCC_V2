import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AccessMap, AppModule, UserProfile } from './models';
import { checkRouteAccess, isAdminRole } from './route-access';

const TOKEN_KEY = 'token';
const PROFILE_KEY = 'userProfile';

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

function toId(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeModule(raw: Record<string, unknown> | null): AppModule | null {
  if (!raw || typeof raw !== 'object') return null;
  const moduleId = toId(raw['moduleId'] ?? raw['ModuleId']);
  if (moduleId == null) return null;
  const parentRaw = raw['parentModuleId'] ?? raw['ParentModuleId'];
  const children = asArray<Record<string, unknown>>(raw['childModules'] ?? raw['ChildModules']);
  return {
    moduleId,
    parentModuleId: parentRaw == null || parentRaw === '' ? null : toId(parentRaw),
    name: String(raw['name'] ?? raw['Name'] ?? ''),
    displayName: String(raw['displayName'] ?? raw['DisplayName'] ?? ''),
    icon: String(raw['icon'] ?? raw['Icon'] ?? ''),
    route: String(raw['route'] ?? raw['Route'] ?? ''),
    sortOrder: Number(raw['sortOrder'] ?? raw['SortOrder'] ?? 0),
    childModules: children.map(normalizeModule).filter((m): m is AppModule => m != null),
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<UserProfile | null>(null);
  readonly myModules = signal<AppModule[]>([]);
  readonly allowedRoutes = signal<string[]>([]);
  readonly catalogRoutes = signal<string[]>([]);
  readonly initialized = signal(false);
  readonly loading = signal(false);

  readonly isAuthenticated = computed(() => {
    const value = this.token();
    return Boolean(value && this.isTokenValid(value) && this.user());
  });

  readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    return full || u.userName || u.email;
  });

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    const a = (u.firstName?.[0] ?? '').toUpperCase();
    const b = (u.lastName?.[0] ?? '').toUpperCase();
    return `${a}${b}` || (u.userName?.[0] ?? 'U').toUpperCase();
  });

  readonly sortedModules = computed(() =>
    [...this.myModules()].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
  );

  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      return Boolean(payload.exp && payload.exp * 1000 > Date.now());
    } catch {
      return false;
    }
  }

  canAccessRoute(pathname: string): boolean {
    if (isAdminRole(this.user()?.roleTitle)) return true;
    return checkRouteAccess(pathname, this.allowedRoutes(), this.catalogRoutes());
  }

  async login(identifier: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<{ token: string }>(`${environment.apiUrl}/Authentification/login`, {
        identifier,
        password,
      }),
    );
    this.persistToken(response.token);
    const ok = await this.fetchSession();
    if (!ok) {
      this.clearSession();
      throw new Error('Impossible de charger le profil utilisateur.');
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized()) return;
    this.loading.set(true);
    const stored = this.token();
    if (!stored || !this.isTokenValid(stored)) {
      this.clearSession();
      this.initialized.set(true);
      this.loading.set(false);
      return;
    }
    const ok = await this.fetchSession();
    if (!ok) this.clearSession();
    this.initialized.set(true);
    this.loading.set(false);
  }

  logout(): void {
    this.clearSession();
  }

  private persistToken(value: string): void {
    localStorage.setItem(TOKEN_KEY, value);
    this.token.set(value);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    this.token.set(null);
    this.user.set(null);
    this.myModules.set([]);
    this.allowedRoutes.set([]);
    this.catalogRoutes.set([]);
  }

  private async fetchSession(): Promise<boolean> {
    try {
      const profile = await firstValueFrom(
        this.http.get<UserProfile>(`${environment.apiUrl}/me/profile`),
      );
      this.user.set(profile);

      const [access, modulesTree] = await Promise.all([
        firstValueFrom(this.http.get<AccessMap>(`${environment.apiUrl}/Module/access-map`)).catch(
          () => ({ allowedRoutes: [] as string[], catalogRoutes: [] as string[] }),
        ),
        firstValueFrom(this.http.get<unknown>(`${environment.apiUrl}/Module/my-modules`)).catch(
          () => [] as unknown[],
        ),
      ]);

      const allowed = asArray<string>(access?.allowedRoutes);
      const catalog = asArray<string>(access?.catalogRoutes);
      const tree = asArray<Record<string, unknown>>(modulesTree)
        .map(normalizeModule)
        .filter((m): m is AppModule => m != null);

      this.allowedRoutes.set(allowed);
      this.catalogRoutes.set(catalog);
      this.myModules.set(tree);

      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({
          ...profile,
          allowedRoutes: allowed,
          catalogRoutes: catalog,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
