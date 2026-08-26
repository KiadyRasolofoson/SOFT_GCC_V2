
-- PRÉREQUIS :
-- - Script 01_TABLES_EVALUATIONS.sql doit avoir été exécuté
-- - La table Employee doit exister
-- - La vue v_employee_position doit exister
--
--  8 vues
-- 1. VEmployeeDetails - Détails des employés avec évaluations terminées
-- 2. VEmployeesWithoutEvaluation - Employés sans évaluation active
-- 3. VEmployeesFinishedEvaluation - Employés avec évaluations terminées (détaillé)
-- 4. VEmployeesOngoingEvaluation - Employés avec évaluations en cours
-- 5. VEmployeeEvaluationProgress - Progression des évaluations
-- 6. VTemporaryActiveAccounts - Comptes temporaires actifs
-- 7. VFailedLoginAttempts - Tentatives de connexion échouées
-- 8. VEvaluationHistory - Historique complet des évaluations
-- =============================================================================================

PRINT '=============================================================================================';
PRINT 'DÉBUT - CRÉATION DES VUES DU MODULE D''ÉVALUATION';
PRINT '=============================================================================================';
PRINT '';

-- Vérifier que la table Employee existe
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Employee')
BEGIN
    PRINT '❌ ERREUR: La table Employee n''existe pas !';
    PRINT 'Les vues ne peuvent pas être créées.';
    PRINT 'Veuillez créer la table Employee avant d''exécuter ce script.';
    RETURN;
END

-- Vérifier que la vue v_employee_position existe
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'v_employee_position')
BEGIN
    PRINT '⚠ AVERTISSEMENT: La vue v_employee_position n''existe pas !';
    PRINT 'Certaines vues pourraient ne pas fonctionner correctement.';
END

PRINT 'Suppression des vues existantes...';

-- Suppression des vues existantes pour les recréer
DROP VIEW IF EXISTS VEmployeeDetails;
DROP VIEW IF EXISTS VEmployeesWithoutEvaluation;
DROP VIEW IF EXISTS VEmployeesFinishedEvaluation;
DROP VIEW IF EXISTS VEmployeesOngoingEvaluation;
DROP VIEW IF EXISTS VEmployeeEvaluationProgress;
DROP VIEW IF EXISTS VTemporaryActiveAccounts;
DROP VIEW IF EXISTS VFailedLoginAttempts;
DROP VIEW IF EXISTS VEvaluationHistory;

PRINT '✓ Vues existantes supprimées';
PRINT '';

-- ====================================================
-- 1. VEmployeeDetails
-- ====================================================

PRINT '1. Création de VEmployeeDetails...';

