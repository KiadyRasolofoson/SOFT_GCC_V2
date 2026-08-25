-- =============================================================================
-- SEED DATA : Modules, Role_Modules et mise à jour des Permissions
-- Script autonome, idempotent, sans GO (compatible DBeaver / JDBC).
-- =============================================================================

-- 0. Création des tables/colonnes (si la migration EF n'a pas été appliquée)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Modules')
BEGIN
    CREATE TABLE Modules (
        module_id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        display_name NVARCHAR(255) NOT NULL,
        icon NVARCHAR(100) NULL,
        route NVARCHAR(255) NULL,
        parent_module_id INT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        state INT NOT NULL DEFAULT 1,
        description NVARCHAR(500) NULL,
        CONSTRAINT FK_Modules_Parent FOREIGN KEY (parent_module_id) REFERENCES Modules(module_id)
    );
    CREATE UNIQUE INDEX IX_Modules_name ON Modules(name);
    PRINT 'Table Modules créée.';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Role_Modules')
BEGIN
    CREATE TABLE Role_Modules (
        role_module_id INT IDENTITY(1,1) PRIMARY KEY,
        role_id INT NOT NULL,
        module_id INT NOT NULL,
        CONSTRAINT FK_RoleModules_Role FOREIGN KEY (role_id) REFERENCES Roles(Role_id) ON DELETE CASCADE,
        CONSTRAINT FK_RoleModules_Module FOREIGN KEY (module_id) REFERENCES Modules(module_id) ON DELETE CASCADE
    );
    PRINT 'Table Role_Modules créée.';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Permissions') AND name = 'module_id')
BEGIN
    ALTER TABLE Permissions ADD module_id INT NULL;
    PRINT 'Colonne module_id ajoutée à Permissions.';
END

-- EXEC : compilation différée (Permissions.module_id vient d'être ajoutée dans ce lot)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Permissions_Module' AND parent_object_id = OBJECT_ID('Permissions'))
BEGIN
    EXEC('ALTER TABLE Permissions ADD CONSTRAINT FK_Permissions_Module FOREIGN KEY (module_id) REFERENCES Modules(module_id)');
    PRINT 'Contrainte FK_Permissions_Module ajoutée.';
END

-- =============================================================================
-- 1. Insertion des modules racines (idempotent)
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state, description)
SELECT v.name, v.display_name, v.icon, v.route, v.parent_module_id, v.sort_order, v.state, v.description
FROM (VALUES
    ('dashboard',    N'Analyse statistiques',      N'mdi mdi-view-grid',        N'/soft-gcc/tableau-de-bord',      CAST(NULL AS INT), 1, 1, N'Tableau de bord'),
    ('competences',  N'Compétences',               N'mdi mdi-school',           N'/soft-gcc/competences',          CAST(NULL AS INT), 2, 1, N'Gestion des compétences'),
    ('carrieres',    N'Carrières',                 N'mdi mdi-crosshairs-gps',   N'/soft-gcc/carrieres',            CAST(NULL AS INT), 3, 1, N'Gestion des carrières'),
    ('evaluations',  N'Évaluations',               N'mdi mdi-clipboard-check',  N'/soft-gcc/evaluations/liste',    CAST(NULL AS INT), 4, 1, N'Gestion des évaluations'),
    ('organigramme', N'Organigramme et effectif',  N'mdi mdi-sitemap',          N'/soft-gcc/effectifs',            CAST(NULL AS INT), 5, 1, N'Organigramme et effectifs'),
    ('historique',   N'Historiques des activités', N'mdi mdi-history',          N'/soft-gcc/historique',           CAST(NULL AS INT), 6, 1, N'Historique des activités'),
    ('parametrage',  N'Paramètres',                N'mdi mdi-settings',         N'/soft-gcc/parametres',           CAST(NULL AS INT), 7, 1, N'Paramétrage'),
    ('attestations', N'Attestations',              N'mdi mdi-certificate',      N'/soft-gcc/attestations',         CAST(NULL AS INT), 8, 1, N'Gestion des attestations')
) v(name, display_name, icon, route, parent_module_id, sort_order, state, description)
WHERE NOT EXISTS (SELECT 1 FROM Modules m WHERE m.name = v.name);

-- 2. Insertion des sous-modules
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'competences_profil',  N'Profil des compétences',    NULL, N'/soft-gcc/competences',              m.module_id, 1, 1 FROM Modules m WHERE m.name = 'competences'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'competences_profil');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'competences_bulletin', N'Bulletin de compétences',  NULL, N'/soft-gcc/evaluations/bulletin',     m.module_id, 2, 1 FROM Modules m WHERE m.name = 'competences'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'competences_bulletin');

INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'carrieres_plan',      N'Plan de carrière',          NULL, N'/soft-gcc/carrieres',                m.module_id, 1, 1 FROM Modules m WHERE m.name = 'carrieres'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'carrieres_plan');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'retraite',            N'Départ à la retraite',      NULL, N'/soft-gcc/retraite',                 m.module_id, 2, 1 FROM Modules m WHERE m.name = 'carrieres'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'retraite');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'souhaits',            N'Évolution de carrière',     NULL, N'/soft-gcc/souhaits-evolution',       m.module_id, 3, 1 FROM Modules m WHERE m.name = 'carrieres'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'souhaits');

INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'eval_notation',       N'Notation d''évaluation',    NULL, N'/soft-gcc/evaluations/liste',        m.module_id, 1, 1 FROM Modules m WHERE m.name = 'evaluations'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'eval_notation');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'eval_planning',       N'Planning d''évaluations',   NULL, N'/soft-gcc/evaluations/planning',     m.module_id, 2, 1 FROM Modules m WHERE m.name = 'evaluations'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'eval_planning');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'eval_entretien',      N'Entretien d''évaluations',  NULL, N'/soft-gcc/evaluations/accueil',      m.module_id, 3, 1 FROM Modules m WHERE m.name = 'evaluations'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'eval_entretien');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'eval_historique',     N'Historique d''évaluations', NULL, N'/soft-gcc/evaluations/historique',  m.module_id, 4, 1 FROM Modules m WHERE m.name = 'evaluations'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'eval_historique');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'eval_objectifs',      N'Récap objectifs',           NULL, N'/soft-gcc/evaluations/objectifs',   m.module_id, 5, 1 FROM Modules m WHERE m.name = 'evaluations'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'eval_objectifs');

INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_competences',   N'Référentiel de compétences', NULL, N'/soft-gcc/parametres/referentiel-competences',  m.module_id, 1, 1 FROM Modules m WHERE m.name = 'parametrage'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'param_competences');
UPDATE Modules
SET route = N'/soft-gcc/parametres/referentiel-competences',
    display_name = N'Référentiel de compétences'
WHERE name = 'param_competences';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_competences_nomenclatures', N'Nomenclatures compétences', NULL, N'/soft-gcc/parametres/competences', m.module_id, 2, 1
FROM Modules m WHERE m.name = 'parametrage'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'param_competences_nomenclatures');
UPDATE Modules
SET parent_module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'parametrage'),
    display_name = N'Nomenclatures compétences',
    route = N'/soft-gcc/parametres/competences',
    sort_order = 2,
    state = 1
WHERE name = 'param_competences_nomenclatures';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_carrieres',     N'Gestion Carrières',         NULL, N'/soft-gcc/parametres/carrieres',    m.module_id, 2, 1 FROM Modules m WHERE m.name = 'parametrage'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'param_carrieres');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_employes',      N'Gestion employés',          NULL, N'/soft-gcc/parametres/employes/liste', m.module_id, 3, 1 FROM Modules m WHERE m.name = 'parametrage'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'param_employes');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_evaluations',   N'Gestion des évaluations',   NULL, N'/soft-gcc/evaluations/parametres',  m.module_id, 4, 1 FROM Modules m WHERE m.name = 'parametrage'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'param_evaluations');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_utilisateurs',  N'Gestion des utilisateurs',  NULL, N'/soft-gcc/parametres/utilisateurs', m.module_id, 5, 1 FROM Modules m WHERE m.name = 'parametrage'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'param_utilisateurs');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_admin_access',  N'Gestion des accès',         NULL, N'/soft-gcc/parametres/utilisateurs/administration', m.module_id, 6, 1 FROM Modules m WHERE m.name = 'parametrage'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'param_admin_access');
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_synchronisation', N'Synchronisation employés', N'mdi mdi-sync', N'/soft-gcc/parametres/synchronisation', m.module_id, 7, 1 FROM Modules m WHERE m.name = 'parametrage'
AND NOT EXISTS (SELECT 1 FROM Modules x WHERE x.name = 'param_synchronisation');

-- 3. Attribution des modules aux rôles
INSERT INTO Role_Modules (role_id, module_id)
SELECT 1, m.module_id FROM Modules m
WHERE m.parent_module_id IS NULL AND m.state = 1
AND NOT EXISTS (SELECT 1 FROM Role_Modules rm WHERE rm.role_id = 1 AND rm.module_id = m.module_id);

