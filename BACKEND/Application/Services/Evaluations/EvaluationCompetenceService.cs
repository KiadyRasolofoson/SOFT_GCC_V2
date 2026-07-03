using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.wish_evolution;
using soft_carriere_competence.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class EvaluationCompetenceService
    {
        private readonly ApplicationDbContext _context;

        public EvaluationCompetenceService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// Calcule et enregistre les résultats par compétence pour une évaluation
        public async Task<bool> CalculateAndSaveCompetenceResultsAsync(int evaluationId)
        {
            try
            {
                Console.WriteLine($"Début du calcul des résultats par compétence pour l'évaluation {evaluationId}");

                // 1. Récupérer l'évaluation avec l'employé associé
                var evaluation = await _context.Evaluations
                    .Include(e => e.Employee)
                    .FirstOrDefaultAsync(e => e.EvaluationId == evaluationId);

                if (evaluation == null)
                {
                    throw new Exception($"Évaluation avec ID {evaluationId} non trouvée.");
                }

                int employeeId = evaluation.EmployeeId;
                decimal overallScore = evaluation.OverallScore ?? 0;

                Console.WriteLine($"Score global de l'évaluation: {overallScore}");

                // 2. Récupérer les questions sélectionnées pour cette évaluation et leurs compétences associées
                var selectedQuestions = await _context.evaluationSelectedQuestions
                    .Where(esq => esq.EvaluationId == evaluationId)
                    .ToListAsync();

                if (selectedQuestions == null || !selectedQuestions.Any())
                {
                    Console.WriteLine($"Aucune question sélectionnée trouvée pour l'évaluation {evaluationId}");
                    return false;
                }

                // 3. Extraire les IDs de compétence distincts
                var distinctCompetences = selectedQuestions
                    .Select(sq => sq.CompetenceLineId)
                    .Distinct()
                    .ToList();

                Console.WriteLine($"Nombre de compétences distinctes: {distinctCompetences.Count}");

                // 4. Créer une entrée de résultat pour chaque compétence distincte avec le score global
                foreach (var competenceId in distinctCompetences)
                {
                    Console.WriteLine($"Création du résultat pour la compétence ID: {competenceId}");
                    
                    // Créer une nouvelle entrée de résultat avec le score global
                    var competenceResult = new EvaluationCompetenceResult
                    {
                        EvaluationId = evaluationId,
                        EmployeeId = employeeId,
                        CompetenceLineId = competenceId,
                        Score = overallScore,
                        CreatedAt = DateTime.UtcNow,
                        State = 1 // Actif
                    };

                    await _context.EvaluationCompetenceResults.AddAsync(competenceResult);
                }

                await _context.SaveChangesAsync();
                Console.WriteLine("Calcul et sauvegarde des résultats par compétence terminés avec succès");

                // 5. Mise à jour des compétences des employés
                await UpdateEmployeeSkillsAfterEvaluation(evaluationId);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur dans CalculateAndSaveCompetenceResultsAsync: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Met à jour ou crée les entrées dans EmployeeSkill basées sur les résultats d'évaluation
        /// </summary>
        public async Task UpdateEmployeeSkillsAfterEvaluation(int evaluationId)
        {
            try
            {
                Console.WriteLine($"Mise à jour des compétences pour l'évaluation {evaluationId}");
                
                // 1. Obtenir l'ID de l'employé et les résultats d'évaluation
                var employeeId = await GetEmployeeIdFromEvaluation(evaluationId);
                if (employeeId <= 0) return;
                
                var results = await GetCompetenceResults(evaluationId);
                if (results.Count == 0) return;
                
                // 2. Obtenir un domaine par défaut
                var defaultDomainId = await GetDefaultDomainId();
                if (defaultDomainId <= 0) return;
                
                // 3. Traiter chaque résultat
                foreach (var result in results)
                {
                    try
                    {
                        // Récupérer les IDs nécessaires
                        var skillId = await GetSkillIdFromCompetenceLine(result.CompetenceLineId);
                        if (skillId <= 0) continue;
                        
                        // Vérifier si la compétence existe déjà
                        var existingSkillId = await CheckExistingSkill(employeeId, skillId);
                        var score = (double)result.Score * 20; // Convertir le score en pourcentage

                        if (existingSkillId > 0)
                        {
                            // Mise à jour
                            await UpdateExistingSkill(existingSkillId, score);
                        }
                        else
                        {
                            // Création
                            await CreateNewSkill(employeeId, skillId, defaultDomainId, score);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Erreur sur la compétence {result.CompetenceLineId}: {ex.Message}");
                    }
                }
                
                Console.WriteLine($"Mise à jour terminée pour l'employé {employeeId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur globale: {ex.Message}");
            }
        }
        
        // Méthodes d'aide pour simplifier le code principal
        
        private async Task<int> GetEmployeeIdFromEvaluation(int evaluationId)
        {
            try
            {
                using (var cmd = _context.Database.GetDbConnection().CreateCommand())
                {
                    cmd.CommandText = "SELECT employeeId FROM Evaluations WHERE evaluations_id = @id";
                    var param = cmd.CreateParameter();
                    param.ParameterName = "@id";
                    param.Value = evaluationId;
                    cmd.Parameters.Add(param);
                    
                    await EnsureConnectionOpen(cmd);
                    var result = await cmd.ExecuteScalarAsync();
                    
                    if (result != null && result != DBNull.Value)
                    {
                        var employeeId = Convert.ToInt32(result);
                        Console.WriteLine($"EmployeeId trouvé: {employeeId}");
                        return employeeId;
                    }
                }
                
                Console.WriteLine($"Évaluation {evaluationId} non trouvée ou sans employé associé");
                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération de l'employeeId: {ex.Message}");
                return 0;
            }
        }
        
        private async Task<List<EvaluationCompetenceResult>> GetCompetenceResults(int evaluationId)
        {
            var results = new List<EvaluationCompetenceResult>();
            try
            {
                using (var cmd = _context.Database.GetDbConnection().CreateCommand())
                {
                    cmd.CommandText = @"
                        SELECT ResultId, EvaluationId, EmployeeId, CompetenceLineId, Score
                        FROM Evaluation_Competence_Results 
                        WHERE EvaluationId = @evaluationId";
                        
                    var param = cmd.CreateParameter();
                    param.ParameterName = "@evaluationId";
                    param.Value = evaluationId;
                    cmd.Parameters.Add(param);
                    
                    await EnsureConnectionOpen(cmd);
                    
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            results.Add(new EvaluationCompetenceResult
                            {
                                ResultId = reader.GetInt32(0),
                                EvaluationId = reader.GetInt32(1),
                                EmployeeId = reader.GetInt32(2),
                                CompetenceLineId = reader.GetInt32(3),
                                Score = reader.GetDecimal(4)
                            });
                        }
                    }
                }
                
                Console.WriteLine($"{results.Count} résultats de compétence trouvés");
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération des résultats: {ex.Message}");
                return results;
            }
        }
        
        private async Task<int> GetDefaultDomainId()
        {
            try
            {
                using (var cmd = _context.Database.GetDbConnection().CreateCommand())
                {
                    cmd.CommandText = "SELECT TOP 1 Domain_skill_id FROM Domain_skill WHERE Domain_skill_id > 0";
                    
                    await EnsureConnectionOpen(cmd);
                    
                    var result = await cmd.ExecuteScalarAsync();
                    if (result != null && result != DBNull.Value)
                    {
                        var domainId = Convert.ToInt32(result);
                        Console.WriteLine($"Domaine par défaut: {domainId}");
                        return domainId;
                    }
                }
                
                Console.WriteLine("Aucun domaine trouvé");
                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération du domaine: {ex.Message}");
                return 0;
            }
        }
        
        private async Task<int> GetSkillIdFromCompetenceLine(int competenceLineId)
        {
            try
            {
                // 1. Récupérer le SkillPositionId
                int skillPositionId = 0;
                
                using (var cmd = _context.Database.GetDbConnection().CreateCommand())
                {
                    cmd.CommandText = "SELECT SkillPositionId FROM Competence_Lines WHERE CompetenceLineId = @id";
                    var param = cmd.CreateParameter();
                    param.ParameterName = "@id";
                    param.Value = competenceLineId;
                    cmd.Parameters.Add(param);
                    
                    await EnsureConnectionOpen(cmd);
                    var result = await cmd.ExecuteScalarAsync();
                    
                    if (result != null && result != DBNull.Value)
                    {
                        skillPositionId = Convert.ToInt32(result);
                    }
                    else
                    {
                        Console.WriteLine($"SkillPositionId non trouvé pour CompetenceLine {competenceLineId}");
                        return 0;
                    }
                }
                
                // 2. Récupérer le SkillId
                using (var cmd = _context.Database.GetDbConnection().CreateCommand())
                {
                    cmd.CommandText = "SELECT Skill_id FROM Skill_position WHERE Skill_position_id = @id";
                    var param = cmd.CreateParameter();
                    param.ParameterName = "@id";
                    param.Value = skillPositionId;
                    cmd.Parameters.Add(param);
                    
                    await EnsureConnectionOpen(cmd);
                    var result = await cmd.ExecuteScalarAsync();
                    
                    if (result != null && result != DBNull.Value)
                    {
                        var skillId = Convert.ToInt32(result);
                        Console.WriteLine($"SkillId trouvé: {skillId}");
                        return skillId;
                    }
                }
                
                Console.WriteLine($"SkillId non trouvé pour SkillPosition {skillPositionId}");
                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération du SkillId: {ex.Message}");
                return 0;
            }
        }
        
        private async Task<int> CheckExistingSkill(int employeeId, int skillId)
        {
            try
            {
                using (var cmd = _context.Database.GetDbConnection().CreateCommand())
                {
                    cmd.CommandText = @"
                        SELECT Employee_skill_id 
                        FROM Employee_skill 
                        WHERE Employee_id = @employeeId AND Skill_id = @skillId";
                    
                    var p1 = cmd.CreateParameter();
                    p1.ParameterName = "@employeeId";
                    p1.Value = employeeId;
                    cmd.Parameters.Add(p1);
                    
                    var p2 = cmd.CreateParameter();
                    p2.ParameterName = "@skillId";
                    p2.Value = skillId;
                    cmd.Parameters.Add(p2);
                    
                    await EnsureConnectionOpen(cmd);
                    var result = await cmd.ExecuteScalarAsync();
                    
                    if (result != null && result != DBNull.Value)
                    {
                        return Convert.ToInt32(result);
                    }
                    
                    return 0;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la vérification de compétence: {ex.Message}");
                return 0;
            }
        }
        
        private async Task UpdateExistingSkill(int skillId, double score)
        {
            try
            {
                using (var cmd = _context.Database.GetDbConnection().CreateCommand())
                {
                    cmd.CommandText = @"
                        UPDATE Employee_skill 
                        SET Level = @level, 
                            Updated_date = @date, 
                            State = 10 
                        WHERE Employee_skill_id = @id";
                    
                    var p1 = cmd.CreateParameter();
                    p1.ParameterName = "@level";
                    p1.Value = score;
                    cmd.Parameters.Add(p1);
                    
                    var p2 = cmd.CreateParameter();
                    p2.ParameterName = "@date";
                    p2.Value = DateTime.Now;
                    cmd.Parameters.Add(p2);
                    
                    var p3 = cmd.CreateParameter();
                    p3.ParameterName = "@id";
                    p3.Value = skillId;
                    cmd.Parameters.Add(p3);
                    
                    await EnsureConnectionOpen(cmd);
                    var rowsAffected = await cmd.ExecuteNonQueryAsync();
                    Console.WriteLine($"Compétence {skillId} mise à jour: {rowsAffected} lignes");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la mise à jour de compétence: {ex.Message}");
            }
        }
        
        private async Task CreateNewSkill(int employeeId, int skillId, int domainId, double score)
        {
            try
            {
                using (var cmd = _context.Database.GetDbConnection().CreateCommand())
                {
                    cmd.CommandText = @"
                        INSERT INTO Employee_skill 
                        (Domain_skill_id, Skill_id, Level, State, Creation_date, Updated_date, Employee_id) 
                        VALUES (@domainId, @skillId, @level, 10, @date, @date, @employeeId)";
                    
                    var p1 = cmd.CreateParameter();
                    p1.ParameterName = "@domainId";
                    p1.Value = domainId;
                    cmd.Parameters.Add(p1);
                    
                    var p2 = cmd.CreateParameter();
                    p2.ParameterName = "@skillId";
                    p2.Value = skillId;
                    cmd.Parameters.Add(p2);
                    
                    var p3 = cmd.CreateParameter();
                    p3.ParameterName = "@level";
                    p3.Value = score;
                    cmd.Parameters.Add(p3);
                    
                    var p4 = cmd.CreateParameter();
                    p4.ParameterName = "@date";
                    p4.Value = DateTime.Now;
                    cmd.Parameters.Add(p4);
                    
                    var p5 = cmd.CreateParameter();
                    p5.ParameterName = "@employeeId";
                    p5.Value = employeeId;
                    cmd.Parameters.Add(p5);
                    
                    await EnsureConnectionOpen(cmd);
                    var rowsAffected = await cmd.ExecuteNonQueryAsync();
                    Console.WriteLine($"Nouvelle compétence créée: {rowsAffected} lignes");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la création de compétence: {ex.Message}");
            }
        }
        
        private async Task EnsureConnectionOpen(System.Data.Common.DbCommand command)
        {
            if (command.Connection.State != System.Data.ConnectionState.Open)
            {
                await command.Connection.OpenAsync();
            }
        }

        public async Task<List<CompetenceResultDto>> GetUserCompetenceResultsAsync(int employeeId)
        {
            try
            {
                // Récupérer les résultats de compétences les plus récents pour chaque compétence de l'employé
                var latestResults = await _context.EvaluationCompetenceResults
                    .Where(ecr => ecr.EmployeeId == employeeId)
                    .GroupBy(ecr => ecr.CompetenceLineId)
                    .Select(group => group.OrderByDescending(ecr => ecr.CreatedAt).First())
                    .ToListAsync();

                // Récupérer les informations de compétence correspondantes
                var competenceIds = latestResults.Select(lr => lr.CompetenceLineId).ToList();
                var competenceLines = await _context.competenceLines
                    .Include(cl => cl.SkillPosition)
                        .ThenInclude(sp => sp.Skill)
                    .Where(cl => competenceIds.Contains(cl.CompetenceLineId))
                    .ToListAsync();

                // Récupérer les informations d'évaluation correspondantes
                var evaluationIds = latestResults.Select(lr => lr.EvaluationId).Distinct().ToList();
                var evaluations = await _context.Evaluations
                    .Where(e => evaluationIds.Contains(e.EvaluationId))
                    .ToListAsync();

                // Construire les DTOs
                var resultDtos = latestResults.Select(result =>
                {
                    var competenceLine = competenceLines.FirstOrDefault(cl => cl.CompetenceLineId == result.CompetenceLineId);
                    var evaluation = evaluations.FirstOrDefault(e => e.EvaluationId == result.EvaluationId);

                    return new CompetenceResultDto
                    {
                        CompetenceId = result.CompetenceLineId,
                        CompetenceName = competenceLine?.SkillPosition?.Skill?.Name ?? "Inconnu",
                        Description = competenceLine?.Description ?? "",
                        Score = result.Score,
                        EvaluationId = result.EvaluationId,
                        EvaluationDate = evaluation?.EndDate ?? DateTime.MinValue
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
                var results = await _context.EvaluationCompetenceResults
                    .Where(ecr => ecr.EvaluationId == evaluationId)
                    .ToListAsync();

                // Si aucun résultat n'existe, calculer les résultats automatiquement
                if (results == null || !results.Any())
                {
                    Console.WriteLine($"Aucun résultat trouvé pour l'évaluation {evaluationId}, calcul automatique...");
                    await CalculateAndSaveCompetenceResultsAsync(evaluationId);
                    
                    // Récupérer les résultats fraîchement calculés
                    results = await _context.EvaluationCompetenceResults
                        .Where(ecr => ecr.EvaluationId == evaluationId)
                        .ToListAsync();
                }

                if (results == null || !results.Any())
                {
                    return new List<CompetenceResultDto>();
                }

                var competenceIds = results.Select(r => r.CompetenceLineId).ToList();
                var competenceLines = await _context.competenceLines
                    .Include(cl => cl.SkillPosition)
                        .ThenInclude(sp => sp.Skill)
                    .Where(cl => competenceIds.Contains(cl.CompetenceLineId))
                    .ToListAsync();

                var evaluation = await _context.Evaluations
                    .FirstOrDefaultAsync(e => e.EvaluationId == evaluationId);

                var resultDtos = results.Select(r =>
                {
                    var competenceLine = competenceLines.FirstOrDefault(cl => cl.CompetenceLineId == r.CompetenceLineId);
                    return new CompetenceResultDto
                    {
                        CompetenceId = r.CompetenceLineId,
                        // Utiliser le nom de compétence à partir de SkillPosition -> Skill
                        CompetenceName = competenceLine?.SkillPosition?.Skill?.Name ?? "Inconnu",
                        // Pas de description directe, utiliser le nom de compétence ou une chaîne vide
                        Description = competenceLine?.SkillPosition?.Skill?.Name ?? "",
                        Score = r.Score,
                        EvaluationId = evaluationId,
                        EvaluationDate = evaluation?.EndDate ?? DateTime.MinValue
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
                var results = await _context.EvaluationCompetenceResults
                    .Where(ecr => ecr.EmployeeId == employeeId && ecr.CompetenceLineId == competenceId)
                    .OrderByDescending(ecr => ecr.CreatedAt)
                    .ToListAsync();

                if (results == null || !results.Any())
                {
                    return new List<CompetenceResultHistoryDto>();
                }

                var evaluationIds = results.Select(r => r.EvaluationId).ToList();
                var evaluations = await _context.Evaluations
                    .Include(e => e.EvaluationType)
                    .Where(e => evaluationIds.Contains(e.EvaluationId))
                    .ToListAsync();

                var competenceLine = await _context.competenceLines
                    .Include(cl => cl.SkillPosition)
                        .ThenInclude(sp => sp.Skill)
                    .FirstOrDefaultAsync(cl => cl.CompetenceLineId == competenceId);

                var historyDtos = results.Select(r =>
                {
                    var evaluation = evaluations.FirstOrDefault(e => e.EvaluationId == r.EvaluationId);
                    return new CompetenceResultHistoryDto
                    {
                        ResultId = r.ResultId,
                        CompetenceId = competenceId,
                        CompetenceName = competenceLine?.SkillPosition?.Skill?.Name ?? "Inconnu",
                        Score = r.Score,
                        EvaluationId = r.EvaluationId,
                        EvaluationDate = evaluation?.EndDate ?? DateTime.MinValue,
                        EvaluationType = evaluation?.EvaluationType?.Designation ?? "Inconnu"
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
        public string CompetenceName { get; set; }
        public string Description { get; set; }
        public decimal Score { get; set; }
        public int EvaluationId { get; set; }
        public DateTime EvaluationDate { get; set; }
    }

    public class CompetenceResultHistoryDto
    {
        public int ResultId { get; set; }
        public int CompetenceId { get; set; }
        public string CompetenceName { get; set; }
        public decimal Score { get; set; }
        public int EvaluationId { get; set; }
        public DateTime EvaluationDate { get; set; }
        public string EvaluationType { get; set; }
    }
}