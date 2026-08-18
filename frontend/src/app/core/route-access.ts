export function normalizeRoutePath(path: string | null | undefined): string {
  if (!path || typeof path !== 'string') return '';
  const clean = path.split('?')[0].split('#')[0].trim();
  if (!clean) return '';
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return withSlash.replace(/\/+$/, '') || '/';
}

/**
 * Vérifie si un pathname est autorisé selon les routes Role_Modules.
 * - Si le catalogue contient une route couvrant le path : la plus longue doit être dans allowed.
 * - Sinon (sous-page non déclarée) : autorise si une section /soft-gcc/{area} est couverte.
 * - Catalogue vide : refuse /soft-gcc (pas de fail-open).
 */
export function checkRouteAccess(
  pathname: string,
  allowedRoutes: string[] = [],
  catalogRoutes: string[] = [],
): boolean {
  const path = normalizeRoutePath(pathname);
  if (!path.startsWith('/soft-gcc')) return true;

  const allowed = (allowedRoutes || []).map(normalizeRoutePath).filter(Boolean);
  const catalog = (catalogRoutes || []).map(normalizeRoutePath).filter(Boolean);

  if (catalog.length === 0) return false;

  const covers = (route: string, target: string) => target === route || target.startsWith(`${route}/`);

  const coveringCatalog = catalog.filter((r) => covers(r, path)).sort((a, b) => b.length - a.length);

  if (coveringCatalog.length > 0) {
    const best = coveringCatalog[0];
    return allowed.includes(best);
  }

  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length < 2) return false;
  const section = `/${pathParts[0]}/${pathParts[1]}`;

  return allowed.some((r) => r === section || r.startsWith(`${section}/`));
}

export function isAdminRole(roleTitle: string | null | undefined): boolean {
  const title = (roleTitle || '').trim().toLowerCase();
  return title === 'admin' || title === 'administrator' || title === 'administrateur';
}
