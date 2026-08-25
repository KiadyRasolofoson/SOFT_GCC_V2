using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Entities.wish_evolution;
using SoftGcc.Domain.Interfaces.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SoftGcc.Application.Services.Evaluations
{
    public class EvaluationCompetenceService
    {
        private readonly IEvaluationDataService _dataService;

        public EvaluationCompetenceService(IEvaluationDataService dataService)
        {
            _dataService = dataService;
        }

        /// Calcule et enregistre les résultats par compétence pour une évaluation
        public async Task<bool> CalculateAndSaveCompetenceResultsAsync(int evaluationId)
        {
            try
            {
                Console.WriteLine($"Début du calcul des résultats par compétence pour l'évaluation {evaluationId}");

                // 1. Récupérer l'évaluation avec l'employé associé
                var evaluation = await _dataService.GetEvaluationWithUserAsync(evaluationId);

                if (evaluation == null)
                {
                    throw new Exception($"Évaluation avec ID {evaluationId} non trouvée.");
                }

                int employeeId = evaluation.EmployeeId;
                decimal overallScore = evaluation.OverallScore ?? 0;

                Console.WriteLine($"Score global de l'évaluation: {overallScore}");

                // 2. Récupérer les questions sélectionnées pour cette évaluation et leurs compétences associées
                var selectedQuestionsData = await _dataService.ExecuteReaderAsync(
                    "SELECT * FROM Evaluation_Selected_Questions WHERE EvaluationId = @p0", evaluationId);

                var selectedQuestions = selectedQuestionsData.Select(row => new EvaluationSelectedQuestions
                {
                    SelectedQuestionId = Convert.ToInt32(row["SelectedQuestionId"]),
                    EvaluationId = Convert.ToInt32(row["EvaluationId"]),
                    QuestionId = Convert.ToInt32(row["QuestionId"]),
                    CompetenceLineId = row.ContainsKey("CompetenceLineId") && row["CompetenceLineId"] != DBNull.Value
                        ? Convert.ToInt32(row["CompetenceLineId"]) : 0
                }).ToList();

                if (selectedQuestions == null || !selectedQuestions.Any())
                {
                    Console.WriteLine($"Aucune question sélectionnée trouvée pour l'évaluation {evaluationId}");
                    return false;
                }

                // 3. Extraire les IDs de compétence distincts (ignorer 0 = non renseigné)
                var distinctCompetences = selectedQuestions
                    .Select(sq => sq.CompetenceLineId)
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();

                Console.WriteLine($"Nombre de compétences distinctes: {distinctCompetences.Count}");

                var existingCompetenceRows = await _dataService.ExecuteReaderAsync(
                    "SELECT ResultId, CompetenceLineId FROM Evaluation_Competence_Results WHERE EvaluationId = @p0",
                    evaluationId);
                var existingByCompetence = existingCompetenceRows
                    .GroupBy(r => Convert.ToInt32(r["CompetenceLineId"]))
                    .ToDictionary(g => g.Key, g => Convert.ToInt32(g.First()["ResultId"]));

                // 4. Upsert SQL (pas d'AddRange EF : navigations obligatoires → « Key: employeeId »)
                var now = DateTime.UtcNow;
                foreach (var competenceId in distinctCompetences)
                {
                    Console.WriteLine($"Enregistrement du résultat pour la compétence ID: {competenceId}");

                    if (existingByCompetence.TryGetValue(competenceId, out var resultId))
                    {
                        await _dataService.ExecuteNonQueryAsync(@"
                            UPDATE Evaluation_Competence_Results
                            SET Score = @p0, EmployeeId = @p1, State = 1
                            WHERE ResultId = @p2",
                            overallScore, employeeId, resultId);
                    }
                    else
                    {
                        await _dataService.ExecuteNonQueryAsync(@"
                            INSERT INTO Evaluation_Competence_Results
                                (EvaluationId, EmployeeId, CompetenceLineId, Score, Comments, CreatedAt, State)
                            VALUES (@p0, @p1, @p2, @p3, @p4, @p5, 1)",
                            evaluationId, employeeId, competenceId, overallScore, string.Empty, now);
                    }
                }

                Console.WriteLine("Calcul et sauvegarde des résultats par compétence terminés avec succès");

                // 5. Mise à jour des compétences des employés
                await UpdateEmployeeSkillsAfterEvaluation(evaluationId);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur dans CalculateAndSaveCompetenceResultsAsync: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Campaign 1–5 scores remain performance ratings. They must not be copied onto
        /// Employee_skill as a percentage (overallScore times twenty) nor as a referential rank.
        /// Auto-positioning 1–4 on the job matrix is out of scope for this module.
        /// </summary>
        public Task UpdateEmployeeSkillsAfterEvaluation(int evaluationId)
        {
            _ = evaluationId;
            return Task.CompletedTask;
        }

        public async Task<List<CompetenceResultDto>> GetUserCompetenceResultsAsync(int employeeId)
        {
            try
            {
                // Récupérer les résultats de compétences les plus récents pour chaque compétence de l'employé
                var latestResultsData = await _dataService.ExecuteReaderAsync(@"
                    SELECT ecr.* FROM Evaluation_Competence_Results ecr
                    INNER JOIN (
                        SELECT CompetenceLineId, MAX(CreatedAt) AS MaxCreatedAt
                        FROM Evaluation_Competence_Results
                        WHERE EmployeeId = @p0
                        GROUP BY CompetenceLineId
                    ) latest ON ecr.CompetenceLineId = latest.CompetenceLineId AND ecr.CreatedAt = latest.MaxCreatedAt
                    WHERE ecr.EmployeeId = @p0", employeeId);

                var latestResults = latestResultsData.Select(row => new EvaluationCompetenceResult
                {
                    ResultId = Convert.ToInt32(row["ResultId"]),
                    EvaluationId = Convert.ToInt32(row["EvaluationId"]),
                    EmployeeId = Convert.ToInt32(row["EmployeeId"]),
                    CompetenceLineId = Convert.ToInt32(row["CompetenceLineId"]),
                    Score = Convert.ToDecimal(row["Score"]),
                    CreatedAt = Convert.ToDateTime(row["CreatedAt"])
                }).ToList();

                // Récupérer les informations de compétence correspondantes
                var competenceIds = latestResults.Select(lr => lr.CompetenceLineId).ToList();
                var competenceLinesData = await _dataService.ExecuteReaderAsync(@"
                    SELECT cl.CompetenceLineId, cl.Description, cl.SkillPositionId, 
                           sp.Skill_id, s.Skill_name AS SkillName
                    FROM Competence_Lines cl
                    LEFT JOIN Skill_position sp ON cl.SkillPositionId = sp.Skill_position_id
                    LEFT JOIN Skill s ON sp.Skill_id = s.Skill_id
                    WHERE cl.CompetenceLineId IN (" + string.Join(",", competenceIds.Select((_, i) => $"@p{i + 1}")) + ")",
                    competenceIds.Cast<object>().ToArray());

                // Récupérer les informations d'évaluation correspondantes
                var evaluationIds = latestResults.Select(lr => lr.EvaluationId).Distinct().ToList();
                var evaluationsData = await _dataService.ExecuteReaderAsync(@"
                    SELECT EvaluationId, EndDate FROM Evaluations 
                    WHERE EvaluationId IN (" + string.Join(",", evaluationIds.Select((_, i) => $"@p{i}")) + ")",
                    evaluationIds.Cast<object>().ToArray());

                // Construire les DTOs
                var resultDtos = latestResults.Select(result =>
                {
                    var compRow = competenceLinesData.FirstOrDefault(r => Convert.ToInt32(r["CompetenceLineId"]) == result.CompetenceLineId);
                    var evalRow = evaluationsData.FirstOrDefault(r => Convert.ToInt32(r["EvaluationId"]) == result.EvaluationId);
                    var skillName = compRow?.GetValueOrDefault("SkillName")?.ToString() ?? "Inconnu";

                    return new CompetenceResultDto
                    {
                        CompetenceId = result.CompetenceLineId,
                        CompetenceName = skillName,
                        Description = compRow?.GetValueOrDefault("Description")?.ToString() ?? "",
                        Score = result.Score,
                        EvaluationId = result.EvaluationId,
                        EvaluationDate = evalRow != null && evalRow["EndDate"] != DBNull.Value
                            ? Convert.ToDateTime(evalRow["EndDate"]) : DateTime.MinValue
                    };
                }).ToList();

                return resultDtos;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur dans GetUserCompetenceResultsAsync: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Récupère les résultats des compétences pour une évaluation spécifique
        /// </summary>
        public async Task<List<CompetenceResultDto>> GetEvaluationCompetenceResultsAsync(int evaluationId)
        {
            try
            {
                var resultsData = await _dataService.ExecuteReaderAsync(
                    "SELECT * FROM Evaluation_Competence_Results WHERE EvaluationId = @p0", evaluationId);

                var results = resultsData.Select(row => new EvaluationCompetenceResult
                {
                    ResultId = Convert.ToInt32(row["ResultId"]),
                    EvaluationId = Convert.ToInt32(row["EvaluationId"]),
                    EmployeeId = Convert.ToInt32(row["EmployeeId"]),
                    CompetenceLineId = Convert.ToInt32(row["CompetenceLineId"]),
                    Score = Convert.ToDecimal(row["Score"])
                }).ToList();

                // Si aucun résultat n'existe, calculer les résultats automatiquement
                if (results == null || !results.Any())
                {
                    Console.WriteLine($"Aucun résultat trouvé pour l'évaluation {evaluationId}, calcul automatique...");
                    await CalculateAndSaveCompetenceResultsAsync(evaluationId);
                    
                    // Récupérer les résultats fraîchement calculés
                    resultsData = await _dataService.ExecuteReaderAsync(
                        "SELECT * FROM Evaluation_Competence_Results WHERE EvaluationId = @p0", evaluationId);
                    results = resultsData.Select(row => new EvaluationCompetenceResult
                    {
                        ResultId = Convert.ToInt32(row["ResultId"]),
                        EvaluationId = Convert.ToInt32(row["EvaluationId"]),
                        EmployeeId = Convert.ToInt32(row["EmployeeId"]),
                        CompetenceLineId = Convert.ToInt32(row["CompetenceLineId"]),
                        Score = Convert.ToDecimal(row["Score"])
                    }).ToList();
                }

                if (results == null || !results.Any())
                {
                    return new List<CompetenceResultDto>();
                }

                var competenceIds = results.Select(r => r.CompetenceLineId).ToList();
                var competenceLinesData = await _dataService.ExecuteReaderAsync(@"
                    SELECT cl.CompetenceLineId, cl.Description, cl.SkillPositionId,
                           sp.Skill_id, s.Skill_name AS SkillName
                    FROM Competence_Lines cl
                    LEFT JOIN Skill_position sp ON cl.SkillPositionId = sp.Skill_position_id
                    LEFT JOIN Skill s ON sp.Skill_id = s.Skill_id
                    WHERE cl.CompetenceLineId IN (" + string.Join(",", competenceIds.Select((_, i) => $"@p{i}")) + ")",
                    competenceIds.Cast<object>().ToArray());

                var evaluationData = await _dataService.ExecuteReaderAsync(
                    "SELECT EndDate FROM Evaluations WHERE EvaluationId = @p0", evaluationId);
                var evaluationEndDate = evaluationData.Count > 0 && evaluationData[0]["EndDate"] != DBNull.Value
                    ? Convert.ToDateTime(evaluationData[0]["EndDate"]) : DateTime.MinValue;

                var resultDtos = results.Select(r =>
                {
                    var compRow = competenceLinesData.FirstOrDefault(c => Convert.ToInt32(c["CompetenceLineId"]) == r.CompetenceLineId);
                    var skillName = compRow?.GetValueOrDefault("SkillName")?.ToString() ?? "Inconnu";
                    return new CompetenceResultDto
                    {
                        CompetenceId = r.CompetenceLineId,
                        CompetenceName = skillName,
                        Description = skillName,
                        Score = r.Score,
                        EvaluationId = evaluationId,
                        EvaluationDate = evaluationEndDate
                    };
                }).ToList();

                return resultDtos;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur dans GetEvaluationCompetenceResultsAsync: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Récupère l'historique des résultats de compétence pour un utilisateur et une compétence spécifique
        /// </summary>
        public async Task<List<CompetenceResultHistoryDto>> GetCompetenceResultHistoryAsync(int employeeId, int competenceId)
        {
            try
            {
                var resultsData = await _dataService.ExecuteReaderAsync(@"
                    SELECT * FROM Evaluation_Competence_Results 
                    WHERE EmployeeId = @p0 AND CompetenceLineId = @p1
                    ORDER BY CreatedAt DESC", employeeId, competenceId);

                var results = resultsData.Select(row => new EvaluationCompetenceResult
                {
                    ResultId = Convert.ToInt32(row["ResultId"]),
                    EvaluationId = Convert.ToInt32(row["EvaluationId"]),
                    EmployeeId = Convert.ToInt32(row["EmployeeId"]),
                    CompetenceLineId = Convert.ToInt32(row["CompetenceLineId"]),
                    Score = Convert.ToDecimal(row["Score"]),
                    CreatedAt = row["CreatedAt"] != DBNull.Value ? Convert.ToDateTime(row["CreatedAt"]) : DateTime.MinValue
                }).ToList();

                if (results == null || !results.Any())
                {
                    return new List<CompetenceResultHistoryDto>();
                }

                var evaluationIds = results.Select(r => r.EvaluationId).ToList();
                var evaluationsData = await _dataService.ExecuteReaderAsync(@"
                    SELECT e.EvaluationId, e.EndDate, et.Designation AS EvaluationTypeName
                    FROM Evaluations e
                    LEFT JOIN EvaluationTypes et ON e.EvaluationTypeId = et.EvaluationTypeId
                    WHERE e.EvaluationId IN (" + string.Join(",", evaluationIds.Select((_, i) => $"@p{i}")) + ")",
                    evaluationIds.Cast<object>().ToArray());

                var compLinesData = await _dataService.ExecuteReaderAsync(@"
                    SELECT cl.CompetenceLineId, s.Skill_name AS SkillName
                    FROM Competence_Lines cl
                    LEFT JOIN Skill_position sp ON cl.SkillPositionId = sp.Skill_position_id
                    LEFT JOIN Skill s ON sp.Skill_id = s.Skill_id
                    WHERE cl.CompetenceLineId = @p0", competenceId);

                var skillName = compLinesData.Count > 0
                    ? compLinesData[0].GetValueOrDefault("SkillName")?.ToString() ?? "Inconnu"
                    : "Inconnu";

                var historyDtos = results.Select(r =>
                {
                    var evalRow = evaluationsData.FirstOrDefault(e => Convert.ToInt32(e["EvaluationId"]) == r.EvaluationId);
                    return new CompetenceResultHistoryDto
                    {
                        ResultId = r.ResultId,
                        CompetenceId = competenceId,
                        CompetenceName = skillName,
                        Score = r.Score,
                        EvaluationId = r.EvaluationId,
                        EvaluationDate = evalRow != null && evalRow["EndDate"] != DBNull.Value
                            ? Convert.ToDateTime(evalRow["EndDate"]) : DateTime.MinValue,
                        EvaluationType = evalRow?.GetValueOrDefault("EvaluationTypeName")?.ToString() ?? "Inconnu"
                    };
                }).ToList();

                return historyDtos;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur dans GetCompetenceResultHistoryAsync: {ex.Message}");
                throw;
            }
        }
    }

    // DTOs pour les résultats de compétence
    public class CompetenceResultDto
    {
        public int CompetenceId { get; set; }
        public string CompetenceName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public int EvaluationId { get; set; }
        public DateTime EvaluationDate { get; set; }
    }

    public class CompetenceResultHistoryDto
    {
        public int ResultId { get; set; }
        public int CompetenceId { get; set; }
        public string CompetenceName { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public int EvaluationId { get; set; }
        public DateTime EvaluationDate { get; set; }
        public string EvaluationType { get; set; } = string.Empty;
    }
}