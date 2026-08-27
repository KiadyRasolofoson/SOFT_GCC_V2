
-- PRÉREQUIS :
-- - La table Employee doit exister
-- - Les tables Department, Position, Roles doivent exister
--
-- ORDRE D'EXÉCUTION :
-- 1. Ce script (01_TABLES_EVALUATIONS.sql)
-- 2. 02_VUES_EVALUATIONS.sql
-- 3. 03_DONNEES_ESSENTIELLES.sql
-- 4. 04_DONNEES_TEST.sql (optionnel)
-- =============================================================================================

PRINT '=============================================================================================';
PRINT 'DÉBUT - CRÉATION DES TABLES DU MODULE D''ÉVALUATION';
PRINT '=============================================================================================';
PRINT '';

-- ====================================================
-- 1. TABLES INDÉPENDANTES (sans clés étrangères)
-- ====================================================

PRINT '1. Création des tables indépendantes...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE Roles (
        Role_id INT PRIMARY KEY IDENTITY(1,1),
        title NVARCHAR(255) NOT NULL,
        state INT
    );
    PRINT '   ✓ Table Roles créée';
END
ELSE PRINT '   - Table Roles existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Department')
BEGIN
    CREATE TABLE Department (
        Department_id INT PRIMARY KEY IDENTITY(1,1),
        Department_name NVARCHAR(255) NOT NULL,
        state INT
    );
    PRINT '   ✓ Table Department créée';
END
ELSE PRINT '   - Table Department existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Position')
BEGIN
    CREATE TABLE Position (
        Position_id INT PRIMARY KEY IDENTITY(1,1),
        position_name NVARCHAR(255) NOT NULL, 
        state INT
    );
    PRINT '   ✓ Table Position créée';
END
ELSE PRINT '   - Table Position existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Permissions')
BEGIN
    CREATE TABLE Permissions (
        Permission_id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(255),
        state INT DEFAULT 1
    );
    PRINT '   ✓ Table Permissions créée';
END
ELSE PRINT '   - Table Permissions existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_type')
BEGIN
    CREATE TABLE Evaluation_type (
        Evaluation_type_id INT PRIMARY KEY IDENTITY(1,1),
        designation NVARCHAR(100),
        state INT
    );
    PRINT '   ✓ Table Evaluation_type créée';
END
ELSE PRINT '   - Table Evaluation_type existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ResponseTypes')
BEGIN
    CREATE TABLE ResponseTypes (
        ResponseTypeId INT PRIMARY KEY,
        TypeName NVARCHAR(20) NOT NULL,
        Description NVARCHAR(255)
    );
    
    INSERT INTO ResponseTypes (ResponseTypeId, TypeName, Description)
    VALUES 
        (1, 'TEXT', 'Réponse textuelle libre'),
        (2, 'QCM', 'Choix multiple avec options prédéfinies'),
        (3, 'SCORE', 'Évaluation numérique sur échelle');
        
    PRINT '   ✓ Table ResponseTypes créée avec données';
END
ELSE PRINT '   - Table ResponseTypes existe déjà';

PRINT '';

-- ====================================================
-- 2. TABLES AVEC RÉFÉRENCES DE PREMIER NIVEAU
-- ====================================================

PRINT '2. Création des tables avec références de 1er niveau...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Competence_Lines')
BEGIN
    CREATE TABLE Competence_Lines (
        CompetenceLineId INT PRIMARY KEY IDENTITY(1,1),
        -- Pont vers la matrice emploi-compétences (A1.3) : une ligne de questionnaire
        -- = une ligne active de Skill_position. PositionId/CompetenceName (legacy) supprimés.
        SkillPositionId INT NOT NULL,
        Description NVARCHAR(255),
        state INT,
        CONSTRAINT FK_CompetenceLines_SkillPosition
            FOREIGN KEY (SkillPositionId) REFERENCES Skill_position(Skill_position_id)
    );
    PRINT '   ✓ Table Competence_Lines créée (alignée sur Skill_position)';
