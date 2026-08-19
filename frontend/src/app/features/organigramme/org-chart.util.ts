import { OrgNode } from '../../core/org-chart.service';

export const ALL_DEPARTMENTS = 'all';
export const NONE_DEPARTMENT = 'none';

export function countNodes(node: OrgNode | null): number {
  if (!node) return 0;
  return 1 + (node.children || []).reduce((sum, child) => sum + countNodes(child), 0);
}

export function matchesDepartment(node: OrgNode, departmentKey: string): boolean {
  if (departmentKey === ALL_DEPARTMENTS) return true;
  if (departmentKey === NONE_DEPARTMENT) return node.departmentId == null;
  return String(node.departmentId) === String(departmentKey);
}

/** Conserve uniquement les collaborateurs du département sélectionné. */
export function pruneToDepartment(node: OrgNode, departmentKey: string): OrgNode | null {
  const children = (node.children || [])
    .map((child) => pruneToDepartment(child, departmentKey))
    .filter((child): child is OrgNode => Boolean(child));

  if (!matchesDepartment(node, departmentKey)) return null;
  return { ...node, children };
}

/**
 * Branches du département : chaque employé du département dont le manager
 * n'est pas dans ce département (ou n'a pas de manager) devient une racine.
 */
export function getDepartmentBranches(roots: OrgNode[], departmentKey: string): OrgNode[] {
  if (departmentKey === ALL_DEPARTMENTS) return roots;

  const branches: OrgNode[] = [];

  function visit(node: OrgNode): void {
    if (matchesDepartment(node, departmentKey)) {
      const pruned = pruneToDepartment(node, departmentKey);
      if (pruned) branches.push(pruned);
      return;
    }
    (node.children || []).forEach(visit);
  }

  roots.forEach(visit);
  return branches;
}

export function collectDepartments(roots: OrgNode[]): { key: string; label: string }[] {
  const map = new Map<string, { key: string; label: string }>();

  function visit(node: OrgNode): void {
    const key = node.departmentId == null ? NONE_DEPARTMENT : String(node.departmentId);
    const label = node.department || 'Non assigné';
    if (!map.has(key)) {
      map.set(key, { key, label });
    }
    (node.children || []).forEach(visit);
  }

  roots.forEach(visit);
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
}

export function trackByOrgNode(node: OrgNode): string {
  return node.employeeId != null ? String(node.employeeId) : node.department || 'node';
}
