


-- Vérifier si les données de permission existent déjà
IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'VIEW_USERS')
BEGIN
    -- Insertion des permissions de base
    INSERT INTO Permissions (name, description, state)
    VALUES
        -- Permissions liées aux utilisateurs
        ('VIEW_USERS', 'Voir la liste des utilisateurs', 1),
        ('CREATE_USERS', 'Créer de nouveaux utilisateurs', 1),
        ('EDIT_USERS', 'Modifier les utilisateurs existants', 1),
        ('DELETE_USERS', 'Supprimer des utilisateurs', 1),
        
        -- Permissions liées aux rôles
        ('VIEW_ROLES', 'Voir la liste des rôles', 1),
        ('CREATE_ROLES', 'Créer de nouveaux rôles', 1),
        ('EDIT_ROLES', 'Modifier les rôles existants', 1),
        ('DELETE_ROLES', 'Supprimer des rôles', 1),
        
        -- Permissions liées aux permissions
        ('VIEW_PERMISSIONS', 'Voir la liste des permissions', 1),
        ('MANAGE_PERMISSIONS', 'Gérer les permissions des rôles', 1),
        
        -- Permissions liées aux évaluations
        ('VIEW_EVALUATIONS', 'Voir les évaluations', 1),
        ('CREATE_EVALUATIONS', 'Créer des évaluations', 1),
        ('EDIT_EVALUATIONS', 'Modifier les évaluations', 1),
        ('DELETE_EVALUATIONS', 'Supprimer des évaluations', 1),
        ('APPROVE_EVALUATIONS', 'Approuver les évaluations', 1),
        ('MANAGE_EVALUATIONS', 'Gérer le module évaluations (planning, entretiens, import)', 1),
        ('VALIDATE_EVALUATIONS_MANAGER', 'Valider les évaluations en tant que manager (N+1)', 1),
        ('VALIDATE_EVALUATIONS_DIRECTOR', 'Valider les évaluations en tant que directeur', 1),
        ('EVALUATION_SETTINGS', 'Configurer les paramètres du module évaluations', 1),
        
        -- Permissions liées aux départements
        ('VIEW_DEPARTMENTS', 'Voir la liste des départements', 1),
        ('MANAGE_DEPARTMENTS', 'Gérer les départements', 1),
        
        -- Permissions liées aux postes
        ('VIEW_POSITIONS', 'Voir la liste des postes', 1),
        ('MANAGE_POSITIONS', 'Gérer les postes', 1),
        
        -- Permissions liées aux rapports
        ('VIEW_REPORTS', 'Voir les rapports', 1),
        ('EXPORT_REPORTS', 'Exporter les rapports', 1),
        
        -- Permissions supplémentaires
        ('MANAGE_CAREER', 'Gérer les carrières', 1),
        ('MANAGE_RETIREMENT', 'Gérer les retraites', 1),
        ('MANAGE_ROLES', 'Gérer les rôles (CRUD)', 1),

        -- Compétences / salary skills
        ('VIEW_SKILLS_PROFILES', N'Consulter les profils de compétences des employés', 1),
        ('EDIT_SKILLS_PROFILES', N'Modifier les compétences, langues et formations des employés', 1),
        ('VIEW_COMPETENCE_BULLETIN', N'Consulter les bulletins de compétences', 1),
        ('MANAGE_SKILLS_PROFILES', N'Administration complète des profils de compétences', 1),

        -- Carrières granulaires
        ('VIEW_CAREER', N'Consulter les plans de carrière', 1),
        ('CREATE_CAREER', N'Créer des plans / affectations de carrière', 1),
        ('EDIT_CAREER', N'Modifier les plans de carrière', 1),
        ('DELETE_CAREER', N'Supprimer des plans de carrière', 1),

        -- Organigramme
        ('VIEW_ORGANIZATION', N'Consulter l''organigramme et les effectifs', 1),
        ('IMPORT_ORGANIZATION', N'Importer les effectifs (CSV)', 1),
        ('MANAGE_ORGANIZATION', N'Administrer l''organigramme et les effectifs', 1),

        -- Historique
        ('VIEW_ACTIVITY_HISTORY', N'Consulter l''historique des activités', 1),
        ('MANAGE_ACTIVITY_HISTORY', N'Administrer l''historique des activités', 1),

        -- Paramétrage
        ('VIEW_SKILL_SETTINGS', N'Consulter le référentiel compétences (paramètres)', 1),
        ('MANAGE_SKILL_SETTINGS', N'Gérer le référentiel compétences (paramètres)', 1),
        ('PUBLISH_SKILL_REFERENTIAL', N'Publier et archiver le référentiel de compétences', 1),
        ('VIEW_CAREER_SETTINGS', N'Consulter le référentiel carrières (paramètres)', 1),
        ('MANAGE_CAREER_SETTINGS', N'Gérer le référentiel carrières (paramètres)', 1),
        ('VIEW_EMPLOYEES', N'Consulter la liste des employés', 1),
        ('CREATE_EMPLOYEES', N'Créer des employés', 1),
        ('EDIT_EMPLOYEES', N'Modifier des employés', 1),
        ('DELETE_EMPLOYEES', N'Supprimer des employés', 1),
        ('MANAGE_EMPLOYEES', N'Administration complète des employés', 1),
        ('MANAGE_EMPLOYEE_SYNC', N'Synchroniser les employés depuis le système source', 1),

        -- Attestations
        ('VIEW_CERTIFICATES', N'Consulter les attestations', 1),
        ('CREATE_CERTIFICATES', N'Générer / créer des attestations', 1),
        ('EDIT_CERTIFICATES', N'Modifier les modèles d''attestations', 1),
        ('DELETE_CERTIFICATES', N'Supprimer des attestations', 1),
        ('SEND_CERTIFICATES', N'Envoyer des attestations par e-mail', 1),
        ('MANAGE_CERTIFICATES', N'Administration complète des attestations', 1),

        -- Souhaits d''évolution
        ('VIEW_WISH_EVOLUTION', N'Consulter les souhaits d''évolution', 1),
        ('CREATE_WISH_EVOLUTION', N'Créer des souhaits d''évolution', 1),
        ('EDIT_WISH_EVOLUTION', N'Modifier des souhaits d''évolution', 1),
        ('DELETE_WISH_EVOLUTION', N'Supprimer des souhaits d''évolution', 1),
        ('MANAGE_WISH_EVOLUTION', N'Administrer les souhaits d''évolution', 1),
        ('MANAGE_WISH_TYPES', N'Gérer les types de souhaits d''évolution', 1),

        -- Retraite
        ('VIEW_RETIREMENT', N'Consulter les départs à la retraite', 1),
        ('EDIT_RETIREMENT_SETTINGS', N'Modifier les paramètres de retraite', 1),

        -- Dashboard / notifications
        ('VIEW_DASHBOARD', N'Accéder au tableau de bord statistiques', 1),
        ('VIEW_NOTIFICATIONS', N'Consulter ses notifications', 1);
        
    PRINT 'Permissions insérées avec succès';
