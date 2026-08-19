export interface WishEvolutionFilters {
  keyWord: string;
  dateRequestMin: string;
  dateRequestMax: string;
  wishTypeId: string;
  positionId: string;
  priority: string;
  state: string;
  year: number;
}

export interface WishEvolutionItem {
  wishEvolutionCareerId: number | null;
  registrationNumber: string | null;
  firstName: string | null;
  name: string | null;
  wishTypeName: string | null;
  wishPositionName: string | null;
  priorityLetter: string | null;
  requestDate: string | null;
  state: number | null;
  stateLetter: string | null;
  [key: string]: any;
}

export interface WishEvolutionPageResult {
  data: WishEvolutionItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface WishGraphPoint {
  month: number;
  totalRequests: number;
}

export interface WishTypeOption {
  wishTypeId: number | string;
  designation: string;
}

export interface PositionOption {
  positionId: number | string;
  positionName: string;
}

export interface EmployeeOption {
  employeeId: number | string;
  registrationNumber: string | null;
  name: string | null;
  firstName: string | null;
}

export interface WishEvolutionForm {
  wishEvolutionCareerId?: number | null;
  positionId: number | string | null;
  employeeId: number | string | null;
  wishTypeId: number | string | null;
  motivation: string | null;
  disponibility: string | null;
  priority: number | string | null;
  requestDate: string | null;
  state: number | null;
  creationDate?: string | null;
  updatedDate?: string | null;
}

export interface WishEvolutionDetails {
  wishEvolutionCareerId: number | null;
  employeeId: number | null;
  registrationNumber: string | null;
  name: string | null;
  firstName: string | null;
  wishTypeName: string | null;
  wishPositionId: number | null;
  wishPositionName: string | null;
  actualDepartmentName: string | null;
  actualPositionName: string | null;
  creationDate: string | null;
  updatedDate: string | null;
  disponibility: string | null;
  state: number | null;
  stateLetter: string | null;
  priorityLetter: string | null;
  motivation: string | null;
  [key: string]: any;
}

export interface SkillPositionItem {
  skillId: number;
  skillName: string;
}

export interface EmployeeSkillItem {
  skillId: number;
  skillName?: string;
  [key: string]: any;
}

export interface SuggestionPositionItem {
  positionId: number;
  positionName: string;
}

export interface SkillNecessaryItem {
  skillId: number;
  skillName: string;
  state: 'validé' | 'non validé';
}
