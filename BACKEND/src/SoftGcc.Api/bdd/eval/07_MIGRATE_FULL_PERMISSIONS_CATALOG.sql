-- =============================================================================
-- Migration : catalogue complet des permissions métier SOFT_GCC
-- Idempotent. À exécuter après 06_MIGRATE_PERMISSIONS_RBAC.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Insertion des permissions manquantes
-- ---------------------------------------------------------------------------
DECLARE @perms TABLE (name NVARCHAR(100), description NVARCHAR(255));
INSERT INTO @perms (name, description) VALUES
-- Compétences / salary skills
('VIEW_SKILLS_PROFILES', N'Consulter les profils de compétences des employés'),
('EDIT_SKILLS_PROFILES', N'Modifier les compétences, langues et formations des employés'),
('VIEW_COMPETENCE_BULLETIN', N'Consulter les bulletins de compétences'),
('MANAGE_SKILLS_PROFILES', N'Administration complète des profils de compétences'),
-- Carrières (granulaire ; MANAGE_CAREER existe déjà)
('VIEW_CAREER', N'Consulter les plans de carrière'),
('CREATE_CAREER', N'Créer des plans / affectations de carrière'),
('EDIT_CAREER', N'Modifier les plans de carrière'),
('DELETE_CAREER', N'Supprimer des plans de carrière'),
-- Organigramme / effectifs
('VIEW_ORGANIZATION', N'Consulter l''organigramme et les effectifs'),
('IMPORT_ORGANIZATION', N'Importer les effectifs (CSV)'),
('MANAGE_ORGANIZATION', N'Administrer l''organigramme et les effectifs'),
-- Historique
('VIEW_ACTIVITY_HISTORY', N'Consulter l''historique des activités'),
('MANAGE_ACTIVITY_HISTORY', N'Administrer l''historique des activités'),
-- Paramétrage compétences
('VIEW_SKILL_SETTINGS', N'Consulter le référentiel compétences (paramètres)'),
('MANAGE_SKILL_SETTINGS', N'Gérer le référentiel compétences (paramètres)'),
-- Paramétrage carrières
('VIEW_CAREER_SETTINGS', N'Consulter le référentiel carrières (paramètres)'),
('MANAGE_CAREER_SETTINGS', N'Gérer le référentiel carrières (paramètres)'),
-- Employés (paramétrage)
('VIEW_EMPLOYEES', N'Consulter la liste des employés'),
('CREATE_EMPLOYEES', N'Créer des employés'),
('EDIT_EMPLOYEES', N'Modifier des employés'),
('DELETE_EMPLOYEES', N'Supprimer des employés'),
('MANAGE_EMPLOYEES', N'Administration complète des employés'),
('MANAGE_EMPLOYEE_SYNC', N'Synchroniser les employés depuis le système source'),
-- Attestations
('VIEW_CERTIFICATES', N'Consulter les attestations'),
('CREATE_CERTIFICATES', N'Générer / créer des attestations'),
('EDIT_CERTIFICATES', N'Modifier les modèles d''attestations'),
('DELETE_CERTIFICATES', N'Supprimer des attestations'),
('SEND_CERTIFICATES', N'Envoyer des attestations par e-mail'),
('MANAGE_CERTIFICATES', N'Administration complète des attestations'),
-- Souhaits d''évolution
('VIEW_WISH_EVOLUTION', N'Consulter les souhaits d''évolution'),
('CREATE_WISH_EVOLUTION', N'Créer des souhaits d''évolution'),
('EDIT_WISH_EVOLUTION', N'Modifier des souhaits d''évolution'),
('DELETE_WISH_EVOLUTION', N'Supprimer des souhaits d''évolution'),
('MANAGE_WISH_EVOLUTION', N'Administrer les souhaits d''évolution'),
('MANAGE_WISH_TYPES', N'Gérer les types de souhaits d''évolution'),
-- Retraite (granulaire)
('VIEW_RETIREMENT', N'Consulter les départs à la retraite'),
('EDIT_RETIREMENT_SETTINGS', N'Modifier les paramètres de retraite'),
-- Dashboard / notifications
('VIEW_DASHBOARD', N'Accéder au tableau de bord statistiques'),
('VIEW_NOTIFICATIONS', N'Consulter ses notifications');

