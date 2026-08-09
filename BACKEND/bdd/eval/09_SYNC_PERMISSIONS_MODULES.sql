-- =============================================================================
-- 09 : Synchronise catalogue permissions ↔ modules + accès Manager
-- Idempotent. Corrige le cas où les permissions métier existent mais
-- module_id n'est pas lié (groupes Compétences / Carrières invisibles).
-- =============================================================================

PRINT '=== 09 SYNC PERMISSIONS / MODULES ===';

-- ---------------------------------------------------------------------------
-- 1. Permissions métier manquantes
-- ---------------------------------------------------------------------------
DECLARE @perms TABLE (name NVARCHAR(100), description NVARCHAR(255));
INSERT INTO @perms (name, description) VALUES
('VIEW_SKILLS_PROFILES', N'Consulter les profils de compétences des employés'),
('EDIT_SKILLS_PROFILES', N'Modifier les compétences, langues et formations des employés'),
('VIEW_COMPETENCE_BULLETIN', N'Consulter les bulletins de compétences'),
('MANAGE_SKILLS_PROFILES', N'Administration complète des profils de compétences'),
('VIEW_CAREER', N'Consulter les plans de carrière'),
('CREATE_CAREER', N'Créer des plans / affectations de carrière'),
('EDIT_CAREER', N'Modifier les plans de carrière'),
('DELETE_CAREER', N'Supprimer des plans de carrière'),
('MANAGE_CAREER', N'Gérer les carrières'),
('VIEW_ORGANIZATION', N'Consulter l''organigramme et les effectifs'),
('IMPORT_ORGANIZATION', N'Importer les effectifs (CSV)'),
('MANAGE_ORGANIZATION', N'Administrer l''organigramme et les effectifs'),
('VIEW_ACTIVITY_HISTORY', N'Consulter l''historique des activités'),
('MANAGE_ACTIVITY_HISTORY', N'Administrer l''historique des activités'),
('VIEW_SKILL_SETTINGS', N'Consulter le référentiel compétences (paramètres)'),
('MANAGE_SKILL_SETTINGS', N'Gérer le référentiel compétences (paramètres)'),
('VIEW_CAREER_SETTINGS', N'Consulter le référentiel carrières (paramètres)'),
('MANAGE_CAREER_SETTINGS', N'Gérer le référentiel carrières (paramètres)'),
('VIEW_EMPLOYEES', N'Consulter la liste des employés'),
('CREATE_EMPLOYEES', N'Créer des employés'),
('EDIT_EMPLOYEES', N'Modifier des employés'),
('DELETE_EMPLOYEES', N'Supprimer des employés'),
('MANAGE_EMPLOYEES', N'Administration complète des employés'),
('MANAGE_EMPLOYEE_SYNC', N'Synchroniser les employés depuis le système source'),
('VIEW_CERTIFICATES', N'Consulter les attestations'),
('CREATE_CERTIFICATES', N'Générer / créer des attestations'),
('EDIT_CERTIFICATES', N'Modifier les modèles d''attestations'),
('DELETE_CERTIFICATES', N'Supprimer des attestations'),
('SEND_CERTIFICATES', N'Envoyer des attestations par e-mail'),
('MANAGE_CERTIFICATES', N'Administration complète des attestations'),
('VIEW_WISH_EVOLUTION', N'Consulter les souhaits d''évolution'),
('CREATE_WISH_EVOLUTION', N'Créer des souhaits d''évolution'),
('EDIT_WISH_EVOLUTION', N'Modifier des souhaits d''évolution'),
('DELETE_WISH_EVOLUTION', N'Supprimer des souhaits d''évolution'),
('MANAGE_WISH_EVOLUTION', N'Administrer les souhaits d''évolution'),
('MANAGE_WISH_TYPES', N'Gérer les types de souhaits d''évolution'),
('VIEW_RETIREMENT', N'Consulter les départs à la retraite'),
('EDIT_RETIREMENT_SETTINGS', N'Modifier les paramètres de retraite'),
('MANAGE_RETIREMENT', N'Gérer les retraites'),
('VIEW_DASHBOARD', N'Accéder au tableau de bord statistiques'),
('VIEW_NOTIFICATIONS', N'Consulter ses notifications'),
('MANAGE_EVALUATIONS', N'Gérer le module évaluations (planning, entretiens, import)'),
('VALIDATE_EVALUATIONS_MANAGER', N'Valider les évaluations en tant que manager (N+1)'),
('VALIDATE_EVALUATIONS_DIRECTOR', N'Valider les évaluations en tant que directeur'),
('EVALUATION_SETTINGS', N'Configurer les paramètres du module évaluations'),
('MANAGE_ROLES', N'Gérer les rôles (CRUD)');

INSERT INTO Permissions (name, description, state)
SELECT p.name, p.description, 1
FROM @perms p
WHERE NOT EXISTS (SELECT 1 FROM Permissions x WHERE x.name = p.name);

PRINT 'Permissions métier présentes.';

