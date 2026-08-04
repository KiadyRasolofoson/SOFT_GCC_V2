-- =============================================================================
-- SEED DATA : Modules, Role_Modules et mise à jour des Permissions
-- Script autonome : crée les tables/colonnes si elles n'existent pas, puis seed.
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
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Permissions_Module' AND parent_object_id = OBJECT_ID('Permissions'))
BEGIN
    ALTER TABLE Permissions ADD CONSTRAINT FK_Permissions_Module FOREIGN KEY (module_id) REFERENCES Modules(module_id);
    PRINT 'Contrainte FK_Permissions_Module ajoutée.';
END
GO

-- =============================================================================
-- 1. Insertion des modules racines (ParentModuleId = NULL)
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state, description)
VALUES
('dashboard',    'Analyse statistiques',      'mdi mdi-view-grid',        '/soft-gcc/tableau-de-bord',      NULL, 1, 1, 'Tableau de bord'),
('competences',  'Compétences',               'mdi mdi-school',           '/soft-gcc/competences',          NULL, 2, 1, 'Gestion des compétences'),
('carrieres',    'Carrières',                 'mdi mdi-crosshairs-gps',   '/soft-gcc/carrieres',            NULL, 3, 1, 'Gestion des carrières'),
('evaluations',  'Évaluations',               'mdi mdi-clipboard-check',  '/soft-gcc/evaluations/liste',    NULL, 4, 1, 'Gestion des évaluations'),
('organigramme', 'Organigramme et effectif',  'mdi mdi-sitemap',          '/soft-gcc/effectifs',            NULL, 5, 1, 'Organigramme et effectifs'),
('historique',   'Historiques des activités', 'mdi mdi-history',          '/soft-gcc/historique',           NULL, 6, 1, 'Historique des activités'),
('parametrage',  'Paramètres',               'mdi mdi-settings',         '/soft-gcc/parametres',           NULL, 7, 1, 'Paramétrage'),
('attestations', 'Attestations',             'mdi mdi-certificate',      '/soft-gcc/attestations',         NULL, 8, 1, 'Gestion des attestations');

-- 2. Insertion des sous-modules (ParentModuleId référence le module parent)

-- Sous-modules de Compétences
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'competences_profil',  'Profil des compétences',    NULL, '/soft-gcc/competences',              m.module_id, 1, 1 FROM Modules m WHERE m.name = 'competences';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'competences_bulletin','Bulletin de compétences',   NULL, '/soft-gcc/evaluations/bulletin',      m.module_id, 2, 1 FROM Modules m WHERE m.name = 'competences';

-- Sous-modules de Carrières (retraite et souhaits sont dans le menu Carrières)
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'carrieres_plan',      'Plan de carrière',          NULL, '/soft-gcc/carrieres',                m.module_id, 1, 1 FROM Modules m WHERE m.name = 'carrieres';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'retraite',            'Départ à la retraite',      NULL, '/soft-gcc/retraite',                 m.module_id, 2, 1 FROM Modules m WHERE m.name = 'carrieres';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'souhaits',            'Évolution de carrière',     NULL, '/soft-gcc/souhaits-evolution',       m.module_id, 3, 1 FROM Modules m WHERE m.name = 'carrieres';

-- Sous-modules d'Évaluations
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'eval_notation',       'Notation d''évaluation',    NULL, '/soft-gcc/evaluations/liste',        m.module_id, 1, 1 FROM Modules m WHERE m.name = 'evaluations';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'eval_planning',       'Planning d''évaluations',   NULL, '/soft-gcc/evaluations/planning',     m.module_id, 2, 1 FROM Modules m WHERE m.name = 'evaluations';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'eval_entretien',      'Entretien d''évaluations',  NULL, '/soft-gcc/evaluations/accueil',      m.module_id, 3, 1 FROM Modules m WHERE m.name = 'evaluations';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'eval_historique',     'Historique d''évaluations', NULL, '/soft-gcc/evaluations/historique',  m.module_id, 4, 1 FROM Modules m WHERE m.name = 'evaluations';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'eval_objectifs',      'Récap objectifs',           NULL, '/soft-gcc/evaluations/objectifs',   m.module_id, 5, 1 FROM Modules m WHERE m.name = 'evaluations';