INSERT INTO Permissions (name, description, state)
SELECT p.name, p.description, 1
FROM @perms p
WHERE NOT EXISTS (SELECT 1 FROM Permissions x WHERE x.name = p.name);

PRINT 'Permissions métier insérées / déjà présentes.';

-- ---------------------------------------------------------------------------
-- 2. Attribution par rôle
-- ---------------------------------------------------------------------------

-- Admin (1) : toutes
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 1, p.Permission_id
FROM Permissions p
WHERE p.state = 1
AND NOT EXISTS (
    SELECT 1 FROM Role_Permissions rp
    WHERE rp.role_id = 1 AND rp.permission_id = p.Permission_id
);

-- Manager (2)
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 2, p.Permission_id
FROM Permissions p
WHERE p.name IN (
    'VIEW_SKILLS_PROFILES', 'EDIT_SKILLS_PROFILES', 'VIEW_COMPETENCE_BULLETIN',
    'VIEW_CAREER',
    'VIEW_ORGANIZATION',
    'VIEW_ACTIVITY_HISTORY',
    'VIEW_EMPLOYEES',
    'VIEW_WISH_EVOLUTION', 'CREATE_WISH_EVOLUTION', 'EDIT_WISH_EVOLUTION',
    'VIEW_RETIREMENT',
    'VIEW_DASHBOARD', 'VIEW_REPORTS',
    'VIEW_NOTIFICATIONS'
)
AND NOT EXISTS (
    SELECT 1 FROM Role_Permissions rp
    WHERE rp.role_id = 2 AND rp.permission_id = p.Permission_id
);

-- RH (3)
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 3, p.Permission_id
FROM Permissions p
WHERE p.name IN (
    'VIEW_SKILLS_PROFILES', 'EDIT_SKILLS_PROFILES', 'VIEW_COMPETENCE_BULLETIN', 'MANAGE_SKILLS_PROFILES',
    'VIEW_CAREER', 'CREATE_CAREER', 'EDIT_CAREER', 'DELETE_CAREER', 'MANAGE_CAREER',
    'VIEW_ORGANIZATION', 'IMPORT_ORGANIZATION', 'MANAGE_ORGANIZATION',
    'VIEW_ACTIVITY_HISTORY', 'MANAGE_ACTIVITY_HISTORY',
    'VIEW_SKILL_SETTINGS', 'MANAGE_SKILL_SETTINGS',
    'VIEW_CAREER_SETTINGS', 'MANAGE_CAREER_SETTINGS',
    'VIEW_EMPLOYEES', 'CREATE_EMPLOYEES', 'EDIT_EMPLOYEES', 'DELETE_EMPLOYEES', 'MANAGE_EMPLOYEES',
    'MANAGE_EMPLOYEE_SYNC',
    'VIEW_CERTIFICATES', 'CREATE_CERTIFICATES', 'EDIT_CERTIFICATES', 'DELETE_CERTIFICATES',
    'SEND_CERTIFICATES', 'MANAGE_CERTIFICATES',
    'VIEW_WISH_EVOLUTION', 'CREATE_WISH_EVOLUTION', 'EDIT_WISH_EVOLUTION', 'DELETE_WISH_EVOLUTION',
    'MANAGE_WISH_EVOLUTION', 'MANAGE_WISH_TYPES',
    'VIEW_RETIREMENT', 'EDIT_RETIREMENT_SETTINGS', 'MANAGE_RETIREMENT',
    'VIEW_DASHBOARD', 'VIEW_REPORTS', 'EXPORT_REPORTS',
    'VIEW_NOTIFICATIONS'
)
AND NOT EXISTS (
    SELECT 1 FROM Role_Permissions rp
    WHERE rp.role_id = 3 AND rp.permission_id = p.Permission_id
);