END

-- Vérifier si les rôles existent déjà
IF NOT EXISTS (SELECT 1 FROM Roles WHERE title = 'Administrator')
BEGIN
    -- Insertion des rôles de base
    INSERT INTO Roles (title, state)
    VALUES 
        ('Admin', 1), -- Role_id = 1 
        ('Manageur', 1),       -- Role_id = 2 
        ('RH', 1),      -- Role_id = 3 
        ('Directeur', 1);      -- Role_id = 4
        
    PRINT 'Rôles insérés avec succès';
END

-- Vérifier si les types de réponse existent déjà
IF NOT EXISTS (SELECT 1 FROM ResponseTypes WHERE TypeName = 'TEXT')
BEGIN
    -- Insérer les types de réponse de base
    INSERT INTO ResponseTypes (ResponseTypeId, TypeName, Description)
    VALUES 
        (1, 'TEXT', 'Réponse textuelle libre'),
        (2, 'QCM', 'Choix multiple avec options prédéfinies'),
        (3, 'SCORE', 'Évaluation numérique sur échelle');
        
    PRINT 'Types de réponse insérés avec succès';
END

IF NOT EXISTS (SELECT 1 FROM Role_Permissions WHERE role_id = 1)
BEGIN
    
    -- Administrator (Role_id = 1) : Toutes les permissions
    INSERT INTO Role_Permissions (role_id, permission_id)
    SELECT 1, Permission_id FROM Permissions;

    -- Manager (Role_id = 2) : Permissions limitées
    INSERT INTO Role_Permissions (role_id, permission_id)
    SELECT 2, Permission_id 
    FROM Permissions 
    WHERE name IN (
        'VIEW_USERS',
        'VIEW_EVALUATIONS',
        'CREATE_EVALUATIONS',
        'EDIT_EVALUATIONS',
        'APPROVE_EVALUATIONS',
        'MANAGE_EVALUATIONS',
        'VALIDATE_EVALUATIONS_MANAGER',
        'VIEW_DEPARTMENTS',
        'VIEW_POSITIONS',
        'VIEW_REPORTS',
        'VIEW_SKILLS_PROFILES', 'EDIT_SKILLS_PROFILES', 'VIEW_COMPETENCE_BULLETIN',
        'VIEW_CAREER',
        'VIEW_ORGANIZATION',
        'VIEW_ACTIVITY_HISTORY',
        'VIEW_EMPLOYEES',
        'VIEW_WISH_EVOLUTION', 'CREATE_WISH_EVOLUTION', 'EDIT_WISH_EVOLUTION',
        'VIEW_RETIREMENT',
        'VIEW_DASHBOARD',
        'VIEW_NOTIFICATIONS'
    );

    -- RH (Role_id = 3)
    INSERT INTO Role_Permissions (role_id, permission_id)
    SELECT 3, Permission_id 
    FROM Permissions 
    WHERE name IN (
        'VIEW_USERS', 'CREATE_USERS', 'EDIT_USERS',
        'VIEW_ROLES', 'MANAGE_ROLES',
        'VIEW_PERMISSIONS', 'MANAGE_PERMISSIONS',
        'VIEW_EVALUATIONS', 'CREATE_EVALUATIONS', 'EDIT_EVALUATIONS',
        'APPROVE_EVALUATIONS', 'MANAGE_EVALUATIONS', 'EVALUATION_SETTINGS',
        'VIEW_DEPARTMENTS', 'MANAGE_DEPARTMENTS',
        'VIEW_POSITIONS', 'MANAGE_POSITIONS',
        'VIEW_REPORTS', 'EXPORT_REPORTS',
        'MANAGE_CAREER', 'MANAGE_RETIREMENT',
        'VIEW_SKILLS_PROFILES', 'EDIT_SKILLS_PROFILES', 'VIEW_COMPETENCE_BULLETIN', 'MANAGE_SKILLS_PROFILES',
        'VIEW_CAREER', 'CREATE_CAREER', 'EDIT_CAREER', 'DELETE_CAREER',
        'VIEW_ORGANIZATION', 'IMPORT_ORGANIZATION', 'MANAGE_ORGANIZATION',
        'VIEW_ACTIVITY_HISTORY', 'MANAGE_ACTIVITY_HISTORY',
        'VIEW_SKILL_SETTINGS', 'MANAGE_SKILL_SETTINGS', 'PUBLISH_SKILL_REFERENTIAL',
        'VIEW_CAREER_SETTINGS', 'MANAGE_CAREER_SETTINGS',
        'VIEW_EMPLOYEES', 'CREATE_EMPLOYEES', 'EDIT_EMPLOYEES', 'DELETE_EMPLOYEES', 'MANAGE_EMPLOYEES',
        'MANAGE_EMPLOYEE_SYNC',
        'VIEW_CERTIFICATES', 'CREATE_CERTIFICATES', 'EDIT_CERTIFICATES', 'DELETE_CERTIFICATES',
        'SEND_CERTIFICATES', 'MANAGE_CERTIFICATES',
        'VIEW_WISH_EVOLUTION', 'CREATE_WISH_EVOLUTION', 'EDIT_WISH_EVOLUTION', 'DELETE_WISH_EVOLUTION',
        'MANAGE_WISH_EVOLUTION', 'MANAGE_WISH_TYPES',
        'VIEW_RETIREMENT', 'EDIT_RETIREMENT_SETTINGS',
        'VIEW_DASHBOARD',
        'VIEW_NOTIFICATIONS'
    );

    -- Directeur (Role_id = 4) : Permissions étendues
    INSERT INTO Role_Permissions (role_id, permission_id)
    SELECT 4, Permission_id 
    FROM Permissions 
    WHERE name IN (
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
        'EXPORT_REPORTS',
        'VIEW_SKILLS_PROFILES', 'VIEW_COMPETENCE_BULLETIN',
        'VIEW_CAREER',
        'VIEW_ORGANIZATION',
        'VIEW_ACTIVITY_HISTORY',
        'VIEW_EMPLOYEES',
        'VIEW_CERTIFICATES',
        'VIEW_WISH_EVOLUTION',
        'VIEW_RETIREMENT',
        'VIEW_DASHBOARD',
        'VIEW_NOTIFICATIONS'
    );
    
    PRINT 'Permissions attribuées aux rôles avec succès';