-- ---------------------------------------------------------------------------
-- 2. Modules racines manquants (si seed 04 non appliqué)
-- ---------------------------------------------------------------------------
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Modules')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'competences')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state, description)
        VALUES ('competences', N'Compétences', 'mdi mdi-school', '/soft-gcc/competences', NULL, 2, 1, N'Gestion des compétences');

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'carrieres')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state, description)
        VALUES ('carrieres', N'Carrières', 'mdi mdi-crosshairs-gps', '/soft-gcc/carrieres', NULL, 3, 1, N'Gestion des carrières');

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'organigramme')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state, description)
        VALUES ('organigramme', N'Organigramme et effectif', 'mdi mdi-sitemap', '/soft-gcc/effectifs', NULL, 5, 1, N'Organigramme et effectifs');

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'historique')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state, description)
        VALUES ('historique', N'Historiques des activités', 'mdi mdi-history', '/soft-gcc/historique', NULL, 6, 1, N'Historique');

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'dashboard')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state, description)
        VALUES ('dashboard', N'Analyse statistiques', 'mdi mdi-view-grid', '/soft-gcc/tableau-de-bord', NULL, 1, 1, N'Tableau de bord');

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'evaluations')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state, description)
        VALUES ('evaluations', N'Évaluations', 'mdi mdi-clipboard-check', '/soft-gcc/evaluations/liste', NULL, 4, 1, N'Évaluations');

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'parametrage')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state, description)
        VALUES ('parametrage', N'Paramètres', 'mdi mdi-settings', '/soft-gcc/parametres', NULL, 7, 1, N'Paramétrage');

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'attestations')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state, description)
        VALUES ('attestations', N'Attestations', 'mdi mdi-certificate', '/soft-gcc/attestations', NULL, 8, 1, N'Attestations');

    -- Sous-pages paramètres / carrières / compétences (si absentes)
    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'param_competences')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
        SELECT 'param_competences', N'Compétences', NULL, '/soft-gcc/parametres/competences', m.module_id, 1, 1
        FROM Modules m WHERE m.name = 'parametrage';

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'param_carrieres')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
        SELECT 'param_carrieres', N'Carrières', NULL, '/soft-gcc/parametres/carrieres', m.module_id, 2, 1
        FROM Modules m WHERE m.name = 'parametrage';

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'param_employes')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
        SELECT 'param_employes', N'Employés', NULL, '/soft-gcc/parametres/employes', m.module_id, 3, 1
        FROM Modules m WHERE m.name = 'parametrage';

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'param_utilisateurs')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
        SELECT 'param_utilisateurs', N'Utilisateurs', NULL, '/soft-gcc/parametres/utilisateurs', m.module_id, 4, 1
        FROM Modules m WHERE m.name = 'parametrage';

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'souhaits')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
        SELECT 'souhaits', N'Évolution de carrière', NULL, '/soft-gcc/souhaits-evolution', m.module_id, 3, 1
        FROM Modules m WHERE m.name = 'carrieres';

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'retraite')
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
        SELECT 'retraite', N'Départ à la retraite', NULL, '/soft-gcc/retraite', m.module_id, 2, 1
        FROM Modules m WHERE m.name = 'carrieres';

    PRINT 'Modules vérifiés.';

    -- -----------------------------------------------------------------------
    -- 3. FORCE la liaison module_id (même si déjà partiellement renseigné)
    -- -----------------------------------------------------------------------
    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'competences')
    WHERE name IN ('VIEW_SKILLS_PROFILES','EDIT_SKILLS_PROFILES','VIEW_COMPETENCE_BULLETIN','MANAGE_SKILLS_PROFILES');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'carrieres')
    WHERE name IN ('VIEW_CAREER','CREATE_CAREER','EDIT_CAREER','DELETE_CAREER','MANAGE_CAREER');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'organigramme')
    WHERE name IN ('VIEW_ORGANIZATION','IMPORT_ORGANIZATION','MANAGE_ORGANIZATION');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'historique')
    WHERE name IN ('VIEW_ACTIVITY_HISTORY','MANAGE_ACTIVITY_HISTORY');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'param_competences')
    WHERE name IN ('VIEW_SKILL_SETTINGS','MANAGE_SKILL_SETTINGS');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'param_carrieres')
    WHERE name IN ('VIEW_CAREER_SETTINGS','MANAGE_CAREER_SETTINGS');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'param_employes')
    WHERE name IN ('VIEW_EMPLOYEES','CREATE_EMPLOYEES','EDIT_EMPLOYEES','DELETE_EMPLOYEES','MANAGE_EMPLOYEES','MANAGE_EMPLOYEE_SYNC');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'attestations')
    WHERE name IN ('VIEW_CERTIFICATES','CREATE_CERTIFICATES','EDIT_CERTIFICATES','DELETE_CERTIFICATES','SEND_CERTIFICATES','MANAGE_CERTIFICATES');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'souhaits')
    WHERE name IN ('VIEW_WISH_EVOLUTION','CREATE_WISH_EVOLUTION','EDIT_WISH_EVOLUTION','DELETE_WISH_EVOLUTION','MANAGE_WISH_EVOLUTION','MANAGE_WISH_TYPES');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'retraite')
    WHERE name IN ('VIEW_RETIREMENT','EDIT_RETIREMENT_SETTINGS','MANAGE_RETIREMENT');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'dashboard')
    WHERE name IN ('VIEW_DASHBOARD','VIEW_REPORTS','EXPORT_REPORTS');

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'evaluations')
    WHERE name IN (
        'VIEW_EVALUATIONS','CREATE_EVALUATIONS','EDIT_EVALUATIONS','DELETE_EVALUATIONS',
        'APPROVE_EVALUATIONS','MANAGE_EVALUATIONS','VALIDATE_EVALUATIONS_MANAGER',
        'VALIDATE_EVALUATIONS_DIRECTOR','EVALUATION_SETTINGS'
    );

    UPDATE Permissions SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'param_utilisateurs')
    WHERE name IN (
        'VIEW_USERS','CREATE_USERS','EDIT_USERS','DELETE_USERS',
        'VIEW_ROLES','CREATE_ROLES','EDIT_ROLES','DELETE_ROLES','MANAGE_ROLES',
        'VIEW_PERMISSIONS','MANAGE_PERMISSIONS'
    );

    PRINT 'Liaisons module_id mises à jour (FORCE).';