-- Directeur (4)
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 4, p.Permission_id
FROM Permissions p
WHERE p.name IN (
    'VIEW_SKILLS_PROFILES', 'VIEW_COMPETENCE_BULLETIN',
    'VIEW_CAREER',
    'VIEW_ORGANIZATION',
    'VIEW_ACTIVITY_HISTORY',
    'VIEW_EMPLOYEES',
    'VIEW_CERTIFICATES',
    'VIEW_WISH_EVOLUTION',
    'VIEW_RETIREMENT',
    'VIEW_DASHBOARD', 'VIEW_REPORTS', 'EXPORT_REPORTS',
    'VIEW_NOTIFICATIONS'
)
AND NOT EXISTS (
    SELECT 1 FROM Role_Permissions rp
    WHERE rp.role_id = 4 AND rp.permission_id = p.Permission_id
);

PRINT 'Permissions attribuées aux rôles.';

-- ---------------------------------------------------------------------------
-- 3. Liaison module_id (si Modules existe)
-- ---------------------------------------------------------------------------
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Modules')
BEGIN
    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'competences')
    WHERE name IN ('VIEW_SKILLS_PROFILES','EDIT_SKILLS_PROFILES','VIEW_COMPETENCE_BULLETIN','MANAGE_SKILLS_PROFILES')
      AND (module_id IS NULL OR module_id = 0);

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'carrieres')
    WHERE name IN ('VIEW_CAREER','CREATE_CAREER','EDIT_CAREER','DELETE_CAREER','MANAGE_CAREER')
      AND (module_id IS NULL OR module_id = 0);

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'organigramme')
    WHERE name IN ('VIEW_ORGANIZATION','IMPORT_ORGANIZATION','MANAGE_ORGANIZATION')
      AND (module_id IS NULL OR module_id = 0);

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'historique')
    WHERE name IN ('VIEW_ACTIVITY_HISTORY','MANAGE_ACTIVITY_HISTORY')
      AND (module_id IS NULL OR module_id = 0);

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'param_competences')
    WHERE name IN ('VIEW_SKILL_SETTINGS','MANAGE_SKILL_SETTINGS')
      AND (module_id IS NULL OR module_id = 0);

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'param_carrieres')
    WHERE name IN ('VIEW_CAREER_SETTINGS','MANAGE_CAREER_SETTINGS')
      AND (module_id IS NULL OR module_id = 0);

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'param_employes')
    WHERE name IN ('VIEW_EMPLOYEES','CREATE_EMPLOYEES','EDIT_EMPLOYEES','DELETE_EMPLOYEES','MANAGE_EMPLOYEES','MANAGE_EMPLOYEE_SYNC')
      AND (module_id IS NULL OR module_id = 0);

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'attestations')
    WHERE name IN ('VIEW_CERTIFICATES','CREATE_CERTIFICATES','EDIT_CERTIFICATES','DELETE_CERTIFICATES','SEND_CERTIFICATES','MANAGE_CERTIFICATES')
      AND (module_id IS NULL OR module_id = 0);

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'souhaits')
    WHERE name IN ('VIEW_WISH_EVOLUTION','CREATE_WISH_EVOLUTION','EDIT_WISH_EVOLUTION','DELETE_WISH_EVOLUTION','MANAGE_WISH_EVOLUTION','MANAGE_WISH_TYPES')
      AND (module_id IS NULL OR module_id = 0);

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'retraite')
    WHERE name IN ('VIEW_RETIREMENT','EDIT_RETIREMENT_SETTINGS','MANAGE_RETIREMENT')
      AND (module_id IS NULL OR module_id = 0);

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'dashboard')
    WHERE name IN ('VIEW_DASHBOARD','VIEW_REPORTS','EXPORT_REPORTS')
      AND (module_id IS NULL OR module_id = 0);

    -- Module sync manquant éventuel
    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'param_synchronisation')
    BEGIN
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
        SELECT 'param_synchronisation', N'Synchronisation employés', 'mdi mdi-sync',
               '/soft-gcc/parametres/synchronisation', m.module_id, 7, 1
        FROM Modules m WHERE m.name = 'parametrage';
    END

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'param_synchronisation')
    WHERE name = 'MANAGE_EMPLOYEE_SYNC' AND (module_id IS NULL OR module_id = 0);

    PRINT 'Permissions liées aux modules.';
END

PRINT '=== Migration 07 permissions métier terminée ===';
