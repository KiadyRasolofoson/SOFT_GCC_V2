


-- ====================================================
- DONNÉES ESSENTIELLES
-- ====================================================

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
        ('MANAGE_RETIREMENT', 'Gérer les retraites', 1);
        
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
        'VIEW_DEPARTMENTS',
        'VIEW_POSITIONS',
        'VIEW_REPORTS'
    );

    -- Employee (Role_id = 3) : Permissions minimales
    INSERT INTO Role_Permissions (role_id, permission_id)
    SELECT 3, Permission_id 
    FROM Permissions 
    WHERE name IN (
        'VIEW_EVALUATIONS',
        'VIEW_DEPARTMENTS',
        'VIEW_POSITIONS'
    );

    -- Director (Role_id = 4) : Permissions étendues
    INSERT INTO Role_Permissions (role_id, permission_id)
    SELECT 4, Permission_id 
    FROM Permissions 
    WHERE name IN (
        'VIEW_USERS',
        'VIEW_EVALUATIONS',
        'CREATE_EVALUATIONS',
        'EDIT_EVALUATIONS',
        'APPROVE_EVALUATIONS',
        'VIEW_DEPARTMENTS',
        'VIEW_POSITIONS',
        'VIEW_REPORTS',
        'EXPORT_REPORTS'
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

