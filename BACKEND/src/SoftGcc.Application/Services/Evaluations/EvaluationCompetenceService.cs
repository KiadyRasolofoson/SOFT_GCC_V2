using SoftGcc.Application.SkillReferential;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Exceptions;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Domain.SkillReferential;

namespace SoftGcc.Application.Services.Evaluations
{
    public class EvaluationCompetenceService
    {
        private readonly IEvaluationDataService _dataService;

        public EvaluationCompetenceService(IEvaluationDataService dataService)
        {
            _dataService = dataService;
        }

        /// <summary>
        /// Enregistre le rang de maîtrise 1–4 de chaque compétence notée.
        /// Ne recopie jamais <c>Evaluations.OverallScore</c> (note de campagne /5).
        /// </summary>
        public Task<bool> CalculateAndSaveCompetenceResultsAsync(int evaluationId) =>
            CalculateAndSaveCompetenceResultsAsync(evaluationId, null);

        public async Task<bool> CalculateAndSaveCompetenceResultsAsync(
            int evaluationId,
            IReadOnlyDictionary<int, int>? competenceRatings)
        {
            try
            {
                Console.WriteLine($"Début du calcul des résultats par compétence pour l'évaluation {evaluationId}");

                var evaluation = await _dataService.GetEvaluationWithUserAsync(evaluationId);
                if (evaluation == null)
                {
                    throw new Exception($"Évaluation avec ID {evaluationId} non trouvée.");
                }

                int employeeId = evaluation.EmployeeId;
                var ratings = NormalizeRatings(competenceRatings);
                foreach (var pair in ratings)
                {
                    CompetencyScale.EnsureValid(pair.Value, $"CompetenceRatings[{pair.Key}]");
                }

                var selectedQuestionsData = await _dataService.ExecuteReaderAsync(
                    "SELECT * FROM Evaluation_Selected_Questions WHERE EvaluationId = @p0", evaluationId);

                if (selectedQuestionsData == null || selectedQuestionsData.Count == 0)
                {
                    Console.WriteLine($"Aucune question sélectionnée trouvée pour l'évaluation {evaluationId}");
                    return false;
                }

                var distinctCompetences = selectedQuestionsData
                    .Select(row => ReadInt(row, "CompetenceLineId") ?? 0)
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();

                Console.WriteLine($"Nombre de compétences distinctes: {distinctCompetences.Count}");

                var existingCompetenceRows = await _dataService.ExecuteReaderAsync(
                    "SELECT ResultId, CompetenceLineId, Score FROM Evaluation_Competence_Results WHERE EvaluationId = @p0",
                    evaluationId);
                var existingByCompetence = existingCompetenceRows
                    .GroupBy(r => Convert.ToInt32(r["CompetenceLineId"]))
                    .ToDictionary(
                        g => g.Key,
                        g => (
                            ResultId: Convert.ToInt32(g.First()["ResultId"]),
                            Score: Convert.ToDecimal(g.First()["Score"])));

                var skillLinks = await LoadSkillLinksAsync(distinctCompetences);

                var now = DateTime.UtcNow;
                foreach (var competenceId in distinctCompetences)
                {
                    int rank;
                    if (ratings.TryGetValue(competenceId, out var incomingRank))
                    {
                        rank = incomingRank;
                    }
                    else if (existingByCompetence.TryGetValue(competenceId, out var existing)
                             && TryGetRank(existing.Score, out rank))
                    {
                        // Rejouer un rang 1–4 déjà enregistré (validation sans nouveau payload).
                    }
                    else
                    {
                        continue;
                    }

                    CompetencyScale.EnsureValid(rank, "Score");
                    var skillVersionParam = ToDbValue(
                        skillLinks.TryGetValue(competenceId, out var link) ? link.SkillVersionId : null);

                    Console.WriteLine($"Enregistrement du rang {rank} pour la compétence ID: {competenceId}");

                    if (existingByCompetence.TryGetValue(competenceId, out var existingRow))
                    {
                        await _dataService.ExecuteNonQueryAsync(@"
                            UPDATE Evaluation_Competence_Results
                            SET Score = @p0, EmployeeId = @p1, State = 1, Skill_version_id = @p2
                            WHERE ResultId = @p3",
                            rank, employeeId, skillVersionParam, existingRow.ResultId);
                    }
                    else
                    {
                        await _dataService.ExecuteNonQueryAsync(@"
                            INSERT INTO Evaluation_Competence_Results
                                (EvaluationId, EmployeeId, CompetenceLineId, Score, Comments, CreatedAt, State, Skill_version_id)
                            VALUES (@p0, @p1, @p2, @p3, @p4, @p5, 1, @p6)",
                            evaluationId, employeeId, competenceId, rank, string.Empty, now, skillVersionParam);
                    }
                }

                Console.WriteLine("Calcul et sauvegarde des résultats par compétence terminés avec succès");

                await UpdateEmployeeSkillsAfterEvaluation(evaluationId);

                return true;
            }
            catch (ValidationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur dans CalculateAndSaveCompetenceResultsAsync: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Écrit <c>Employee_skill.Acquired_level</c> (rang 1–4) pour les skills notés.
        /// Ne touche pas <c>Level</c> (pourcentage legacy) et ignore les compétences hors évaluation.
        /// </summary>
        public async Task UpdateEmployeeSkillsAfterEvaluation(int evaluationId)
        {
            var evaluation = await _dataService.GetEvaluationWithUserAsync(evaluationId);
            if (evaluation == null)
            {
                Console.WriteLine($"Évaluation {evaluationId} introuvable — Employee_skill non mis à jour.");
                return;
            }

            int employeeId = evaluation.EmployeeId;
            var resultsData = await _dataService.ExecuteReaderAsync(
                "SELECT CompetenceLineId, Score, Skill_version_id FROM Evaluation_Competence_Results WHERE EvaluationId = @p0",
                evaluationId);

            var scored = new List<(int CompetenceLineId, int Rank, int? SkillVersionId)>();
            foreach (var row in resultsData)
            {
                var competenceLineId = Convert.ToInt32(row["CompetenceLineId"]);
                if (!TryGetRank(Convert.ToDecimal(row["Score"]), out var rank))
                {
                    continue;
                }

                scored.Add((competenceLineId, rank, ReadInt(row, "Skill_version_id")));
            }

            if (scored.Count == 0)
            {
                return;
            }

            var skillLinks = await LoadSkillLinksAsync(scored.Select(s => s.CompetenceLineId).Distinct().ToList());
            var existingSkillRows = await _dataService.ExecuteReaderAsync(
                "SELECT Employee_skill_id, Skill_id FROM Employee_skill WHERE Employee_id = @p0",
                employeeId);
            var existingBySkill = existingSkillRows
                .GroupBy(r => Convert.ToInt32(r["Skill_id"]))
                .ToDictionary(g => g.Key, g => Convert.ToInt32(g.First()["Employee_skill_id"]));

            var now = DateTime.UtcNow;
            var updatedSkillIds = new HashSet<int>();
            foreach (var item in scored)
            {
                if (!skillLinks.TryGetValue(item.CompetenceLineId, out var link) || link.SkillId is null or <= 0)
                {
                    Console.WriteLine(
                        $"Compétence {item.CompetenceLineId} sans SkillPositionId/Skill_id — Employee_skill ignoré.");
                    continue;
                }

                if (link.DomainSkillId is null or <= 0)
                {
                    Console.WriteLine(
                        $"Compétence {item.CompetenceLineId} sans Domain_skill_id — Employee_skill ignoré.");
                    continue;
                }

                if (!updatedSkillIds.Add(link.SkillId.Value))
                {
                    continue;
                }

                var versionParam = ToDbValue(item.SkillVersionId ?? link.SkillVersionId);
                if (existingBySkill.TryGetValue(link.SkillId.Value, out var employeeSkillId))
                {
                    await _dataService.ExecuteNonQueryAsync(@"
                        UPDATE Employee_skill
                        SET Acquired_level = @p0, Source = @p1, Updated_date = @p2, Skill_version_id = @p3
                        WHERE Employee_skill_id = @p4",
                        item.Rank, EmployeeSkillSource.Evaluation, now, versionParam, employeeSkillId);
                }
                else
                {
                    await _dataService.ExecuteNonQueryAsync(@"
                        INSERT INTO Employee_skill
                            (Domain_skill_id, Skill_id, Level, Acquired_level, Skill_version_id, Source, State, Creation_date, Updated_date, Employee_id)
                        VALUES (@p0, @p1, 0, @p2, @p3, @p4, 1, @p5, @p5, @p6)",
                        link.DomainSkillId.Value,
                        link.SkillId.Value,
                        item.Rank,
                        versionParam,
                        EmployeeSkillSource.Evaluation,
                        now,
                        employeeId);
                }
            }
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

                    return MapCompetenceResult(
                        result.CompetenceLineId,
                        skillName,
                        compRow?.GetValueOrDefault("Description")?.ToString() ?? "",
                        result.Score,
                        result.EvaluationId,
                        evalRow != null && evalRow["EndDate"] != DBNull.Value
                            ? Convert.ToDateTime(evalRow["EndDate"]) : DateTime.MinValue);
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
                    return MapCompetenceResult(
                        r.CompetenceLineId,
                        skillName,
                        skillName,
                        r.Score,
                        evaluationId,
                        evaluationEndDate);
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

        public async Task<List<CompetenceMasterySummaryDto>> GetMasterySummariesAsync(IReadOnlyList<int> evaluationIds)
        {
            var ids = evaluationIds.Where(id => id > 0).Distinct().ToList();
            if (ids.Count == 0)
            {
                return [];
            }

            var placeholders = string.Join(",", ids.Select((_, i) => $"@p{i}"));
            var rows = await _dataService.ExecuteReaderAsync(
                $"SELECT EvaluationId, Score FROM Evaluation_Competence_Results WHERE EvaluationId IN ({placeholders})",
                ids.Cast<object>().ToArray());

            var byEval = rows
                .GroupBy(row => Convert.ToInt32(row["EvaluationId"]))
                .ToDictionary(
                    group => group.Key,
                    group =>
                    {
                        var ranks = group
                            .Select(row => CompetencyScale.RankFromStoredScore(Convert.ToDecimal(row["Score"])))
                            .Where(rank => rank.HasValue)
                            .Select(rank => rank!.Value)
                            .ToList();
                        return (RatedCount: ranks.Count, DominantRank: DominantRank(ranks));
                    });

            return ids.Select(id =>
            {
                byEval.TryGetValue(id, out var summary);
                return new CompetenceMasterySummaryDto
                {
                    EvaluationId = id,
                    RatedCount = summary.RatedCount,
                    DominantRank = summary.DominantRank
                };
            }).ToList();
        }

        internal static CompetenceResultDto MapCompetenceResult(
            int competenceId,
            string competenceName,
            string description,
            decimal score,
            int evaluationId,
            DateTime evaluationDate)
        {
            var acquired = CompetencyScale.RankFromStoredScore(score);
            return new CompetenceResultDto
            {
                CompetenceId = competenceId,
                CompetenceName = competenceName,
                Description = description,
                Score = score,
                AcquiredLevel = acquired,
                AcquiredLevelLabel = acquired is { } rank ? CompetencyScale.Label(rank) : null,
                EvaluationId = evaluationId,
                EvaluationDate = evaluationDate
            };
        }

        private static int? DominantRank(IReadOnlyList<int> ranks)
        {
            if (ranks.Count == 0)
            {
                return null;
            }

            return ranks
                .GroupBy(rank => rank)
                .OrderByDescending(group => group.Count())
                .ThenByDescending(group => group.Key)
                .Select(group => (int?)group.Key)
                .First();
        }

        private static Dictionary<int, int> NormalizeRatings(IReadOnlyDictionary<int, int>? ratings)
        {
            if (ratings == null || ratings.Count == 0)
            {
                return new Dictionary<int, int>();
            }

            return ratings
                .Where(pair => pair.Key > 0)
                .GroupBy(pair => pair.Key)
                .ToDictionary(group => group.Key, group => group.First().Value);
        }

        private static bool TryGetRank(decimal score, out int rank)
        {
            rank = (int)decimal.Truncate(score);
            return score == rank && CompetencyScale.IsValid(rank);
        }

        private static int? ReadInt(IReadOnlyDictionary<string, object> row, string key)
        {
            if (!row.TryGetValue(key, out var value) || value is null || value == DBNull.Value)
            {
                return null;
            }

            return Convert.ToInt32(value);
        }

        private static object ToDbValue(int? value) => value.HasValue ? value.Value : DBNull.Value;

        private async Task<Dictionary<int, CompetenceSkillLink>> LoadSkillLinksAsync(IReadOnlyList<int> competenceLineIds)
        {
            var result = new Dictionary<int, CompetenceSkillLink>();
            if (competenceLineIds.Count == 0)
            {
                return result;
            }

            var placeholders = string.Join(",", competenceLineIds.Select((_, i) => $"@p{i}"));
            var rows = await _dataService.ExecuteReaderAsync($@"
                SELECT cl.CompetenceLineId, cl.SkillPositionId, sp.Skill_id, sf.Domain_skill_id,
                       (
                           SELECT TOP 1 sv.Skill_version_id
                           FROM Skill_version sv
                           WHERE sv.Skill_id = sp.Skill_id AND sv.Valid_to IS NULL
                           ORDER BY sv.Version DESC
                       ) AS Skill_version_id
                FROM Competence_Lines cl
                LEFT JOIN Skill_position sp ON cl.SkillPositionId = sp.Skill_position_id
                LEFT JOIN Skill s ON sp.Skill_id = s.Skill_id
                LEFT JOIN Skill_family sf ON s.Family_id = sf.Family_id
                WHERE cl.CompetenceLineId IN ({placeholders})",
                competenceLineIds.Cast<object>().ToArray());

            foreach (var row in rows)
            {
                var competenceLineId = Convert.ToInt32(row["CompetenceLineId"]);
                result[competenceLineId] = new CompetenceSkillLink(
                    ReadInt(row, "Skill_id"),
                    ReadInt(row, "Domain_skill_id"),
                    ReadInt(row, "Skill_version_id"));
            }

            return result;
        }

        private sealed record CompetenceSkillLink(int? SkillId, int? DomainSkillId, int? SkillVersionId);
    }

    // DTOs pour les résultats de compétence
    public class CompetenceResultDto
    {
        public int CompetenceId { get; set; }
        public string CompetenceName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        /// <summary>Rang de maîtrise 1–4. Ne pas afficher en / 5.</summary>
        public decimal Score { get; set; }
        /// <summary>Rang CompetencyScale, null si Score n’est pas un entier 1–4.</summary>
        public int? AcquiredLevel { get; set; }
        public string? AcquiredLevelLabel { get; set; }
        public int EvaluationId { get; set; }
        public DateTime EvaluationDate { get; set; }
    }

    public class CompetenceMasterySummaryDto
    {
        public int EvaluationId { get; set; }
        public int RatedCount { get; set; }
        public int? DominantRank { get; set; }
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