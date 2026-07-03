CREATE TABLE Roles (
    Role_id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL,
    state INT
);

CREATE TABLE Department (
    Department_id INT PRIMARY KEY IDENTITY(1,1),
    Department_name NVARCHAR(255) NOT NULL,
    state INT
);

CREATE TABLE Postes (
    Poste_id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL, -- Titre du poste
    state INT
);

CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    last_name NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    departmentid INT,
    postId INT, -- Référence au poste
    creation_date DATE NOT NULL DEFAULT GETUTCDATE(),
    created_by INT NOT NULL,
    deletion_date DATE,
    deleted_by INT,
    state INT,
    FOREIGN KEY (role_id) REFERENCES Roles(Role_id),
    FOREIGN KEY (departmentid) REFERENCES Department(Department_id),
    FOREIGN KEY (postId) REFERENCES Postes(Poste_id)
);

-- Add self-reference after Users table is created
ALTER TABLE Users ADD CONSTRAINT FK_Users_DeletedBy 
FOREIGN KEY (deleted_by) REFERENCES Users(UserId);

CREATE TABLE Evaluation_type (
    Evaluation_type_id INT PRIMARY KEY IDENTITY(1,1),
    designation NVARCHAR(100),
    state INT
);

CREATE TABLE Evaluations (
    Evaluations_id INT PRIMARY KEY IDENTITY(1,1),
    evaluationType_id INT,
    userId INT,
    supervisorId INT,
    startDate DATE,
    endDate DATE,
    overallScore DECIMAL(3,2),
    comments TEXT,
    actionPlan TEXT,
    strengths NVARCHAR(MAX),
    weaknesses NVARCHAR(MAX),
    isServiceApproved BIT DEFAULT 0,
    isDgApproved BIT DEFAULT 0,
    serviceApprovalDate DATE NULL,
    dgApprovalDate DATE NULL,
    state INT DEFAULT 0,
    FOREIGN KEY (evaluationType_id) REFERENCES Evaluation_type(Evaluation_type_id),
    FOREIGN KEY (userId) REFERENCES Users(UserId),
    FOREIGN KEY (supervisorId) REFERENCES Users(UserId)
);

CREATE TABLE Evaluation_questions (
    Question_id INT PRIMARY KEY IDENTITY(1,1),
    evaluationTypeId INT NOT NULL,
    positionId INT NOT NULL,
    CompetenceLineId INT,
    question NVARCHAR(MAX) NOT NULL,
    MaxTimeInMinutes INT DEFAULT 30, -- Temps maximum en minutes pour répondre à la question
    state INT DEFAULT 1,
    FOREIGN KEY (evaluationTypeId) REFERENCES Evaluation_type(Evaluation_type_id),
    FOREIGN KEY (positionId) REFERENCES Postes(Poste_id),
    FOREIGN KEY (CompetenceLineId) REFERENCES Competence_Lines(CompetenceLineId)
);

CREATE TABLE Evaluation_questionnaire (
    evaluation_questionnaire_id INT PRIMARY KEY IDENTITY(1,1),
    evaluationId INT,
    questionId INT,
    score DECIMAL(3,2),
    comments TEXT,
    state INT,
    FOREIGN KEY (evaluationId) REFERENCES Evaluations(Evaluations_id),
    FOREIGN KEY (questionId) REFERENCES Evaluation_questions(Question_id)
);

CREATE TABLE Training_suggestions (
    Training_suggestion_id INT PRIMARY KEY IDENTITY(1,1),
    evaluationTypeId INT, -- Référence au type d'évaluation
    questionId INT, -- Référence à une question spécifique
    training NVARCHAR(255) NOT NULL, -- Nom de la formation suggérée
    details TEXT, -- Détails sur la formation suggérée
    scoreThreshold INT DEFAULT 2, -- Score en dessous duquel la suggestion s'applique
    state INT,
    FOREIGN KEY (evaluationType Id) REFERENCES Evaluation_type(Evaluation_type_id),
    FOREIGN KEY (questionId) REFERENCES Evaluation_questions(Question_id)
);