END
ELSE PRINT '   - Table Competence_Lines existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Role_Permissions')
BEGIN
    CREATE TABLE Role_Permissions (
        Role_Permission_id INT PRIMARY KEY IDENTITY(1,1),
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        FOREIGN KEY (role_id) REFERENCES Roles(Role_id),
        FOREIGN KEY (permission_id) REFERENCES Permissions(Permission_id)
    );
    PRINT '   ✓ Table Role_Permissions créée';
END
ELSE PRINT '   - Table Role_Permissions existe déjà';

PRINT '';

-- ====================================================
-- 3. TABLES AVEC RÉFÉRENCES DE DEUXIÈME NIVEAU
-- ====================================================

PRINT '3. Création des tables avec références de 2ème niveau...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        UserId INT PRIMARY KEY IDENTITY(1,1),
        last_name NVARCHAR(255) NOT NULL,
        first_name NVARCHAR(255) NOT NULL,
        username NVARCHAR(255) NULL,
        email NVARCHAR(255) NOT NULL,
        password NVARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        employee_id INT NULL,
        departmentid INT,
        positionId INT,
        creation_date DATE NOT NULL DEFAULT GETUTCDATE(),
        created_by INT NOT NULL,
        deletion_date DATE,
        deleted_by INT,
        state INT,
        FOREIGN KEY (role_id) REFERENCES Roles(Role_id),
        FOREIGN KEY (employee_id) REFERENCES Employee(Employee_id),
        FOREIGN KEY (departmentid) REFERENCES Department(Department_id),
        FOREIGN KEY (positionId) REFERENCES Position(Position_id)
    );
    PRINT '   ✓ Table Users créée';
END
ELSE PRINT '   - Table Users existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Competence_Trainings')
BEGIN
    CREATE TABLE Competence_Trainings (
        TrainingId INT PRIMARY KEY IDENTITY(1,1),
        CompetenceLineId INT NOT NULL,
        TrainingName NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX),
        Duration NVARCHAR(50),
        Provider NVARCHAR(100),
        Level NVARCHAR(50),
        state INT,
        FOREIGN KEY (CompetenceLineId) REFERENCES Competence_Lines(CompetenceLineId)
    );
    PRINT '   ✓ Table Competence_Trainings créée';
END
ELSE PRINT '   - Table Competence_Trainings existe déjà';

-- Ajout référence circulaire pour Users
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Users_DeletedBy')
BEGIN
    ALTER TABLE Users 
    ADD CONSTRAINT FK_Users_DeletedBy 
    FOREIGN KEY (deleted_by) REFERENCES Users(UserId);
    PRINT '   ✓ Contrainte FK_Users_DeletedBy ajoutée';
END

PRINT '';

-- ====================================================
-- 4. TABLES AVEC RÉFÉRENCES DE TROISIÈME NIVEAU
-- ====================================================

PRINT '4. Création des tables avec références de 3ème niveau...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluations')
BEGIN
    CREATE TABLE Evaluations (
        Evaluations_id INT PRIMARY KEY IDENTITY(1,1),
        evaluationType_id INT,
        userId INT,
        employeeId INT,
        startDate DATE,
        start_date DATE,
        endDate DATE,
        end_date DATE,
        overallScore DECIMAL(3,2),
        comments NVARCHAR(MAX),
        actionPlan NVARCHAR(MAX), 
        strengths NVARCHAR(MAX),
        weaknesses NVARCHAR(MAX),
        isServiceApproved BIT DEFAULT 0,
        isDgApproved BIT DEFAULT 0,
        serviceApprovalDate DATE NULL,
        dgApprovalDate DATE NULL,
        state INT DEFAULT 0,
        FOREIGN KEY (evaluationType_id) REFERENCES Evaluation_type(Evaluation_type_id),
        FOREIGN KEY (userId) REFERENCES Users(UserId)
    );
    PRINT '   ✓ Table Evaluations créée';
