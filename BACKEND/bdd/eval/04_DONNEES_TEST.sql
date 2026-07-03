-- D�sactiver temporairement toutes les contraintes
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';

BEGIN TRANSACTION;

-- Tables de niveau le plus profond (d�pendantes)
DELETE FROM InterviewParticipants;
DELETE FROM Evaluation_interviews;
DELETE FROM Training_suggestions;
DELETE FROM Evaluation_questionnaire;
DELETE FROM Evaluation_progress;
DELETE FROM Evaluations;
DELETE FROM Evaluation_questions;

-- Suppression des donn�es dans les nouvelles tables
DELETE FROM Competence_Trainings; -- Si elle existe
DELETE FROM Competence_Lines; -- Si elle existe

-- Gestion des r�f�rences circulaires dans Users
UPDATE Users SET deleted_by = NULL, created_by = NULL; 
DELETE FROM Users;

-- Tables Permission (si vous souhaitez les conserver, commentez ces lignes)
DELETE FROM Role_Permissions;
DELETE FROM Permissions;

-- R�activer toutes les contraintes
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';

-- R�initialisation de toutes les s�quences IDENTITY (sauf Department, Position, Roles)
DBCC CHECKIDENT ('Users', RESEED, 0);
DBCC CHECKIDENT ('Evaluation_type', RESEED, 0);
DBCC CHECKIDENT ('Evaluations', RESEED, 0);
DBCC CHECKIDENT ('Evaluation_questions', RESEED, 0);
DBCC CHECKIDENT ('Evaluation_questionnaire', RESEED, 0);
DBCC CHECKIDENT ('Training_suggestions', RESEED, 0);
DBCC CHECKIDENT ('Evaluation_interviews', RESEED, 0);
DBCC CHECKIDENT ('InterviewParticipants', RESEED, 0);
DBCC CHECKIDENT ('Evaluation_progress', RESEED, 0);
DBCC CHECKIDENT ('Competence_Lines', RESEED, 0);
DBCC CHECKIDENT ('Competence_Trainings', RESEED, 0);
--DBCC CHECKIDENT ('Permissions', RESEED, 0);
--DBCC CHECKIDENT ('Role_Permissions', RESEED, 0);

COMMIT TRANSACTION;







INSERT INTO Department (Department_name)
VALUES
    ('Informatique'),
    ( 'Marketing'),
    ('Direction'),
    ( 'Vente et commerce'),
    ('Reseaux et techniques');
	use BaseGcc_presentation
INSERT INTO Position(position_name)
VALUES
    ('Developpeur'),             -- Poste_id = 1
    ('Technicien'),				-- Poste_id = 2
    ('Responsable Marketing'),     -- Poste_id = 3
    ('Testeur');					-- Poste_id = 4

 INSERT INTO Roles (title)
 VALUES 
    ('Administrator'), -- Role_id = 1 
    ('Manager'),       -- Role_id = 2 
    ('Employee'),      -- Role_id = 3 
    ('Director');      -- Role_id = 4
---------------------------
-- 1. Administrateur
---------------------------
INSERT INTO Users 
    (last_name, first_name, email, password, role_id, departmentid, positionId, creation_date, created_by, deletion_date, deleted_by, state)
VALUES 
    ('Rasoanirina', 'Andrianina', 'admin.mg@example.com', 'passAdmin', 1, 1, 2, GETUTCDATE(), 1, NULL, NULL, 1);

---------------------------
-- 2. Managers
---------------------------
INSERT INTO Users 
    (last_name, first_name, email, password, role_id, departmentid, positionId, creation_date, created_by, deletion_date, deleted_by, state)
