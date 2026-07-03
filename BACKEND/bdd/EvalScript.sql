use base_GCC;
		CREATE TABLE Roles (
			Role_id int PRIMARY KEY identity(1,1),
			title NVARCHAR(255) NOT NULL,
			state int
		);
CREATE TABLE Users (
			UserId int PRIMARY KEY identity(1,1),
			last_name NVARCHAR(255) NOT NULL,
			first_name NVARCHAR(255) NOT NULL,
			email NVARCHAR(255) NOT NULL,
			password NVARCHAR(255) NOT NULL,
			role_id int NOT NULL,
			departmentid int,
			creation_date DATE NOT NULL DEFAULT GETUTCDATE(),
			created_by int NOT NULL,
			deletion_date DATE,
			deleted_by int,
			postId INT,
			FOREIGN KEY (role_id) REFERENCES Roles(Role_id),
			FOREIGN KEY (postId) REFERENCES Postes(Poste_id),
			FOREIGN KEY (departmentid) REFERENCES Department(Department_id),
			-- FOREIGN KEY (created_by) REFERENCES users(id),
			FOREIGN KEY (deleted_by) REFERENCES users(UserId),
			state int
		);

CREATE TABLE Evaluation_type (
    Evaluation_type_id INT PRIMARY KEY IDENTITY(1,1),
    designation NVARCHAR(100),
	state int
);

CREATE TABLE Evaluations (
    Evaluations_id INT PRIMARY KEY IDENTITY(1,1),
    evaluationType_id INT, 
    userId INT, -- R�f�rence � l'employ� (table users)
    supervisorId INT, -- R�f�rence au superviseur (table users)
    startDate DATE, -- Date de d�but de l'�valuation
    endDate DATE, -- Date de fin de l'�valuation
    overallScore DECIMAL(3,2), -- Note globale de l'�valuation
    comments TEXT, -- Commentaires globaux de l'�valuation
    actionPlan TEXT, -- Plan d'action pour l'employ�
	strenghts nvarchar(max),
	weakness nvarchar (max),
    FOREIGN KEY (evaluationType_id) REFERENCES Evaluation_type(Evaluation_type_id),
	state int,
    FOREIGN KEY (userId) REFERENCES users(UserId), -- Employ� venant de la table users
    FOREIGN KEY (supervisorId) REFERENCES users(UserId) -- Superviseur venant de la table users
);

CREATE TABLE Evaluation_questionnaire (
    evaluation_questionnaire_id INT PRIMARY KEY IDENTITY(1,1),
    evaluationId INT, -- R�f�rence � l'�valuation
    questionId INT, -- R�f�rence � la question pos�e
    score DECIMAL(3,2), -- Note donn�e pour cette question
    comments TEXT, -- Commentaires sur la r�ponse � cette question
	state int,
    FOREIGN KEY (evaluationId) REFERENCES Evaluations(Evaluations_id),
    FOREIGN KEY (questionId) REFERENCES Evaluation_Questions(Question_id)
);


CREATE TABLE Evaluation_schedules (
    Evaluation_schedules_id INT PRIMARY KEY IDENTITY(1,1),
    userId INT, -- R�f�rence � l'employ� (table users)
    startDate DATE, -- Date de d�but de l'�valuation
    endDate DATE, -- Date de fin de l'�valuation
    emailSent BIT DEFAULT 0, -- Statut de l'envoi de l'email (0 = non envoy�, 1 = envoy�)
    emailSubject NVARCHAR(255), -- Objet de l'email envoy� pour la convocation
    emailBody TEXT, -- Contenu de l'email envoy�
	state int,
    FOREIGN KEY (userId) REFERENCES users(UserId)
);

CREATE TABLE Training_suggestions (
    Training_suggestions INT PRIMARY KEY IDENTITY(1,1),
    evaluationId INT, -- R�f�rence � l'�valuation
    training NVARCHAR(255), -- Nom de la formation sugg�r�e
    details TEXT, -- D�tails sur la formation sugg�r�e
	state int,
    FOREIGN KEY (evaluationId) REFERENCES Evaluations(evaluations_id)
);

CREATE TABLE Evaluation_history (
    Evaluation_history_id INT PRIMARY KEY IDENTITY(1,1),
    userId INT, -- R�f�rence � l'employ� (table users)
    evaluationId INT, -- R�f�rence � l'�valuation
    evaluationDate DATE, -- Date de l'�valuation
    overallScore DECIMAL(3,2), -- Note globale de l'�valuation
    actionPlan TEXT, -- Plan d'action d�fini lors de l'�valuation
	state int,
    FOREIGN KEY (userId) REFERENCES users(UserId),
    FOREIGN KEY (evaluationId) REFERENCES Evaluations(evaluations_id)
);