-- Sous-modules de Paramétrage
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_competences',   'Gestion Compétences',       NULL, '/soft-gcc/parametres/competences',  m.module_id, 1, 1 FROM Modules m WHERE m.name = 'parametrage';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_carrieres',     'Gestion Carrières',         NULL, '/soft-gcc/parametres/carrieres',    m.module_id, 2, 1 FROM Modules m WHERE m.name = 'parametrage';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_employes',      'Gestion employés',          NULL, '/soft-gcc/parametres/employes/liste', m.module_id, 3, 1 FROM Modules m WHERE m.name = 'parametrage';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_evaluations',   'Gestion des évaluations',   NULL, '/soft-gcc/evaluations/parametres',  m.module_id, 4, 1 FROM Modules m WHERE m.name = 'parametrage';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_utilisateurs',  'Gestion des utilisateurs',  NULL, '/soft-gcc/parametres/utilisateurs', m.module_id, 5, 1 FROM Modules m WHERE m.name = 'parametrage';
INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
SELECT 'param_admin_access',  'Gestion des accès',         NULL, '/soft-gcc/parametres/utilisateurs/administration', m.module_id, 6, 1 FROM Modules m WHERE m.name = 'parametrage';

-- 3. Attribution des modules aux rôles

-- Admin (role_id=1) : TOUS les modules racines
INSERT INTO Role_Modules (role_id, module_id)
SELECT 1, m.module_id FROM Modules m WHERE m.parent_module_id IS NULL AND m.state = 1;

-- Manager (role_id=2) : modules métier uniquement (pas parametrage ni attestations)
INSERT INTO Role_Modules (role_id, module_id)
SELECT 2, m.module_id FROM Modules m WHERE m.parent_module_id IS NULL AND m.state = 1
AND m.name IN ('dashboard', 'competences', 'carrieres', 'evaluations', 'organigramme', 'historique');

-- RH (role_id=3) : TOUS les modules
INSERT INTO Role_Modules (role_id, module_id)
SELECT 3, m.module_id FROM Modules m WHERE m.parent_module_id IS NULL AND m.state = 1;

-- Directeur (role_id=4) : TOUS les modules
INSERT INTO Role_Modules (role_id, module_id)
SELECT 4, m.module_id FROM Modules m WHERE m.parent_module_id IS NULL AND m.state = 1;

-- 4. Association des permissions existantes aux modules (module_id)

-- Module Utilisateurs → param_utilisateurs
UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = 'param_utilisateurs')
WHERE name LIKE '%_USERS' AND module_id IS NULL;

-- Module Rôles → param_utilisateurs
UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = 'param_utilisateurs')
WHERE name LIKE '%_ROLES' AND module_id IS NULL;

-- Module Permissions → param_utilisateurs
UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = 'param_utilisateurs')
WHERE name LIKE '%_PERMISSIONS' AND module_id IS NULL;

-- Module Évaluations → evaluations
UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = 'evaluations')
WHERE name LIKE '%_EVALUATIONS' AND module_id IS NULL;

-- Module Départements → param_employes
UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = 'param_employes')
WHERE name LIKE '%_DEPARTMENTS' AND module_id IS NULL;

-- Module Postes → param_employes
UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = 'param_employes')
WHERE name LIKE '%_POSITIONS' AND module_id IS NULL;

-- Module Carrières → carrieres
UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = 'carrieres')
WHERE name LIKE '%_CAREER' AND module_id IS NULL;

-- Module Retraite → retraite
UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = 'retraite')
WHERE name LIKE '%_RETIREMENT' AND module_id IS NULL;

-- Module Statistiques → dashboard
UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = 'dashboard')
WHERE name LIKE '%_REPORTS' AND module_id IS NULL;

-- Tout le reste → parametrage (fallback)
UPDATE Permissions SET module_id = (SELECT module_id FROM Modules WHERE name = 'parametrage')
WHERE module_id IS NULL;

PRINT '=== Seed Modules terminé ===';