CREATE TABLE Evaluation_interviews (
    InterviewId INT PRIMARY KEY IDENTITY(1,1),
    evaluationId INT NOT NULL, -- Référence à l'évaluation
    scheduled_date DATETIME NOT NULL, -- Date et heure de l'entretien
    status INT DEFAULT 0, -- Statut : Scheduled, In Progress, Completed, Cancelled
    notes TEXT, -- Notes supplémentaires pour l'entretien
    manager_approval BIT DEFAULT 0, -- Validation du manager
    manager_comments TEXT, -- Commentaires du manager
    director_approval BIT DEFAULT 0, -- Validation du directeur
    director_comments TEXT,
    FOREIGN KEY (evaluationId) REFERENCES Evaluations(Evaluations_id)
);

CREATE TABLE InterviewParticipants (
    ParticipantId INT PRIMARY KEY IDENTITY(1,1),
    InterviewId INT NOT NULL, -- Référence à Evaluation_interviews
    UserId INT NOT NULL, -- Référence à l'utilisateur participant
    FOREIGN KEY (InterviewId) REFERENCES Evaluation_interviews(InterviewId),
    FOREIGN KEY (User Id) REFERENCES Users(UserId)
);

CREATE TABLE Evaluation_progress (
    Progress_id INT PRIMARY KEY IDENTITY(1,1),
    evaluationId INT NOT NULL, 
    userId INT NOT NULL,
    totalQuestions INT NOT NULL,
    answeredQuestions INT DEFAULT 0,
    progressPercentage DECIMAL(5,2) DEFAULT 0,
    lastUpdate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (evaluationId) REFERENCES Evaluations(Evaluations_id),
    FOREIGN KEY (userId) REFERENCES Users(UserId)
);
CREATE TABLE Evaluation_Responses (
    ResponseId INT PRIMARY KEY IDENTITY(1,1),
    EvaluationId INT NOT NULL,
    QuestionId INT NOT NULL,
    ResponseType NVARCHAR(20) NOT NULL, -- 'QCM', 'TEXT', 'SCORE'
    ResponseValue NVARCHAR(MAX), -- Pour stocker la réponse (texte ou JSON pour QCM)
    TimeSpent INT, -- Temps en secondes pour répondre
    StartTime DATETIME, -- Heure de début de la réponse
    EndTime DATETIME, -- Heure de fin de la réponse
    IsCorrect BIT, -- Pour les QCM
    State INT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    FOREIGN KEY (EvaluationId) REFERENCES Evaluations(Evaluations_id),
    FOREIGN KEY (QuestionId) REFERENCES Evaluation_questions(Question_id)
);

CREATE TABLE Evaluation_Question_Options (
    OptionId INT PRIMARY KEY IDENTITY(1,1),
    QuestionId INT NOT NULL,
    OptionText NVARCHAR(255) NOT NULL,
    IsCorrect BIT DEFAULT 0,
    State INT DEFAULT 1,
    FOREIGN KEY (QuestionId) REFERENCES Evaluation_questions(Question_id)
);

CREATE TABLE TemporaryAccounts (
    TempAccountId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,          -- Lien avec l'employé
    Evaluations_id INT NOT NULL,  -- Lien avec l'évaluation
    TempLogin NVARCHAR(255) NOT NULL,
    TempPassword NVARCHAR(255) NOT NULL,
    ExpirationDate DATETIME NOT NULL,  -- Date d'expiration (ex: 24h après création)
    IsUsed BIT DEFAULT 0,         -- 0 = non utilisé, 1 = utilisé
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    FOREIGN KEY (User Id) REFERENCES Users(UserId),
    FOREIGN KEY (Evaluations_id) REFERENCES Evaluations(Evaluations_id)
);

CREATE TABLE LoginAttempts (
    AttemptId INT PRIMARY KEY IDENTITY(1,1),
    TempLogin NVARCHAR(255) NOT NULL,
    AttemptDate DATETIME DEFAULT GETUTCDATE(),
    IPAddress NVARCHAR(45),
    IsSuccess BIT DEFAULT 0  -- 0 = échec, 1 = succès
);