END

-- Vérifier si les départements existent déjà
IF NOT EXISTS (SELECT 1 FROM Department WHERE Department_name = 'Informatique')
BEGIN
    -- Insertion des départements de base
    INSERT INTO Department (Department_name, state)
    VALUES
        ('Informatique', 1),
        ('Marketing', 1),
        ('Direction', 1),
        ('Vente et commerce', 1),
        ('Reseaux et techniques', 1);
        
    PRINT 'Départements insérés avec succès';
END

-- Vérifier si les postes existent déjà
IF NOT EXISTS (SELECT 1 FROM Position WHERE position_name = 'Developpeur')
BEGIN
    -- Insertion des postes de base
    INSERT INTO Position (position_name, state)
    VALUES
        ('Developpeur', 1),
        ('Technicien', 1),
        ('Responsable Marketing', 1),
        ('Testeur', 1);
        
    PRINT 'Postes insérés avec succès';
END

-- Vérifier si les types d'évaluation existent déjà
IF NOT EXISTS (SELECT 1 FROM Evaluation_type WHERE designation = 'Évaluation annuelle')
BEGIN
    -- Insertion des types d'évaluation de base
    INSERT INTO Evaluation_type (designation, state)
    VALUES
        ('Évaluation annuelle', 1),
        ('Évaluation de période d''essai', 1),
        ('Évaluation de projet', 1);
        
    PRINT 'Types d''évaluation insérés avec succès';
END

-- ====================================================
-- 4. VALIDATION
-- ====================================================

-- Afficher les permissions de l'administrateur
SELECT 'Permissions de l''administrateur:' AS Information;
SELECT p.name, p.description
FROM Permissions p
JOIN Role_Permissions rp ON p.Permission_id = rp.permission_id
WHERE rp.role_id = 1;