END
ELSE PRINT '   - Table Evaluations existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_questions')
BEGIN
    CREATE TABLE Evaluation_questions (
        Question_id INT PRIMARY KEY IDENTITY(1,1),
        evaluationTypeId INT NOT NULL,
        -- Une question appartient à une compétence du référentiel (Skill), pas à un poste.
        -- Domaine et famille sont déduits via Skill.Family_id → Skill_family.Domain_skill_id.
        SkillId INT NULL,
        -- positionId conservé comme filtre facultatif (ciblage lors de la planification).
        positionId INT NULL,
        question NVARCHAR(255) NOT NULL,
        CompetenceLineId INT,
        ResponseTypeId INT NOT NULL DEFAULT 1,
        state INT,
        FOREIGN KEY (evaluationTypeId) REFERENCES Evaluation_type(Evaluation_type_id),
        CONSTRAINT FK_Evaluation_questions_Skill
            FOREIGN KEY (SkillId) REFERENCES Skill(Skill_id),
        CONSTRAINT FK_Evaluation_questions_Position
            FOREIGN KEY (positionId) REFERENCES Position(Position_id),
        FOREIGN KEY (CompetenceLineId) REFERENCES Competence_Lines(CompetenceLineId),
        FOREIGN KEY (ResponseTypeId) REFERENCES ResponseTypes(ResponseTypeId)
    );
    CREATE INDEX IX_Evaluation_questions_SkillId ON Evaluation_questions(SkillId);
    PRINT '   ✓ Table Evaluation_questions créée';
END
ELSE
BEGIN
    IF COL_LENGTH(N'dbo.Evaluation_questions', N'SkillId') IS NULL
        ALTER TABLE dbo.Evaluation_questions ADD SkillId INT NULL;
    PRINT '   - Table Evaluation_questions existe déjà';
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_questionnaire')
BEGIN
    CREATE TABLE Evaluation_questionnaire (
        evaluation_questionnaire_id INT PRIMARY KEY IDENTITY(1,1),
        evaluationId INT,
        questionId INT,
        score DECIMAL(3,2),
        comments NVARCHAR(MAX),
        state INT,
        FOREIGN KEY (evaluationId) REFERENCES Evaluations(Evaluations_id),
        FOREIGN KEY (questionId) REFERENCES Evaluation_questions(Question_id)
    );
    PRINT '   ✓ Table Evaluation_questionnaire créée';
END
ELSE PRINT '   - Table Evaluation_questionnaire existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Training_suggestions')
BEGIN
    CREATE TABLE Training_suggestions (
        Training_suggestion_id INT PRIMARY KEY IDENTITY(1,1),
        evaluationTypeId INT,
        questionId INT,
        training NVARCHAR(255) NOT NULL,
        details NVARCHAR(MAX),
        scoreThreshold INT DEFAULT 2,
        state INT,
        FOREIGN KEY (evaluationTypeId) REFERENCES Evaluation_type(Evaluation_type_id),
        FOREIGN KEY (questionId) REFERENCES Evaluation_questions(Question_id)
    );
    PRINT '   ✓ Table Training_suggestions créée';
END
ELSE PRINT '   - Table Training_suggestions existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_interviews')
BEGIN
    CREATE TABLE Evaluation_interviews (
        InterviewId INT PRIMARY KEY IDENTITY(1,1),
        evaluationId INT NOT NULL,
        scheduled_date DATETIME NOT NULL,
        status INT DEFAULT 0,
        notes NVARCHAR(MAX),
        manager_approval BIT DEFAULT 0,
        manager_comments NVARCHAR(MAX),
        director_approval BIT DEFAULT 0,
        director_comments NVARCHAR(MAX),
        FOREIGN KEY (evaluationId) REFERENCES Evaluations(Evaluations_id)
    );
    PRINT '   ✓ Table Evaluation_interviews créée';
END
ELSE PRINT '   - Table Evaluation_interviews existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InterviewParticipants')
BEGIN
    CREATE TABLE InterviewParticipants (
        ParticipantId INT PRIMARY KEY IDENTITY(1,1),
        InterviewId INT NOT NULL,
        UserId INT,
        EmployeeId INT,
        FOREIGN KEY (InterviewId) REFERENCES Evaluation_interviews(InterviewId),
        FOREIGN KEY (UserId) REFERENCES Users(UserId)
    );
    PRINT '   ✓ Table InterviewParticipants créée';