EXEC('
CREATE VIEW VEmployeeDetails AS
SELECT 
    e.Employee_id AS EmployeeId,
    e.FirstName AS FirstName,
    e.Name AS LastName,
    ISNULL(ep.Position_name, ''Non défini'') AS Position,
    ISNULL(ep.Position_id, 0) AS PositionId,
    NULL AS Role,
    d.Department_name AS Department,
    ev.Evaluations_id AS EvaluationId,
    ev.start_date AS EvaluationDate,
    ev.overallScore AS OverallScore,
    ev.comments AS EvaluationComments,
    ev.isServiceApproved AS IsServiceApproved,
    ev.isDgApproved AS IsDgApproved,
    et.designation AS EvaluationType,
    ev.strengths AS strengths,
    ev.weaknesses AS weaknesses,
    ev.state AS state
FROM Employee e
LEFT JOIN Department d ON e.Department_id = d.Department_id
LEFT JOIN v_employee_position ep ON e.Employee_id = ep.Employee_id
LEFT JOIN Evaluations ev ON e.Employee_id = ev.employeeId
LEFT JOIN Evaluation_type et ON ev.evaluationType_id = et.Evaluation_type_id 
WHERE ev.state = 20
  AND ev.Evaluations_id = (
      SELECT MAX(ev2.Evaluations_id)
      FROM Evaluations ev2
      WHERE ev2.employeeId = e.Employee_id AND ev2.state = 20
  )
');

PRINT '   ✓ Vue VEmployeeDetails créée';

-- ====================================================
-- 2. VEmployeesWithoutEvaluation
-- ====================================================

PRINT '2. Création de VEmployeesWithoutEvaluation...';

EXEC('
CREATE VIEW VEmployeesWithoutEvaluation AS
SELECT 
    e.Employee_id AS EmployeeId,
    ISNULL(ep.Position_id, 0) AS positionId,
    e.FirstName AS FirstName,
    e.Name AS LastName,
    ISNULL(ep.Position_name, ''Non défini'') AS Position,
    e.Department_id AS DepartmentId,
    d.Department_name AS Department,
    ev.start_date AS startDate,
    ev.end_date AS endDate,
    ev.state AS state
FROM Employee e
LEFT JOIN Department d ON e.Department_id = d.Department_id
LEFT JOIN v_employee_position ep ON e.Employee_id = ep.Employee_id
LEFT JOIN Evaluations ev ON e.Employee_id = ev.employeeId
WHERE NOT EXISTS (
    SELECT 1 
    FROM Evaluations eval
    WHERE eval.employeeId = e.Employee_id 
    AND eval.state IN (10, 15, 20)
)
AND (
    NOT EXISTS (SELECT 1 FROM Evaluations WHERE employeeId = e.Employee_id)
    OR EXISTS (
        SELECT 1 
        FROM Evaluations eval
        WHERE eval.employeeId = e.Employee_id 
        AND eval.state = 30
        AND eval.Evaluations_id = (
            SELECT MAX(Evaluations_id) 
            FROM Evaluations 
            WHERE employeeId = e.Employee_id
        )
    )
)
');

PRINT '   ✓ Vue VEmployeesWithoutEvaluation créée';

-- ====================================================
-- 3. VEmployeesFinishedEvaluation
-- ====================================================

PRINT '3. Création de VEmployeesFinishedEvaluation...';

EXEC('
CREATE VIEW VEmployeesFinishedEvaluation AS
SELECT 
    e.Employee_id AS EmployeeId,
    ISNULL(ep.Position_id, 0) AS positionId,
    e.FirstName AS FirstName,
    e.Name AS LastName,
    ISNULL(ep.Position_name, ''Non défini'') AS Position,
    ev.start_date AS startDate,
    ev.end_date AS endDate,
    ev.Evaluations_id AS evaluationId,
    d.Department_name AS Department,
    d.Department_id AS DepartmentId,
    ev.state AS state,
    ev.strengths AS strengths,
    ev.weaknesses AS weaknesses,
    ev.comments AS comments,
    ev.overallScore AS overallScore,
    ei.scheduled_date AS InterviewDate,
    ei.status AS InterviewStatus,
    ei.director_approval AS directorApproval,
    ei.manager_approval AS managerApproval,
    ei.director_comments AS directorComments,
    ei.manager_comments AS managerComments
FROM Employee e
LEFT JOIN Department d ON e.Department_id = d.Department_id
LEFT JOIN v_employee_position ep ON e.Employee_id = ep.Employee_id
LEFT JOIN Evaluations ev ON e.Employee_id = ev.employeeId
LEFT JOIN Evaluation_interviews ei ON ev.Evaluations_id = ei.evaluationId
WHERE ev.state = 20
');

PRINT '   ✓ Vue VEmployeesFinishedEvaluation créée';

-- ====================================================
-- 4. VEmployeesOngoingEvaluation
-- ====================================================

PRINT '4. Création de VEmployeesOngoingEvaluation...';

EXEC('
CREATE VIEW VEmployeesOngoingEvaluation AS
SELECT 
    e.Employee_id AS EmployeeId,
    e.FirstName AS FirstName,
    e.Name AS LastName,
    ISNULL(ep.Position_name, ''Non défini'') AS Position,
    ev.start_date AS StartDate,
    ev.end_date AS EndDate,
    ev.Evaluations_id AS EvaluationId,
    et.designation AS EvaluationType,
    et.Evaluation_type_id AS EvaluationTypeId,
    ev.state AS EvaluationState
FROM Employee e
LEFT JOIN v_employee_position ep ON e.Employee_id = ep.Employee_id
LEFT JOIN Evaluations ev ON e.Employee_id = ev.employeeId
LEFT JOIN Evaluation_type et ON ev.evaluationType_id = et.Evaluation_type_id
WHERE ev.state = 15
');

PRINT '   ✓ Vue VEmployeesOngoingEvaluation créée';

-- ====================================================
-- 5. VEmployeeEvaluationProgress
-- ====================================================

PRINT '5. Création de VEmployeeEvaluationProgress...';

EXEC('
CREATE VIEW VEmployeeEvaluationProgress AS
SELECT 
    ep.evaluationId AS EvaluationId,
    ep.employeeId AS EmployeeId,
    e.FirstName AS FirstName,
    e.Name AS LastName,
    ep.totalQuestions AS TotalQuestions,
    ep.answeredQuestions AS AnsweredQuestions,
    ep.progressPercentage AS Progress,
    ep.lastUpdate AS LastUpdated
FROM Evaluation_progress ep
JOIN Employee e ON ep.employeeId = e.Employee_id
');

PRINT '   ✓ Vue VEmployeeEvaluationProgress créée';

-- ====================================================
-- 6. VTemporaryActiveAccounts
-- ====================================================

PRINT '6. Création de VTemporaryActiveAccounts...';

EXEC('
CREATE VIEW VTemporaryActiveAccounts AS
SELECT 
    ta.TempAccountId,
    e.Employee_id AS EmployeeId,
    ta.TempLogin,
    ta.ExpirationDate,
    ev.Evaluations_id,
    ev.start_date AS EvaluationStart,
    ev.end_date AS EvaluationEnd
FROM TemporaryAccounts ta
JOIN Employee e ON ta.EmployeeId = e.Employee_id
JOIN Evaluations ev ON ta.Evaluations_id = ev.Evaluations_id
WHERE ta.ExpirationDate > GETUTCDATE() 
  AND ta.IsUsed = 0
');

PRINT '   ✓ Vue VTemporaryActiveAccounts créée';

-- ====================================================
-- 7. VFailedLoginAttempts
-- ====================================================

PRINT '7. Création de VFailedLoginAttempts...';

EXEC('
CREATE VIEW VFailedLoginAttempts AS
SELECT 
    la.AttemptId,
    la.TempLogin,
    la.AttemptDate,
    la.IPAddress,
    ta.Evaluations_id,
    ta.EmployeeId
FROM LoginAttempts la
LEFT JOIN TemporaryAccounts ta ON la.TempLogin = ta.TempLogin
WHERE la.IsSuccess = 0
');

PRINT '   ✓ Vue VFailedLoginAttempts créée';

-- ====================================================
-- 8. VEvaluationHistory
-- ====================================================

PRINT '8. Création de VEvaluationHistory...';

EXEC('
CREATE VIEW VEvaluationHistory AS
SELECT 
    ev.Evaluations_id AS EvaluationId,
    ev.employeeId AS EmployeeId,
    e.FirstName AS FirstName,
    e.Name AS LastName,
    et.designation AS EvaluationType,
    ev.start_date AS StartDate,
    ev.end_date AS EndDate,
    ev.overallScore AS OverallScore,
    ev.comments AS EvaluationComments,
    ev.strengths AS Strengths,
    ev.weaknesses AS Weaknesses,
    ev.isServiceApproved AS IsServiceApproved,
    ev.isDgApproved AS IsDgApproved,
    ei.scheduled_date AS InterviewDate,
    ei.status AS InterviewStatus,
    ISNULL(ep.Position_name, ''Non défini'') AS Position,
    d.Department_name AS Department,
    ev.state AS Status,
    (SELECT STRING_AGG(training.training, '', '')
     FROM (
         SELECT DISTINCT ts.training
         FROM Evaluation_questionnaire eq
         JOIN Training_suggestions ts 
         ON eq.questionId = ts.questionId 
         AND eq.score < ts.scoreThreshold
         WHERE eq.evaluationId = ev.Evaluations_id
     ) AS training
    ) AS Recommendations,
    (SELECT STRING_AGG(participants.full_name, '', '')
     FROM (
         SELECT DISTINCT ip.ParticipantId, e_part.FirstName + '' '' + e_part.Name AS full_name
         FROM InterviewParticipants ip
         JOIN Employee e_part ON ip.EmployeeId = e_part.Employee_id
         WHERE ip.InterviewId = ei.InterviewId
     ) AS participants
    ) AS ParticipantNames,
    (SELECT STRING_AGG(CAST(participant_ids.EmployeeId AS NVARCHAR), '', '')
     FROM (
         SELECT DISTINCT ip.ParticipantId, e_part.Employee_id AS EmployeeId
         FROM InterviewParticipants ip
         JOIN Employee e_part ON ip.EmployeeId = e_part.Employee_id
         WHERE ip.InterviewId = ei.InterviewId
     ) AS participant_ids
    ) AS ParticipantIds,
    (SELECT STRING_AGG(CONCAT(''ID:'', CAST(eq.Question_id AS NVARCHAR), '', Question:'', eq.question, '', Score:'', CAST(eqn.score AS NVARCHAR)), ''; '')
     FROM Evaluation_questionnaire eqn
     JOIN Evaluation_questions eq ON eqn.questionId = eq.Question_id
     WHERE eqn.evaluationId = ev.Evaluations_id
    ) AS QuestionDetails
FROM Evaluations ev
JOIN Employee e ON ev.employeeId = e.Employee_id
LEFT JOIN Department d ON e.Department_id = d.Department_id
LEFT JOIN v_employee_position ep ON e.Employee_id = ep.Employee_id
LEFT JOIN Evaluation_type et ON ev.evaluationType_id = et.Evaluation_type_id
LEFT JOIN Evaluation_interviews ei ON ev.Evaluations_id = ei.evaluationId
WHERE ev.state IN (20, 30)
GROUP BY 
    ev.Evaluations_id, ev.employeeId, e.FirstName, e.Name, et.designation, 
    ev.start_date, ev.end_date, ev.overallScore, ev.comments, 
    ev.strengths, ev.weaknesses, ev.isServiceApproved, ev.isDgApproved, 
    ei.scheduled_date, ei.status, ei.InterviewId,
    ep.Position_name, d.Department_name, ev.state
');

PRINT '   ✓ Vue VEvaluationHistory créée';

PRINT '';
PRINT '=============================================================================================';
PRINT 'CRÉATION DES VUES TERMINÉE AVEC SUCCÈS !';
PRINT '=============================================================================================';
PRINT '';
PRINT 'RÉSUMÉ : 8 vues créées';
PRINT '  1. VEmployeeDetails';
PRINT '  2. VEmployeesWithoutEvaluation';
PRINT '  3. VEmployeesFinishedEvaluation';
PRINT '  4. VEmployeesOngoingEvaluation';
PRINT '  5. VEmployeeEvaluationProgress';
PRINT '  6. VTemporaryActiveAccounts';
PRINT '  7. VFailedLoginAttempts';
PRINT '  8. VEvaluationHistory';
PRINT '';
PRINT 'PROCHAINE ÉTAPE : Exécuter 03_DONNEES_ESSENTIELLES.sql';
PRINT '';
PRINT '=============================================================================================';
