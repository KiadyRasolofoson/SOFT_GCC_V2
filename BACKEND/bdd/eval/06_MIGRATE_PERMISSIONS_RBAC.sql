-- =============================================================================
-- Migration RBAC : permissions métier manquantes + attributions rôles
-- =============================================================================
-- Aligne le catalogue Permissions avec le frontend (PermissionService.js)
-- et les policies [RequirePermission] côté API.
-- Idempotent.
-- =============================================================================

-- 1. Nouvelles permissions
IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'MANAGE_ROLES')
BEGIN
    INSERT INTO Permissions (name, description, state)
    VALUES ('MANAGE_ROLES', 'Gérer les rôles (CRUD)', 1);
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'MANAGE_EVALUATIONS')
BEGIN
    INSERT INTO Permissions (name, description, state)
    VALUES ('MANAGE_EVALUATIONS', 'Gérer le module évaluations (planning, entretiens, import)', 1);
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'VALIDATE_EVALUATIONS_MANAGER')
BEGIN
    INSERT INTO Permissions (name, description, state)
    VALUES ('VALIDATE_EVALUATIONS_MANAGER', 'Valider les évaluations en tant que manager (N+1)', 1);
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'VALIDATE_EVALUATIONS_DIRECTOR')
BEGIN
    INSERT INTO Permissions (name, description, state)
    VALUES ('VALIDATE_EVALUATIONS_DIRECTOR', 'Valider les évaluations en tant que directeur', 1);
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'EVALUATION_SETTINGS')
BEGIN
    INSERT INTO Permissions (name, description, state)
    VALUES ('EVALUATION_SETTINGS', 'Configurer les paramètres du module évaluations', 1);
END

-- 2. Admin (1) : toutes les permissions (y compris nouvelles)
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 1, p.Permission_id
FROM Permissions p
WHERE p.state = 1
AND NOT EXISTS (
    SELECT 1 FROM Role_Permissions rp
    WHERE rp.role_id = 1 AND rp.permission_id = p.Permission_id
);

-- 3. Manager (2)
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 2, p.Permission_id
FROM Permissions p
WHERE p.name IN (
    'VIEW_USERS',
    'VIEW_EVALUATIONS',
    'CREATE_EVALUATIONS',
    'EDIT_EVALUATIONS',
    'APPROVE_EVALUATIONS',
    'MANAGE_EVALUATIONS',
    'VALIDATE_EVALUATIONS_MANAGER',
    'VIEW_DEPARTMENTS',
    'VIEW_POSITIONS',
    'VIEW_REPORTS'
)
AND NOT EXISTS (
    SELECT 1 FROM Role_Permissions rp
    WHERE rp.role_id = 2 AND rp.permission_id = p.Permission_id
);

-- 4. RH (3) — élargi pour administration & évaluations
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 3, p.Permission_id
FROM Permissions p
WHERE p.name IN (
    'VIEW_USERS', 'CREATE_USERS', 'EDIT_USERS',
    'VIEW_ROLES', 'MANAGE_ROLES',
    'VIEW_PERMISSIONS', 'MANAGE_PERMISSIONS',
    'VIEW_EVALUATIONS', 'CREATE_EVALUATIONS', 'EDIT_EVALUATIONS',
    'APPROVE_EVALUATIONS', 'MANAGE_EVALUATIONS', 'EVALUATION_SETTINGS',
    'VIEW_DEPARTMENTS', 'MANAGE_DEPARTMENTS',
    'VIEW_POSITIONS', 'MANAGE_POSITIONS',
    'VIEW_REPORTS', 'EXPORT_REPORTS',
    'MANAGE_CAREER', 'MANAGE_RETIREMENT'
)
AND NOT EXISTS (
    SELECT 1 FROM Role_Permissions rp
    WHERE rp.role_id = 3 AND rp.permission_id = p.Permission_id
);

-- 5. Directeur (4)
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 4, p.Permission_id
FROM Permissions p
WHERE p.name IN (
    'VIEW_USERS',
    'VIEW_EVALUATIONS',
    'CREATE_EVALUATIONS',
    'EDIT_EVALUATIONS',
    'APPROVE_EVALUATIONS',
    'MANAGE_EVALUATIONS',
    'VALIDATE_EVALUATIONS_DIRECTOR',
    'VIEW_DEPARTMENTS',
    'VIEW_POSITIONS',
    'VIEW_REPORTS',
    'EXPORT_REPORTS'
)
AND NOT EXISTS (
    SELECT 1 FROM Role_Permissions rp
    WHERE rp.role_id = 4 AND rp.permission_id = p.Permission_id
);

PRINT 'Migration permissions RBAC terminée.';
