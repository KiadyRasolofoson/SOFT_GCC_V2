using Microsoft.AspNetCore.Http;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Interfaces;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Exceptions;
using soft_carriere_competence.Core.Interface.DataService;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class TrainingSuggestionService : ITrainingSuggestionImportService
    {
        private readonly IEvaluationDataService _dataService;

        public TrainingSuggestionService(IEvaluationDataService dataService)
        {
            _dataService = dataService;
        }

        public async Task<TrainingSuggestionImportResultDto> ImportFromCsvAsync(IFormFile file)
        {
            if (file is null || file.Length == 0)
            {
                throw new ValidationException("Aucun fichier fourni.");
            }

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException("Seuls les fichiers CSV sont acceptés.");
            }

            var parseResult = await ParseCsvAsync(file);

            return new TrainingSuggestionImportResultDto(parseResult.ImportedCount, parseResult.Errors);
        }

        private sealed class ImportResult
        {
            public int ImportedCount { get; set; }
            public List<string> Errors { get; set; } = new List<string>();
        }

        private async Task<ImportResult> ParseCsvAsync(IFormFile file)
        {
            var result = new ImportResult();

            using (var reader = new StreamReader(file.OpenReadStream()))
            {
                var line = await reader.ReadLineAsync(); // Lecture de l'en-tête
                
                // Vérifier que l'en-tête a le format attendu
                if (line == null)
                {
                    result.Errors.Add("Le fichier CSV est vide");
                    return result;
                }

                // Supposons que l'en-tête contient: Training,Details,EvaluationTypeId,QuestionId,ScoreThreshold
                var headers = line.Split(',');
                if (headers.Length < 5)
                {
                    result.Errors.Add("Format d'en-tête CSV invalide. Format attendu: Training,Details,EvaluationTypeId,QuestionId,ScoreThreshold");
                    return result;
                }

                int lineNumber = 1;
                int importedCount = 0;

                while ((line = await reader.ReadLineAsync()) != null)
                {
                    lineNumber++;
                    
                    try
                    {
                        var values = line.Split(',');
                        if (values.Length < 5)
                        {
                            result.Errors.Add($"Ligne {lineNumber}: Nombre de colonnes insuffisant");
                            continue;
                        }

                        var training = values[0].Trim();
                        var details = values[1].Trim();
                        
                        if (!int.TryParse(values[2].Trim(), out int evaluationTypeId))
                        {
                            result.Errors.Add($"Ligne {lineNumber}: EvaluationTypeId invalide");
                            continue;
                        }

                        if (!int.TryParse(values[3].Trim(), out int questionId))
                        {
                            result.Errors.Add($"Ligne {lineNumber}: QuestionId invalide");
                            continue;
                        }

                        if (!int.TryParse(values[4].Trim(), out int scoreThreshold))
                        {
                            result.Errors.Add($"Ligne {lineNumber}: ScoreThreshold invalide");
                            continue;
                        }

                        // Vérifier si l'EvaluationType existe
                        if (!await _dataService.EvaluationTypeExistsAsync(evaluationTypeId))
                        {
                            result.Errors.Add($"Ligne {lineNumber}: EvaluationType avec ID {evaluationTypeId} introuvable");
                            continue;
                        }

                        // Vérifier si la Question existe
                        if (!await _dataService.EvaluationQuestionExistsAsync(questionId))
                        {
                            result.Errors.Add($"Ligne {lineNumber}: Question avec ID {questionId} introuvable");
                            continue;
                        }

                        // Récupérer CompetenceLineId de la question si possible
                        int? competenceLineId = null;
                        var questionData = await _dataService.ExecuteReaderAsync(
                            "SELECT CompetenceLineId FROM Evaluation_questions WHERE questionId = @p0", questionId);
                            
                        if (questionData.Count > 0 && questionData[0].ContainsKey("CompetenceLineId"))
                        {
                            var val = questionData[0]["CompetenceLineId"];
                            if (val != null && val != DBNull.Value)
                            {
                                competenceLineId = Convert.ToInt32(val);
                            }
                        }

                        // Créer et ajouter la suggestion
                        var trainingSuggestion = new TrainingSuggestion
                        {
                            Training = training,
                            Details = details,
                            evaluationTypeId = evaluationTypeId,
                            questionId = questionId,
                            scoreThreshold = scoreThreshold,
                            CompetenceLineId = competenceLineId, // Utiliser CompetenceLineId de la question
                            // Ne pas définir TrainingId s'il n'y a pas de CompetenceTraining associée
                            state = 1 // Actif par défaut
                        };

                        await _dataService.AddRangeAsync(new[] { trainingSuggestion });
                        importedCount++;
                    }
                    catch (Exception ex)
                    {
                        result.Errors.Add($"Ligne {lineNumber}: {ex.Message}");
                    }
                }

                // Sauvegarder toutes les suggestions importées
                if (importedCount > 0)
                {
                    await _dataService.SaveChangesAsync();
                }

                result.ImportedCount = importedCount;
                return result;
            }
        }
    }
} 