-- Nouvelle table pour stocker les questions sélectionnées par évaluation
CREATE TABLE Evaluation_Selected_Questions (
    SelectedQuestionId INT PRIMARY KEY IDENTITY(1,1),
    EvaluationId INT NOT NULL,
    QuestionId INT NOT NULL,
    CompetenceLineId INT NOT NULL,
    FOREIGN KEY (EvaluationId) REFERENCES Evaluations(Evaluations_id),
    FOREIGN KEY (QuestionId) REFERENCES Evaluation_questions(Question_id),
    FOREIGN KEY (CompetenceLineId) REFERENCES Competence_Lines(CompetenceLineId)
);

-- VIEWS
CREATE VIEW VEmployeeDetails AS
SELECT 
    u.UserId AS EmployeeId,
    u.first_name AS FirstName,
    u.last_name AS LastName,
    p.title AS Position,
    p.Position_id as PositionId,
    r.title AS Role,
    d.Department_name AS Department,
    e.Evaluations_id AS EvaluationId,
    e.startDate AS EvaluationDate,
    e.overallScore AS OverallScore,
    e.comments AS EvaluationComments,
    e.isServiceApproved AS IsServiceApproved,
    e.isDgApproved AS IsDgApproved,
    et.designation AS EvaluationType,
    e.strengths as strengths,
    e.weaknesses as weaknesses,
    e.state as state
FROM Users u
LEFT JOIN Position p ON u.positionId = p.Position_id
LEFT JOIN Roles r ON u.role_id = r.Role_id
LEFT JOIN Department d ON u.departmentid = d.Department_id
LEFT JOIN Evaluations e ON u.UserId = e.userId
LEFT JOIN Evaluation_type et ON e.evaluationType_id = et.Evaluation_type_id 
WHERE e.state=10;

CREATE VIEW VEmployeesWithoutEvaluation AS
SELECT 
    u.UserId AS EmployeeId,
    u.positionId as positionId,
    u.first_name AS FirstName,
    u.last_name AS LastName,
    p.title AS Position,
    e.startDate as startDate,
    e.endDate as endDate,
    e.Evaluations_id as evaluationId,
    d.Department_name AS Department,
    d.Department_id as DepartmentId,
    e.state as state
FROM Users u
LEFT JOIN Position p ON u.positionId = p.Position_id
LEFT JOIN Department d ON u.departmentid = d.Department_id
LEFT JOIN Evaluations e ON u.UserId = e.userId
WHERE e.Evaluations_id IS NULL OR (e.startDate IS NULL AND e.endDate IS NULL AND e.state=0);

CREATE VIEW VEmployeesFinishedEvaluation AS
SELECT 
    u.UserId AS EmployeeId,
    u.positionId as positionId,
    u.first_name AS FirstName,
    u.last_name AS LastName,
    p.title AS Position,
    e.startDate as startDate,
    e.endDate as endDate,
    e.Evaluations_id as evaluationId,
    d.Department_name AS Department,
    d.Department_id as DepartmentId,
    e.state as state,
    e.strengths as strengths,
    e.weaknesses as weaknesses,
    e.comments as comments,
    e.overallScore as overallScore,
    ei.scheduled_date AS InterviewDate,
    ei.status AS InterviewStatus,
    ei.director_approval as directorApproval,
    ei.manager_approval as managerApproval,
    ei.director_comments as directorComments,
    ei.manager_comments as managerComments
FROM Users u
LEFT JOIN Position p ON u.positionId = p.Position_id
LEFT JOIN Department d ON u.departmentid = d.Department_id
LEFT JOIN Evaluations e ON u.UserId = e.userId
LEFT JOIN Evaluation_interviews ei ON e.Evaluations_id = ei.evaluationId
WHERE e.state=20;

CREATE VIEW VEmployeesOngoingEvaluation AS
SELECT 
    u.UserId AS EmployeeId,
    u.first_name AS FirstName,
    u.last_name AS LastName,
    p.title AS Position,
    e.startDate AS StartDate,
    e.endDate AS EndDate,
    e.Evaluations_id AS EvaluationId,
    et.designation AS EvaluationType,
    et.Evaluation_type_id as EvaluationTypeId,
    e.state AS EvaluationState
FROM Users u
LEFT JOIN Position p ON u.positionId = p.Position_id
LEFT JOIN Evaluations e ON u.UserId = e.userId
LEFT JOIN Evaluation_type et ON e.evaluationType_id = et.Evaluation_type_id
WHERE e.state = 15; -- évaluations en cours