END
ELSE
BEGIN
    PRINT 'Table Modules absente — lancez 04_SEED_MODULES.sql d''abord.';
END

-- ---------------------------------------------------------------------------
-- 4. Accès pages pour les rôles Manager (par titre)
-- ---------------------------------------------------------------------------
DECLARE @managerRoles TABLE (role_id INT PRIMARY KEY);
INSERT INTO @managerRoles (role_id)
SELECT r.Role_id FROM Roles r
WHERE LOWER(LTRIM(RTRIM(r.title))) IN ('manager', 'managers');

IF EXISTS (SELECT 1 FROM @managerRoles) AND EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Role_Modules')
BEGIN
    INSERT INTO Role_Modules (role_id, module_id)
    SELECT mr.role_id, m.module_id
    FROM @managerRoles mr
    CROSS JOIN Modules m
    WHERE m.state = 1
      AND m.name IN (
        'dashboard','competences','competences_profil','competences_bulletin',
        'carrieres','carrieres_plan','retraite','souhaits',
        'evaluations','organigramme','historique'
      )
      AND NOT EXISTS (
          SELECT 1 FROM Role_Modules x
          WHERE x.role_id = mr.role_id AND x.module_id = m.module_id
      );

    -- Permissions métier de base Manager
    INSERT INTO Role_Permissions (role_id, permission_id)
    SELECT mr.role_id, p.Permission_id
    FROM @managerRoles mr
    CROSS JOIN Permissions p
    WHERE p.state = 1
      AND p.name IN (
        'VIEW_SKILLS_PROFILES','EDIT_SKILLS_PROFILES','VIEW_COMPETENCE_BULLETIN',
        'VIEW_CAREER','VIEW_ORGANIZATION','VIEW_ACTIVITY_HISTORY',
        'VIEW_EMPLOYEES','VIEW_WISH_EVOLUTION','CREATE_WISH_EVOLUTION','EDIT_WISH_EVOLUTION',
        'VIEW_RETIREMENT','VIEW_DASHBOARD','VIEW_REPORTS','VIEW_NOTIFICATIONS',
        'VIEW_EVALUATIONS','CREATE_EVALUATIONS','EDIT_EVALUATIONS',
        'APPROVE_EVALUATIONS','MANAGE_EVALUATIONS','VALIDATE_EVALUATIONS_MANAGER'
      )
      AND NOT EXISTS (
          SELECT 1 FROM Role_Permissions rp
          WHERE rp.role_id = mr.role_id AND rp.permission_id = p.Permission_id
      );

    PRINT 'Accès Manager synchronisé (modules + permissions).';
END
ELSE
BEGIN
    PRINT 'Aucun rôle Manager trouvé (titre exact Manager) — saute étape 4.';
END

-- Diagnostic
SELECT 'Permissions actives' AS info, COUNT(*) AS n FROM Permissions WHERE state = 1
UNION ALL
SELECT 'Avec module_id', COUNT(*) FROM Permissions WHERE state = 1 AND module_id IS NOT NULL
UNION ALL
SELECT 'Modules racines', COUNT(*) FROM Modules WHERE state = 1 AND parent_module_id IS NULL;

SELECT m.display_name, COUNT(p.Permission_id) AS nb_permissions
FROM Modules m
LEFT JOIN Permissions p ON p.module_id = m.module_id AND p.state = 1
WHERE m.state = 1 AND m.parent_module_id IS NULL
GROUP BY m.display_name, m.sort_order
ORDER BY m.sort_order;

PRINT '=== 09 terminé — rechargez l''admin / reconnectez le Manager ===';