INSERT INTO Role_Modules (role_id, module_id)
SELECT 2, m.module_id FROM Modules m
WHERE m.parent_module_id IS NULL AND m.state = 1
AND m.name IN ('dashboard', 'competences', 'carrieres', 'evaluations', 'organigramme', 'historique')
AND NOT EXISTS (SELECT 1 FROM Role_Modules rm WHERE rm.role_id = 2 AND rm.module_id = m.module_id);

INSERT INTO Role_Modules (role_id, module_id)
SELECT 3, m.module_id FROM Modules m
WHERE m.parent_module_id IS NULL AND m.state = 1
AND NOT EXISTS (SELECT 1 FROM Role_Modules rm WHERE rm.role_id = 3 AND rm.module_id = m.module_id);

INSERT INTO Role_Modules (role_id, module_id)
SELECT 4, m.module_id FROM Modules m
WHERE m.parent_module_id IS NULL AND m.state = 1
AND NOT EXISTS (SELECT 1 FROM Role_Modules rm WHERE rm.role_id = 4 AND rm.module_id = m.module_id);

INSERT INTO Role_Modules (role_id, module_id)
SELECT rm.role_id, c.module_id
FROM Role_Modules rm
INNER JOIN Modules p ON p.module_id = rm.module_id AND p.parent_module_id IS NULL
INNER JOIN Modules c ON c.parent_module_id = p.module_id AND c.state = 1
WHERE NOT EXISTS (
  SELECT 1 FROM Role_Modules x
  WHERE x.role_id = rm.role_id AND x.module_id = c.module_id
);

-- 4. Association des permissions aux modules
-- EXEC : SQL Server refuse de compiler Permissions.module_id dans le même lot que l'ALTER TABLE
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''param_utilisateurs'') WHERE name LIKE ''%_USERS'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''param_utilisateurs'') WHERE name LIKE ''%_ROLES'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''param_utilisateurs'') WHERE name LIKE ''%_PERMISSIONS'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''evaluations'') WHERE name LIKE ''%_EVALUATIONS'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''param_employes'') WHERE name LIKE ''%_DEPARTMENTS'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''param_employes'') WHERE name LIKE ''%_POSITIONS'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''carrieres'') WHERE name LIKE ''%_CAREER'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''retraite'') WHERE name LIKE ''%_RETIREMENT'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''dashboard'') WHERE name LIKE ''%_REPORTS'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''competences'') WHERE name IN (''VIEW_SKILLS_PROFILES'',''EDIT_SKILLS_PROFILES'',''VIEW_COMPETENCE_BULLETIN'',''MANAGE_SKILLS_PROFILES'') AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''organigramme'') WHERE name IN (''VIEW_ORGANIZATION'',''IMPORT_ORGANIZATION'',''MANAGE_ORGANIZATION'') AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''historique'') WHERE name IN (''VIEW_ACTIVITY_HISTORY'',''MANAGE_ACTIVITY_HISTORY'') AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''param_competences'') WHERE name IN (''VIEW_SKILL_SETTINGS'',''MANAGE_SKILL_SETTINGS'',''PUBLISH_SKILL_REFERENTIAL'') AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''param_carrieres'') WHERE name IN (''VIEW_CAREER_SETTINGS'',''MANAGE_CAREER_SETTINGS'') AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''param_employes'') WHERE name IN (''VIEW_EMPLOYEES'',''CREATE_EMPLOYEES'',''EDIT_EMPLOYEES'',''DELETE_EMPLOYEES'',''MANAGE_EMPLOYEES'') AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''param_synchronisation'') WHERE name = ''MANAGE_EMPLOYEE_SYNC'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''attestations'') WHERE name LIKE ''%_CERTIFICATES'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''souhaits'') WHERE name LIKE ''%WISH%'' AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''dashboard'') WHERE name IN (''VIEW_DASHBOARD'',''VIEW_NOTIFICATIONS'') AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''carrieres'') WHERE name IN (''VIEW_CAREER'',''CREATE_CAREER'',''EDIT_CAREER'',''DELETE_CAREER'') AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''retraite'') WHERE name IN (''VIEW_RETIREMENT'',''EDIT_RETIREMENT_SETTINGS'') AND module_id IS NULL');
EXEC(N'UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = ''parametrage'') WHERE module_id IS NULL');

PRINT '=== Seed Modules terminé ===';