CREATE VIEW VEmployeeEvaluationProgress AS
SELECT 
    ep.evaluationId AS EvaluationId,
    ep.userId AS EmployeeId,
    u.first_name AS FirstName,
    u.last_name AS LastName,
    ep.totalQuestions AS TotalQuestions,
    ep.answeredQuestions AS AnsweredQuestions,
    ep.progressPercentage AS Progress,
    ep.lastUpdate AS LastUpdated
FROM Evaluation_progress ep
JOIN Users u ON ep.userId = u.UserId;

CREATE VIEW VTemporaryActiveAccounts AS
SELECT 
    ta.TempAccountId,
    u.UserId,
    u.email AS EmployeeEmail,
    ta.TempLogin,
    ta.ExpirationDate,
    e.Evaluations_id,
    e.startDate AS EvaluationStart,
    e.endDate AS EvaluationEnd
FROM TemporaryAccounts ta
JOIN Users u ON ta.UserId = u.UserId
JOIN Evaluations e ON ta.Evaluations_id = e.Evaluations_id
WHERE ta.ExpirationDate > GETUTCDATE() 
  AND ta.IsUsed = 0;

CREATE VIEW VFailedLoginAttempts AS
SELECT 
    la.AttemptId,
    la.TempLogin,
    la.AttemptDate,
    la.IPAddress,
    ta.Evaluations_id,
    u.UserId
FROM LoginAttempts la
LEFT JOIN TemporaryAccounts ta ON la.TempLogin = ta.TempLogin
LEFT JOIN Users u ON ta.UserId = u.UserId
WHERE la.IsSuccess = 0;

CREATE PROCEDURE CleanExpiredTemporaryAccounts
AS
BEGIN
    DELETE FROM TemporaryAccounts 
    WHERE ExpirationDate < GETUTCDATE();
END;

CREATE VIEW VEvaluationHistory AS
SELECT 
    e.Evaluations_id AS EvaluationId,
    e.userId AS EmployeeId,
    u.first_name AS FirstName,
    u.last_name AS LastName,
    et.designation AS EvaluationType,
    e.startDate AS StartDate,
    e.endDate AS EndDate,
    e.overallScore AS OverallScore,
    e.comments AS EvaluationComments,
    e.strengths AS Strengths,
    e.weaknesses AS Weaknesses,
    e.isServiceApproved AS IsServiceApproved,
    e.isDgApproved AS IsDgApproved,
    ei.scheduled_date AS InterviewDate,
    ei.status AS InterviewStatus,
    p.title AS Position,
    d.Department_name AS Department,
    e.state AS Status,
    (SELECT STRING_AGG(training.training, ', ')
     FROM (
         SELECT DISTINCT ts.training
         FROM Evaluation_questionnaire eq
         JOIN Training_suggestions ts 
         ON eq.questionId = ts.questionId 
         AND eq.score < ts.scoreThreshold
         WHERE eq.evaluationId = e.Evaluations_id
     ) AS training
    ) AS Recommendations,
    (SELECT STRING_AGG(participants.full_name, ', ')
     FROM (
         SELECT DISTINCT ip.ParticipantId, up.first_name + ' ' + up.last_name AS full_name
         FROM InterviewParticipants ip
         JOIN Users up ON ip.ParticipantId = up.UserId
         WHERE ip.InterviewId = ei.InterviewId
     ) AS participants
    ) AS ParticipantNames,
    (SELECT STRING_AGG(CAST(participant_ids.UserId AS NVARCHAR), ', ')
     FROM (
         SELECT DISTINCT ip.ParticipantId, up.UserId
         FROM InterviewParticipants ip
         JOIN Users up ON ip.ParticipantId = up.UserId
         WHERE ip.InterviewId = ei.InterviewId
     ) AS participant_ids
    ) AS ParticipantIds,
    (SELECT STRING_AGG(CONCAT('ID:', CAST(eq.Question_id AS NVARCHAR), ', Question:', eq.question, ', Score:', CAST(eqn.score AS NVARCHAR)), '; ')
     FROM Evaluation_questionnaire eqn
     JOIN Evaluation_questions eq ON eqn.questionId = eq.Question_id
     WHERE eqn.evaluationId = e.Evaluations_id
    ) AS QuestionDetails
