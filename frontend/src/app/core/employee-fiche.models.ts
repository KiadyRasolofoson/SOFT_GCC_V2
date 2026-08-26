import { SkillLevel } from '../ui/gcc-skill-badge';

export type EmployeeTabKey = 'infos' | 'competences' | 'carrieres';

export interface ResolvedEmployeeIds {
  employeeId: number | null;
  registrationNumber: string | null;
  baseEmployee: Record<string, any> | null;
}

export interface EmployeeFicheProfile {
  employeeId: number | null;
  registrationNumber: string | null;
  name: string | null;
  firstName: string | null;
  birthday: string | null;
  departmentName: string | null;
  hiringDate: string | null;
  photo: string | null;
  email: string | null;
  positionName: string | null;
  baseSalary: number | null;
  netSalary: number | null;
  skillNumber: number | null;
  educationNumber: number | null;
  languageNumber: number | null;
  otherFormationNumber: number | null;
  updatedDate: string | null;
  [key: string]: any;
}

export interface EmployeeSkillGapItem {
  label: string;
  required: SkillLevel;
  acquired: SkillLevel;
  missing?: boolean;
  critical?: boolean;
  status?: 'ok' | 'gap' | 'missing';
  domainName?: string | null;
}
