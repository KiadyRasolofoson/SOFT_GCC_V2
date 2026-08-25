export type SkillState = 'Draft' | 'Active' | 'Archived';

export interface SkillListItem {
  skillId: number;
  code: string;
  name: string;
  category: string;
  state: string;
  familyId: number;
  familyName: string;
  domainId: number;
  domainName: string;
  currentVersion: number;
}

export interface SkillCatalogNode {
  domainId: number;
  domainCode: string;
  domainName: string;
  families: SkillFamilyNode[];
}

export interface SkillFamilyNode {
  familyId: number;
  domainId: number;
  code: string;
  name: string;
  skills: SkillListItem[];
}

export interface SkillLevelDescriptor {
  rank: number;
  label: string;
  behavioralDefinition: string;
}

export interface SkillVersion {
  skillVersionId: number;
  version: number;
  name: string;
  definition: string;
  category: string;
  validFrom: string;
  validTo: string | null;
}

export interface LinkedPosition {
  skillPositionId: number;
  positionId: number;
  positionName: string;
  expectedLevel: number;
  requirementKind: string;
  weight: number;
}

export interface SkillDetail {
  skillId: number;
  code: string;
  name: string;
  definition: string;
  category: string;
  familyId: number;
  familyName: string;
  domainId: number;
  domainName: string;
  currentVersion: number;
  state: string;
  publishedAt: string | null;
  descriptors: SkillLevelDescriptor[];
  versions: SkillVersion[];
  positions: LinkedPosition[];
}

export interface SkillDraft {
  code?: string;
  name: string;
  definition: string;
  category: string;
  familyId: number;
  descriptors: SkillLevelDescriptor[];
}

export interface TaxonomyItem {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  state: string;
  domainId?: number | null;
  domainName?: string | null;
}

export interface PositionSkillItem {
  skillPositionId: number;
  skillId: number;
  skillName: string;
  skillCode: string;
  expectedLevel: number;
  requirementKind: string;
  weight: number;
  state: number;
}

export interface SkillGapItem {
  skillId: number;
  skillName: string;
  expectedRank: number;
  acquiredRank: number | null;
  requirementKind: string;
  skillVersionId: number | null;
  weight: number;
  gap: boolean;
  status: 'ok' | 'gap' | 'missing' | string;
  domainId: number;
  domainName: string;
}

export interface EmployeeSkillGapResponse {
  positionId: number | null;
  positionName: string | null;
  items: SkillGapItem[];
}

export const SKILL_CATEGORY_OPTIONS = [
  { label: 'Technique', value: 'Technical' },
  { label: 'Comportementale', value: 'Behavioral' },
  { label: 'Managériale', value: 'Managerial' },
  { label: 'Transverse', value: 'Transversal' },
];

export const SKILL_STATE_OPTIONS = [
  { label: 'Tous', value: '' },
  { label: 'Brouillon', value: 'Draft' },
  { label: 'Active', value: 'Active' },
  { label: 'Archivée', value: 'Archived' },
];

export const SKILL_RANK_OPTIONS = [
  { label: '1 · Notions', value: '1' },
  { label: '2 · Application', value: '2' },
  { label: '3 · Maîtrise', value: '3' },
  { label: '4 · Expert', value: '4' },
];

export const REQUIREMENT_KIND_OPTIONS = [
  { label: 'Critique', value: 'Critical' },
  { label: 'Requise', value: 'Required' },
  { label: 'Souhaitée', value: 'Desired' },
];

export function emptyDescriptors(): SkillLevelDescriptor[] {
  return [
    { rank: 1, label: 'Notions', behavioralDefinition: '' },
    { rank: 2, label: 'Application', behavioralDefinition: '' },
    { rank: 3, label: 'Maîtrise', behavioralDefinition: '' },
    { rank: 4, label: 'Expert', behavioralDefinition: '' },
  ];
}

export function flattenCatalog(nodes: SkillCatalogNode[]): SkillListItem[] {
  return nodes.flatMap((domain) => domain.families.flatMap((family) => family.skills));
}

export function categoryLabel(value: string): string {
  return SKILL_CATEGORY_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function stateLabel(value: string): string {
  return SKILL_STATE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function skillStateStatus(state: string): 'ok' | 'pending' | 'refused' {
  if (state === 'Active') return 'ok';
  if (state === 'Archived') return 'refused';
  return 'pending';
}

export function requirementKindLabel(value: string): string {
  return REQUIREMENT_KIND_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function requirementKindStatus(kind: string): 'gap' | 'ok' | 'pending' {
  if (kind === 'Critical') return 'gap';
  if (kind === 'Required') return 'ok';
  return 'pending';
}