FROM Evaluations e
LEFT JOIN Users u ON e.userId = u.UserId
LEFT JOIN Evaluation_type et ON e.evaluationType_id = et.Evaluation_type_id
LEFT JOIN Evaluation_interviews ei ON e.Evaluations_id = ei.evaluationId
LEFT JOIN Position p ON u.positionId = p.Position_id
LEFT JOIN Department d ON u.departmentid = d.Department_id
WHERE e.state = 20
GROUP BY 
    e.Evaluations_id, e.userId, u.first_name, u.last_name, et.designation, 
    e.startDate, e.endDate, e.overallScore, e.comments, 
    e.strengths, e.weaknesses, e.isServiceApproved, e.isDgApproved, 
    ei.scheduled_date, ei.status, ei.InterviewId,
    p.title, d.Department_name, e.state;


--AJOUT DE LIGNE DE COMPETENCE

CREATE TABLE Competence_Lines (
    CompetenceLineId INT PRIMARY KEY IDENTITY(1,1),
    PositionId INT NOT NULL,              -- Référence au poste (ex: développeur)
    CompetenceName NVARCHAR(100) NOT NULL, -- Nom de la compétence (ex: JAVA, CSS)
    Description NVARCHAR(255),            -- Description optionnelle
    state INT,                            -- État (actif/inactif)
    FOREIGN KEY (PositionId) REFERENCES Position(Position_id)
);

ALTER TABLE Evaluation_questions ADD CompetenceLineId INT;
ALTER TABLE Evaluation_questions ADD CONSTRAINT FK_EvalQuestions_CompetenceLines
FOREIGN KEY (CompetenceLineId) REFERENCES Competence_Lines(CompetenceLineId);

--FORMATIONS PAR LIGNE DE COMPETENCES
ALTER TABLE Training_suggestions ADD CompetenceLineId INT;
ALTER TABLE Training_suggestions ADD CONSTRAINT FK_TrainingSuggestions_CompetenceLines
FOREIGN KEY (CompetenceLineId) REFERENCES Competence_Lines(CompetenceLineId);


CREATE TABLE Competence_Trainings (
    TrainingId INT PRIMARY KEY IDENTITY(1,1),
    CompetenceLineId INT NOT NULL,           -- Référence à la ligne de compétence
    TrainingName NVARCHAR(255) NOT NULL,     -- Nom de la formation
    Description NVARCHAR(MAX),               -- Description détaillée
    Duration NVARCHAR(50),                   -- Durée estimée (ex: "3 jours", "40 heures")
    Provider NVARCHAR(100),                  -- Fournisseur de la formation
    Level NVARCHAR(50),                      -- Niveau (débutant, intermédiaire, avancé)
    state INT,
    FOREIGN KEY (CompetenceLineId) REFERENCES Competence_Lines(CompetenceLineId)
);
ALTER TABLE Training_suggestions ADD TrainingId INT;
ALTER TABLE Training_suggestions ADD CONSTRAINT FK_TrainingSuggestions_Trainings
FOREIGN KEY (TrainingId) REFERENCES Competence_Trainings(TrainingId);

-- Mettre à jour la colonne postId en positionId dans la table Users
EXEC sp_rename 'Users.postId', 'positionId', 'COLUMN';

-- Mettre à jour la contrainte de clé étrangère dans Users
ALTER TABLE Users DROP CONSTRAINT FK_Users_Postes;
ALTER TABLE Users ADD CONSTRAINT FK_Users_Positions 
FOREIGN KEY (positionId) REFERENCES Position(Position_id);

-- Mettre à jour la colonne postId en positionId dans Evaluation_questions 
EXEC sp_rename 'Evaluation_questions.postId', 'positionId', 'COLUMN';

-- Mettre à jour la contrainte de clé étrangère dans Evaluation_questions
ALTER TABLE Evaluation_questions DROP CONSTRAINT FK_EvalQuestions_Postes;
ALTER TABLE Evaluation_questions ADD CONSTRAINT FK_EvalQuestions_Positions
FOREIGN KEY (positionId) REFERENCES Position(Position_id);

-- Mettre à jour les vues qui référencent ces tables
-- Note: Il faudra recréer les vues qui utilisent ces tables