END
ELSE PRINT '   - Table InterviewParticipants existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_progress')
BEGIN
    CREATE TABLE Evaluation_progress (
        Progress_id INT PRIMARY KEY IDENTITY(1,1),
        evaluationId INT NOT NULL,
        userId INT,
        employeeId INT,
        totalQuestions INT NOT NULL,
        answeredQuestions INT DEFAULT 0,
        progressPercentage DECIMAL(5,2) DEFAULT 0,
        lastUpdate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (evaluationId) REFERENCES Evaluations(Evaluations_id),
        FOREIGN KEY (userId) REFERENCES Users(UserId)
    );
    PRINT '   ✓ Table Evaluation_progress créée';
END
ELSE PRINT '   - Table Evaluation_progress existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TemporaryAccounts')
BEGIN
    CREATE TABLE TemporaryAccounts (
        TempAccountId INT PRIMARY KEY IDENTITY(1,1),
        UserId INT,
        EmployeeId INT,
        Evaluations_id INT NOT NULL,
        TempLogin NVARCHAR(255) NOT NULL,
        TempPassword NVARCHAR(255) NOT NULL,
        ExpirationDate DATETIME NOT NULL,
        IsUsed BIT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (UserId) REFERENCES Users(UserId),
        FOREIGN KEY (Evaluations_id) REFERENCES Evaluations(Evaluations_id)
    );
    PRINT '   ✓ Table TemporaryAccounts créée';
END
ELSE PRINT '   - Table TemporaryAccounts existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LoginAttempts')
BEGIN
    CREATE TABLE LoginAttempts (
        AttemptId INT PRIMARY KEY IDENTITY(1,1),
        TempLogin NVARCHAR(255) NOT NULL,
        AttemptDate DATETIME DEFAULT GETUTCDATE(),
        IPAddress NVARCHAR(45),
        IsSuccess BIT DEFAULT 0
    );
    PRINT '   ✓ Table LoginAttempts créée';
END
ELSE PRINT '   - Table LoginAttempts existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_Selected_Questions')
BEGIN
    CREATE TABLE Evaluation_Selected_Questions (
        SelectedQuestionId INT PRIMARY KEY IDENTITY(1,1),
        EvaluationId INT NOT NULL,
        QuestionId INT NOT NULL,
        CompetenceLineId INT NOT NULL,
        FOREIGN KEY (EvaluationId) REFERENCES Evaluations(Evaluations_id),
        FOREIGN KEY (QuestionId) REFERENCES Evaluation_questions(Question_id),
        FOREIGN KEY (CompetenceLineId) REFERENCES Competence_Lines(CompetenceLineId)
    );
    PRINT '   ✓ Table Evaluation_Selected_Questions créée';
END
ELSE PRINT '   - Table Evaluation_Selected_Questions existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_Responses')
BEGIN
    CREATE TABLE Evaluation_Responses (
        ResponseId INT PRIMARY KEY IDENTITY(1,1),
        EvaluationId INT NOT NULL,
        QuestionId INT NOT NULL,
        ResponseType NVARCHAR(20) NOT NULL,
        ResponseValue NVARCHAR(MAX),
        TimeSpent INT,
        StartTime DATETIME,
        EndTime DATETIME,
        IsCorrect BIT,
        State INT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (EvaluationId) REFERENCES Evaluations(Evaluations_id),
        FOREIGN KEY (QuestionId) REFERENCES Evaluation_questions(Question_id)
    );
    PRINT '   ✓ Table Evaluation_Responses créée';
END
ELSE PRINT '   - Table Evaluation_Responses existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_Question_Options')
BEGIN
    CREATE TABLE Evaluation_Question_Options (
        OptionId INT PRIMARY KEY IDENTITY(1,1),
        QuestionId INT NOT NULL,
        OptionText NVARCHAR(255) NOT NULL,
        IsCorrect BIT DEFAULT 0,
        SortOrder INT NOT NULL DEFAULT 0,
        State INT DEFAULT 1,
        FOREIGN KEY (QuestionId) REFERENCES Evaluation_questions(Question_id)
    );
    PRINT '   ✓ Table Evaluation_Question_Options créée';
