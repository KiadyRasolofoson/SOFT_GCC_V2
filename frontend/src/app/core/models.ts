export interface UserProfile {
  userId: number;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  roleTitle: string;
  employeeId: number | null;
  registrationNumber: string | null;
  departmentName: string | null;
  permissions: string[];
  visibleModules: string[];
}

export interface AppModule {
  moduleId: number;
  parentModuleId: number | null;
  name: string;
  displayName: string;
  icon: string;
  route: string;
  sortOrder: number;
  childModules: AppModule[];
}

export interface AccessMap {
  allowedRoutes: string[];
  catalogRoutes: string[];
}

