export interface CareerPlanForm {
  assignmentTypeId: string | null;
  registrationNumber: string | null;
  decisionNumber: string | null;
  decisionDate: string | null;
  assignmentDate: string | null;
  description: string | null;
  establishmentId: string | null;
  departmentId: string | null;
  positionId: string | null;
  employeeTypeId: string | null;
  socioCategoryProfessionalId: string | null;
  indicationId: string | null;
  baseSalary: string | null;
  netSalary: string | null;
  professionalCategoryId: string | null;
  legalClassId: string | null;
  newsletterTemplateId: string | null;
  paymentMethodId: string | null;
  endingContract: string | null;
  reason: string | null;
  assigningInstitution: string | null;
  startDate: string | null;
  endDate: string | null;
  echelonId: string | null;
  state: number;
}

export interface CareerPlanFormErrors {
  registrationNumber?: string;
  assignmentTypeId?: string;
  decisionNumber?: string;
  decisionDate?: string;
  assignmentDate?: string;
}

export interface CareerPlanPayload {
  assignmentTypeId: number;
  registrationNumber: string | null;
  decisionNumber: string | null;
  decisionDate: string | null;
  assignmentDate: string | null;
  description: string | null;
  establishmentId: number | null;
  departmentId: number | null;
  positionId: number | null;
  employeeTypeId: number | null;
  socioCategoryProfessionalId: number | null;
  indicationId: number | null;
  baseSalary: number | null;
  netSalary: number | null;
  professionalCategoryId: number | null;
  legalClassId: number | null;
  newsletterTemplateId: number | null;
  paymentMethodId: number | null;
  endingContract: string | null;
  reason: string | null;
  assigningInstitution: string | null;
  startDate: string | null;
  endDate: string | null;
  echelonId: number | null;
  state: number;
  creationDate: string;
  updatedDate: string;
}

export interface EmployeeOption {
  employeeId: number | string;
  registrationNumber: string | null;
  name: string | null;
  firstName: string | null;
}

export interface AssignmentTypeOption {
  assignmentTypeId: number | string;
  assignmentTypeName: string;
}

export interface EstablishmentOption {
  establishmentId: number | string;
  establishmentName: string;
}

export interface DepartmentOption {
  departmentId: number | string;
  name: string;
}

export interface PositionOption {
  positionId: number | string;
  positionName: string;
}

export interface EmployeeTypeOption {
  employeeTypeId: number | string;
  employeeTypeName: string;
}

export interface IndicationOption {
  indicationId: number | string;
  indicationName: string;
}

export interface ProfessionalCategoryOption {
  professionalCategoryId: number | string;
  professionalCategoryName: string;
}

export interface LegalClassOption {
  legalClassId: number | string;
  legalClassName: string;
}

export interface NewsletterTemplateOption {
  newsletterTemplateId: number | string;
  newsletterTemplateName: string;
}

export interface PaymentMethodOption {
  paymentMethodId: number | string;
  paymentMethodName: string;
}

export interface EchelonOption {
  echelonId: number | string;
  echelonName: string;
}

/** Formulaire vide (parité React initializeForm — type affectation par défaut : nomination). */
export function createEmptyForm(): CareerPlanForm {
  return {
    assignmentTypeId: '1',
    registrationNumber: null,
    decisionNumber: null,
    decisionDate: null,
    assignmentDate: null,
    description: null,
    establishmentId: null,
    departmentId: null,
    positionId: null,
    employeeTypeId: null,
    socioCategoryProfessionalId: null,
    indicationId: null,
    baseSalary: null,
    netSalary: null,
    professionalCategoryId: null,
    legalClassId: null,
    newsletterTemplateId: null,
    paymentMethodId: null,
    endingContract: null,
    reason: null,
    assigningInstitution: null,
    startDate: null,
    endDate: null,
    echelonId: null,
    state: 1,
  };
}