VALUES 
    ('Rakotoarisoa', 'Fanja', 'fanja.mg@example.com', 'passManager1', 2, 2, 4, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Randrianarisoa', 'Mialy', 'mialy.mg@example.com', 'passManager2', 2, 4, 8, GETUTCDATE(), 1, NULL, NULL, 1);

---------------------------
-- 3. Directeurs
---------------------------
INSERT INTO Users 
    (last_name, first_name, email, password, role_id, departmentid, positionId, creation_date, created_by, deletion_date, deleted_by, state)
VALUES 
    ('Rasolofoson', 'Hery', 'hery.mg@example.com', 'passDirector1', 4, 3, 6, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Raharison', 'Andry', 'andry.mg@example.com', 'passDirector2', 4, 3, 6, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Ratsimbazafy', 'Tovo', 'tovo.mg@example.com', 'passDirector3', 4, 3, 6, GETUTCDATE(), 1, NULL, NULL, 1);

---------------------------
-- 4. Employ�s (20 enregistrements)
---------------------------
INSERT INTO Users 
    (last_name, first_name, email, password, role_id, departmentid, positionId, creation_date, created_by, deletion_date, deleted_by, state)
VALUES
    -- Affect�s � Informatique (D�pt 1) : alternance entre "Developpeur" (post_id 1) et "Analyste de donn�es" (post_id 3)
    ('Rakotomavo', 'Lala', 'lala.mg@example.com', 'passEmployee1', 3, 1, 1, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Raharivelo', 'Fetra', 'fetra.mg@example.com', 'passEmployee2', 3, 1, 3, GETUTCDATE(), 1, NULL, NULL, 1),
    
    -- Affect�s � Marketing (D�pt 2) avec "Charg� de communication" (post_id 5)
    ('Razanirina', 'Jean', 'jean.mg@example.com', 'passEmployee3', 3, 2, 5, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Ranaivoson', 'Solo', 'solo.mg@example.com', 'passEmployee4', 3, 2, 5, GETUTCDATE(), 1, NULL, NULL, 1),
    
    -- Affect�s � Vente et commerce (D�pt 4) avec "Commercial" (post_id 7)
    ('Ratsimbazaka', 'Mandro', 'mandro.mg@example.com', 'passEmployee5', 3, 4, 7, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Rakotomalala', 'Noro', 'noro.mg@example.com', 'passEmployee6', 3, 4, 7, GETUTCDATE(), 1, NULL, NULL, 1),
    
    -- Affect�s � Reseaux et techniques (D�pt 5) avec "Technicien support" (post_id 10)
    ('Rasoanaivo', 'Vola', 'vola.mg@example.com', 'passEmployee7', 3, 5, 10, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Randrianarivelo', 'Zafy', 'zafy.mg@example.com', 'passEmployee8', 3, 5, 10, GETUTCDATE(), 1, NULL, NULL, 1),
    
    -- Retour � Informatique
    ('Rasolomampianina', 'Faly', 'faly.mg@example.com', 'passEmployee9', 3, 1, 1, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Rakotondramanana', 'Mamy', 'mamy.mg@example.com', 'passEmployee10', 3, 1, 3, GETUTCDATE(), 1, NULL, NULL, 1),
    
    -- Nouveau groupe en Marketing
    ('Rafanomezantsoa', 'Herizo', 'herizo.mg@example.com', 'passEmployee11', 3, 2, 5, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Ranaivoson', 'Oliva', 'oliva.mg@example.com', 'passEmployee12', 3, 2, 5, GETUTCDATE(), 1, NULL, NULL, 1),
    
    -- Retour � Vente et commerce
    ('Rajaonarivelo', 'Tiana', 'tiana.mg@example.com', 'passEmployee13', 3, 4, 7, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Rafindrakoto', 'Lova', 'lova.mg@example.com', 'passEmployee14', 3, 4, 7, GETUTCDATE(), 1, NULL, NULL, 1),
    
    -- Nouveau groupe en Reseaux et techniques
    ('Ratsimandrava', 'Fanja', 'fanja2.mg@example.com', 'passEmployee15', 3, 5, 10, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Rakotondravelo', 'Miora', 'miora.mg@example.com', 'passEmployee16', 3, 5, 10, GETUTCDATE(), 1, NULL, NULL, 1),
    
    -- De nouveau en Informatique
    ('Rasolofo', 'Tsiory', 'tsiory.mg@example.com', 'passEmployee17', 3, 1, 1, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Rabarison', 'Feno', 'feno.mg@example.com', 'passEmployee18', 3, 1, 3, GETUTCDATE(), 1, NULL, NULL, 1),
    
    -- Dernier groupe en Marketing
    ('Rafitoharisoa', 'Nirina', 'nirina.mg@example.com', 'passEmployee19', 3, 2, 5, GETUTCDATE(), 1, NULL, NULL, 1),
    ('Rasolofonirina', 'Faniry', 'faniry.mg@example.com', 'passEmployee20', 3, 2, 5, GETUTCDATE(), 1, NULL, NULL, 1);



	----------------------------
-- Evaluation_type
----------------------------
INSERT INTO Evaluation_type (designation, state)
VALUES
    ('�valuation annuelle', 1),
    ('�valuation de p�riode d''essai', 1),
    ('�valuation de projet', 1);

----------------------------
-- Evaluations (5 �valuations)
----------------------------
INSERT INTO Evaluations (evaluationType_id, userId, startDate, endDate, overallScore, 
                        comments, isServiceApproved, isDgApproved, serviceApprovalDate, 
                        dgApprovalDate, state)
VALUES
    (1, 7, 2, '2023-05-01', '2023-05-15', 4.25, 
    'Bonne performance globale',  1, 1, '2023-05-20', '2023-05-22', 1),
    
    (2, 9, 3, '2023-06-01', '2023-06-10', 3.75, 
    'Adaptation rapide � l''�quipe', 1, 0, '2023-06-12', NULL, 1),
    
    (1, 15, 2, '2023-07-01', '2023-07-15', 2.90, 
    'Probl�mes de ponctualit�',  0, 0, NULL, NULL, 1),
    
    (3, 12, 3, '2023-08-01', '2023-08-20', 4.50, 
    'Excellente gestion du projet X', 1, 1, '2023-08-25', '2023-08-28', 1),
    
    (1, 20, 2, '2023-09-01', '2023-09-15', 4.00, 
    'Satisfait les attentes',  1, 1, '2023-09-18', '2023-09-20', 1);

----------------------------
-- Evaluation_questions
----------------------------
INSERT INTO Evaluation_questions (evaluationTypeId, positionId, question, state)
VALUES
    -- Questions pour �valuation annuelle (type 1)
    (1, 1, 'Ma�trise des technologies requises', 1),
    (1, 1, 'Qualit� du code produit', 1),
    (1, 5, 'Cr�ativit� dans les campagnes', 1),
    (1, 7, 'Atteinte des objectifs commerciaux', 1),
    
    -- Questions pour �valuation de p�riode d'essai (type 2)
    (2, 10, 'Int�gration dans l''�quipe', 1),
    (2, 3, 'Capacit� d''apprentissage', 1),
    
    -- Questions pour �valuation de projet (type 3)
    (3, 1, 'Respect des d�lais', 1),
    (3, 5, 'Gestion du budget allou�', 1);


	INSERT INTO Evaluation_questions (evaluationTypeId, positionId, question, state)
VALUES
    (1, 4, 'D�veloppement et mise en �uvre de strat�gies marketing', 1),
    (1, 4, 'Analyse des tendances du march� et adaptation des campagnes', 1),
    (1, 4, 'Capacit� � g�rer une �quipe marketing', 1),
    (1, 4, 'Optimisation des budgets marketing et retour sur investissement', 1),
    (1, 4, 'Suivi et am�lioration de la notori�t� de la marque', 1);


----------------------------
-- Evaluation_questionnaire
----------------------------
INSERT INTO Evaluation_questionnaire (evaluationId, questionId, score, comments, state)
VALUES
    (1, 1, 4.5, 'Excellente ma�trise de React et Node.js', 1),
    (1, 2, 4.0, 'Quelques oublis de commentaires', 1),
    
    (2, 5, 3.5, 'Relations professionnelles � am�liorer', 1),
    (2, 6, 4.0, 'Apprentissage rapide des proc�dures', 1),
    
    (4, 7, 4.75, 'Livraison 2 jours avant la deadline', 1),
    (4, 8, 4.25, 'D�passement budg�taire de 5% justifi�', 1);

----------------------------
-- Training_suggestions
----------------------------
INSERT INTO Training_suggestions (evaluationTypeId, questionId, training, details, scoreThreshold, state)
VALUES
    (1, 2, 'Clean Code Workshop', 'Formation aux bonnes pratiques de codage', 3.0, 1),
    (1, 3, 'Formation Marketing Digital', 'Cr�ation de campagnes multi-canaux', 3.5, 1),
    (2, 5, 'Team Building', 'Ateliers de collaboration inter-�quipes', 2.5, 1);


	INSERT INTO Training_suggestions (evaluationTypeId, questionId, training, details, scoreThreshold, state)
VALUES
    (1, 9, 'Strat�gies Marketing Avanc�es', 'Approfondissement des strat�gies marketing et techniques de mise en �uvre', 3, 1),
    (1, 10, 'Analyse de March� et Veille Concurrentielle', 'Techniques pour analyser les tendances et s�adapter au march�', 3, 1),
    (1, 11, 'Leadership et Management d''�quipe', 'Formation sur la gestion et la motivation d''une �quipe marketing', 3, 1),
    (1, 12, 'Optimisation Budg�taire et ROI', 'Techniques pour maximiser l''efficacit� des budgets marketing', 3, 1),
    (1, 13, 'Branding et Notori�t� de Marque', 'Strat�gies pour am�liorer et suivre l''image de marque', 3, 1);

----------------------------
-- Evaluation_interviews
----------------------------
INSERT INTO Evaluation_interviews (evaluationId, scheduled_date, status, notes, manager_approval, manager_comments, director_approval, director_comments)
VALUES
    (1, '2023-05-25T14:00:00', 2, 'Entretien constructif avec objectifs clairs', 1, 'Validation des axes d''am�lioration', 1, 'Accord sur le plan de formation'),
    (3, '2023-07-20T10:30:00', 1, 'N�cessit� de mettre en place un suivi RH', 0, NULL, 0, NULL),
    (4, '2023-08-30T09:00:00', 2, 'Reconnaissance des performances exceptionnelles', 1, 'Proposition de promotion', 1, 'Promotion valid�e pour Q4');

----------------------------
-- InterviewParticipants
----------------------------
INSERT INTO InterviewParticipants (InterviewId, UserId)
VALUES
    (1, 7),  -- Employ� �valu�
    (1, 2),  -- Manager
    (1, 4),  -- Directeur
    
    (2, 15),
    (2, 2),
    
    (3, 12),
    (3, 3),

    (3, 5);


	BEGIN TRANSACTION;

-- Step 1: Set deleted_by to NULL for all users to avoid foreign key issues
UPDATE Users SET deleted_by = NULL;

-- Step 2: Delete from the most dependent tables first
DELETE FROM InterviewParticipants;
DELETE FROM Evaluation_interviews;
DELETE FROM Training_suggestions;
DELETE FROM Evaluation_questionnaire;
DELETE FROM Evaluation_questions;
DELETE FROM Evaluations;
DELETE FROM Users;
DELETE FROM Postes;
DELETE FROM Evaluation_type;
DELETE FROM Roles;
DELETE FROM Department;

COMMIT TRANSACTION;

EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';

UPDATE Users SET deleted_by = NULL;

BEGIN TRANSACTION;

-- Tables de niveau le plus profond (d�pendantes)
DELETE FROM InterviewParticipants;
DELETE FROM Evaluation_interviews;
DELETE FROM Training_suggestions;
DELETE FROM Evaluation_questionnaire;
DELETE FROM Evaluations;
DELETE FROM Evaluation_questions;

-- Gestion des r�f�rences circulaires dans Users
UPDATE Users SET deleted_by = NULL, created_by = NULL; 
DELETE FROM Users;

-- Tables de r�f�rence
DELETE FROM Postes;
DELETE FROM Evaluation_type;
DELETE FROM Roles;
DELETE FROM Department;

COMMIT TRANSACTION;


-- R�initialisation de toutes les s�quences IDENTITY
DBCC CHECKIDENT ('Roles', RESEED, 0);
DBCC CHECKIDENT ('Users', RESEED, 0);
DBCC CHECKIDENT ('Postes', RESEED, 0);
DBCC CHECKIDENT ('Department', RESEED, 0);
DBCC CHECKIDENT ('Evaluation_type', RESEED, 0);
DBCC CHECKIDENT ('Evaluations', RESEED, 0);
DBCC CHECKIDENT ('Evaluation_questions', RESEED, 0);
DBCC CHECKIDENT ('Evaluation_questionnaire', RESEED, 0);
DBCC CHECKIDENT ('Training_suggestions', RESEED, 0);
DBCC CHECKIDENT ('Evaluation_interviews', RESEED, 0);
DBCC CHECKIDENT ('InterviewParticipants', RESEED, 0);
DBCC CHECKIDENT ('Evaluation_history', RESEED, 0); -- Si elle existe


 -- Insertion des permissions de base
INSERT INTO Permissions (name, description, state)
VALUES
    -- Permissions li�es aux utilisateurs
    ('VIEW_USERS', 'Voir la liste des utilisateurs', 1),
    ('CREATE_USERS', 'Cr�er de nouveaux utilisateurs', 1),
    ('EDIT_USERS', 'Modifier les utilisateurs existants', 1),
    ('DELETE_USERS', 'Supprimer des utilisateurs', 1),
    
    -- Permissions li�es aux r�les
    ('VIEW_ROLES', 'Voir la liste des r�les', 1),
    ('CREATE_ROLES', 'Cr�er de nouveaux r�les', 1),
    ('EDIT_ROLES', 'Modifier les r�les existants', 1),
    ('DELETE_ROLES', 'Supprimer des r�les', 1),
    
    -- Permissions li�es aux permissions
    ('VIEW_PERMISSIONS', 'Voir la liste des permissions', 1),
    ('MANAGE_PERMISSIONS', 'G�rer les permissions des r�les', 1),
    
    -- Permissions li�es aux �valuations
    ('VIEW_EVALUATIONS', 'Voir les �valuations', 1),
    ('CREATE_EVALUATIONS', 'Cr�er des �valuations', 1),
    ('EDIT_EVALUATIONS', 'Modifier les �valuations', 1),
    ('DELETE_EVALUATIONS', 'Supprimer des �valuations', 1),
    ('APPROVE_EVALUATIONS', 'Approuver les �valuations', 1),
    
    -- Permissions li�es aux d�partements
    ('VIEW_DEPARTMENTS', 'Voir la liste des d�partements', 1),
    ('MANAGE_DEPARTMENTS', 'G�rer les d�partements', 1),
    
    -- Permissions li�es aux postes
    ('VIEW_POSITIONS', 'Voir la liste des postes', 1),
    ('MANAGE_POSITIONS', 'G�rer les postes', 1),
    
    -- Permissions li�es aux rapports
    ('VIEW_REPORTS', 'Voir les rapports', 1),
    ('EXPORT_REPORTS', 'Exporter les rapports', 1);

-- Attribution des permissions aux r�les
-- Administrator (Role_id = 1) : Toutes les permissions
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 3, Permission_id FROM Permissions;

-- Manager (Role_id = 2) : Permissions limit�es
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

-- Director (Role_id = 4) : Permissions �tendues
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

INSERT INTO Permissions (name, description, state)
VALUES
    ('MANAGE_CAREER', 'G�rer les carri�res', 1),
    ('MANAGE_RETIREMENT', 'G�rer les retraites', 1);

	-- Attribution des nouvelles permissions � l'administrateur
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 1, Permission_id 
FROM Permissions 
WHERE name IN ('MANAGE_CAREER', 'MANAGE_RETIREMENT');



SELECT p.name, p.description
FROM Permissions p
JOIN Role_Permissions rp ON p.Permission_id = rp.permission_id
WHERE rp.role_id = 1;





INSERT INTO Competence_Lines (PositionId, CompetenceName, Description, state)
VALUES 
    (1, 'Java/J2EE', 'D�veloppement d''applications Java et frameworks associ�s (Spring, Hibernate)', 1),
    (1, 'PHP/Symfony', 'D�veloppement d''applications en PHP et Symfony', 1),
    (1, 'JavaScript/React', 'D�veloppement frontend avec JavaScript et React', 1),
    (1, 'WordPress/CMS', 'D�veloppement et personnalisation de sites WordPress', 1),
    (1, 'CSS/SASS', 'Ma�trise des feuilles de style et pr�processeurs', 1),
    (1, 'DevOps/CI-CD', 'Int�gration continue et d�ploiement automatis�', 1);

	INSERT INTO Competence_Lines (PositionId, CompetenceName, Description, state)
VALUES 
    (2, 'Support Utilisateur', 'Assistance technique aux utilisateurs', 1),
    (2, 'Maintenance Mat�rielle', 'Maintenance et d�pannage des �quipements', 1),
    (2, 'Gestion R�seau', 'Configuration et surveillance des r�seaux', 1),
    (2, 'S�curit� Informatique', 'Protection des syst�mes et donn�es', 1);


	INSERT INTO Competence_Lines (PositionId, CompetenceName, Description, state)
VALUES 
    (3, 'SEO/SEM', 'Optimisation pour les moteurs de recherche et publicit�', 1),
    (3, 'R�seaux Sociaux', 'Gestion des communaut�s et campagnes sociales', 1),
    (3, 'Analyse de Donn�es', 'Collecte et analyse des donn�es marketing', 1),
    (3, 'Gestion d''�quipe', 'Management des �quipes marketing', 1),
    (3, 'Planification Budg�taire', 'Allocation et suivi des ressources financi�res', 1);

	INSERT INTO Competence_Lines (PositionId, CompetenceName, Description, state)
VALUES 
    (4, 'Tests Manuels', 'Ex�cution de sc�narios de test manuels', 1),
    (4, 'Automatisation Selenium', 'D�veloppement de tests automatis�s avec Selenium', 1),
    (4, 'Tests de Performance', '�valuation des performances des applications', 1),
    (4, 'Tests de S�curit�', 'Identification des vuln�rabilit�s', 1);

	INSERT INTO Competence_Trainings (CompetenceLineId, TrainingName, Description, Duration, Provider, Level, state)
VALUES
    (1, 'Java 17 et nouveaut�s', 'Formation sur les derni�res fonctionnalit�s de Java', '4 jours', 'JavaExpert', 'Interm�diaire', 1),
    (1, 'Spring Boot Avanc�', 'D�veloppement d''applications avec Spring Boot', '5 jours', 'SpringAcademy', 'Avanc�', 1),
    (1, 'Hibernate et JPA', 'Persistance des donn�es avec JPA', '3 jours', 'JavaExpert', 'Interm�diaire', 1);

	INSERT INTO Competence_Trainings (CompetenceLineId, TrainingName, Description, Duration, Provider, Level, state)
VALUES
    (2, 'Symfony 6', 'D�veloppement d''applications PHP avec Symfony 6', '5 jours', 'PHPExpert', 'Interm�diaire', 1),
    (2, 'API Platform', 'Cr�ation d''API REST avec API Platform', '3 jours', 'WebDevPro', 'Interm�diaire', 1);

	-- Formations pour JavaScript/React
INSERT INTO Competence_Trainings (CompetenceLineId, TrainingName, Description, Duration, Provider, Level, state)
VALUES
    (3, 'React et Redux', 'D�veloppement d''applications frontend avec React', '5 jours', 'JSMaster', 'Interm�diaire', 1),
    (3, 'TypeScript Avanc�', 'D�veloppement d''applications typ�es avec TypeScript', '3 jours', 'TypeScriptPro', 'Avanc�', 1);


	INSERT INTO Competence_Trainings (CompetenceLineId, TrainingName, Description, Duration, Provider, Level, state)
VALUES
    (4, 'WordPress pour D�veloppeurs', 'D�veloppement de th�mes et plugins WordPress', '4 jours', 'WPAcademy', 'Interm�diaire', 1),
    (4, 'Gutenberg Block Editor', 'D�veloppement de blocs personnalis�s', '2 jours', 'WPAcademy', 'Interm�diaire', 1);

	INSERT INTO Competence_Trainings (CompetenceLineId, TrainingName, Description, Duration, Provider, Level, state)
VALUES
    (5, 'CSS Avanc� et Animations', 'Techniques avanc�es de mise en page et animations', '3 jours', 'CSSMaster', 'Avanc�', 1),
    (5, 'SASS et Architecture CSS', 'Organisation et optimisation des feuilles de style', '2 jours', 'FrontEndPro', 'Interm�diaire', 1);

	INSERT INTO Competence_Trainings (CompetenceLineId, TrainingName, Description, Duration, Provider, Level, state)
VALUES
    (6, 'GitLab CI/CD', 'Int�gration et d�ploiement continu avec GitLab', '3 jours', 'DevOpsAcademy', 'Interm�diaire', 1),
    (6, 'Docker et Kubernetes', 'Conteneurisation et orchestration d''applications', '5 jours', 'CloudExpert', 'Interm�diaire', 1);



	INSERT INTO Competence_Trainings (CompetenceLineId, TrainingName, Description, Duration, Provider, Level, state)
VALUES
    (7, 'Service Desk ITIL', 'Gestion des incidents selon ITIL', '3 jours', 'ITILExpert', 'D�butant', 1),
    (7, 'Communication Technique', 'Techniques de communication avec les utilisateurs', '2 jours', 'SupportPro', 'Interm�diaire', 1);


	INSERT INTO Competence_Trainings (CompetenceLineId, TrainingName, Description, Duration, Provider, Level, state)
VALUES
    (8, 'Maintenance Hardware', 'Diagnostic et r�paration mat�rielle', '4 jours', 'TechRepair', 'Interm�diaire', 1),
    (9, 'Administration Cisco', 'Configuration et maintenance d''�quipements Cisco', '5 jours', 'NetworkAcademy', 'Interm�diaire', 1),
    (10, 'S�curit� des Syst�mes', 'Protection et audit de s�curit�', '4 jours', 'SecurePro', 'Avanc�', 1),
    (11, 'SEO Avanc�', 'Optimisation technique pour les moteurs de recherche', '3 jours', 'SEOMaster', 'Avanc�', 1),
    (12, 'Community Management', 'Animation de communaut�s et cr�ation de contenu', '3 jours', 'SocialMediaPro', 'Interm�diaire', 1),
    (13, 'Google Analytics 4', 'Analyse des donn�es marketing avec GA4', '2 jours', 'AnalyticsMaster', 'Interm�diaire', 1),
    (14, 'Leadership Marketing', 'Management d''�quipe marketing', '3 jours', 'LeadershipAcademy', 'Avanc�', 1),
    (15, 'Planification Budg�taire', 'Gestion et optimisation des budgets marketing', '2 jours', 'FinanceMarketing', 'Interm�diaire', 1),
    (16, 'Test Case Design', 'Conception efficace de cas de test', '3 jours', 'TestingAcademy', 'Interm�diaire', 1),
    (17, 'Selenium WebDriver', 'Automatisation des tests web', '4 jours', 'AutoTest', 'Interm�diaire', 1),
    (18, 'JMeter', 'Tests de charge et de performance', '3 jours', 'PerformancePro', 'Interm�diaire', 1),
    (19, 'OWASP Top 10', 'Tests de s�curit� bas�s sur OWASP Top 10', '2 jours', 'SecureTesting', 'Avanc�', 1);


	INSERT INTO Evaluation_questions (evaluationTypeId, positionId, CompetenceLineId, question, state)
VALUES
    -- Questions pour d�veloppeurs Java/J2EE (�valuation annuelle - type 1)
    (1, 1, 1, 'Comment �valuez-vous votre ma�trise de Java 8+ et de ses fonctionnalit�s (streams, lambda, etc.) ?', 1),
    (1, 1, 1, 'Dans quelle mesure ma�trisez-vous Spring Boot pour le d�veloppement d''applications ?', 1),
    (1, 1, 1, '�tes-vous � l''aise avec la configuration et l''optimisation de JPA/Hibernate ?', 1),
    
    -- Questions pour d�veloppeurs PHP/Symfony (�valuation annuelle - type 1)
    (1, 1, 2, 'Comment �valuez-vous vos comp�tences dans le d�veloppement d''applications avec Symfony ?', 1),
    (1, 1, 2, 'Quel est votre niveau de ma�trise de Doctrine ORM pour la gestion des donn�es ?', 1),
    
    -- Questions pour d�veloppeurs JavaScript/React (�valuation annuelle - type 1)
    (1, 1, 3, 'Comment �valuez-vous vos comp�tences en d�veloppement d''interfaces avec React et ses hooks ?', 1),
    (1, 1, 3, '�tes-vous � l''aise avec l''utilisation de Redux pour la gestion d''�tat global ?', 1),
    (1, 1, 3, 'Dans quelle mesure utilisez-vous TypeScript pour am�liorer la qualit� de votre code JavaScript ?', 1),
    
    -- Questions pour d�veloppeurs WordPress/CMS (�valuation annuelle - type 1)
    (1, 1, 4, 'Comment �valuez-vous votre capacit� � d�velopper des th�mes personnalis�s sous WordPress ?', 1),
    (1, 1, 4, 'Quel est votre niveau de ma�trise dans le d�veloppement de plugins WordPress ?', 1),
    
    -- Questions pour CSS/SASS (�valuation annuelle - type 1)
    (1, 1, 5, 'Comment �valuez-vous vos comp�tences en responsive design avec CSS/SASS ?', 1),
    (1, 1, 5, 'Dans quelle mesure ma�trisez-vous les animations et transitions CSS ?', 1),
    
    -- Questions pour DevOps/CI-CD (�valuation annuelle - type 1)
    (1, 1, 6, 'Comment �valuez-vous votre capacit� � mettre en place des pipelines CI/CD ?', 1),
    (1, 1, 6, 'Quel est votre niveau de ma�trise de Docker et de la conteneurisation ?', 1),
    
    -- Questions pour techniciens support (�valuation annuelle - type 1)
    (1, 2, 7, 'Comment �valuez-vous votre efficacit� � r�soudre les probl�mes techniques des utilisateurs ?', 1),
    (1, 2, 7, 'Dans quelle mesure parvenez-vous � expliquer clairement les solutions techniques aux utilisateurs ?', 1),
    
    -- Questions pour techniciens maintenance (�valuation annuelle - type 1)
    (1, 2, 8, 'Comment �valuez-vous votre capacit� � diagnostiquer et r�parer les probl�mes mat�riels ?', 1),
    (1, 2, 8, 'Quel est votre niveau de ma�trise dans l''installation et la configuration de nouveaux �quipements ?', 1),
    
    -- Questions pour techniciens r�seau (�valuation annuelle - type 1)
    (1, 2, 9, 'Comment �valuez-vous vos comp�tences en configuration des �quipements r�seau ?', 1),
    (1, 2, 9, 'Dans quelle mesure �tes-vous capable de diagnostiquer et r�soudre les probl�mes de connectivit� ?', 1),
    
    -- Questions pour techniciens s�curit� (�valuation annuelle - type 1)
    (1, 2, 10, 'Comment �valuez-vous votre capacit� � identifier et corriger les vuln�rabilit�s de s�curit� ?', 1),
    (1, 2, 10, 'Quel est votre niveau de ma�trise des bonnes pratiques de s�curit� informatique ?', 1),
    
    -- Questions pour responsables marketing SEO/SEM (�valuation annuelle - type 1)
    (1, 3, 11, 'Comment �valuez-vous l''efficacit� de vos strat�gies SEO pour am�liorer le r�f�rencement ?', 1),
    (1, 3, 11, 'Dans quelle mesure vos campagnes SEM ont-elles atteint leurs objectifs cette ann�e ?', 1),
    
    -- Questions pour responsables r�seaux sociaux (�valuation annuelle - type 1)
    (1, 3, 12, 'Comment �valuez-vous l''engagement g�n�r� par vos publications sur les r�seaux sociaux ?', 1),
    (1, 3, 12, 'Quel est le niveau d''efficacit� de votre strat�gie de contenu sur les diff�rentes plateformes ?', 1),
    
    -- Questions pour responsables analyse de donn�es (�valuation annuelle - type 1)
    (1, 3, 13, 'Comment �valuez-vous votre capacit� � extraire des insights pertinents des donn�es marketing ?', 1),
    (1, 3, 13, 'Dans quelle mesure utilisez-vous les outils d''analyse pour ajuster les strat�gies marketing ?', 1),
    
    -- Questions pour responsables gestion d'�quipe (�valuation annuelle - type 1)
    (1, 3, 14, 'Comment �valuez-vous votre capacit� � motiver et d�velopper votre �quipe marketing ?', 1),
    (1, 3, 14, 'Quel est votre niveau d''efficacit� dans la d�l�gation et le suivi des t�ches ?', 1),
    
    -- Questions pour responsables budget (�valuation annuelle - type 1)
    (1, 3, 15, 'Comment �valuez-vous votre gestion et optimisation du budget marketing ?', 1),
    (1, 3, 15, 'Dans quelle mesure mesurez-vous et optimisez-vous le ROI des actions marketing ?', 1),
    
    -- Questions pour testeurs manuels (�valuation annuelle - type 1)
    (1, 4, 16, 'Comment �valuez-vous la qualit� et la couverture de vos sc�narios de test manuels ?', 1),
    (1, 4, 16, 'Quel est votre niveau de pr�cision dans l''identification et la documentation des bugs ?', 1),
    
    -- Questions pour testeurs automatisation (�valuation annuelle - type 1)
    (1, 4, 17, 'Comment �valuez-vous votre capacit� � cr�er et maintenir des tests automatis�s avec Selenium ?', 1),
    (1, 4, 17, 'Dans quelle mesure vos tests automatis�s ont-ils permis de d�tecter des r�gressions ?', 1),
    
    -- Questions pour testeurs performance (�valuation annuelle - type 1)
    (1, 4, 18, 'Comment �valuez-vous votre capacit� � concevoir et ex�cuter des tests de performance pertinents ?', 1),
    (1, 4, 18, 'Quel est votre niveau d''expertise dans l''analyse des r�sultats de tests de charge ?', 1),
    
    -- Questions pour testeurs s�curit� (�valuation annuelle - type 1)
    (1, 4, 19, 'Comment �valuez-vous votre capacit� � identifier les vuln�rabilit�s de s�curit� dans les applications ?', 1),
    (1, 4, 19, 'Dans quelle mesure ma�trisez-vous les outils et m�thodologies de test de s�curit� ?', 1),
    
    -- Questions pour p�riode d'essai (type 2)
    (2, 1, 1, 'Comment �valuez-vous votre adaptation aux technologies Java utilis�es dans l''entreprise ?', 1),
    (2, 1, 3, 'Dans quelle mesure vous �tes-vous familiaris� avec l''architecture React de nos projets ?', 1),
    (2, 2, 7, 'Comment �valuez-vous votre int�gration aux proc�dures de support technique de l''entreprise ?', 1),
    (2, 3, 11, 'Dans quelle mesure avez-vous assimil� la strat�gie SEO/SEM de l''entreprise ?', 1),
    (2, 4, 16, 'Comment �valuez-vous votre compr�hension et application des m�thodologies de test de l''entreprise ?', 1),
    
    -- Questions pour �valuation de projet (type 3)
    (3, 1, 1, 'Comment �valuez-vous la qualit� du code Java produit pour ce projet ?', 1),
    (3, 1, 3, 'Dans quelle mesure les interfaces React d�velopp�es r�pondent-elles aux exigences du projet ?', 1),
    (3, 1, 6, 'Comment �valuez-vous l''efficacit� de la pipeline CI/CD mise en place pour ce projet ?', 1),
    (3, 3, 11, 'Dans quelle mesure les actions SEO/SEM ont-elles contribu� aux objectifs du projet ?', 1),
    (3, 3, 12, 'Comment �valuez-vous l''impact des campagnes social media sur la visibilit� du projet ?', 1),
    (3, 4, 16, 'Dans quelle mesure les tests fonctionnels ont-ils couvert les exigences du projet ?', 1),
    (3, 4, 17, 'Comment �valuez-vous la qualit� et la maintenabilit� des tests automatis�s d�velopp�s pour ce projet ?', 1);

	SELECT Question_id, question, CompetenceLineId FROM Evaluation_questions;


	INSERT INTO Training_suggestions (evaluationTypeId, questionId, CompetenceLineId, TrainingId, training, details, scoreThreshold, state)
VALUES
    -- Suggestions pour les d�veloppeurs Java (�valuation annuelle)
    (1, 1, 1, 1, 'Java 17 et nouveaut�s', 'Formation approfondie sur les derni�res fonctionnalit�s de Java', 3, 1),
    (1, 2, 1, 2, 'Spring Boot Avanc�', 'Ma�triser le d�veloppement d''applications avec Spring Boot', 3, 1),
    (1, 3, 1, 3, 'Hibernate et JPA', 'Optimisation de la persistance des donn�es', 3, 1),

    -- Suggestions pour les d�veloppeurs PHP/Symfony
    (1, 4, 2, 4, 'Symfony 6', 'D�veloppement d''applications PHP avec Symfony 6', 3, 1),
    (1, 5, 2, 5, 'API Platform', 'Cr�ation d''API REST avec API Platform', 3, 1),

    -- Suggestions pour les d�veloppeurs JavaScript/React
    (1, 6, 3, 6, 'React et Redux', 'Ma�triser le d�veloppement React avec gestion d''�tat Redux', 3, 1),
    (1, 7, 3, 6, 'React et Redux', 'Ma�triser la gestion d''�tat avec Redux', 3, 1),
    (1, 8, 3, 7, 'TypeScript Avanc�', 'Am�liorer la qualit� du code avec TypeScript', 3, 1),

    -- Suggestions pour les d�veloppeurs WordPress
    (1, 9, 4, 8, 'WordPress pour D�veloppeurs', 'D�veloppement avanc� de th�mes et plugins', 3, 1),
    (1, 10, 4, 9, 'Gutenberg Block Editor', 'Cr�ation de blocs personnalis�s', 3, 1),

    -- Suggestions pour CSS/SASS
    (1, 11, 5, 10, 'CSS Avanc� et Animations', 'Techniques avanc�es de mise en page et animations', 3, 1),
    (1, 12, 5, 10, 'CSS Avanc� et Animations', 'Ma�triser les animations CSS avanc�es', 3, 1),

    -- Suggestions pour DevOps
    (1, 13, 6, 12, 'GitLab CI/CD', 'Ma�triser l''int�gration et d�ploiement continu', 3, 1),
    (1, 14, 6, 13, 'Docker et Kubernetes', 'Conteneurisation et orchestration d''applications', 3, 1),

    -- Suggestions pour support utilisateur
    (1, 15, 7, 14, 'Service Desk ITIL', 'Gestion des incidents selon les bonnes pratiques ITIL', 3, 1),
    (1, 16, 7, 15, 'Communication Technique', 'Am�liorer la communication avec les utilisateurs', 3, 1),

    -- Suggestions pour maintenance mat�rielle
    (1, 17, 8, 16, 'Maintenance Hardware', 'Diagnostic et r�paration mat�rielle avanc�e', 3, 1),
    (1, 18, 8, 16, 'Maintenance Hardware', 'Installation et configuration d''�quipements', 3, 1),

    -- Suggestions pour gestion r�seau
    (1, 19, 9, 17, 'Administration Cisco', 'Configuration et maintenance d''�quipements r�seau', 3, 1),
    (1, 20, 9, 17, 'Administration Cisco', 'Diagnostic et r�solution des probl�mes r�seau', 3, 1),

    -- Suggestions pour s�curit�
    (1, 21, 10, 18, 'S�curit� des Syst�mes', 'Protection et audit de s�curit�', 3, 1),
    (1, 22, 10, 18, 'S�curit� des Syst�mes', 'Bonnes pratiques de s�curit� informatique', 3, 1),

    -- Suggestions pour SEO/SEM
    (1, 23, 11, 19, 'SEO Avanc�', 'Optimisation technique pour les moteurs de recherche', 3, 1),
    (1, 24, 11, 19, 'SEO Avanc�', 'Gestion des campagnes SEM', 3, 1),

    -- Suggestions pour r�seaux sociaux
    (1, 25, 12, 20, 'Community Management', 'Animation de communaut�s et cr�ation de contenu', 3, 1),
    (1, 26, 12, 20, 'Community Management', 'Strat�gie de contenu multi-plateformes', 3, 1),

    -- Suggestions pour analyse de donn�es
    (1, 27, 13, 21, 'Google Analytics 4', 'Analyse des donn�es marketing avec GA4', 3, 1),
    (1, 28, 13, 21, 'Google Analytics 4', 'Utilisation des outils d''analyse marketing', 3, 1),

    -- Suggestions pour gestion d'�quipe
    (1, 29, 14, 22, 'Leadership Marketing', 'Management d''�quipe marketing', 3, 1),
    (1, 30, 14, 22, 'Leadership Marketing', 'D�l�gation et suivi des t�ches', 3, 1),

    -- Suggestions pour gestion budg�taire
    (1, 31, 15, 23, 'Planification Budg�taire', 'Gestion et optimisation des budgets marketing', 3, 1),
    (1, 32, 15, 23, 'Planification Budg�taire', 'Mesure et optimisation du ROI', 3, 1),

    -- Suggestions pour tests manuels
    (1, 33, 16, 24, 'Test Case Design', 'Conception efficace de cas de test', 3, 1),
    (1, 34, 16, 24, 'Test Case Design', 'Documentation des bugs et suivi', 3, 1),

    -- Suggestions pour tests automatis�s
    (1, 35, 17, 25, 'Selenium WebDriver', 'Automatisation des tests web', 3, 1),
    (1, 36, 17, 25, 'Selenium WebDriver', 'Maintenance des tests automatis�s', 3, 1),

    -- Suggestions pour tests de performance
    (1, 37, 18, 26, 'JMeter', 'Tests de charge et de performance', 3, 1),
    (1, 38, 18, 26, 'JMeter', 'Analyse des r�sultats de performance', 3, 1),

    -- Suggestions pour tests de s�curit�
    (1, 39, 19, 27, 'OWASP Top 10', 'Tests de s�curit� bas�s sur OWASP Top 10', 3, 1),
    (1, 40, 19, 27, 'OWASP Top 10', 'M�thodologies de test de s�curit�', 3, 1),

    -- Suggestions pour p�riode d'essai
    (2, 41, 1, 1, 'Java 17 pour d�butants', 'Formation acc�l�r�e sur Java pour nouveaux d�veloppeurs', 2.5, 1),
    (2, 42, 3, 6, 'React pour d�butants', 'Introduction � React et son architecture', 2.5, 1),
    (2, 43, 7, 14, 'Fondamentaux du support technique', 'Bases du support utilisateur dans l''entreprise', 2.5, 1),
    (2, 44, 11, 19, 'SEO/SEM de base', 'Introduction aux strat�gies SEO/SEM', 2.5, 1),
    (2, 45, 16, 24, 'Fondamentaux des tests', 'Introduction aux m�thodologies de test', 2.5, 1),

    -- Suggestions pour �valuation de projet
    (3, 46, 1, 2, 'Optimisation des applications Java', 'Am�lioration des performances Java', 3, 1),
    (3, 47, 3, 6, 'Architecture React avanc�e', 'Meilleures pratiques pour projets React complexes', 3, 1),
    (3, 48, 6, 12, 'Pipeline CI/CD avanc�e', 'Optimisation des pipelines de d�ploiement', 3, 1),
    (3, 49, 11, 19, 'SEO Technique Avanc�', 'Optimisation technique pour sites complexes', 3, 1),
    (3, 50, 12, 20, 'Strat�gie Social Media Avanc�e', 'Optimisation des campagnes social media', 3, 1),
    (3, 51, 16, 24, 'Tests Fonctionnels Avanc�s', 'Couverture compl�te des exigences fonctionnelles', 3, 1),
    (3, 52, 17, 25, 'Tests Automatis�s Avanc�s', 'Maintenance et optimisation des tests automatis�s', 3, 1);
 

 -- Questions sur Java/J2EE
INSERT INTO Evaluation_Question_Options (QuestionId, OptionText, IsCorrect, State)
VALUES 
-- Pour la question sur la ma�trise de Java 8+
(1, 'Je ma�trise parfaitement les streams, lambdas et les nouvelles fonctionnalit�s de Java 8+', 1, 1),
(1, 'Je connais bien les streams et lambdas mais je peux m''am�liorer', 0, 1),
(1, 'Je connais les bases de Java 8+', 0, 1),
(1, 'Je d�bute avec Java 8+', 0, 1),

-- Pour la question sur Spring Boot
(2, 'Je peux d�velopper des applications complexes avec Spring Boot', 1, 1),
(2, 'Je peux d�velopper des applications simples avec Spring Boot', 0, 1),
(2, 'Je connais les bases de Spring Boot', 0, 1),
(2, 'Je d�bute avec Spring Boot', 0, 1),

-- Pour la question sur JPA/Hibernate
(3, 'Je peux optimiser et configurer JPA/Hibernate efficacement', 1, 1),
(3, 'Je peux utiliser JPA/Hibernate pour des cas simples', 0, 1),
(3, 'Je connais les bases de JPA/Hibernate', 0, 1),
(3, 'Je d�bute avec JPA/Hibernate', 0, 1);

-- Questions sur le support utilisateur
INSERT INTO Evaluation_Question_Options (QuestionId, OptionText, IsCorrect, State)
VALUES 
-- Pour la question sur la r�solution des probl�mes
(15, 'Je r�sous efficacement les probl�mes techniques des utilisateurs', 1, 1),
(15, 'Je peux r�soudre la plupart des probl�mes courants', 0, 1),
(15, 'Je peux r�soudre des probl�mes simples', 0, 1),
(15, 'Je dois am�liorer mes comp�tences de r�solution', 0, 1),

-- Pour la question sur l'explication des solutions
(16, 'Je peux expliquer clairement les solutions techniques � tous les niveaux', 1, 1),
(16, 'Je peux expliquer les solutions de mani�re compr�hensible', 0, 1),
(16, 'J''ai parfois du mal � expliquer les solutions', 0, 1),
(16, 'Je dois am�liorer ma communication technique', 0, 1);

-- Questions sur les tests
select * from Evaluation_Question_Options
INSERT INTO Evaluation_Question_Options (QuestionId, OptionText, IsCorrect, State)
VALUES 
-- Pour la question sur les tests manuels
(33, 'Je cr�e des sc�narios de test complets et pertinents', 1, 1),
(33, 'Je peux cr�er des sc�narios de test basiques', 0, 1),
(33, 'Je dois am�liorer mes comp�tences en cr�ation de sc�narios', 0, 1),
(33, 'Je d�bute dans la cr�ation de sc�narios', 0, 1),

-- Pour la question sur la documentation des bugs
(34, 'Je documente pr�cis�ment les bugs avec toutes les informations n�cessaires', 1, 1),
(34, 'Je documente les bugs de mani�re basique', 0, 1),
(34, 'Je dois am�liorer ma documentation des bugs', 0, 1),
(34, 'Je d�bute dans la documentation des bugs', 0, 1);



INSERT INTO [BaseGcc_presentation].[dbo].[Skill_position] (Position_id, Skill_id, State, Creation_date, Updated_date) VALUES
(1, 1, 1, GETDATE(), GETDATE()), -- Développeur a la compétence Java
(1, 2, 1, GETDATE(), GETDATE()), -- Développeur a la compétence .Net
(1, 3, 1, GETDATE(), GETDATE()), -- Développeur a la compétence C#
(2, 5, 1, GETDATE(), GETDATE()), -- Technicien a la compétence Maintenance & réseau
(2, 7, 1, GETDATE(), GETDATE()), -- Technicien a la compétence Informatique
(3, 6, 1, GETDATE(), GETDATE()), -- Responsable marketing a la compétence Communication
(3, 9, 1, GETDATE(), GETDATE()), -- Responsable marketing a la compétence Economie
(4, 7, 1, GETDATE(), GETDATE()), -- Testeur a la compétence Informatique
(1, 7, 1, GETDATE(), GETDATE()), -- Développeur a la compétence Informatique
(2, 4, 1, GETDATE(), GETDATE()), -- Technicien a la compétence Admin system
(3, 11, 1, GETDATE(), GETDATE()), -- Responsable marketing a la compétence Géstion
(4, 1, 1, GETDATE(), GETDATE()); -- Testeur a la compétence Java

 