CREATE TABLE Performance_evolution (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT, -- R�f�rence � l'employ� (table users)
    period DATE, -- P�riode d'�valuation
    evaluationQuestionnaireId INT, -- R�f�rence � une question du questionnaire d'�valuation
    score DECIMAL(3,2), -- Note pour la question ou la performance g�n�rale � cette p�riode
	state int,
    FOREIGN KEY (userId) REFERENCES users(UserId),
    FOREIGN KEY (evaluationQuestionnaireId) REFERENCES Evaluation_questionnaire(Evaluation_questionnaire_id)
);
 -- UPDATE --
CREATE TABLE Evaluation_questions (
    Question_id INT PRIMARY KEY IDENTITY(1,1),
    evaluationTypeId INT NOT NULL, -- Lien avec le type d'�valuation
    postId INT NOT NULL, -- Lien avec le poste de l'employ�
    question NVARCHAR(255) NOT NULL, -- Texte de la question
    FOREIGN KEY (evaluationTypeId) REFERENCES Evaluation_type(Evaluation_type_id),
	state int,
    FOREIGN KEY (postId) REFERENCES Postes(Poste_id)
);

CREATE TABLE Postes (
    Poste_id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL, -- Titre du poste (ex. : D�veloppeur)
	state int
);

---------------------------------------------------------------------------------
---------------------------------------------------------------------------------
---------------------------------------------------------------------------------
---------------------------------------------------------------------------------
-- TABLES POUR LA GESTION DES R�LES ET UTILISATEURS
CREATE TABLE Roles (
    Role_id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL,
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
    postId INT, -- R�f�rence au poste
    creation_date DATE NOT NULL DEFAULT GETUTCDATE(),
    created_by INT NOT NULL,
    deletion_date DATE,
    deleted_by INT,
    state INT,
    FOREIGN KEY (role_id) REFERENCES Roles(Role_id),
    FOREIGN KEY (departmentid) REFERENCES Department(Department_id),
    FOREIGN KEY (postId) REFERENCES Postes(Poste_id),
    FOREIGN KEY (deleted_by) REFERENCES Users(UserId)
);

CREATE TABLE Postes (
    Poste_id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL, -- Titre du poste
    state INT
);

-- TABLES POUR LES �VALUATIONS
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
    isServiceApproved BIT DEFAULT 0,
    isDgApproved BIT DEFAULT 0,
    serviceApprovalDate DATE NULL,
    dgApprovalDate DATE NULL,
    state INT,
    FOREIGN KEY (evaluationType_id) REFERENCES Evaluation_type(Evaluation_type_id),
    FOREIGN KEY (userId) REFERENCES Users(UserId),
    FOREIGN KEY (supervisorId) REFERENCES Users(UserId)
);

