using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Application.Common;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Interfaces;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Exceptions;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.EvaluationInterface;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Core.Interface.AuthInterface;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using soft_carriere_competence.Application.Services;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class EvaluationService : IEvaluationService, IEvaluationQuestionService, IEvaluationTrainingSuggestionService
    {
        private readonly IEvaluationQuestionRepository _questionRepository;
        private readonly IGenericRepository<EvaluationType> _evaluationTypeRepository;
        private readonly IGenericRepository<EvaluationQuestion> _evaluationQuestion;
        private readonly IGenericRepository<TrainingSuggestion> _trainingSuggestionsRepository;
        private readonly IGenericRepository<EvaluationQuestionnaire> _evaluationQuestionnaireRepository;
        private readonly IGenericRepository<Evaluation> _evaluationRepository;
        private readonly IGenericRepository<User> _userRepository;
        private readonly IGenericRepository<Position> _posteRepository;
        private readonly IEvaluationDataService _dataService;
        private readonly TemporaryAccountService _temporaryAccountService;
        private readonly IEmailService _emailService;
        private readonly ReminderSettings _reminderSettings;
        private readonly EvaluationCompetenceService? _competenceService;
        private readonly IConfiguration _configuration;
        private readonly INotificationService _notificationService;

        public EvaluationService(IEvaluationQuestionRepository questionRepository, IGenericRepository<EvaluationType> evaluationType,
            IGenericRepository<EvaluationQuestion> EvaluationQuestion, IGenericRepository<Evaluation> _evaluation,
            IGenericRepository<EvaluationQuestionnaire> _evaluationQuestionnaire, IGenericRepository<TrainingSuggestion> _trainingSuggestions,
            IGenericRepository<User> userRepository,
            IEmailService emailService,
            IOptions<ReminderSettings> reminderSettings,
            IGenericRepository<Position> poste,
            IEvaluationDataService dataService,
            TemporaryAccountService temporaryAccountService,
            IConfiguration configuration,
            INotificationService notificationService,
            EvaluationCompetenceService? competenceService = null)
        {
            _questionRepository = questionRepository;
            _evaluationTypeRepository = evaluationType;
            _evaluationQuestion = EvaluationQuestion;
            _evaluationRepository = _evaluation;
            _trainingSuggestionsRepository = _trainingSuggestions;
            _evaluationQuestionnaireRepository = _evaluationQuestionnaire; 
            _userRepository = userRepository;
            _emailService = emailService;
            _reminderSettings = reminderSettings.Value;
            _posteRepository = poste;
            _dataService = dataService;
            _temporaryAccountService = temporaryAccountService;
            _configuration = configuration;
            _notificationService = notificationService;
            _competenceService = competenceService;
        }

        public async Task<EvaluationQuestionCreatedDto> CreateQuestionAsync(EvaluationQuestionDto question)
        {
            ArgumentNullException.ThrowIfNull(question);

            var newQuestion = new EvaluationQuestion
            {
                question = question.Question,
                evaluationTypeId = question.EvaluationTypeId,
                positionId = question.PositionId,
                CompetenceLineId = question.CompetenceLineId,
                ResponseTypeId = question.ResponseTypeId,
                state = question.State
            };

            await CreateEvaluationQuestionAsync(newQuestion);

            return new EvaluationQuestionCreatedDto(
                newQuestion.questionId,
                newQuestion.question,
                newQuestion.evaluationTypeId,
                newQuestion.positionId,
                newQuestion.CompetenceLineId,
                newQuestion.ResponseTypeId,
                newQuestion.state);
        }

        public async Task UpdateQuestionAsync(int questionId, EvaluationQuestionDto question)
        {
            ArgumentNullException.ThrowIfNull(question);

            if (question.QuestionId.HasValue && question.QuestionId.Value != questionId)
            {
                throw new ValidationException(
                    "L'identifiant de la question diffère entre l'URL et le corps de la requête.");
            }

            var existingQuestion = await GetRequiredQuestionAsync(questionId);
            existingQuestion.question = question.Question;
            existingQuestion.evaluationTypeId = question.EvaluationTypeId;
            existingQuestion.positionId = question.PositionId;
            existingQuestion.CompetenceLineId = question.CompetenceLineId;
            existingQuestion.ResponseTypeId = question.ResponseTypeId;
            existingQuestion.state = question.State;

            await UpdateEvaluationQuestionAsync(existingQuestion);
        }

        public async Task DeleteQuestionAsync(int questionId)
        {
            if (!await DeleteEvaluationQuestionAsync(questionId))
            {
                throw new NotFoundException("Question d'évaluation", questionId);
            }
        }

        public async Task<EvaluationQuestion> GetRequiredQuestionAsync(int questionId)
        {
            return await GetEvaluationQuestionByIdAsync(questionId)
                   ?? throw new NotFoundException("Question d'évaluation", questionId);
        }

        public async Task<IEnumerable<EvaluationQuestion>> FindQuestionsAsync(EvaluationQuestionFilterDto filter)
        {
            ArgumentNullException.ThrowIfNull(filter);

            if (filter.CompetenceLineId is { } competenceLineId)
            {
                if (filter.PositionId > 0)
                {
                    return await GetEvaluationQuestionsByTypePositionAndCompetenceAsync(
                        filter.EvaluationTypeId, filter.PositionId, competenceLineId);
                }

                if (filter.PositionId == 0)
                {
                    return await GetEvaluationQuestionsByTypeAndCompetenceAsync(
                        filter.EvaluationTypeId, competenceLineId);
                }
            }

            return await GetEvaluationQuestionsAsync(filter.EvaluationTypeId, filter.PositionId);
        }

        public async Task<PagedResult<EvaluationQuestionSummaryDto>> GetQuestionSummariesAsync(PageRequest page)
        {
            ArgumentNullException.ThrowIfNull(page);

            var (items, totalPages) = await GetPaginatedEvaluationQuestionsAsync(page.PageNumber, page.PageSize);

            return PagedResult<EvaluationQuestionSummaryDto>.Create(items.Select(ToSummary), page, totalPages);
        }

        public async Task<PagedResult<EvaluationQuestion>> GetQuestionsByTypeAsync(int evaluationTypeId, PageRequest page)
        {
            ArgumentNullException.ThrowIfNull(page);

            var (items, totalPages) = await GetPaginatedEvaluationQuestionsByTypeAsync(
                evaluationTypeId, page.PageNumber, page.PageSize);

            return PagedResult<EvaluationQuestion>.Create(items, page, totalPages);
        }

        public async Task<TrainingSuggestion> GetRequiredTrainingSuggestionAsync(int suggestionId)
        {
            return await GetTrainingSuggestionByIdAsync(suggestionId)
                   ?? throw new NotFoundException("Suggestion de formation", suggestionId);
        }

        public async Task CreateTrainingSuggestionAsync(TrainingSuggestionCreationDto suggestion)
        {
            ArgumentNullException.ThrowIfNull(suggestion);

            await CreateTrainingSuggestionAsync(ToTrainingSuggestion(suggestion, suggestionId: 0));
        }

        public async Task UpdateTrainingSuggestionAsync(int suggestionId, TrainingSuggestionCreationDto suggestion)
        {
            ArgumentNullException.ThrowIfNull(suggestion);

            if (!await UpdateTrainingSuggestionAsync(ToTrainingSuggestion(suggestion, suggestionId)))
            {
                throw new NotFoundException("Suggestion de formation", suggestionId);
            }
        }

        public async Task DeleteTrainingSuggestionAsync(int suggestionId)
        {
            if (!await TryDeleteTrainingSuggestionAsync(suggestionId))
            {
                throw new NotFoundException("Suggestion de formation", suggestionId);
            }
        }

        public async Task<PagedResult<TrainingSuggestion>> GetTrainingSuggestionPageAsync(PageRequest page)
        {
            ArgumentNullException.ThrowIfNull(page);

            var (items, totalPages) = await GetPaginatedTrainingSuggestionsAsync(page.PageNumber, page.PageSize);

            return PagedResult<TrainingSuggestion>.Create(items, page, totalPages);
        }

        public async Task<object> GetRequiredEvaluationDetailsAsync(int evaluationId)
        {
            return await GetEvaluationDetailsAsync(evaluationId)
                   ?? throw new NotFoundException("Évaluation", evaluationId);
        }

        public async Task<bool> ValidateEvaluationAsync(EvaluationValidationDto validation)
        {
            ArgumentNullException.ThrowIfNull(validation);

            return await ValidateEvaluationAsync(
                validation.EvaluationId,
                validation.IsServiceApproved,
                validation.IsDgApproved,
                validation.ServiceApprovalDate,
                validation.DgApprovalDate);
        }

        private static EvaluationQuestionSummaryDto ToSummary(EvaluationQuestion question) =>
            new(question.questionId,
                question.question,
                question.evaluationTypeId,
                question.EvaluationType?.Designation,
                question.positionId,
                question.Position?.PositionName,
                question.CompetenceLineId,
                question.CompetenceLine?.Description,
                question.ResponseTypeId,
                question.ResponseType?.TypeName,
                question.state);

        private static TrainingSuggestion ToTrainingSuggestion(TrainingSuggestionCreationDto suggestion, int suggestionId) =>
            new()
            {
                TrainingSuggestionId = suggestionId,
                evaluationTypeId = suggestion.EvaluationTypeId,
                questionId = suggestion.QuestionId,
                Training = suggestion.Training,
                Details = suggestion.Details,
                scoreThreshold = suggestion.ScoreThreshold,
                state = suggestion.State
            };

        // Create a new evaluation question
        private async Task<bool> CreateEvaluationQuestionAsync(EvaluationQuestion question)
        {
            if (question == null) throw new ArgumentNullException(nameof(question));
            await _evaluationQuestion.CreateAsync(question);
            return true;
        }

        // Get all evaluation questions
        public async Task<IEnumerable<EvaluationQuestion>> GetAllEvaluationQuestionsAsync()
        {
            return await _dataService.GetAllQuestionsWithIncludes();
        }
        // Get a specific evaluation question by ID
        public async Task<EvaluationQuestion?> GetEvaluationQuestionByIdAsync(int id)
        {
            return await _evaluationQuestion.GetByIdAsync(id);
        }
        // Update an existing evaluation question
        private async Task<bool> UpdateEvaluationQuestionAsync(EvaluationQuestion question)
        {
            if (question == null) throw new ArgumentNullException(nameof(question));
            
            Console.WriteLine($"Debug: Mise à jour de la question avec ID {question.questionId}");
            Console.WriteLine($"Debug: Données reçues: {System.Text.Json.JsonSerializer.Serialize(question)}");
            
            try {
                // Récupérer la question existante pour conserver les relations
                var existingQuestion = await _dataService.GetQuestionWithIncludes(question.questionId);
                
                if (existingQuestion == null) {
                    Console.WriteLine($"Debug: Question avec ID {question.questionId} non trouvée");
                    return false;
                }
                
                // Mettre à jour uniquement les champs simples, pas les relations
                existingQuestion.question = question.question;
                existingQuestion.evaluationTypeId = question.evaluationTypeId;
                existingQuestion.positionId = question.positionId;
                existingQuestion.CompetenceLineId = question.CompetenceLineId;
                existingQuestion.ResponseTypeId = question.ResponseTypeId;
                existingQuestion.state = question.state;
                
                // Sauvegarder les modifications
                await _dataService.UpdateQuestion(existingQuestion);
                Console.WriteLine("Debug: Question mise à jour avec succès");
                return true;
            }
            catch (Exception ex) {
                Console.WriteLine($"Debug: Erreur lors de la mise à jour: {ex.Message}");
                Console.WriteLine($"Debug: Inner exception: {ex.InnerException?.Message}");
                throw; // Propager l'exception pour être gérée au niveau du contrôleur
            }
        }

        // Delete an evaluation question
        private async Task<bool> DeleteEvaluationQuestionAsync(int id)
        {
            var question = await _evaluationQuestion.GetByIdAsync(id);
            if (question == null) return false; // Not found

            await _evaluationQuestion.DeleteAsync(question);
            return true;
        }

        private async Task<IEnumerable<EvaluationQuestion>> GetEvaluationQuestionsAsync(int evaluationTypeId, int positionId)
        {
            return await _questionRepository.GetQuestionsByEvaluationTypeAndPostAsync(evaluationTypeId, positionId);
        }

        public async Task<IEnumerable<EvaluationType>> GetEvaluationTypeAsync()
        {
            return await _evaluationTypeRepository.GetAllAsync();
        }

        public double CalculateAverageRating(Dictionary<int, int> ratings)
        {
            if (ratings == null || ratings.Count == 0)
                return 0;

            var total = ratings.Values.Sum();
            var count = ratings.Count;

            return (double)total / count;
        }

        public async Task<List<TrainingSuggestionResultDto>> GetTrainingSuggestionsByQuestionsAsync(Dictionary<int, int> ratings)
        {
            try
            {
                Console.WriteLine("Début de la recherche des suggestions de formation");
                Console.WriteLine($"Nombre de notations fournies: {ratings?.Count ?? 0}");
                
                if (ratings == null || !ratings.Any())
                {
                    Console.WriteLine("Aucune notation fournie, impossible de trouver des suggestions");
                    return new List<TrainingSuggestionResultDto>();
                }

                // Afficher les ratings reçus pour le débogage
                foreach (var rating in ratings)
                {
                    Console.WriteLine($"Question ID: {rating.Key}, Note: {rating.Value}");
                }

                // 1. Récupérer d'abord toutes les suggestions de formation
                var allSuggestions = await _dataService.GetAllTrainingSuggestions();
                Console.WriteLine($"Nombre total de suggestions dans la base: {allSuggestions.Count}");
                
                // 2. Filtrer côté client selon les critères
                var suggestions = allSuggestions
                    .Where(ts => ratings.ContainsKey(ts.questionId) && ratings[ts.questionId] <= ts.scoreThreshold)
                    .ToList();
                
                Console.WriteLine($"Nombre de suggestions après filtrage: {suggestions.Count}");
                
                // 3. Récupérer les IDs des questions pour lesquelles nous avons des suggestions
                var questionIds = suggestions.Select(s => s.questionId).ToList();
                
                if (!questionIds.Any())
                {
                    Console.WriteLine("Aucune suggestion correspondant aux critères");
                    
                    // Vérifier pourquoi les suggestions ne correspondent pas
                    var matchingSuggestions = allSuggestions
                        .Where(ts => ratings.ContainsKey(ts.questionId))
                        .ToList();
                    
                    Console.WriteLine($"Questions évaluées présentes dans les suggestions: {matchingSuggestions.Count}");
                    
                    foreach (var suggestion in matchingSuggestions)
                    {
                        int rating = ratings[suggestion.questionId];
                        Console.WriteLine($"Question {suggestion.questionId}: Seuil {suggestion.scoreThreshold}, Note {rating}, evaluationTypeId {suggestion.evaluationTypeId}");
                    }
                    
                    return new List<TrainingSuggestionResultDto>();
                }

                // 4. Récupérer les questions correspondantes
                var questions = await _dataService.GetQuestionTextsAsync(questionIds);
                
                // 5. Créer les DTOs de résultat
                var result = suggestions.Select(s => new TrainingSuggestionResultDto
                {
                    Question = questions.ContainsKey(s.questionId) ? questions[s.questionId] : $"Question {s.questionId}",
                    Training = s.Training,
                    Details = s.Details
                }).ToList();

                Console.WriteLine($"Nombre final de suggestions retournées: {result.Count}");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération des suggestions: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                // Retourner une liste vide en cas d'erreur
                return new List<TrainingSuggestionResultDto>();
            }
        }
        
        private async Task<bool> ValidateEvaluationAsync(int evaluationId, bool isServiceApproved, bool isDgApproved, DateTime? serviceApprovalDate, DateTime? dgApprovalDate)
        {
            var evaluation = await _evaluationRepository.GetByIdAsync(evaluationId);
            if (evaluation == null) throw new Exception($"Evaluation with ID {evaluationId} not found.");

            evaluation.IsServiceApproved = isServiceApproved;
            evaluation.isDgApproved = isDgApproved;
            evaluation.serviceApprovalDate = serviceApprovalDate;
            evaluation.dgApprovalDate = dgApprovalDate;
            evaluation.state = 20;

            await _evaluationRepository.UpdateAsync(evaluation);
            
            // Calculer et sauvegarder les résultats par compétence
            if (_competenceService != null)
            {
                try 
                {
                    Console.WriteLine("Appel du service de compétence pour l'évaluation " + evaluationId);
                    await _competenceService.CalculateAndSaveCompetenceResultsAsync(evaluationId);
                }
                catch (Exception ex)
                {
                    // Log l'erreur mais continue sans échouer la validation
                    Console.WriteLine($"Erreur lors du calcul et de la sauvegarde des résultats par compétence: {ex.Message}");
                    Console.WriteLine(ex.StackTrace);
                }
            }
            else
            {
                Console.WriteLine("Service de compétence non disponible - aucun calcul de résultats par compétence");
            }
            
            return true;
        }

        public async Task<bool> SaveEvaluationResultsAsync(
       int evaluationId,
       Dictionary<int, int> ratings,
       decimal overallScore,
       string strengths,
       string weaknesses,
            string generalEvaluation,
            List<MultiCriteriaRatingDto>? detailedRatings = null)
        {
            var evaluation = await _evaluationRepository.GetByIdAsync(evaluationId);
            if (evaluation == null) throw new Exception($"Evaluation with ID {evaluationId} not found.");

            // Enregistrer les informations globales de l'évaluation
            evaluation.OverallScore = overallScore;
            evaluation.Comments = generalEvaluation;
            evaluation.strengths = strengths;
            evaluation.weaknesses = weaknesses;

            await _evaluationRepository.UpdateAsync(evaluation);

            // Réponses existantes (une par question). Ne pas écraser QCM/TEXT du salarié.
            var existingRows = await _dataService.ExecuteReaderAsync(
                "SELECT ResponseId, QuestionId, ResponseType FROM Evaluation_Responses WHERE EvaluationId = @p0",
                evaluationId);
            var existingByQuestion = existingRows
                .Select(r => new
                {
                    QuestionId = Convert.ToInt32(r["QuestionId"]),
                    ResponseId = Convert.ToInt32(r["ResponseId"]),
                    ResponseType = (r["ResponseType"]?.ToString() ?? string.Empty).Trim().ToUpperInvariant()
                })
                .GroupBy(r => r.QuestionId)
                .ToDictionary(g => g.Key, g => g.First());

            static bool IsEmployeeAnswer(string responseType) =>
                responseType is "QCM" or "TEXT";

            // Une seule écriture par question (notes + commentaires). Évite le doublon EF « Key: N ».
            var writes = new Dictionary<int, (string Value, string Type)>();
            foreach (var rating in ratings)
            {
                if (rating.Key <= 0) continue;
                writes[rating.Key] = (rating.Value.ToString(), "SCORE");
            }

            if (detailedRatings != null)
            {
                foreach (var detailedRating in detailedRatings)
                {
                    if (detailedRating == null || detailedRating.QuestionId <= 0) continue;

                    detailedRating.OverallRating = detailedRating.CalculateOverallRating();
                    writes[detailedRating.QuestionId] = (
                        System.Text.Json.JsonSerializer.Serialize(detailedRating),
                        "MULTI_CRITERIA");
                }
            }

            var now = DateTime.UtcNow;
            foreach (var write in writes)
            {
                int questionId = write.Key;
                var (value, responseType) = write.Value;

                if (existingByQuestion.TryGetValue(questionId, out var existing))
                {
                    if (IsEmployeeAnswer(existing.ResponseType))
                    {
                        continue;
                    }

                    await _dataService.ExecuteNonQueryAsync(@"
                        UPDATE Evaluation_Responses
                        SET ResponseValue = @p0, ResponseType = @p1, EndTime = @p2
                        WHERE ResponseId = @p3",
                        value, responseType, now, existing.ResponseId);
                }
                else
                {
                    await _dataService.ExecuteNonQueryAsync(@"
                        INSERT INTO Evaluation_Responses
                            (EvaluationId, QuestionId, ResponseType, ResponseValue, TimeSpent, StartTime, EndTime, IsCorrect, State, CreatedAt)
                        VALUES (@p0, @p1, @p2, @p3, 0, @p4, @p5, 0, 10, @p6)",
                        evaluationId, questionId, responseType, value, now, now, now);
                }
            }
            
            // Calculer et sauvegarder les résultats par compétence
            try
            {
                // Utiliser l'instance injectée du service de compétence ici
                if (_competenceService != null)
                    await _competenceService.CalculateAndSaveCompetenceResultsAsync(evaluationId);
            }
            catch (Exception ex)
            {
                // On log l'erreur mais on ne la propage pas pour ne pas bloquer l'enregistrement des résultats
                Console.WriteLine($"Erreur lors du calcul des résultats par compétence : {ex.Message}");
            }

            return true;
        }

        // Surcharge pour accepter le DTO complet
        public async Task<bool> SaveEvaluationResultsAsync(EvaluationResultsDto dto)
        {
            // Synchroniser les notes simples et détaillées si nécessaire
            if (dto.HasDetailedRatings())
            {
                dto.SynchronizeRatings();
            }
            
            return await SaveEvaluationResultsAsync(
                dto.EvaluationId,
                dto.Ratings,
                dto.OverallScore,
                dto.Strengths ?? string.Empty,
                dto.Weaknesses ?? string.Empty,
                dto.GeneralEvaluation ?? string.Empty,
                dto.DetailedRatings
            );
        }

        public async Task<int> CreateEvaluationAsync(
            int userId,
            int employeeId,
            int evaluationTypeId,
            List<int> supervisorIds,
            DateTime startDate,
            DateTime endDate,
            bool enableReminders = false)
        {
            await _dataService.BeginTransactionAsync();
            try
            {
                var employeeData = await _dataService.ExecuteReaderAsync(
                    "SELECT * FROM Employee WHERE Employee_id = @p0", employeeId);

                if (employeeData.Count == 0)
                {
                    throw new Exception($"Employé avec ID {employeeId} non trouvé");
                }

                var employeeRow = employeeData[0];

                // Créer une nouvelle évaluation
                var newEvaluation = new Evaluation
                {
                    EmployeeId = employeeId,
                    EvaluationTypeId = evaluationTypeId,
                    StartDate = startDate,
                    EndDate = endDate,
                    state = 10, // État "Planifié"
                    EnableReminders = enableReminders
                };

                // Sauvegarder l'évaluation
                await _evaluationRepository.CreateAsync(newEvaluation);
                await _dataService.SaveChangesAsync();

                Console.WriteLine($"Created evaluation with ID: {newEvaluation.EvaluationId}");

                // Initialiser la progression
                var progress = new EvaluationProgress
                {
                    evaluationId = newEvaluation.EvaluationId,
                    employeeId = employeeId,
                    totalQuestions = 0,
                    answeredQuestions = 0,
                    progressPercentage = 0,
                    lastUpdate = DateTime.UtcNow
                };
                await _dataService.AddRangeAsync(new[] { progress });

                // Créer les associations superviseur-évaluation
                var evaluationSupervisors = supervisorIds.Select(supervisorId => new EvaluationSupervisors
                {
                    EvaluationId = newEvaluation.EvaluationId,
                    SupervisorId = supervisorId
                }).ToList();

                // Ajouter toutes les associations en une seule fois
                await _dataService.AddRangeAsync(evaluationSupervisors);

                Console.WriteLine($"Added {evaluationSupervisors.Count} supervisors to evaluation {newEvaluation.EvaluationId}");

                    // Récupérer le type d'évaluation pour l'objet du mail
                    var evaluationType = await _evaluationTypeRepository.GetByIdAsync(evaluationTypeId);
                    string evaluationTypeName = evaluationType?.Designation ?? "Évaluation";

                    // Créer un compte temporaire pour l'employé
                    var tempAccount = await _temporaryAccountService.CreateTemporaryAccountAsync(
                        employeeId, 
                        newEvaluation.EvaluationId
                    );
                    
                    var employeeEmail = employeeRow.GetValueOrDefault("Email")?.ToString();
                    var employeeFirstName = employeeRow.GetValueOrDefault("FirstName")?.ToString() ?? "";
                    var employeeLastName = employeeRow.GetValueOrDefault("Name")?.ToString() ?? employeeRow.GetValueOrDefault("LastName")?.ToString() ?? "";

                    // Envoi des emails de notification — NON BLOQUANT : un échec SMTP ne doit pas
                    // annuler la création de l'évaluation (déjà persistée en base).
                    try
                    {
                        // Utiliser l'email de l'employé s'il est disponible
                        if (!string.IsNullOrEmpty(employeeEmail))
                        {
                            // Envoyer l'email de notification à l'employé
                            await _emailService.SendEmailAsync(
                                employeeEmail,
                                $"{evaluationTypeName} - Planification",
                                $"Bonjour {employeeFirstName} {employeeLastName},<br><br>" +
                                $"Nous vous informons qu'une {evaluationTypeName.ToLower()} a été planifiée à votre attention.<br><br>" +
                                $"<strong>Période d'évaluation :</strong> Du {startDate.ToShortDateString()} au {endDate.ToShortDateString()}<br><br>" +
                                $"<div class='credentials'>" +
                                $"<strong>Vos identifiants de connexion :</strong><br>" +
                                $"<strong>Login :</strong> {tempAccount.TempLogin}<br>" +
                                $"<strong>Mot de passe :</strong> {tempAccount.TempPassword}<br>" +
                                $"</div><br>" +
                                $"Ces identifiants seront valides à partir du {startDate.ToShortDateString()}.<br><br>" +
                                $"<a href='{_configuration["FrontendBaseUrl"]}/soft-gcc/evaluation/connexion' class='button'>Accéder à l'évaluation</a><br><br>" +
                                $"Cordialement,<br>" +
                                $"L'équipe Gestion des Carrières et Compétences"
                            );
                        }

                        // Envoyer des notifications par email à tous les superviseurs
                        foreach (var supervisorId in supervisorIds)
                        {
                            var supervisor = await _userRepository.GetByIdAsync(supervisorId);
                            if (supervisor != null && !string.IsNullOrEmpty(supervisor.Email))
                            {
                                string employeeName = !string.IsNullOrEmpty(employeeFirstName) ? $"{employeeFirstName} {employeeLastName}" : "Un employé";
                                
                                await _emailService.SendEmailAsync(
                                    supervisor.Email,
                                    $"{evaluationTypeName} - Planification à superviser",
                                    $"Bonjour {supervisor.FirstName} {supervisor.LastName},<br><br>" +
                                    $"Vous avez été désigné comme superviseur pour une {evaluationTypeName.ToLower()}.<br><br>" +
                                    $"<strong>Employé concerné :</strong> {employeeName}<br>" +
                                    $"<strong>Période d'évaluation :</strong> Du {startDate.ToShortDateString()} au {endDate.ToShortDateString()}<br><br>" +
                                    $"Veuillez vous connecter à votre compte pour consulter et gérer cette évaluation.<br><br>" +
                                    $"<a href='{_configuration["FrontendBaseUrl"]}/soft-gcc/evaluations/liste' class='button'>Accéder au système</a><br><br>" +
                                    $"Cordialement,<br>" +
                                    $"L'équipe Gestion des Carrières et Compétences"
                                );
                            }
                        }
                    }
                    catch (Exception emailEx)
                    {
                        // Un problème SMTP (ex. identifiants invalides) ne doit pas bloquer la création de l'évaluation.
                        Console.WriteLine($"Erreur envoi email de planification (ignorée, l'évaluation est conservée) : {emailEx.Message}");
                        Console.WriteLine($"Inner exception: {emailEx.InnerException?.Message}");
                    }

                    await _dataService.CommitTransactionAsync();

                    // Notification in-app : informer les superviseurs, le planificateur et l'employé.
                    // Chaque envoi est isolé : un destinataire invalide ne doit pas bloquer les autres.
                    try
                    {
                        var users = await _userRepository.GetAllAsync();
                        var employeeUser = users.FirstOrDefault(u => u.EmployeeId == employeeId);

                        async Task TryNotifyAsync(int recipientUserId, string title, string message, string link)
                        {
                            if (recipientUserId <= 0)
                            {
                                Console.WriteLine($"Notification ignorée : userId invalide ({recipientUserId}).");
                                return;
                            }

                            try
                            {
                                await _notificationService.SendAsync(
                                    recipientUserId,
                                    "evaluation_assigned",
                                    title,
                                    message,
                                    link
                                );
                            }
                            catch (Exception sendEx)
                            {
                                Console.WriteLine($"Erreur notification in-app pour user {recipientUserId}: {sendEx.Message}");
                                if (sendEx.InnerException != null)
                                    Console.WriteLine($"Inner: {sendEx.InnerException.Message}");
                            }
                        }

                        // 1. Notifier le planificateur (admin/RH/manager qui a créé l'évaluation)
                        await TryNotifyAsync(
                            userId,
                            $"{evaluationTypeName} planifiée",
                            $"Évaluation créée pour {employeeFirstName} {employeeLastName} (du {startDate:dd/MM/yyyy} au {endDate:dd/MM/yyyy}).",
                            "/soft-gcc/evaluations/liste"
                        );

                        // 2. Notifier les superviseurs
                        foreach (var supervisorId in supervisorIds.Where(id => id > 0 && id != userId).Distinct())
                        {
                            await TryNotifyAsync(
                                supervisorId,
                                $"Nouvelle {evaluationTypeName}",
                                $"Vous êtes superviseur pour {employeeFirstName} {employeeLastName}.",
                                "/soft-gcc/evaluations/liste"
                            );
                        }

                        // 3. Notifier l'employé évalué (s'il a un compte utilisateur)
                        if (employeeUser != null && employeeUser.Id != userId)
                        {
                            await TryNotifyAsync(
                                employeeUser.Id,
                                $"{evaluationTypeName} planifiée",
                                $"Une {evaluationTypeName.ToLower()} a été planifiée pour vous (du {startDate:dd/MM/yyyy} au {endDate:dd/MM/yyyy}).",
                                "/soft-gcc/evaluation/connexion"
                            );
                        }
                    }
                    catch (Exception notifEx)
                    {
                        Console.WriteLine($"Erreur notification in-app: {notifEx.Message}");
                    }

                    return newEvaluation.EvaluationId;
                }
                catch (Exception ex)
                {
                    await _dataService.RollbackTransactionAsync();
                    Console.WriteLine($"Error in CreateEvaluationAsync: {ex.Message}");
                    Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    throw;
                }
        }

        private async Task<bool> CreateTrainingSuggestionAsync(TrainingSuggestion suggestion)
        {
            if (suggestion == null) throw new ArgumentNullException(nameof(suggestion));

            await _trainingSuggestionsRepository.CreateAsync(suggestion);
            return true;
        }

        //public async Task<int> rappelerEvaluation(int evaluation_id)
        //{
        //    try
        //    {
        //        var evaluation = await _evaluationRepository.GetByIdAsync(evaluation_id);
        //        int idUser = evaluation.UserId;
        //        var user = await _userRepository.GetByIdAsync(idUser);
        //        await _emailService.SendEmailAsync(user.Email, "Rappel évaluation",
        //            $"Pour rappel , vous avez une évaluation le : {evaluation.StartDate} au {evaluation.EndDate}");
        //    }
        //    catch (Exception e)
        //    {
        //        return 0;
        //    }
        //    return 1;
        //}

        // Method to send reminder emails for evaluations that are due
        public async Task SendAutomaticRemindersAsync()
        {
            var upcomingEvaluations = await GetUpcomingEvaluationsAsync();

            // Ne traiter que les évaluations avec reminders activés
            var evaluationsToRemind = upcomingEvaluations
                .Where(e => e.EnableReminders)
                .ToList();
        
            Console.WriteLine($"Sending reminders for {evaluationsToRemind.Count} evaluations (out of {upcomingEvaluations.Count} upcoming)");

            foreach (var evaluation in evaluationsToRemind)
            {
                await SendReminderEmailAsync(evaluation.EmployeeId, evaluation.StartDate);
            }
        }

        // Method to get evaluations that are due for reminders (e.g., 2 days before the evaluation date)
        public async Task<List<Evaluation>> GetUpcomingEvaluationsAsync()
        {
            var today = DateTime.UtcNow;
            var reminderDate = today.AddDays(_reminderSettings.DaysBefore); // Use the configured days before

            var evaluations = await _evaluationRepository.GetAllAsync();
            return evaluations.Where(e => e.StartDate.Date == reminderDate.Date).ToList();
        }

        // Method to send a reminder email to the user
        public async Task SendReminderEmailAsync(int userId, DateTime evaluationDate)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return;

            // Récupérer l'évaluation en cours pour cet utilisateur
            var evaluation = await _evaluationRepository.FindAsync(e =>
                e.EmployeeId == userId &&
                e.StartDate == evaluationDate &&
                e.state == 10);

            if (evaluation == null || !evaluation.Any()) return;

            var currentEvaluation = evaluation.First();
            
            // Récupérer le type d'évaluation
            var evaluationType = await _evaluationTypeRepository.GetByIdAsync(currentEvaluation.EvaluationTypeId);
            string evaluationTypeName = evaluationType?.Designation ?? "Évaluation";

            // Récupérer le compte temporaire existant ou en créer un nouveau
            var tempAccount = await _dataService.GetTemporaryAccountAsync(userId, currentEvaluation.EvaluationId);

            if (tempAccount == null)
            {
                // Si pas de compte existant, en créer un nouveau
                tempAccount = await _temporaryAccountService.CreateTemporaryAccountAsync(userId, currentEvaluation.EvaluationId);
            }

            // Envoyer l'email de rappel avec les identifiants à l'employé
            if (string.IsNullOrEmpty(user.Email)) return;
            await _emailService.SendEmailAsync(
                user.Email,
                $"{evaluationTypeName} - Rappel",
                $"Bonjour {user.FirstName} {user.LastName},<br><br>" +
                $"Ceci est un rappel que vous avez une {evaluationTypeName.ToLower()} prévue le {evaluationDate.ToShortDateString()}.<br><br>" +
                $"<div class='credentials'>" +
                $"<strong>Vos identifiants de connexion :</strong><br>" +
                $"<strong>Login :</strong> {tempAccount.TempLogin}<br>" +
                $"<strong>Mot de passe :</strong> {tempAccount.TempPassword}<br>" +
                $"</div><br>" +
                $"Ces identifiants ne seront valides qu'à partir du {currentEvaluation.StartDate.ToShortDateString()}.<br><br>" +
                $"<a href='{_configuration["FrontendBaseUrl"]}/soft-gcc/evaluation/connexion' class='button'>Accéder à l'évaluation</a><br><br>" +
                $"Cordialement,<br>" +
                $"L'équipe Gestion des Carrières et Compétences"
            );
            
            // Envoyer des rappels aux superviseurs également
            var supervisors = await _dataService.GetSupervisorsForEvaluationAsync(currentEvaluation.EvaluationId);

            foreach (var supervisor in supervisors)
            {
                if (!string.IsNullOrEmpty(supervisor.Email))
                {
                    await _emailService.SendEmailAsync(
                        supervisor.Email,
                        $"{evaluationTypeName} - Rappel de supervision",
                        $"Bonjour {supervisor.FirstName} {supervisor.LastName},<br><br>" +
                        $"Ceci est un rappel concernant une {evaluationTypeName.ToLower()} que vous devez superviser, prévue pour le {evaluationDate.ToShortDateString()}.<br><br>" +
                        $"<strong>Employé concerné:</strong> {user.FirstName} {user.LastName}<br><br>" +
                        $"Cordialement,<br>" +
                        $"L'équipe Gestion des Carrières et Compétences"
                    );
                }
            }
        }

        // Existing rappelerEvaluation method (if needed for manual reminders)
        public async Task<int> rappelerEvaluation(int evaluationId)
        {
            try
            {
                var evaluation = await _evaluationRepository.GetByIdAsync(evaluationId);
                if (evaluation == null) return 0; // Evaluation not found

                int userId = evaluation.EmployeeId;
                await SendReminderEmailAsync(userId, evaluation.StartDate);
            }
            catch (Exception)
            {
                return 0; // Error occurred
            }
            return 1; // Success
        }

        public async Task<IEnumerable<Position>> GetPostesAsync()
        {
            return await _posteRepository.GetAllAsync(); // Assuming you have a repository for posts
        }

        //METHOD FOR CRUD TRAINING SUGGESTIONS
        // Get all training suggestions
        public async Task<IEnumerable<TrainingSuggestion>> GetAllTrainingSuggestionsAsync()
        {
            return await _dataService.GetAllTrainingSuggestionsWithIncludesAsync();
        }

        // Get a specific training suggestion by ID
        private async Task<TrainingSuggestion?> GetTrainingSuggestionByIdAsync(int id)
        {
            return await _dataService.GetTrainingSuggestionByIdWithIncludesAsync(id);
        }

        // Update an existing training suggestion
        private async Task<bool> UpdateTrainingSuggestionAsync(TrainingSuggestion suggestion)
        {
            if (suggestion == null) throw new ArgumentNullException(nameof(suggestion));

            var existingSuggestion = await _trainingSuggestionsRepository.GetByIdAsync(suggestion.TrainingSuggestionId);
            if (existingSuggestion == null) return false; // Not found

            existingSuggestion.evaluationTypeId = suggestion.evaluationTypeId;
            existingSuggestion.questionId = suggestion.questionId;
            existingSuggestion.Training = suggestion.Training;
            existingSuggestion.Details = suggestion.Details;
            existingSuggestion.scoreThreshold = suggestion.scoreThreshold;
            existingSuggestion.state = suggestion.state;

            await _trainingSuggestionsRepository.UpdateAsync(existingSuggestion);
            return true;
        }

        // Delete a training suggestion
        private async Task<bool> TryDeleteTrainingSuggestionAsync(int id)
        {
            var suggestion = await _trainingSuggestionsRepository.GetByIdAsync(id);
            if (suggestion == null) return false; // Not found

            await _trainingSuggestionsRepository.DeleteAsync(suggestion);
            return true;
        }

        // Get paginated training suggestions
        private async Task<(IEnumerable<TrainingSuggestion> Items, int TotalPages)> GetPaginatedTrainingSuggestionsAsync(int pageNumber, int pageSize)
        {
            // Utilisez la méthode de pagination de votre repository
            var items = _trainingSuggestionsRepository.GetPage(pageNumber, pageSize, "evaluationType,evaluationQuestion");

            // Obtenez le nombre total de pages
            var totalPages = _trainingSuggestionsRepository.GetTotalPages(pageSize);

            return (items, totalPages);
        }

        // Get paginated evaluation questions
        public async Task<(IEnumerable<EvaluationQuestion> Items, int TotalPages)> GetPaginatedEvaluationQuestionsAsync(int pageNumber, int pageSize)
        {
            try
            {
                var (items, totalCount) = await _dataService.GetPaginatedQuestionsAsync(pageNumber, pageSize);
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
                return (items, totalPages);
            }
            catch (Exception ex)
            {
                // Log l'erreur pour le débogage
                Console.WriteLine($"Erreur dans GetPaginatedEvaluationQuestionsAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                throw new Exception($"Erreur lors de la récupération des questions paginées : {ex.Message}");
            }
        }

        public async Task<List<int>> CreateEvaluationWithSelectedQuestionsAsync(CreateEvaluationWithQuestionsDto dto, int userId = 0)
        {
            var createdEvaluationIds = new List<int>();

                foreach (var employeeQuestion in dto.EmployeeQuestions)
                {
                // Créer l'évaluation — userId du JWT (évite FK notifications avec userId=0)
                    var evaluationId = await CreateEvaluationAsync(
                        userId,
                        employeeQuestion.EmployeeId,
                    dto.EvaluationTypeId,
                        dto.SupervisorIds,
                        dto.StartDate,
                    dto.EndDate,
                    dto.EnableReminders // Ajouter le paramètre de rappel
                    );

                    // Ajouter les questions sélectionnées avec leurs compétences
                    var attachedCount = 0;
                    foreach (var question in employeeQuestion.SelectedQuestions)
                    {
                        var competenceLineId = await ResolveCompetenceLineIdAsync(question.QuestionId, question.CompetenceLineId);
                        if (competenceLineId <= 0)
                        {
                            continue;
                        }

                        var selectedQuestion = new EvaluationSelectedQuestions
                        {
                            EvaluationId = evaluationId,
                            QuestionId = question.QuestionId,
                            CompetenceLineId = competenceLineId
                        };
                        await _dataService.AddSelectedQuestionAsync(selectedQuestion);
                        attachedCount++;
                    }

                    if (attachedCount == 0)
                    {
                        throw new InvalidOperationException(
                            $"Aucune question avec une compétence valide n’a pu être associée à l’évaluation de l’employé {employeeQuestion.EmployeeId}.");
                    }

                    // Mettre à jour le nombre total de questions dans la progression
                    var progress = await _dataService.GetProgressByEvaluationIdAsync(evaluationId);
                    if (progress != null)
                    {
                        progress.totalQuestions = attachedCount;
                        await _dataService.SaveChangesAsync();
                    }

                createdEvaluationIds.Add(evaluationId);
                }

                await _dataService.SaveChangesAsync();
            return createdEvaluationIds;
        }

        private async Task<int> GetCompetenceLineIdForQuestion(int questionId)
        {
            var question = await _evaluationQuestion.GetByIdAsync(questionId);
            if (question == null)
                throw new Exception($"Question avec ID {questionId} non trouvée");
            if (!question.CompetenceLineId.HasValue)
                throw new Exception($"La question avec ID {questionId} n'a pas de ligne de compétence associée");
            return question.CompetenceLineId.Value;
        }

        private async Task<int> ResolveCompetenceLineIdAsync(int questionId, int? requestedCompetenceLineId)
        {
            if (requestedCompetenceLineId is > 0)
            {
                return requestedCompetenceLineId.Value;
            }

            var question = await _evaluationQuestion.GetByIdAsync(questionId);
            return question?.CompetenceLineId is > 0 ? question.CompetenceLineId.Value : 0;
        }

        public async Task<IEnumerable<EvaluationSelectedQuestions>> GetSelectedQuestionsAsync(int evaluationId)
        {
            return await _dataService.GetSelectedQuestionsForEvaluationAsync(evaluationId);
        }

        public async Task<bool> AddSelectedQuestionAsync(int evaluationId, int questionId, int competenceLineId)
        {
            var selectedQuestion = new EvaluationSelectedQuestions
            {
                EvaluationId = evaluationId,
                QuestionId = questionId,
                CompetenceLineId = competenceLineId
            };

            await _dataService.AddSelectedQuestionAsync(selectedQuestion);
            return true;
        }

        public async Task<bool> RemoveSelectedQuestionAsync(int evaluationId, int questionId)
        {
            var selectedQuestion = await _dataService.FindSelectedQuestionAsync(evaluationId, questionId);

            if (selectedQuestion == null)
                return false;

            await _dataService.RemoveSelectedQuestionAsync(selectedQuestion);
            return true;
        }

        public async Task<bool> UpdateSelectedQuestionAsync(int evaluationId, int questionId, int newCompetenceLineId)
        {
            var selectedQuestion = await _dataService.FindSelectedQuestionAsync(evaluationId, questionId);

            if (selectedQuestion == null)
                return false;

            selectedQuestion.CompetenceLineId = newCompetenceLineId;
            await _dataService.SaveChangesAsync();
            return true;
        }


        private async Task<(IEnumerable<EvaluationQuestion> Items, int TotalPages)> GetPaginatedEvaluationQuestionsByTypeAsync(int evaluationTypeId, int pageNumber, int pageSize)
        {
            try
            {
                var (items, totalCount) = await _dataService.GetPaginatedQuestionsByTypeAsync(evaluationTypeId, pageNumber, pageSize);
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
                return (items, totalPages);
            }
            catch (Exception ex)
            {
                throw new Exception($"Erreur lors de la récupération des questions paginées : {ex.Message}");
            }
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetEvaluationQuestionsByPositionAsync(int positionId)
        {
            return await _questionRepository.GetQuestionsByPositionAsync(positionId);
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetEvaluationQuestionsByTypePositionAndCompetenceAsync(int evaluationTypeId, int positionId, int competenceLineId)
        {
            return await _questionRepository.GetQuestionsByEvaluationTypePositionAndCompetenceAsync(evaluationTypeId, positionId, competenceLineId);
        }

        private async Task<IEnumerable<EvaluationQuestion>> GetEvaluationQuestionsByTypeAndCompetenceAsync(int evaluationTypeId, int competenceLineId)
        {
            return await _questionRepository.GetQuestionsByEvaluationTypeAndCompetenceAsync(evaluationTypeId, competenceLineId);
        }

        // Méthode pour récupérer une évaluation par son ID
        public async Task<Evaluation?> GetEvaluationByIdAsync(int evaluationId)
        {
            return await _evaluationRepository.GetByIdAsync(evaluationId);
        }

        // Méthode pour mettre à jour une évaluation
        public async Task<bool> UpdateEvaluationAsync(Evaluation evaluation)
        {
            if (evaluation == null) throw new ArgumentNullException(nameof(evaluation));
            
            // Mettre à jour l'évaluation dans le repository
            await _evaluationRepository.UpdateAsync(evaluation);
            return true;
        }

        // ===================== New methods for controller refactoring =====================

        // Get evaluation details with employee, evaluation type and position info
        private async Task<object?> GetEvaluationDetailsAsync(int id)
        {
            var evaluation = await _evaluationRepository.GetByIdAsync(id);
            if (evaluation == null) return null;

            // Get employee name
            string employeeName = "Unknown";
            var employeeRows = await _dataService.ExecuteReaderAsync(
                "SELECT FirstName, Name FROM Employee WHERE Employee_id = @p0", evaluation.EmployeeId);
            if (employeeRows.Count > 0)
            {
                employeeName = $"{employeeRows[0]["FirstName"]} {employeeRows[0]["Name"]}";
            }

            // Get employee position info from view
            string? positionName = null;
            string? departmentName = null;
            var positionRows = await _dataService.ExecuteReaderAsync(
                "SELECT Position_name, Department_name FROM v_employee_position WHERE Employee_id = @p0", evaluation.EmployeeId);
            if (positionRows.Count > 0)
            {
                positionName = positionRows[0].GetValueOrDefault("Position_name")?.ToString();
                departmentName = positionRows[0].GetValueOrDefault("Department_name")?.ToString();
            }

            // Get evaluation type
            var evalType = await _evaluationTypeRepository.GetByIdAsync(evaluation.EvaluationTypeId);

            return new
            {
                evaluationId = evaluation.EvaluationId,
                title = evalType?.Designation ?? "",
                description = $"Évaluation du {evaluation.StartDate.ToShortDateString()} au {evaluation.EndDate.ToShortDateString()}",
                employeeName,
                position = positionName ?? "Non défini",
                department = departmentName ?? "Non défini",
                evaluationTypeId = evaluation.EvaluationTypeId
            };
        }

        // Get evaluation templates (types with question counts)
        public async Task<IEnumerable<object>> GetEvaluationTemplatesAsync()
        {
            var types = await _evaluationTypeRepository.GetAllAsync();
            var questions = await _evaluationQuestion.GetAllAsync();

            return types
                .Where(et => et.state == 1)
                .Select(et => new
                {
                    id = et.EvaluationTypeId,
                    title = et.Designation,
                    description = et.Designation,
                    questionCount = questions.Count(q => q.evaluationTypeId == et.EvaluationTypeId && q.state == 1)
                })
                .ToList();
        }

        // Get questions by evaluation type with response types and time configs
        public async Task<IEnumerable<object>> GetQuestionsByEvaluationTypeAsync(int evaluationTypeId)
        {
            // Get questions
            var questions = await _evaluationQuestion.GetAllAsync();
            var filteredQuestions = questions.Where(q => q.evaluationTypeId == evaluationTypeId && q.state == 1).ToList();

            // Get response types
            var responseTypes = await _dataService.GetAllResponseTypesAsync();
            var responseTypeDict = responseTypes.ToDictionary(rt => rt.ResponseTypeId, rt => rt.TypeName);

            // Get time configs
            var questionIds = filteredQuestions.Select(q => q.questionId).ToList();
            var timeConfigRows = questionIds.Count > 0
                ? await _dataService.ExecuteReaderAsync(
                    $"SELECT QuestionId, MaxTimeInMinutes FROM EvaluationQuestionConfig WHERE QuestionId IN ({string.Join(",", questionIds)})")
                : new List<Dictionary<string, object>>();

            var timeConfigs = timeConfigRows
                .GroupBy(r => Convert.ToInt32(r["QuestionId"]))
                .ToDictionary(g => g.Key, g => Convert.ToInt32(g.First()["MaxTimeInMinutes"]));

            return filteredQuestions.Select(q => new
            {
                questionId = q.questionId,
                text = q.question,
                positionId = q.positionId,
                competenceLineId = q.CompetenceLineId,
                responseType = responseTypeDict.ContainsKey(q.ResponseTypeId) ? responseTypeDict[q.ResponseTypeId] : "TEXT",
                maxTimeInMinutes = timeConfigs.ContainsKey(q.questionId) ? timeConfigs[q.questionId] : 15
            }).ToList();
        }

        // Update time configs for questions
        public async Task UpdateQuestionsTimeAsync(List<QuestionTimeUpdateDto> questions)
        {
            foreach (var questionUpdate in questions)
            {
                var existingRows = await _dataService.ExecuteReaderAsync(
                    "SELECT Id, QuestionId, MaxTimeInMinutes FROM EvaluationQuestionConfig WHERE QuestionId = @p0",
                    questionUpdate.QuestionId);

                if (existingRows.Count > 0)
                {
                    var configId = Convert.ToInt32(existingRows[0]["Id"]);
                    await _dataService.ExecuteNonQueryAsync(
                        "UPDATE EvaluationQuestionConfig SET MaxTimeInMinutes = @p0, UpdatedAt = @p1 WHERE Id = @p2",
                        questionUpdate.MaxTimeInMinutes, DateTime.UtcNow, configId);
                }
                else
                {
                    await _dataService.ExecuteNonQueryAsync(
                        "INSERT INTO EvaluationQuestionConfig (QuestionId, MaxTimeInMinutes, CreatedAt, UpdatedAt) VALUES (@p0, @p1, @p2, @p3)",
                        questionUpdate.QuestionId, questionUpdate.MaxTimeInMinutes, DateTime.UtcNow, DateTime.UtcNow);
                }
            }
        }

        // Get selected questions and responses for an evaluation (from EvaluationController)
        public async Task<IEnumerable<object>> GetSelectedQuestionsAndResponsesAsync(int evaluationId)
        {
            // Get selected questions with question data
            var selectedRows = await _dataService.ExecuteReaderAsync(@"
                SELECT esq.QuestionId, eq.question, eq.CompetenceLineId, eq.ResponseTypeId,
                       er.ResponseValue, er.IsCorrect, er.ResponseId
                FROM Evaluation_Selected_Questions esq
                INNER JOIN Evaluation_questions eq ON esq.QuestionId = eq.Question_id
                LEFT JOIN Evaluation_Responses er ON er.EvaluationId = @p0 AND er.QuestionId = eq.Question_id
                WHERE esq.EvaluationId = @p0", evaluationId);

            // Get time configs
            var questionIds = selectedRows
                .Select(r => Convert.ToInt32(r["QuestionId"]))
                .Distinct()
                .ToList();

            var timeConfigs = new Dictionary<int, int>();
            if (questionIds.Count > 0)
            {
                var placeholders = string.Join(",", questionIds.Select((_, i) => $"@p{i + 1}"));
                var allParams = new List<object> { evaluationId };
                allParams.AddRange(questionIds.Cast<object>());
                
                var timeRows = await _dataService.ExecuteReaderAsync(
                    $"SELECT QuestionId, MaxTimeInMinutes FROM EvaluationQuestionConfig WHERE QuestionId IN ({placeholders})",
                    allParams.ToArray());
                
                timeConfigs = timeRows
                    .GroupBy(r => Convert.ToInt32(r["QuestionId"]))
                    .ToDictionary(g => g.Key, g => Convert.ToInt32(g.First()["MaxTimeInMinutes"]));
            }

            // Get response types
            var responseTypes = await _dataService.GetAllResponseTypesAsync();
            var responseTypeDict = responseTypes.ToDictionary(rt => rt.ResponseTypeId, rt => rt.TypeName);

            // Get competence lines
            var competenceLineIds = selectedRows
                .Select(r => r["CompetenceLineId"] as int? ?? (r["CompetenceLineId"] != DBNull.Value ? Convert.ToInt32(r["CompetenceLineId"]) : (int?)null))
                .Where(id => id.HasValue)
                .Select(id => id.Value)
                .Distinct()
                .ToList();

            var competenceLines = new Dictionary<int, string>();
            if (competenceLineIds.Count > 0)
            {
                var clPlaceholders = string.Join(",", competenceLineIds.Select((_, i) => $"@p{i}"));
                var clRows = await _dataService.ExecuteReaderAsync(
                    $"SELECT CompetenceLineId, Description FROM Competence_Lines WHERE CompetenceLineId IN ({clPlaceholders})",
                    competenceLineIds.Cast<object>().ToArray());
                competenceLines = clRows
                    .GroupBy(r => Convert.ToInt32(r["CompetenceLineId"]))
                    .ToDictionary(g => g.Key, g => g.First()["Description"]?.ToString() ?? "Non spécifiée");
            }

            // Get option IDs from responses for QCM
            var optionIds = new List<int>();
            foreach (var row in selectedRows)
            {
                var responseValue = row.GetValueOrDefault("ResponseValue")?.ToString();
                if (responseValue != null && int.TryParse(responseValue, out int optId))
                {
                    optionIds.Add(optId);
                }
            }

            var options = new Dictionary<int, string>();
            if (optionIds.Count > 0)
            {
                var optPlaceholders = string.Join(",", optionIds.Select((_, i) => $"@p{i}"));
                var optRows = await _dataService.ExecuteReaderAsync(
                    $"SELECT optionId, optionText FROM evaluation_question_options WHERE optionId IN ({optPlaceholders})",
                    optionIds.Cast<object>().ToArray());
                options = optRows
                    .Select(r =>
                    {
                        r.TryGetValue("optionId", out var idObj);
                        r.TryGetValue("optionText", out var textObj);
                        var id = idObj is null or DBNull ? 0 : Convert.ToInt32(idObj);
                        return new { Id = id, Text = textObj?.ToString() ?? "" };
                    })
                    .Where(o => o.Id > 0)
                    .GroupBy(o => o.Id)
                    .ToDictionary(g => g.Key, g => g.First().Text);
            }

            var result = new List<object>();
            foreach (var row in selectedRows)
            {
                var questionId = Convert.ToInt32(row["QuestionId"]);
                responseTypeDict.TryGetValue(Convert.ToInt32(row["ResponseTypeId"]), out var responseType);

                var responseValue = row.GetValueOrDefault("ResponseValue")?.ToString();
                var isCorrect = row.ContainsKey("IsCorrect") && row["IsCorrect"] != DBNull.Value && Convert.ToBoolean(row["IsCorrect"]);

                string competenceName = "Non spécifiée";
                var clIdObj = row["CompetenceLineId"];
                if (clIdObj != DBNull.Value && competenceLines.TryGetValue(Convert.ToInt32(clIdObj), out var cn))
                {
                    competenceName = cn;
                }

                string formattedResponse = responseValue ?? string.Empty;
                if (responseType == "QCM" && responseValue != null && int.TryParse(responseValue, out int optId) && options.TryGetValue(optId, out var optText))
                {
                    formattedResponse = optText!;
                }

                int maxTime = timeConfigs.ContainsKey(questionId) ? timeConfigs[questionId] : 15;

                result.Add(new
                {
                    QuestionId = questionId,
                    QuestionText = row["question"]?.ToString() ?? "",
                    CompetenceLineId = clIdObj != DBNull.Value ? Convert.ToInt32(clIdObj) : (int?)null,
                    CompetenceName = competenceName,
                    ResponseType = responseType,
                    ResponseValue = formattedResponse,
                    IsCorrect = isCorrect,
                    MaxTimeInMinutes = maxTime
                });
            }

            return result;
        }

        // Submit evaluation - complex logic moved from controller
        public async Task SubmitEvaluationAsync(int evaluationId, EvaluationSubmissionDto submission)
        {
            // Récupérer l'évaluation pour mettre à jour sa date de complétion
            var evaluation = await _evaluationRepository.GetByIdAsync(evaluationId);
            if (evaluation == null)
                throw new Exception($"Évaluation avec ID {evaluationId} non trouvée");

            // Mettre à jour la date de complétion
            evaluation.completionDate = submission.CompletionDate;
            evaluation.state = 20; // État terminé
            await _evaluationRepository.UpdateAsync(evaluation);

            // Récupérer les IDs de réponses existantes pour cette évaluation
            var existingRows = await _dataService.ExecuteReaderAsync(
                "SELECT ResponseId, QuestionId FROM Evaluation_Responses WHERE EvaluationId = @p0", evaluationId);
            var existingByQuestion = existingRows
                .GroupBy(r => Convert.ToInt32(r["QuestionId"]))
                .ToDictionary(g => g.Key, g => Convert.ToInt32(g.First()["ResponseId"]));

            var minValidDate = new DateTime(1753, 1, 1);
            foreach (var response in submission.Responses)
            {
                if (response.StartTime < minValidDate || response.EndTime < minValidDate)
                {
                    throw new Exception("Les dates doivent être supérieures ou égales au 1er janvier 1753.");
                }

                // Vérifier si la réponse est correcte
                bool isCorrect = false;
                if (response.ResponseType == "QCM")
                {
                    if (int.TryParse(response.ResponseValue, out int optionId))
                    {
                        var count = await _dataService.ExecuteScalarAsync(
                            "SELECT COUNT(1) FROM evaluation_question_options WHERE questionId = @p0 AND optionId = @p1 AND isCorrect = 1",
                            response.QuestionId, optionId);
                        isCorrect = count > 0;
                    }
                }

                if (existingByQuestion.TryGetValue(response.QuestionId, out var existingResponseId))
                {
                    // Mettre à jour la réponse existante
                    await _dataService.ExecuteNonQueryAsync(@"
                        UPDATE Evaluation_Responses 
                        SET ResponseType = @p0, ResponseValue = @p1, TimeSpent = @p2, 
                            StartTime = @p3, EndTime = @p4, IsCorrect = @p5, State = @p6
                        WHERE ResponseId = @p7",
                        response.ResponseType, response.ResponseValue, response.TimeSpent,
                        response.StartTime, response.EndTime, isCorrect, 1, existingResponseId);
                }
                else
                {
                    // Insérer une nouvelle réponse
                    await _dataService.ExecuteNonQueryAsync(@"
                        INSERT INTO Evaluation_Responses (EvaluationId, QuestionId, ResponseType, ResponseValue, TimeSpent, StartTime, EndTime, IsCorrect, State, CreatedAt)
                        VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9)",
                        evaluationId, response.QuestionId, response.ResponseType, response.ResponseValue,
                        response.TimeSpent, response.StartTime, response.EndTime, isCorrect, 1, DateTime.UtcNow);
                }
            }

            // Marquer le compte temporaire comme utilisé
            var tempAccountRows = await _dataService.ExecuteReaderAsync(
                "SELECT TempAccountId FROM TemporaryAccounts WHERE Evaluations_id = @p0", evaluationId);
            if (tempAccountRows.Count > 0)
            {
                var tempAccountId = Convert.ToInt32(tempAccountRows[0]["TempAccountId"]);
                await _dataService.ExecuteNonQueryAsync(
                    "UPDATE TemporaryAccounts SET IsUsed = 1 WHERE TempAccountId = @p0", tempAccountId);
            }

            // Récupérer l'employé associé
            var employeeRows = await _dataService.ExecuteReaderAsync(
                "SELECT FirstName, Name, Email FROM Employee WHERE Employee_id = @p0", evaluation.EmployeeId);
            string employeeName = "Un employé";
            if (employeeRows.Count > 0)
            {
                employeeName = $"{employeeRows[0]["FirstName"]} {employeeRows[0]["Name"]}";
            }

            // Récupérer le type d'évaluation
            var evalType = await _evaluationTypeRepository.GetByIdAsync(evaluation.EvaluationTypeId);
            string evaluationTypeName = evalType?.Designation ?? "Évaluation";

            // Récupérer les superviseurs et envoyer des notifications
            var supervisorRows = await _dataService.ExecuteReaderAsync(@"
                SELECT u.Email, u.FirstName, u.LastName 
                FROM EvaluationSupervisors es
                INNER JOIN Users u ON es.SupervisorId = u.UserId
                WHERE es.EvaluationId = @p0", evaluationId);

            foreach (var supervisor in supervisorRows)
            {
                var email = supervisor["Email"]?.ToString();
                if (!string.IsNullOrEmpty(email))
                {
                    try
                    {
                        await _emailService.SendEmailAsync(
                            email,
                            $"{evaluationTypeName} - Évaluation soumise",
                            $"Bonjour {supervisor["FirstName"]} {supervisor["LastName"]},<br><br>" +
                            $"Nous vous informons que {employeeName} a soumis son {evaluationTypeName.ToLower()}.<br><br>" +
                            $"<strong>Date de soumission :</strong> {submission.CompletionDate.ToShortDateString()}<br>" +
                            $"<strong>Période d'évaluation :</strong> Du {evaluation.StartDate.ToShortDateString()} au {evaluation.EndDate.ToShortDateString()}<br><br>" +
                            $"En tant que superviseur désigné, vous êtes invité(e) à consulter et à valider cette évaluation.<br><br>" +
                            $"<a href='{_configuration["FrontendBaseUrl"]}/soft-gcc/evaluations/liste' class='button'>Accéder au système</a><br><br>" +
                            $"Cordialement,<br>" +
                            $"L'équipe Gestion des Carrières et Compétences"
                        );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Erreur lors de l'envoi de l'email au superviseur: {ex.Message}");
                    }
                }
            }
        }

        // Get selected questions and responses for EvaluationQuestionController
        public async Task<IEnumerable<object>> GetSelectedQuestionsAndResponsesForQuestionControllerAsync(int evaluationId)
        {
            var selectedRows = await _dataService.ExecuteReaderAsync(@"
                SELECT esq.QuestionId, eq.question, eq.CompetenceLineId, eq.ResponseTypeId,
                       er.ResponseValue, er.ResponseId, er.IsCorrect
                FROM Evaluation_Selected_Questions esq
                INNER JOIN Evaluation_questions eq ON esq.QuestionId = eq.Question_id
                LEFT JOIN Evaluation_Responses er ON er.EvaluationId = @p0 AND er.QuestionId = eq.Question_id
                WHERE esq.EvaluationId = @p0", evaluationId);

            // Get response types
            var responseTypes = await _dataService.GetAllResponseTypesAsync();
            var responseTypeDict = responseTypes.ToDictionary(rt => rt.ResponseTypeId, rt => new { rt.TypeName });

            // Get competence lines with skill/position info
            var competenceLineIds = selectedRows
                .Select(r => r["CompetenceLineId"] as int? ?? (r["CompetenceLineId"] != DBNull.Value ? Convert.ToInt32(r["CompetenceLineId"]) : (int?)null))
                .Where(id => id.HasValue)
                .Select(id => id.Value)
                .Distinct()
                .ToList();

            var competenceData = new Dictionary<int, object>();
            if (competenceLineIds.Count > 0)
            {
                var clPlaceholders = string.Join(",", competenceLineIds.Select((_, i) => $"@p{i}"));
                var clRows = await _dataService.ExecuteReaderAsync(
                    $"SELECT cl.CompetenceLineId, cl.Description, sp.Name AS SkillName " +
                    $"FROM Competence_Lines cl " +
                    $"LEFT JOIN SkillPosition sp ON cl.SkillPositionId = sp.SkillPositionId " +
                    $"WHERE cl.CompetenceLineId IN ({clPlaceholders})",
                    competenceLineIds.Cast<object>().ToArray());

                competenceData = clRows
                    .GroupBy(r => Convert.ToInt32(r["CompetenceLineId"]))
                    .ToDictionary(
                        g => g.Key,
                        g => (object)new
                        {
                            CompetenceLineId = g.Key,
                            CompetenceName = g.First()["SkillName"]?.ToString()
                                ?? g.First()["Description"]?.ToString()
                                ?? ""
                        });
            }

            var result = new List<object>();
            foreach (var row in selectedRows)
            {
                var questionId = Convert.ToInt32(row["QuestionId"]);
                var responseTypeId = Convert.ToInt32(row["ResponseTypeId"]);
                var responseTypeName = responseTypeDict.ContainsKey(responseTypeId) ? responseTypeDict[responseTypeId].TypeName : "TEXT";

                var clIdObj = row["CompetenceLineId"];

                result.Add(new
                {
                    QuestionId = questionId,
                    QuestionText = row["question"]?.ToString() ?? "",
                    CompetenceLineId = clIdObj != DBNull.Value ? Convert.ToInt32(clIdObj) : (int?)null,
                    ResponseTypeId = responseTypeId,
                    ResponseType = responseTypeName,
                    CompetenceLine = clIdObj != DBNull.Value ? competenceData.GetValueOrDefault(Convert.ToInt32(clIdObj)) : null,
                    Response = row.ContainsKey("ResponseValue") && row["ResponseValue"] != DBNull.Value
                        ? new { ResponseValue = row["ResponseValue"]?.ToString() }
                        : null
                });
            }

            return result;
        }
    }
}