END
ELSE
BEGIN
    IF COL_LENGTH(N'dbo.Evaluation_Question_Options', N'SortOrder') IS NULL
        ALTER TABLE dbo.Evaluation_Question_Options ADD SortOrder INT NOT NULL CONSTRAINT DF_Evaluation_Question_Options_SortOrder DEFAULT 0;
    PRINT '   - Table Evaluation_Question_Options existe déjà';
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EvaluationQuestionConfig')
BEGIN
    CREATE TABLE EvaluationQuestionConfig (
        Id INT PRIMARY KEY IDENTITY(1,1),
        QuestionId INT NOT NULL,
        MaxTimeInMinutes INT NOT NULL DEFAULT 15,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME DEFAULT GETUTCDATE(),
        CONSTRAINT FK_EvaluationQuestionConfig_Questions FOREIGN KEY (QuestionId) REFERENCES Evaluation_questions(Question_id)
    );
    
    CREATE INDEX IX_EvaluationQuestionConfig_QuestionId ON EvaluationQuestionConfig(QuestionId);
    
    PRINT '   ✓ Table EvaluationQuestionConfig créée';
END
ELSE PRINT '   - Table EvaluationQuestionConfig existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_Competence_Results')
BEGIN
    CREATE TABLE Evaluation_Competence_Results (
        ResultId INT PRIMARY KEY IDENTITY(1,1),
        EvaluationId INT NOT NULL,
        UserId INT,
        EmployeeId INT,
        CompetenceLineId INT NOT NULL,
        Score DECIMAL(3,2) NOT NULL,
        Comments NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        State INT DEFAULT 1,
        CONSTRAINT FK_EvalCompResults_Evaluations FOREIGN KEY (EvaluationId) REFERENCES Evaluations(Evaluations_id),
        CONSTRAINT FK_EvalCompResults_Users FOREIGN KEY (UserId) REFERENCES Users(UserId),
        CONSTRAINT FK_EvalCompResults_CompetenceLines FOREIGN KEY (CompetenceLineId) REFERENCES Competence_Lines(CompetenceLineId)
    );

    CREATE INDEX IX_EvalCompResults_EvaluationId ON Evaluation_Competence_Results(EvaluationId);
    CREATE INDEX IX_EvalCompResults_UserId ON Evaluation_Competence_Results(UserId);
    CREATE INDEX IX_EvalCompResults_CompetenceLineId ON Evaluation_Competence_Results(CompetenceLineId);
    
    PRINT '   ✓ Table Evaluation_Competence_Results créée';
END
ELSE PRINT '   - Table Evaluation_Competence_Results existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EvaluationSupervisors')
BEGIN
    CREATE TABLE EvaluationSupervisors (
        EvaluationId INT NOT NULL,
        SupervisorId INT NOT NULL,
        PRIMARY KEY (EvaluationId, SupervisorId),
        FOREIGN KEY (EvaluationId) REFERENCES Evaluations(Evaluations_id),
        FOREIGN KEY (SupervisorId) REFERENCES Users(UserId)
    );
    PRINT '   ✓ Table EvaluationSupervisors créée';
END
ELSE PRINT '   - Table EvaluationSupervisors existe déjà';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_Reference_Answers')
BEGIN
    CREATE TABLE Evaluation_Reference_Answers (
        ReferenceAnswerId INT PRIMARY KEY IDENTITY(1,1),
        QuestionId INT NOT NULL,
        ReferenceText NVARCHAR(MAX) NOT NULL,
        EvaluationGuidelines NVARCHAR(MAX) NULL,
        ExpectedKeyPoints NVARCHAR(MAX) NULL,
        ScoreDescription1 NVARCHAR(255) NULL,
        ScoreDescription2 NVARCHAR(255) NULL,
        ScoreDescription3 NVARCHAR(255) NULL,
        ScoreDescription4 NVARCHAR(255) NULL,
        ScoreDescription5 NVARCHAR(255) NULL,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME NULL,
        CreatedById INT NULL,
        UpdatedById INT NULL,
        State INT DEFAULT 1,
        FOREIGN KEY (QuestionId) REFERENCES Evaluation_questions(Question_id),
        FOREIGN KEY (CreatedById) REFERENCES Users(UserId),
        FOREIGN KEY (UpdatedById) REFERENCES Users(UserId)
    );

    CREATE INDEX IX_EvaluationReferenceAnswers_QuestionId
    ON Evaluation_Reference_Answers (QuestionId);
    
    PRINT '   ✓ Table Evaluation_Reference_Answers créée';