CREATE TABLE Evaluation_questions (
    Question_id INT PRIMARY KEY IDENTITY(1,1),
    evaluationTypeId INT NOT NULL,
    postId INT NOT NULL,
    question NVARCHAR(255) NOT NULL,
    state INT,
    FOREIGN KEY (evaluationTypeId) REFERENCES Evaluation_type(Evaluation_type_id),
    FOREIGN KEY (postId) REFERENCES Postes(Poste_id)
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

-- TABLE POUR LES SUGGESTIONS DE FORMATION
CREATE TABLE Training_suggestions (
    Training_suggestion_id INT PRIMARY KEY IDENTITY(1,1),
    evaluationTypeId INT, -- R�f�rence au type d'�valuation
    questionId INT, -- R�f�rence � une question sp�cifique
    training NVARCHAR(255) NOT NULL, -- Nom de la formation sugg�r�e
    details TEXT, -- D�tails sur la formation sugg�r�e
    scoreThreshold INT DEFAULT 2, -- Score en dessous duquel la suggestion s'applique
    state INT,
    FOREIGN KEY (evaluationTypeId) REFERENCES Evaluation_type(Evaluation_type_id),
    FOREIGN KEY (questionId) REFERENCES Evaluation_questions(Question_id)
);

-----TABLE POUR L'ENTRETIEN D'EVALUATION------

CREATE TABLE Evaluation_interviews (
    InterviewId INT PRIMARY KEY IDENTITY(1,1),
    evaluationId INT NOT NULL, -- R�f�rence � l'�valuation
    scheduled_date DATETIME NOT NULL, -- Date et heure de l'entretien
    status INT DEFAULT 0, -- Statut : Scheduled, In Progress, Completed, Cancelled
    notes TEXT, -- Notes suppl�mentaires pour l'entretien
	manager_approval BIT DEFAULT 0, -- Validation du manager
    manager_comments TEXT, -- Commentaires du manager
    director_approval BIT DEFAULT 0, -- Validation du directeur
    director_comments TEXT,
    FOREIGN KEY (evaluationId) REFERENCES Evaluations(Evaluations_id)
);


CREATE TABLE InterviewParticipants (
    ParticipantId INT PRIMARY KEY IDENTITY(1,1),
    InterviewId INT NOT NULL, -- R�f�rence � Evaluation_interviews
    UserId INT NOT NULL, -- R�f�rence � l'utilisateur participant
    FOREIGN KEY (InterviewId) REFERENCES Evaluation_interviews(InterviewId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
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

CREATE TABLE TemporaryAccounts (
    TempAccountId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,          -- Lien avec l'employ�
    Evaluations_id INT NOT NULL,  -- Lien avec l'�valuation
    TempLogin NVARCHAR(255) NOT NULL,
    TempPassword NVARCHAR(255) NOT NULL,
    ExpirationDate DATETIME NOT NULL,  -- Date d'expiration (ex: 24h apr�s cr�ation)
    IsUsed BIT DEFAULT 0,         -- 0 = non utilis�, 1 = utilis�
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (Evaluations_id) REFERENCES Evaluations(Evaluations_id)
);

CREATE TABLE LoginAttempts (
    AttemptId INT PRIMARY KEY IDENTITY(1,1),
    TempLogin NVARCHAR(255) NOT NULL,
    AttemptDate DATETIME DEFAULT GETUTCDATE(),
    IPAddress NVARCHAR(45),
    IsSuccess BIT DEFAULT 0  -- 0 = �chec, 1 = succ�s
);

use base_GCC
------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------
-------VIEW POUR LA NOTATION------------
CREATE  VIEW VEmployeeDetails AS
SELECT 
    u.UserId AS EmployeeId,
    u.first_name AS FirstName,
    u.last_name AS LastName,
    p.title AS Position,
	p.Poste_id as PosteId,
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
LEFT JOIN Postes p ON u.postId = p.Poste_id
LEFT JOIN Roles r ON u.role_id = r.Role_id
LEFT JOIN Department d ON u.departmentid = d.Department_id
LEFT JOIN Evaluations e ON u.UserId = e.userId
LEFT JOIN Evaluation_type et ON e.evaluationType_id = et.Evaluation_type_id Where e.state=10;


drop view VEmployeeDetails
------VIEW POUR LE PLANNING D"EVALUATION--------
CREATE VIEW VEmployeesWithoutEvaluation AS
SELECT 
    u.UserId AS EmployeeId,
	u.postId as postId,
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
LEFT JOIN Postes p ON u.postId = p.Poste_id
LEFT JOIN Department d ON u.departmentid = d.Department_id
LEFT JOIN Evaluations e ON u.UserId = e.userId
WHERE e.Evaluations_id IS NULL OR (e.startDate IS NULL AND e.endDate IS NULL AND e.state=0);

-------------------VIEW POUR L'ENTRETIEN D'EVALUATION---------------------
drop view VEmployeesFinishedEvaluation
Create View VEmployeesFinishedEvaluation AS
SELECT 
    u.UserId AS EmployeeId,
	u.postId as postId,
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
LEFT JOIN Postes p ON u.postId = p.Poste_id
LEFT JOIN Department d ON u.departmentid = d.Department_id
LEFT JOIN Evaluations e ON u.UserId = e.userId
LEFT JOIN Evaluation_interviews ei ON e.Evaluations_id = ei.evaluationId
WHERE e.state=20;

drop view VEmployeesFinishedEvaluation
use base_GCC

--VIEW POUR LEVALUATIONS EN COURS
drop view VEmployeesOngoingEvaluation
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
LEFT JOIN Postes p ON u.postId = p.Poste_id
LEFT JOIN Evaluations e ON u.UserId = e.userId
LEFT JOIN Evaluation_type et ON e.evaluationType_id = et.Evaluation_type_id
WHERE e.state = 15; -- �valuations en cours

--PROGRES DES EMPLOYEES
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

--COMPTE TEMPORAIREMENT ACTIFS
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

----Surveille les tentatives de connexion suspectes.
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

-- proc�dure stock�e pour supprimer les comptes expir�s :
CREATE PROCEDURE CleanExpiredTemporaryAccounts
AS
BEGIN
    DELETE FROM TemporaryAccounts 
    WHERE ExpirationDate < GETUTCDATE();
END;


---------------------------------------------------------------------------------
---------------------------------------------------------------------------------

--HISTORIQUE D'EVALUATION
drop view VEvaluationHistory
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
    -- Colonne pour les d�tails des questions avec ID, nom, et score
    (SELECT STRING_AGG(CONCAT('ID:', CAST(eq.Question_id AS NVARCHAR), ', Question:', eq.question, ', Score:', CAST(eqn.score AS NVARCHAR)), '; ')
     FROM Evaluation_questionnaire eqn
     JOIN Evaluation_questions eq ON eqn.questionId = eq.Question_id
     WHERE eqn.evaluationId = e.Evaluations_id
    ) AS QuestionDetails
FROM Evaluations e
LEFT JOIN Users u ON e.userId = u.UserId
LEFT JOIN Evaluation_type et ON e.evaluationType_id = et.Evaluation_type_id
LEFT JOIN Evaluation_interviews ei ON e.Evaluations_id = ei.evaluationId
LEFT JOIN Postes p ON u.postId = p.Poste_id
LEFT JOIN Department d ON u.departmentid = d.Department_id
WHERE e.state = 20
GROUP BY 
    e.Evaluations_id, e.userId, u.first_name, u.last_name, et.designation, 
    e.startDate, e.endDate, e.overallScore, e.comments, 
    e.strengths, e.weaknesses, e.isServiceApproved, e.isDgApproved, 
    ei.scheduled_date, ei.status, ei.InterviewId,
    p.title, d.Department_name, e.state;


	SELECT 
    eq.EvaluationId,
    q.question,
    eq.Score,
    eq.comments
FROM Evaluation_questionnaire eq
JOIN Evaluation_questions q ON eq.QuestionId = q.Question_id

use base_GCC
---------------------------------------------------------------------------------
---------------------------------------------------------------------------------

SELECT * 
FROM users 
WHERE postId IS NULL OR role_id IS NULL OR departmentid IS NULL;

SELECT * FROM Postes WHERE Poste_id NOT IN (SELECT PostId FROM Users WHERE PostId IS NOT NULL);
use base_soft_gcc
SELECT u.UserId AS Id, u.last_name AS LastName, u.first_name AS FirstName, 
       u.Email, u.Password, u.postId AS PostId, u.role_id AS RoleId, 
       u.departmentid AS DepartmentId, u.creation_date AS CreationDate, 
       u.deletion_date AS DeletionDate, u.deleted_by AS DeletedBy, 
       u.created_by AS CreatedBy,
       r.Title AS RoleTitle,
       p.title AS PosteTitle,
       d.Department_name AS DepartmentName
FROM users u
LEFT JOIN Roles r ON u.role_id = r.Role_id
LEFT JOIN Postes p ON u.postId = p.Poste_id
LEFT JOIN Department d ON u.departmentid = d.Department_id
WHERE u.UserId = 1;

 SELECT u.UserId , 
        u.first_name , 
        u.last_name , 
        u.email , 
        u.password , 
        u.postId , 
        u.role_id , 
        u.departmentid, 
        u.creation_date , 
        u.deletion_date , 
        u.deleted_by , 
        u.created_by,
        r.title ,
        p.title ,
        d.Department_name 
 FROM Users u
 LEFT JOIN Roles r ON u.role_id = r.Role_id
 LEFT JOIN Postes p ON u.postId = p.Poste_id
 LEFT JOIN Department d ON u.departmentid = d.Department_id
 WHERE u.UserId = 1

 ALTER TABLE Evaluations 
ADD isServiceApproved BIT DEFAULT 0,
    isDgApproved BIT DEFAULT 0,
    serviceApprovalDate DATE NULL,
    dgApprovalDate DATE NULL;

	ALTER TABLE Training_suggestions
ADD scoreThreshold INT DEFAULT 2; -- Exemple : une suggestion s�applique si score < 2

ALTER TABLE Performance_evolution
ADD isTrainingAction BIT DEFAULT 0;

ALTER TABLE Evaluations
ADD state int DEFAULT 0;


 use base_GCC

ALTER TABLE Evaluations ADD strengths NVARCHAR(MAX);
ALTER TABLE Evaluations ADD weaknesses NVARCHAR(MAX);

SELECT * FROM VEmployeeDetails WHERE EmployeeId = 5;
