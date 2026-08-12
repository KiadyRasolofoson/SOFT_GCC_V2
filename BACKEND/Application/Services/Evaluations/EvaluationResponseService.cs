using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Interfaces;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Exceptions;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class EvaluationResponseService : IEvaluationResponseService
    {
        private readonly IEvaluationDataService _dataService;
        private readonly IGenericRepository<EvaluationResponses> _responseRepository;
        
        private readonly IGenericRepository<Evaluation> _evaluationRepository;
        private readonly IGenericRepository<EvaluationQuestion> _questionRepository;

        public EvaluationResponseService(
            IEvaluationDataService dataService,
            IGenericRepository<EvaluationResponses> responseRepository,
            IGenericRepository<Evaluation> evaluationRepository,
            IGenericRepository<EvaluationQuestion> questionRepository)
        {
            _dataService = dataService;
            _responseRepository = responseRepository;
            _evaluationRepository = evaluationRepository;
            _questionRepository = questionRepository;
        }

        public async Task<EvaluationResponses> SaveResponseAsync(int evaluationId, EvaluationResponseDto responseDto)
        {
            // Vérifier si l'évaluation existe
            var evaluation = await _evaluationRepository.GetByIdAsync(evaluationId);
            if (evaluation == null)
                throw new Exception($"Évaluation avec l'ID {evaluationId} non trouvée");

            // Vérifier si la question existe
            var question = await _questionRepository.GetByIdAsync(responseDto.QuestionId);
            if (question == null)
                throw new Exception($"Question avec l'ID {responseDto.QuestionId} non trouvée");

            var response = new EvaluationResponses
            {
                EvaluationId = evaluationId,
                QuestionId = responseDto.QuestionId,
                ResponseType = responseDto.ResponseType,
                ResponseValue = responseDto.ResponseValue,
                TimeSpent = responseDto.TimeSpent,
                StartTime = responseDto.StartTime,
                EndTime = responseDto.EndTime,
                IsCorrect = responseDto.IsCorrect,
                State = 1 // Actif
            };

            await _responseRepository.CreateAsync(response);
            await _dataService.SaveChangesAsync();

            return response;
        }

        public async Task<List<EvaluationResponses>> GetResponsesAsync(int evaluationId)
        {
            var rows = await _dataService.ExecuteReaderAsync(
                "SELECT * FROM Evaluation_Responses WHERE EvaluationId = @p0", evaluationId);
            return rows.Select(row => new EvaluationResponses
            {
                ResponseId = Convert.ToInt32(row["ResponseId"]),
                EvaluationId = Convert.ToInt32(row["EvaluationId"]),
                QuestionId = Convert.ToInt32(row["QuestionId"]),
                ResponseValue = row["ResponseValue"]?.ToString() ?? string.Empty,
                ResponseType = row["ResponseType"]?.ToString() ?? string.Empty,
                State = row.ContainsKey("State") && row["State"] != DBNull.Value ? Convert.ToInt32(row["State"]) : 0
            }).ToList();
        }

        public async Task<EvaluationResponses?> GetResponseAsync(int evaluationId, int questionId)
        {
            var rows = await _dataService.ExecuteReaderAsync(
                "SELECT TOP 1 * FROM Evaluation_Responses WHERE EvaluationId = @p0 AND QuestionId = @p1",
                evaluationId, questionId);
            if (rows.Count == 0) return null;
            var row = rows[0];
            return new EvaluationResponses
            {
                ResponseId = Convert.ToInt32(row["ResponseId"]),
                EvaluationId = Convert.ToInt32(row["EvaluationId"]),
                QuestionId = Convert.ToInt32(row["QuestionId"]),
                ResponseValue = row["ResponseValue"]?.ToString() ?? string.Empty,
                ResponseType = row["ResponseType"]?.ToString() ?? string.Empty,
                State = row.ContainsKey("State") && row["State"] != DBNull.Value ? Convert.ToInt32(row["State"]) : 0
            };
        }

        public async Task<EvaluationResponses> GetRequiredResponseAsync(int evaluationId, int questionId)
        {
            return await GetResponseAsync(evaluationId, questionId)
                   ?? throw new NotFoundException(
                       $"Aucune réponse enregistrée pour la question {questionId} de l'évaluation {evaluationId}.");
        }

        public async Task<bool> UpdateResponseAsync(int responseId, EvaluationResponseDto responseDto)
        {
            var response = await _responseRepository.GetByIdAsync(responseId);
            if (response == null)
                throw new NotFoundException("Réponse", responseId);

            response.ResponseType = responseDto.ResponseType;
            response.ResponseValue = responseDto.ResponseValue;
            response.TimeSpent = responseDto.TimeSpent;
            response.EndTime = responseDto.EndTime;
            response.IsCorrect = responseDto.IsCorrect;

            await _responseRepository.UpdateAsync(response);
            await _dataService.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteResponseAsync(int responseId)
        {
            var response = await _responseRepository.GetByIdAsync(responseId);
            if (response == null)
                throw new Exception($"Réponse avec l'ID {responseId} non trouvée");

            await _responseRepository.DeleteAsync(response);
            await _dataService.SaveChangesAsync();

            return true;
        }

        // Nouvelles méthodes pour les options de questions
        public async Task<Dictionary<int, IEnumerable<EvaluationQuestionOptions>>> GetQuestionOptionsAsync(int evaluationId)
        {
            // Récupérer les IDs de questions associées à l'évaluation (type QCM uniquement)
            var questionIdsRows = await _dataService.ExecuteReaderAsync(@"
                SELECT esq.QuestionId FROM Evaluation_Selected_Questions esq
                INNER JOIN Evaluation_questions q ON esq.QuestionId = q.questionId
                WHERE esq.EvaluationId = @p0 AND q.ResponseTypeId = 2", evaluationId);

            var questionIds = questionIdsRows
                .Select(r => Convert.ToInt32(r["QuestionId"]))
                .ToList();

            if (!questionIds.Any())
                return new Dictionary<int, IEnumerable<EvaluationQuestionOptions>>();

            // Récupérer les options pour ces questions
            var placeholders = string.Join(",", questionIds.Select((_, i) => $"@p{i}"));
            var optionsRows = await _dataService.ExecuteReaderAsync($@"
                SELECT * FROM Evaluation_Question_Options 
                WHERE QuestionId IN ({placeholders})", questionIds.Cast<object>().ToArray());

            var options = optionsRows.Select(row => new EvaluationQuestionOptions
            {
                OptionId = Convert.ToInt32(row["OptionId"]),
                QuestionId = Convert.ToInt32(row["QuestionId"]),
                OptionText = row["OptionText"]?.ToString() ?? string.Empty,
                IsCorrect = row.ContainsKey("IsCorrect") && row["IsCorrect"] != DBNull.Value && Convert.ToBoolean(row["IsCorrect"])
            }).ToList();

            // Grouper les options par questionId
            return options.GroupBy(opt => opt.QuestionId)
                .ToDictionary(g => g.Key, g => g.AsEnumerable());
        }

        // Méthode pour sauvegarder la progression
        public async Task SaveProgressAsync(int evaluationId, EvaluationProgressDto progress)
        {
            var progressRows = await _dataService.ExecuteReaderAsync(
                "SELECT * FROM Evaluation_progress WHERE evaluationId = @p0", evaluationId);

            if (progressRows.Count == 0)
            {
                // Récupérer l'employeeId depuis l'évaluation
                var evaluation = await _dataService.FindEvaluationAsync(evaluationId);
                if (evaluation == null) 
                    throw new Exception($"Évaluation avec ID {evaluationId} non trouvée");

                var evaluationProgress = new EvaluationProgress
                {
                    evaluationId = evaluationId,
                    employeeId = evaluation.EmployeeId, // Utiliser l'ID de l'employé lié à l'évaluation
                    totalQuestions = progress.TotalQuestions,
                    answeredQuestions = progress.AnsweredQuestions,
                    progressPercentage = progress.ProgressPercentage,
                    lastUpdate = DateTime.UtcNow
                };
                await _dataService.AddRangeAsync(new[] { evaluationProgress });
            }
            else
            {
                var progressId = Convert.ToInt32(progressRows[0]["progressId"]);
                await _dataService.ExecuteNonQueryAsync(@"
                    UPDATE Evaluation_progress 
                    SET answeredQuestions = @p0, progressPercentage = @p1, lastUpdate = @p2 
                    WHERE progressId = @p3",
                    progress.AnsweredQuestions, progress.ProgressPercentage, DateTime.UtcNow, progressId);
            }
        }

        // Méthode pour obtenir le temps restant
        public async Task<TimeSpan> GetTimeRemainingAsync(int evaluationId)
        {
            var evaluation = await _dataService.FindEvaluationAsync(evaluationId);
            if (evaluation == null) throw new Exception("Évaluation non trouvée");

            var timeRemaining = evaluation.EndDate - DateTime.UtcNow;
            return timeRemaining > TimeSpan.Zero ? timeRemaining : TimeSpan.Zero;
        }

        public async Task<EvaluationResponses> UpdateProgressAsync(int evaluationId, int questionId, int timeSpent)
        {
            var existingRows = await _dataService.ExecuteReaderAsync(
                "SELECT * FROM Evaluation_Responses WHERE EvaluationId = @p0 AND QuestionId = @p1",
                evaluationId, questionId);

            EvaluationResponses response;
            if (existingRows.Count == 0)
            {
                response = new EvaluationResponses
                {
                    EvaluationId = evaluationId,
                    QuestionId = questionId,
                    TimeSpent = timeSpent,
                    StartTime = DateTime.UtcNow,
                    EndTime = DateTime.UtcNow,
                    State = 1
                };
                await _responseRepository.CreateAsync(response);
            }
            else
            {
                var responseId = Convert.ToInt32(existingRows[0]["ResponseId"]);
                var existingResponse = await _responseRepository.GetByIdAsync(responseId);
                if (existingResponse == null) throw new Exception("Réponse non trouvée");
                response = existingResponse;
                response.TimeSpent = timeSpent;
                response.EndTime = DateTime.UtcNow;
                await _responseRepository.UpdateAsync(response);
            }

            await _dataService.SaveChangesAsync();
            return response;
        }

        public async Task<bool> IsResponseCorrect(int questionId, string responseValue)
        {
            // Vérifier si c'est une réponse QCM
            var question = await _dataService.GetQuestionWithOptionsAsync(questionId);
            
            if (question == null)
                return false;
            
            // Si c'est une question QCM
            if (question.ResponseTypeId == 2) // 2 = QCM
            {
                // Essayer de parser la valeur comme un ID d'option
                if (int.TryParse(responseValue, out int optionId))
                {
                    // Vérifier si l'option sélectionnée est marquée comme correcte
                    var count = await _dataService.ExecuteScalarAsync(@"
                        SELECT COUNT(1) FROM Evaluation_Question_Options 
                        WHERE QuestionId = @p0 AND OptionId = @p1 AND IsCorrect = 1",
                        questionId, optionId);
                    return count > 0;
                }
            }
            
            // Pour les autres types de questions, on devrait implémenter d'autres méthodes de vérification
            // Par exemple, pour les questions textuelles, on pourrait comparer avec une réponse de référence
            return false;
        }

        public async Task<bool> ProcessResponsesAfterSubmissionAsync(int evaluationId)
        {
            try
            {
                // Récupérer toutes les réponses de l'évaluation
                var responsesData = await _dataService.ExecuteReaderAsync(
                    "SELECT * FROM Evaluation_Responses WHERE EvaluationId = @p0", evaluationId);

                foreach (var row in responsesData)
                {
                    var responseId = Convert.ToInt32(row["ResponseId"]);
                    var questionId = Convert.ToInt32(row["QuestionId"]);
                    var responseType = row["ResponseType"]?.ToString();
                    var responseValue = row["ResponseValue"]?.ToString();

                    // Vérifier si la réponse est correcte
                    bool isCorrect = false;
                    if (responseType == "QCM")
                    {
                        if (int.TryParse(responseValue, out int optionId))
                        {
                            var count = await _dataService.ExecuteScalarAsync(@"
                                SELECT COUNT(1) FROM Evaluation_Question_Options 
                                WHERE QuestionId = @p0 AND OptionId = @p1 AND IsCorrect = 1",
                                questionId, optionId);
                            isCorrect = count > 0;
                        }
                    }

                    // Mettre à jour le statut de la réponse
                    await _dataService.ExecuteNonQueryAsync(@"
                        UPDATE Evaluation_Responses 
                        SET IsCorrect = @p0, State = 10 
                        WHERE ResponseId = @p1",
                        isCorrect ? 1 : 0, responseId);
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors du traitement des réponses: {ex.Message}");
                return false;
            }
        }

        // Get all question options for an evaluation (not filtered by QCM type)
        public async Task<Dictionary<int, List<EvaluationQuestionOptions>>> GetAllQuestionOptionsAsync(int evaluationId)
        {
            var questionIdsRows = await _dataService.ExecuteReaderAsync(@"
                SELECT esq.QuestionId FROM Evaluation_Selected_Questions esq
                WHERE esq.EvaluationId = @p0", evaluationId);

            var questionIds = questionIdsRows
                .Select(r => Convert.ToInt32(r["QuestionId"]))
                .ToList();

            if (!questionIds.Any())
                return new Dictionary<int, List<EvaluationQuestionOptions>>();

            var placeholders = string.Join(",", questionIds.Select((_, i) => $"@p{i}"));
            var optionsRows = await _dataService.ExecuteReaderAsync($@"
                SELECT * FROM evaluation_question_options 
                WHERE questionId IN ({placeholders})", questionIds.Cast<object>().ToArray());

            var options = optionsRows.Select(row => new EvaluationQuestionOptions
            {
                OptionId = Convert.ToInt32(row["optionId"]),
                QuestionId = Convert.ToInt32(row["questionId"]),
                OptionText = row["optionText"]?.ToString() ?? string.Empty,
                IsCorrect = row.ContainsKey("isCorrect") && row["isCorrect"] != DBNull.Value && Convert.ToBoolean(row["isCorrect"]),
                State = row.ContainsKey("state") && row["state"] != DBNull.Value ? Convert.ToInt32(row["state"]) : 0
            }).ToList();

            return options.GroupBy(opt => opt.QuestionId)
                .ToDictionary(g => g.Key, g => g.ToList());
        }
    }
}