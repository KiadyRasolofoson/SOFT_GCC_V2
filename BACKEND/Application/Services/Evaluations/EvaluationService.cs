using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.EvaluationInterface;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Core.Interface.AuthInterface;
using Microsoft.Extensions.Options;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class EvaluationService
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
        private readonly EvaluationCompetenceService _competenceService;

        public EvaluationService(IEvaluationQuestionRepository questionRepository, IGenericRepository<EvaluationType> evaluationType,
            IGenericRepository<EvaluationQuestion> EvaluationQuestion, IGenericRepository<Evaluation> _evaluation,
            IGenericRepository<EvaluationQuestionnaire> _evaluationQuestionnaire, IGenericRepository<TrainingSuggestion> _trainingSuggestions,
            IGenericRepository<User> userRepository,
            IEmailService emailService,
            IOptions<ReminderSettings> reminderSettings,
            IGenericRepository<Position> poste,
            IEvaluationDataService dataService,
            TemporaryAccountService temporaryAccountService,
            EvaluationCompetenceService competenceService = null)
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
            _competenceService = competenceService;
        }

        // Create a new evaluation question
        public async Task<bool> CreateEvaluationQuestionAsync(EvaluationQuestion question)
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
        public async Task<EvaluationQuestion> GetEvaluationQuestionByIdAsync(int id)
        {
            return await _evaluationQuestion.GetByIdAsync(id);
        }
        // Update an existing evaluation question
        public async Task<bool> UpdateEvaluationQuestionAsync(EvaluationQuestion question)
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
        public async Task<bool> DeleteEvaluationQuestionAsync(int id)
        {
            var question = await _evaluationQuestion.GetByIdAsync(id);
            if (question == null) return false; // Not found

            await _evaluationQuestion.DeleteAsync(question);
            return true;
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetEvaluationQuestionsAsync(int evaluationTypeId, int positionId)
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
        
        public async Task<bool> ValidateEvaluationAsync(int evaluationId, bool isServiceApproved, bool isDgApproved, DateTime? serviceApprovalDate, DateTime? dgApprovalDate)
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
            List<MultiCriteriaRatingDto> detailedRatings = null)
        {
            var evaluation = await _evaluationRepository.GetByIdAsync(evaluationId);
            if (evaluation == null) throw new Exception($"Evaluation with ID {evaluationId} not found.");

            // Enregistrer les informations globales de l'évaluation
            evaluation.OverallScore = overallScore;
            evaluation.Comments = generalEvaluation;
            evaluation.strengths = strengths;
            evaluation.weaknesses = weaknesses;

            await _evaluationRepository.UpdateAsync(evaluation);

            // Récupérer les IDs des réponses existantes
            var existingRows = await _dataService.ExecuteReaderAsync(
                "SELECT ResponseId, QuestionId FROM evaluationResponses WHERE EvaluationId = @p0", evaluationId);
            var existingResponseIds = existingRows
                .Select(r => new { QuestionId = Convert.ToInt32(r["QuestionId"]), ResponseId = Convert.ToInt32(r["ResponseId"]) })
                .ToDictionary(r => r.QuestionId, r => r.ResponseId);

            // Pour chaque note
            var newResponses = new List<EvaluationResponses>();
            foreach (var rating in ratings)
            {
                int questionId = rating.Key;
                int score = rating.Value;

                if (existingResponseIds.TryGetValue(questionId, out var responseId))
                {
                    // Mettre à jour la réponse existante
                    await _dataService.ExecuteNonQueryAsync(@"
                        UPDATE evaluationResponses 
                        SET ResponseValue = @p0, EndTime = @p1 
                        WHERE ResponseId = @p2",
                        score.ToString(), DateTime.UtcNow, responseId);
                }
                else
                {
                    // Créer une nouvelle réponse
                    newResponses.Add(new EvaluationResponses
                    {
                        EvaluationId = evaluationId,
                        QuestionId = questionId,
                        ResponseValue = score.ToString(),
                        ResponseType = "SCORE",
                        CreatedAt = DateTime.UtcNow,
                        StartTime = DateTime.UtcNow,
                        EndTime = DateTime.UtcNow,
                        State = 10 // TERMINEE
                    });
                }
            }

            // Si des ratings détaillés sont fournis (pour les critères multiples)
            if (detailedRatings != null && detailedRatings.Count > 0)
            {
                foreach (var detailedRating in detailedRatings)
                {
                    if (detailedRating == null || detailedRating.QuestionId <= 0) continue;

                    int questionId = detailedRating.QuestionId;

                    // Calculer la note globale
                    detailedRating.OverallRating = detailedRating.CalculateOverallRating();

                    // Convertir en JSON
                    string jsonValue = System.Text.Json.JsonSerializer.Serialize(detailedRating);

                    if (existingResponseIds.TryGetValue(questionId, out var responseId))
                    {
                        // Mettre à jour la réponse existante
                        await _dataService.ExecuteNonQueryAsync(@"
                            UPDATE evaluationResponses 
                            SET ResponseValue = @p0, ResponseType = 'MULTI_CRITERIA', EndTime = @p1 
                            WHERE ResponseId = @p2",
                            jsonValue, DateTime.UtcNow, responseId);
                    }
                    else
                    {
                        // Créer une nouvelle réponse
                        newResponses.Add(new EvaluationResponses
                        {
                            EvaluationId = evaluationId,
                            QuestionId = questionId,
                            ResponseValue = jsonValue,
                            ResponseType = "MULTI_CRITERIA",
                            CreatedAt = DateTime.UtcNow,
                            StartTime = DateTime.UtcNow,
                            EndTime = DateTime.UtcNow,
                            State = 10 // TERMINEE
                        });
                    }
                }
            }

            // Ajouter les nouvelles réponses en une seule fois
            if (newResponses.Any())
            {
                await _dataService.AddRangeAsync(newResponses);
            }
            
            // Calculer et sauvegarder les résultats par compétence
            try
            {
                // Utiliser l'instance injectée du service de compétence ici
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
                    "SELECT * FROM Employee WHERE EmployeeId = @p0", employeeId);

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
                            $"<a href='http://localhost:5173/EvaluationLogin' class='button'>Accéder à l'évaluation</a><br><br>" +
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
                                $"<a href='http://localhost:5173/salary-list' class='button'>Accéder au système</a><br><br>" +
                                $"Cordialement,<br>" +
                                $"L'équipe Gestion des Carrières et Compétences"
                            );
                        }
                    }

                    await _dataService.CommitTransactionAsync();
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

        public async Task<bool> CreateTrainingSuggestionAsync(TrainingSuggestion suggestion)
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
                $"<a href='http://localhost:5173/EvaluationLogin' class='button'>Accéder à l'évaluation</a><br><br>" +
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
        public async Task<TrainingSuggestion> GetTrainingSuggestionByIdAsync(int id)
        {
            return await _dataService.GetTrainingSuggestionByIdWithIncludesAsync(id);
        }

        // Update an existing training suggestion
        public async Task<bool> UpdateTrainingSuggestionAsync(TrainingSuggestion suggestion)
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
        public async Task<bool> DeleteTrainingSuggestionAsync(int id)
        {
            var suggestion = await _trainingSuggestionsRepository.GetByIdAsync(id);
            if (suggestion == null) return false; // Not found

            await _trainingSuggestionsRepository.DeleteAsync(suggestion);
            return true;
        }

        // Get paginated training suggestions
        public async Task<(IEnumerable<TrainingSuggestion> Items, int TotalPages)> GetPaginatedTrainingSuggestionsAsync(int pageNumber, int pageSize)
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

        public async Task<List<int>> CreateEvaluationWithSelectedQuestionsAsync(CreateEvaluationWithQuestionsDto dto)
        {
            var createdEvaluationIds = new List<int>();

                foreach (var employeeQuestion in dto.EmployeeQuestions)
                {
                // Créer l'évaluation
                    var evaluationId = await CreateEvaluationAsync(
                    0, // UserId (not specified in this flow)
                        employeeQuestion.EmployeeId,
                    dto.EvaluationTypeId,
                        dto.SupervisorIds,
                        dto.StartDate,
                    dto.EndDate,
                    dto.EnableReminders // Ajouter le paramètre de rappel
                    );

                    // Ajouter les questions sélectionnées avec leurs compétences
                    foreach (var question in employeeQuestion.SelectedQuestions)
                    {
                        if (!question.CompetenceLineId.HasValue)
                        {
                            throw new Exception($"La question avec ID {question.QuestionId} n'a pas de ligne de compétence associée");
                        }

                        var selectedQuestion = new EvaluationSelectedQuestions
                        {
                            EvaluationId = evaluationId,
                            QuestionId = question.QuestionId,
                            CompetenceLineId = question.CompetenceLineId.Value
                        };
                        await _dataService.AddSelectedQuestionAsync(selectedQuestion);
                    }

                    // Mettre à jour le nombre total de questions dans la progression
                    var progress = await _dataService.GetProgressByEvaluationIdAsync(evaluationId);
                    if (progress != null)
                    {
                        progress.totalQuestions = employeeQuestion.SelectedQuestions.Count;
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


        public async Task<(IEnumerable<EvaluationQuestion> Items, int TotalPages)> GetPaginatedEvaluationQuestionsByTypeAsync(int evaluationTypeId, int pageNumber, int pageSize)
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

        // Méthode pour récupérer une évaluation par son ID
        public async Task<Evaluation> GetEvaluationByIdAsync(int evaluationId)
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
    }
}
