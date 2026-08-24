const PermissionService = {
    // Mapping fonctionnel → permissions catalogue (seed / Role_Permissions)
    PERMISSION_MAPPING: {
      // Évaluations
      'IMPORT_EVALUATION': ['MANAGE_EVALUATIONS', 'CREATE_EVALUATIONS', 'EDIT_EVALUATIONS'],
      'FILL_EVALUATION': ['MANAGE_EVALUATIONS', 'EDIT_EVALUATIONS'],
      'VIEW_EVALUATION_DETAILS': ['VIEW_EVALUATIONS', 'MANAGE_EVALUATIONS'],
      'VALIDATE_AS_MANAGER': ['VALIDATE_EVALUATIONS_MANAGER', 'APPROVE_EVALUATIONS'],
      'VALIDATE_AS_DIRECTOR': ['VALIDATE_EVALUATIONS_DIRECTOR', 'APPROVE_EVALUATIONS'],
      'EVAL_SETTINGS': ['EVALUATION_SETTINGS', 'MANAGE_EVALUATIONS'],

      // Administration
      'MANAGE_ROLES_UI': ['MANAGE_ROLES', 'CREATE_ROLES', 'EDIT_ROLES', 'MANAGE_PERMISSIONS'],

      // Compétences
      'VIEW_COMPETENCES': ['VIEW_SKILLS_PROFILES', 'MANAGE_SKILLS_PROFILES'],
      'EDIT_COMPETENCES': ['EDIT_SKILLS_PROFILES', 'MANAGE_SKILLS_PROFILES'],
      'VIEW_BULLETIN': ['VIEW_COMPETENCE_BULLETIN', 'VIEW_SKILLS_PROFILES'],

      // Carrières
      'VIEW_CAREER_PLANS': ['VIEW_CAREER', 'MANAGE_CAREER'],
      'EDIT_CAREER_PLANS': ['CREATE_CAREER', 'EDIT_CAREER', 'MANAGE_CAREER'],

      // Organigramme
      'VIEW_ORG': ['VIEW_ORGANIZATION', 'MANAGE_ORGANIZATION'],
      'IMPORT_ORG': ['IMPORT_ORGANIZATION', 'MANAGE_ORGANIZATION'],

      // Employés / paramétrage
      'VIEW_EMPLOYEE_LIST': ['VIEW_EMPLOYEES', 'MANAGE_EMPLOYEES'],
      'MANAGE_EMPLOYEE_LIST': ['MANAGE_EMPLOYEES', 'CREATE_EMPLOYEES', 'EDIT_EMPLOYEES'],

      // Attestations
      'VIEW_ATTESTATIONS': ['VIEW_CERTIFICATES', 'MANAGE_CERTIFICATES'],
      'MANAGE_ATTESTATIONS': ['MANAGE_CERTIFICATES', 'CREATE_CERTIFICATES', 'EDIT_CERTIFICATES', 'SEND_CERTIFICATES'],

      // Souhaits / retraite / historique / dashboard
      'VIEW_WISHES': ['VIEW_WISH_EVOLUTION', 'MANAGE_WISH_EVOLUTION'],
      'VIEW_RETIREMENT_PAGE': ['VIEW_RETIREMENT', 'MANAGE_RETIREMENT'],
      'VIEW_HISTORY': ['VIEW_ACTIVITY_HISTORY', 'MANAGE_ACTIVITY_HISTORY'],
      'VIEW_STATS': ['VIEW_DASHBOARD', 'VIEW_REPORTS'],
    },

    // Alias anciens → catalogue actuel
    PERMISSION_ALIASES: {
      'VALIDATE_MANAGER': 'VALIDATE_EVALUATIONS_MANAGER',
      'VALIDATE_DIRECTOR': 'VALIDATE_EVALUATIONS_DIRECTOR',
      'IMPORT_EVAL': 'MANAGE_EVALUATIONS',
      'EDIT_EVAL': 'MANAGE_EVALUATIONS',
      'EVAL_SETTINGS': 'EVALUATION_SETTINGS',
      'MANAGE_ROLES': 'MANAGE_ROLES',
    },

    hasPermission: (hasPermissionFn, permission) => {
      if (!hasPermissionFn) return false;
      if (hasPermissionFn(permission)) return true;
      const aliasedPermission = PermissionService.PERMISSION_ALIASES[permission];
      if (aliasedPermission && hasPermissionFn(aliasedPermission)) return true;
      return false;
    },

    hasFunctionalPermission: (hasPermissionFn, functionalPermission) => {
      if (!hasPermissionFn) return false;
      if (PermissionService.hasPermission(hasPermissionFn, functionalPermission)) return true;
      const mappedPermissions = PermissionService.PERMISSION_MAPPING[functionalPermission] || [];
      return mappedPermissions.some(permission =>
        PermissionService.hasPermission(hasPermissionFn, permission)
      );
    },

    hasAnyPermission: (hasPermissionFn, permissionGroup) => {
      if (!hasPermissionFn || !Array.isArray(permissionGroup)) return false;
      return permissionGroup.some(permission =>
        PermissionService.hasPermission(hasPermissionFn, permission)
      );
    },

    hasAllPermissions: (hasPermissionFn, permissionGroup) => {
      if (!hasPermissionFn || !Array.isArray(permissionGroup)) return false;
      return permissionGroup.every(permission =>
        PermissionService.hasPermission(hasPermissionFn, permission)
      );
    }
  };

export default PermissionService;