END
ELSE PRINT '   - Table Evaluation_Reference_Answers existe déjà';

PRINT '';

-- ====================================================
-- 5. MODIFICATION DES CONTRAINTES POUR UTILISER EMPLOYEE
-- ====================================================

PRINT '5. Ajout des contraintes vers Employee...';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Employee')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Evaluations_Employee')
    BEGIN
        ALTER TABLE Evaluations 
        ADD CONSTRAINT FK_Evaluations_Employee
        FOREIGN KEY (employeeId) REFERENCES Employee(Employee_id);
        PRINT '   ✓ Contrainte FK_Evaluations_Employee ajoutée';
    END

    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_InterviewParticipants_Employee')
    BEGIN
        ALTER TABLE InterviewParticipants 
        ADD CONSTRAINT FK_InterviewParticipants_Employee
        FOREIGN KEY (EmployeeId) REFERENCES Employee(Employee_id);
        PRINT '   ✓ Contrainte FK_InterviewParticipants_Employee ajoutée';
    END

    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_EvaluationProgress_Employee')
    BEGIN
        ALTER TABLE Evaluation_progress 
        ADD CONSTRAINT FK_EvaluationProgress_Employee
        FOREIGN KEY (employeeId) REFERENCES Employee(Employee_id);
        PRINT '   ✓ Contrainte FK_EvaluationProgress_Employee ajoutée';
    END

    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TemporaryAccounts_Employee')
    BEGIN
        ALTER TABLE TemporaryAccounts 
        ADD CONSTRAINT FK_TemporaryAccounts_Employee
        FOREIGN KEY (EmployeeId) REFERENCES Employee(Employee_id);
        PRINT '   ✓ Contrainte FK_TemporaryAccounts_Employee ajoutée';
    END

    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_EvalCompResults_Employee')
    BEGIN
        ALTER TABLE Evaluation_Competence_Results 
        ADD CONSTRAINT FK_EvalCompResults_Employee
        FOREIGN KEY (EmployeeId) REFERENCES Employee(Employee_id);
        PRINT '   ✓ Contrainte FK_EvalCompResults_Employee ajoutée';
    END
END
ELSE
BEGIN
    PRINT '   ⚠ ATTENTION: La table Employee n''existe pas';
    PRINT '   Les contraintes vers Employee n''ont pas été créées';
END

-- ====================================================
-- 6. PROCÉDURES STOCKÉES
-- ====================================================

PRINT '';
PRINT '6. Création des procédures stockées...';

IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'CleanExpiredTemporaryAccounts')
BEGIN
    EXEC('
    CREATE PROCEDURE CleanExpiredTemporaryAccounts
    AS
    BEGIN
        DELETE FROM TemporaryAccounts 
        WHERE ExpirationDate < GETUTCDATE();
    END
    ');
    PRINT '   ✓ Procédure CleanExpiredTemporaryAccounts créée';
END
ELSE PRINT '   - Procédure CleanExpiredTemporaryAccounts existe déjà';

PRINT '';
PRINT '=============================================================================================';
PRINT 'CRÉATION DES TABLES TERMINÉE AVEC SUCCÈS !';
PRINT '=============================================================================================';
PRINT '';
PRINT 'PROCHAINE ÉTAPE : Exécuter 02_VUES_EVALUATIONS.sql';
PRINT '';
PRINT '=============================================================================================';
