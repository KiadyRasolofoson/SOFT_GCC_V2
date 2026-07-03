const PermissionService = {
    // Mapping des permissions (avec potentiels alias)
    // Permet de gérer les changements de noms sans modifier le code partout
    PERMISSION_MAPPING: {
      // Permissions pour les interviews d'évaluation
      'IMPORT_EVALUATION': ['MANAGE_EVALUATIONS'],
      'FILL_EVALUATION': ['MANAGE_EVALUATIONS'],
      'VIEW_EVALUATION_DETAILS': ['MANAGE_EVALUATIONS'],
      'VALIDATE_AS_MANAGER': ['VALIDATE_EVALUATIONS_MANAGER'],
      'VALIDATE_AS_DIRECTOR': ['VALIDATE_EVALUATIONS_DIRECTOR'],
      'EVAL_SETTINGS': ['EVALUATION_SETTINGS']
    },
    
    // Dictionnaire d'alias pour gérer la transition entre anciens et nouveaux noms
    PERMISSION_ALIASES: {
      // Exemple : 'ANCIEN_NOM': 'NOUVEAU_NOM'
      'VALIDATE_MANAGER': 'VALIDATE_EVALUATIONS_MANAGER',
      'VALIDATE_DIRECTOR': 'VALIDATE_EVALUATIONS_DIRECTOR',
      'IMPORT_EVAL': 'MANAGE_EVALUATIONS',
      'EDIT_EVAL': 'MANAGE_EVALUATIONS',
      'EVAL_SETTINGS': 'EVALUATION_SETTINGS'
    },
  
    /**
     * Vérifie si l'utilisateur a une permission spécifique
     * @param {Function} hasPermissionFn - La fonction hasPermission du UserContext
     * @param {string} permission - La permission à vérifier
     * @returns {boolean} - True si l'utilisateur a la permission
     */
    hasPermission: (hasPermissionFn, permission) => {
      if (!hasPermissionFn) return false;
      
      // Vérifier d'abord avec le nom original
      if (hasPermissionFn(permission)) return true;
      
      // Vérifier avec l'alias si disponible
      const aliasedPermission = PermissionService.PERMISSION_ALIASES[permission];
      if (aliasedPermission && hasPermissionFn(aliasedPermission)) return true;
      
      return false;
    },
  
    /**
     * Vérifie si l'utilisateur a une permission fonctionnelle (utilise le mapping)
     * @param {Function} hasPermissionFn - La fonction hasPermission du UserContext
     * @param {string} functionalPermission - La clé fonctionnelle de la permission
     * @returns {boolean} - True si l'utilisateur a une des permissions mappées
     */
    hasFunctionalPermission: (hasPermissionFn, functionalPermission) => {
      if (!hasPermissionFn) return false;
  
      // Vérifier d'abord si la permission fonctionnelle existe directement
      if (PermissionService.hasPermission(hasPermissionFn, functionalPermission)) return true;
  
      // Vérifier ensuite dans le mapping
      const mappedPermissions = PermissionService.PERMISSION_MAPPING[functionalPermission] || [];
      return mappedPermissions.some(permission => PermissionService.hasPermission(hasPermissionFn, permission));
    },
  
    /**
     * Vérifie si l'utilisateur a au moins une des permissions du groupe
     * @param {Function} hasPermissionFn - La fonction hasPermission du UserContext
     * @param {string[]} permissionGroup - Groupe de permissions
     * @returns {boolean} - True si l'utilisateur a au moins une permission du groupe
     */
    hasAnyPermission: (hasPermissionFn, permissionGroup) => {
      if (!hasPermissionFn || !Array.isArray(permissionGroup)) return false;
      return permissionGroup.some(permission => PermissionService.hasPermission(hasPermissionFn, permission));
    },
  
    /**
     * Vérifie si l'utilisateur a toutes les permissions du groupe
     * @param {Function} hasPermissionFn - La fonction hasPermission du UserContext
     * @param {string[]} permissionGroup - Groupe de permissions
     * @returns {boolean} - True si l'utilisateur a toutes les permissions du groupe
     */
    hasAllPermissions: (hasPermissionFn, permissionGroup) => {
      if (!hasPermissionFn || !Array.isArray(permissionGroup)) return false;
      return permissionGroup.every(permission => PermissionService.hasPermission(hasPermissionFn, permission));
    }
  };
  
  export default PermissionService;