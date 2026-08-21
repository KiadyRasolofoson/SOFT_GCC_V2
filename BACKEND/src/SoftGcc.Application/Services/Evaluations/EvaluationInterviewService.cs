using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Application.Dtos.EvaluationsDto;
using Microsoft.Extensions.Configuration;

namespace SoftGcc.Application.Services.Evaluations
{
    public class EvaluationInterviewService
    {
        private readonly IEvaluationDataService _dataService;
        private readonly IGenericRepository<Position> _posteRepository;
        private readonly IGenericRepository<Department> _departementRepository;
        private readonly IGenericRepository<User> _userRepository;
        private readonly IGenericRepository<EvaluationInterviews> _interviewRepository;
        private readonly IGenericRepository<InterviewParticipants> _participantRepository;
        private readonly IGenericRepository<Evaluation> _evaluationRepository;
        private readonly IGenericRepository<Employee> _employeeRepository;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public EvaluationInterviewService(
            IEvaluationDataService dataService,
            IGenericRepository<Position> posteRepository,
            IGenericRepository<Department> departementRepository,
            IGenericRepository<User> userRepository,
            IGenericRepository<EvaluationInterviews> interviewRepository,
            IGenericRepository<InterviewParticipants> participantRepository,
            IGenericRepository<Evaluation> evaluationRepository,
            IGenericRepository<Employee> employeeRepository,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _dataService = dataService;
            _posteRepository = posteRepository;
            _departementRepository = departementRepository;
            _userRepository = userRepository;
            _interviewRepository = interviewRepository;
            _participantRepository = participantRepository;
            _evaluationRepository = evaluationRepository;
            _employeeRepository = employeeRepository;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<IEnumerable<VEmployeesFinishedEvaluation>> GetEmployeesWithFinishedEvalAsync(
                int? position = null,
                int? department = null,
                string? search = null)
        {
            var query = _dataService.GetEmployeesFinishedEvalQuery();

            if (position.HasValue)
                query = query.Where(e => e.positionId == position);

            if (department.HasValue)
                query = query.Where(e => e.DepartmentId == department);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(e =>
                    ((e.FirstName ?? "") + " " + (e.LastName ?? "")).Contains(search) ||
                    (e.FirstName ?? "").Contains(search) ||
                    (e.LastName ?? "").Contains(search));

            return query.ToList();
        }

        //pagination
        public async Task<(IEnumerable<VEmployeesFinishedEvaluation> Employees, int TotalPages, int TotalCount)> GetEmployeesWithFinishedEvalPaginatedAsync(
    int pageNumber = 1,
    int pageSize = 10,
    int? position = null,
    int? department = null,
    string? search = null,
    string? sortBy = null,
    string? sortDirection = null)
        {
            var query = _dataService.GetEmployeesFinishedEvalQuery();

            // Appliquer les filtres
            if (position.HasValue)
                query = query.Where(e => e.positionId == position);

            if (department.HasValue)
                query = query.Where(e => e.DepartmentId == department);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(e =>
                    ((e.FirstName ?? "") + " " + (e.LastName ?? "")).Contains(search) ||
                    (e.FirstName ?? "").Contains(search) ||
                    (e.LastName ?? "").Contains(search));

            // Appliquer le tri
            if (!string.IsNullOrEmpty(sortBy))
            {
                bool isAscending = string.IsNullOrEmpty(sortDirection) || sortDirection.ToLower() == "ascending";

                switch (sortBy.ToLower())
                {
                    case "name":
                        query = isAscending
                            ? query.OrderBy(e => e.FirstName).ThenBy(e => e.LastName)
                            : query.OrderByDescending(e => e.FirstName).ThenByDescending(e => e.LastName);
                        break;
                    case "position":
                        query = isAscending
                            ? query.OrderBy(e => e.Position)
                            : query.OrderByDescending(e => e.Position);
                        break;
                    case "department":
                        query = isAscending
                            ? query.OrderBy(e => e.Department)
                            : query.OrderByDescending(e => e.Department);
                        break;
                    case "evaluationdate":
                    case "startdate":
                        query = isAscending
                            ? query.OrderBy(e => e.startDate)
                            : query.OrderByDescending(e => e.startDate);
                        break;
                    case "interviewdate":
                        query = isAscending
                            ? query.OrderBy(e => e.InterviewDate)
                            : query.OrderByDescending(e => e.InterviewDate);
                        break;
                    default:
                        // Tri par défaut si la clé de tri n'est pas reconnue
                        query = query.OrderBy(e => e.FirstName).ThenBy(e => e.LastName);
                        break;
                }
            }

            // Calculer le nombre total d'éléments
            var totalItems = query.Count();

            // Calculer le nombre total de pages
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            // Paginer les résultats
            var employees = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return (employees, totalPages, totalItems);
        }

        // Statistiques des entretiens (totaux par statut) — mêmes filtres que GetEmployeesWithFinishedEvalPaginatedAsync
        public async Task<(int TotalCount, int NoneCount, int TodayCount, int PendingCount)> GetInterviewStatisticsAsync(
            int? position = null,
            int? department = null,
            string? search = null)
        {
            var query = _dataService.GetEmployeesFinishedEvalQuery();

            if (position.HasValue)
                query = query.Where(e => e.positionId == position);

            if (department.HasValue)
                query = query.Where(e => e.DepartmentId == department);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(e =>
                    ((e.FirstName ?? "") + " " + (e.LastName ?? "")).Contains(search) ||
                    (e.FirstName ?? "").Contains(search) ||
                    (e.LastName ?? "").Contains(search));

            var rows = query
                .Select(e => new { e.InterviewStatus, e.InterviewDate })
                .ToList();

            var today = DateTime.Today;

            var totalCount = rows.Count;
            var noneCount = rows.Count(e => IsNoneInterview(e.InterviewStatus, e.InterviewDate));
            var todayCount = rows.Count(e => IsTodayInterview(e.InterviewStatus, e.InterviewDate, today));
            var pendingCount = rows.Count(e => e.InterviewStatus == 25);

            return (totalCount, noneCount, todayCount, pendingCount);
        }

        private static bool IsValidInterviewDate(DateTime? date)
        {
            return date.HasValue && date.Value.Year >= 2000;
        }

        private static bool IsNoneInterview(int? status, DateTime? date)
        {
            return status == null && !IsValidInterviewDate(date);
        }

        private static bool IsTodayInterview(int? status, DateTime? date, DateTime today)
        {
            // Statuts déjà traités avant la branche "planifié / date" côté front
            if (status == 50 || status == 40 || status == 30 || status == 25 || status == 20) return false;
            if (!IsValidInterviewDate(date)) return false;
            return date!.Value.Date == today.Date;
        }

        public async Task<VEmployeesFinishedEvaluation?> GetEmployeeAsync(int employeeId)
        {
            return _dataService.GetEmployeesFinishedEvalQuery()
                .FirstOrDefault(e => e.EmployeeId == employeeId);
        }

        public async Task<Position?> GetPosteByIdAsync(int posteId)
        {
            return await _posteRepository.GetByIdAsync(posteId);
        }

        public async Task<Department?> GetDepartmentByIdAsync(int departmentId)
        {
            return await _departementRepository.GetByIdAsync(departmentId);
        }

        public async Task<IEnumerable<Position>> GetAllPostesAsync()
        {
            return await _posteRepository.GetAllAsync();
        }

        public async Task<IEnumerable<Department>> GetAllDepartmentsAsync()
        {
            return await _departementRepository.GetAllAsync();
        }


        // Planifier un entretien
        public async Task<(bool Success, string Message, int? InterviewId)> ScheduleInterviewAsync(int evaluationId, DateTime scheduledDate, List<int> participantIds, int? employeeId = null, bool sendEmails = true)
        {
            await _dataService.BeginTransactionAsync();
            try
            {
                Console.WriteLine($"Planification d'un entretien pour l'évaluation ID: {evaluationId}, employé ID: {employeeId}");
                
                // Vérifier si l'évaluation existe
                var evaluation = await _evaluationRepository.GetByIdAsync(evaluationId);
                if (evaluation == null)
                {
                    return (false, "Évaluation non trouvée.", null);
                }

                // Vérifier si un entretien existe déjà pour cette évaluation
                var existingInterview = await _interviewRepository
                    .GetFirstOrDefaultAsync(e => e.EvaluationId == evaluationId);

                EvaluationInterviews interview;
                bool isUpdate = false;

                if (existingInterview != null)
                {
                    // Mise à jour d'un entretien existant
                    isUpdate = true;
                    Console.WriteLine($"Un entretien existe déjà (ID: {existingInterview.InterviewId}). Mise à jour plutôt que création.");
                    
                    // Mettre à jour seulement si l'entretien n'est pas déjà terminé
                    if (existingInterview.status == InterviewStatus.Completed)
                    {
                        await _dataService.RollbackTransactionAsync();
                        return (false, "Impossible de reprogrammer un entretien déjà terminé.", null);
                    }
                    
                    existingInterview.InterviewDate = scheduledDate;
                    existingInterview.status = InterviewStatus.Planned;
                    
                    await _interviewRepository.UpdateAsync(existingInterview);
                    
                    // Supprimer les participants existants avant d'en ajouter de nouveaux
                    var existingParticipants = (await _participantRepository
                        .FindAsync(p => p.InterviewId == existingInterview.InterviewId))
                        .ToList();
                    
                    if (existingParticipants.Any())
                    {
                        Console.WriteLine($"Suppression de {existingParticipants.Count} participants existants");
                        foreach (var p in existingParticipants)
                            await _participantRepository.DeleteAsync(p);
                    }
                    
                    interview = existingInterview;
                }
                else
                {
                    // Création d'un nouvel entretien
                    interview = new EvaluationInterviews
                    {
                        EvaluationId = evaluationId,
                        InterviewDate = scheduledDate,
                        status = InterviewStatus.Planned
                    };

                    await _interviewRepository.CreateAsync(interview);
                    Console.WriteLine($"Nouvel entretien créé avec ID: {interview.InterviewId}");
                }

                // Liste pour collecter les participants (pour l'envoi d'emails)
                var participantsInfo = new List<(int ParticipantId, bool IsEvaluatedEmployee)>();

                // Ajouter l'employé concerné par l'évaluation (si fourni)
                if (employeeId.HasValue && employeeId.Value > 0)
                {
                    Console.WriteLine($"Ajout de l'employé {employeeId.Value} comme personne évaluée");
                    
                    await _participantRepository.CreateAsync(new InterviewParticipants
                    {
                        InterviewId = interview.InterviewId,
                        EmployeeId = employeeId.Value,
                        UserId = null  // L'employé évalué n'est pas lié à un utilisateur
                    });
                    
                    // Ajouter à la liste pour l'envoi d'emails
                    participantsInfo.Add((employeeId.Value, true));
                }

                // Ajouter les participants
                if (participantIds != null && participantIds.Any())
                {
                    foreach (var participantId in participantIds)
                    {
                        // Éviter les doublons avec l'employé évalué
                        if (employeeId.HasValue && participantId == employeeId.Value) 
                            continue;
                        
                        await _participantRepository.CreateAsync(new InterviewParticipants
                        {
                            InterviewId = interview.InterviewId,
                            UserId = participantId
                        });
                        
                        // Ajouter à la liste pour l'envoi d'emails
                        participantsInfo.Add((participantId, false));
                    }
                }
                
                // Envoi des notifications par email si demandé
                if (sendEmails)
                {
                    await SendInterviewNotificationsAsync(interview, participantsInfo);
                }

                await _dataService.CommitTransactionAsync();
                
                return (true, isUpdate ? "Entretien mis à jour avec succès." : "Entretien planifié avec succès.", interview.InterviewId);
            }
            catch (Exception ex)
            {
                await _dataService.RollbackTransactionAsync();
                Console.WriteLine($"Exception lors de la planification: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"InnerException: {ex.InnerException.Message}");
                }
                return (false, $"Erreur lors de la planification: {ex.Message}", null);
            }
        }

        // Méthode pour envoyer des notifications d'entretien par email
        private async Task SendInterviewNotificationsAsync(EvaluationInterviews interview, List<(int ParticipantId, bool IsEvaluatedEmployee)> participants)
        {
            try
            {
                // Récupérer les détails de l'évaluation
                var evaluation = await _evaluationRepository
                    .GetFirstOrDefaultAsync(e => e.EvaluationId == interview.EvaluationId, e => e.EvaluationType);
                
                if (evaluation == null) 
                {
                    Console.WriteLine("Impossible d'envoyer des emails: évaluation non trouvée");
                    return;
                }
                
                var evaluationTypeName = evaluation.EvaluationType?.Designation ?? "Entretien d'évaluation";
                
                // Formater la date pour l'affichage
                string formattedDate = interview.InterviewDate.ToString("dd MMMM yyyy à HH:mm");
                
                // Initialiser l'employé évalué pour le message aux autres participants
                string evaluatedEmployeeName = "l'employé concerné";
                
                foreach (var (participantId, isEvaluatedEmployee) in participants)
                {
                    // Récupérer les informations du participant
                    User? userInfo = null;
                    string firstName = "", lastName = "", email = "";
                    
                    if (isEvaluatedEmployee)
                    {
                        // Cas de l'employé évalué
                        var employee = await _employeeRepository.GetByIdAsync(participantId);
                        
                        if (employee != null)
                        {
                            firstName = employee.FirstName ?? string.Empty;
                            lastName = employee.Name ?? string.Empty;
                            email = employee.Email ?? string.Empty;
                            
                            // Mise à jour du nom pour les autres participants
                            evaluatedEmployeeName = $"{firstName} {lastName}";
                        }
                    }
                    else
                    {
                        // Cas d'un autre participant (manager, directeur, etc.)
                        userInfo = await _userRepository.GetByIdAsync(participantId);
                        
                        if (userInfo != null)
                        {
                            firstName = userInfo.FirstName;
                            lastName = userInfo.LastName;
                            email = userInfo.Email ?? string.Empty;
                        }
                    }
                    
                    // Si l'email n'est pas disponible, passer au suivant
                    if (string.IsNullOrEmpty(email))
                    {
                        Console.WriteLine($"Email non disponible pour le participant ID: {participantId}");
                        continue;
                    }
                    
                    string emailBody;
                    
                    if (isEvaluatedEmployee)
                    {
                        // Email spécifique pour l'employé évalué
                        emailBody = $"Bonjour {firstName} {lastName},<br><br>" +
                                   $"Nous vous informons qu'un entretien d'évaluation a été planifié pour vous.<br><br>" +
                                   $"<strong>Type d'entretien :</strong> {evaluationTypeName}<br>" +
                                   $"<strong>Date et heure :</strong> {formattedDate}<br><br>" +
                                   $"Cordialement,<br>" +
                                   $"L'équipe Gestion des Carrières et Compétences";
                    }
                    else
                    {
                        // Email pour les autres participants (managers, directeurs)
                        emailBody = $"Bonjour {firstName} {lastName},<br><br>" +
                                   $"Vous avez été ajouté(e) comme participant à un entretien d'évaluation.<br><br>" +
                                   $"<strong>Type d'entretien :</strong> {evaluationTypeName}<br>" +
                                   $"<strong>Employé concerné :</strong> {evaluatedEmployeeName}<br>" +
                                   $"<strong>Date et heure :</strong> {formattedDate}<br><br>" +
                                   $"Veuillez vous connecter à votre compte pour consulter les détails de cet entretien.<br><br>" +
                                   $"<a href='{_configuration["FrontendBaseUrl"]}/soft-gcc/evaluations/accueil' class='button'>Accéder au système</a><br><br>" +
                                   $"Cordialement,<br>" +
                                   $"L'équipe Gestion des Carrières et Compétences";
                    }
                    
                    // Envoi de l'email
                    await _emailService.SendEmailAsync(
                        email,
                        $"{evaluationTypeName} - Planification",
                        emailBody
                    );
                    
                    Console.WriteLine($"Email de planification envoyé à {firstName} {lastName} ({email})");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de l'envoi des notifications par email: {ex.Message}");
                // Ne pas relancer l'exception pour éviter de perturber le processus principal
                // même si l'envoi d'email échoue
            }
        }

        // Démarrer un entretien
        public async Task<bool> StartInterviewAsync(int interviewId)
        {
            Console.WriteLine($"Démarrage de StartInterviewAsync pour l'interview ID: {interviewId}");

            try
            {
                // Vérifier si l'entretien existe avant d'essayer de mettre à jour
                var interview = await _interviewRepository.GetByIdAsync(interviewId);

                if (interview == null)
                {
                    Console.WriteLine($"Aucun entretien trouvé avec l'ID: {interviewId}");
                    return false;
                }

                Console.WriteLine($"Entretien trouvé, statut actuel: {interview.status}");

                // Mettre à jour le statut
                interview.status = InterviewStatus.InProgress;
                await _interviewRepository.UpdateAsync(interview);

                Console.WriteLine($"Mise à jour effectuée");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception dans StartInterviewAsync: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                throw;
            }
        }

        // Terminer un entretien avec validation
        public async Task<bool> CompleteInterviewAsync(
      int interviewId,
      bool? managerApproval = null,
      string? managerComments = null,
      bool? directorApproval = null,
      string? directorComments = null,
      string? notes = null,
      int? status = null  // Paramètre conservé pour compatibilité mais ignoré
  )
        {
            Console.WriteLine($"Démarrage de CompleteInterviewAsync pour l'interview ID: {interviewId}");

            var interview = await _interviewRepository.GetByIdAsync(interviewId);

            if (interview == null)
            {
                Console.WriteLine($"Interview introuvable pour l'ID: {interviewId}");
                return false;
            }

            Console.WriteLine($"Interview trouvé - EvaluationId: {interview.EvaluationId}, Status actuel: {interview.status}");

            // Mise à jour conditionnelle des champs
            if (managerApproval.HasValue)
            {
                interview.managerApproval = managerApproval;
                Console.WriteLine($"Mise à jour de managerApproval: {managerApproval}");
            }

            if (!string.IsNullOrEmpty(managerComments))
            {
                interview.managerComments = managerComments;
                Console.WriteLine("Mise à jour des commentaires du manager");
            }

            if (directorApproval.HasValue)
            {
                interview.directorApproval = directorApproval;
                Console.WriteLine($"Mise à jour de directorApproval: {directorApproval}");
            }

            if (!string.IsNullOrEmpty(directorComments))
            {
                interview.directorComments = directorComments;
                Console.WriteLine("Mise à jour des commentaires du directeur");
            }

            if (!string.IsNullOrEmpty(notes))
            {
                interview.notes = notes;
                Console.WriteLine("Mise à jour des notes");
            }

            // Ignorer le paramètre de statut explicite (status) et déterminer le statut approprié selon la logique métier

            // Statut par défaut: si cet appel vient d'EvaluationFill sans validations, c'est PendingValidation
            if (interview.status == InterviewStatus.InProgress &&
                !managerApproval.HasValue && !directorApproval.HasValue)
            {
                interview.status = InterviewStatus.PendingValidation;
                Console.WriteLine("Interview terminé, statut mis à jour à PendingValidation");
            }
            // Si validations par managers/directeurs
            else if (interview.managerApproval == true && interview.directorApproval == true)
            {
                // Tous les deux ont validé
                interview.status = InterviewStatus.Completed;
                Console.WriteLine("Statut de l'interview mis à jour: Completed");

                try
                {
                    // Vérifier que l'ID d'évaluation existe et est valide avant de l'utiliser
                    if (interview.EvaluationId != null && interview.EvaluationId > 0)
                    {
                        // Mettre à jour l'état de l'évaluation à 30 (archivé)
                        var evaluation = await _evaluationRepository.GetByIdAsync(interview.EvaluationId);
                        if (evaluation != null)
                        {
                            evaluation.state = 30; // État archivé
                            await _evaluationRepository.UpdateAsync(evaluation);
                            Console.WriteLine($"État de l'évaluation (ID: {interview.EvaluationId}) mis à jour à 30 (archivé)");
                        }
                        else
                        {
                            Console.WriteLine($"Évaluation avec ID {interview.EvaluationId} non trouvée");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"EvaluationId est NULL ou invalide: {interview.EvaluationId}");
                    }
                }
                catch (Exception ex)
                {
                    // Capturer et journaliser l'exception, mais continuer le traitement
                    Console.WriteLine($"Exception lors de la mise à jour de l'évaluation: {ex.Message}");
                    Console.WriteLine($"StackTrace: {ex.StackTrace}");
                }
            }
            else if (interview.managerApproval == false || interview.directorApproval == false)
            {
                // L'un des deux a refusé
                interview.status = InterviewStatus.Rejected;
                Console.WriteLine("Statut de l'interview mis à jour: Rejected");
            }
            else
            {
                // En attente de validation
                interview.status = InterviewStatus.PendingValidation;
                Console.WriteLine("Statut de l'interview mis à jour: PendingValidation");
            }

            try
            {
                await _interviewRepository.UpdateAsync(interview);
                Console.WriteLine("Interview mis à jour avec succès dans la base de données");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception lors de la sauvegarde des changements: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                throw;
            }
        }




        // Récupérer les détails d'un entretien
        public async Task<EvaluationInterviews?> GetInterviewDetailsAsync(int interviewId)
        {
            // Récupère les détails de l'entretien sans les participants d'abord
            var interview = await _interviewRepository.GetByIdAsync(interviewId);

            if (interview != null)
            {
                try
                {
                    // Récupère les participants associés à cet entretien
                    var participants = (await _participantRepository
                        .FindAsync(p => p.InterviewId == interviewId))
                        .ToList();

                    Console.WriteLine($"Récupération des participants pour l'entretien {interviewId}: {participants.Count} trouvés");

                    if (participants.Any())
                    {
                        Console.WriteLine("Participants trouvés, mais non chargés avec les détails utilisateur pour éviter les erreurs NULL");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Erreur lors de la récupération des participants: {ex.Message}");
                    Console.WriteLine($"StackTrace: {ex.StackTrace}");
                }
            }

            return interview;
        }


        public async Task<bool> UpdateInterviewAsync(int interviewId, DateTime? newDate, List<int>? newParticipantIds, int? newStatus)
        {
            var interview = await _interviewRepository.GetByIdAsync(interviewId);

            if (interview == null)
            {
                return false; // Entretien introuvable
            }

            // Vérifier que l'entretien est dans un statut qui permet la modification
            if (interview.status == InterviewStatus.Completed || interview.status == InterviewStatus.Rejected)
            {
                return false; // Ne pas autoriser la mise à jour si l'entretien est déjà terminé ou rejeté
            }

            // Mise à jour de la date de l'entretien si elle est fournie
            if (newDate.HasValue)
            {
                interview.InterviewDate = newDate.Value;
            }

            // Mise à jour des participants
            if (newParticipantIds != null && newParticipantIds.Any())
            {
                foreach (var participantId in newParticipantIds)
                {
                    await _participantRepository.CreateAsync(new InterviewParticipants
                    {
                        InterviewId = interview.InterviewId,
                        EmployeeId = participantId
                    });
                }
            }

            // Mise à jour du statut de l'entretien si nécessaire
            if (newStatus.HasValue)
            {
                var status = (InterviewStatus)newStatus.Value;
                if (Enum.IsDefined(typeof(InterviewStatus), status))
                {
                    interview.status = status;
                }
                else
                {
                    return false;
                }
            }

            await _interviewRepository.UpdateAsync(interview);

            return true;
        }

        public async Task<EvaluationInterviews?> GetInterviewByParticipantIdAsync(int participantId)
        {
            try
            {
                Console.WriteLine($"Recherche d'entretien pour le participant/employé ID: {participantId}");

                // Rechercher d'abord si c'est un employé évalué
                var participants = await _participantRepository.FindAsync(p => p.EmployeeId == participantId);
                var interviewIds = participants.Select(p => p.InterviewId).ToList();

                Console.WriteLine($"Entretiens trouvés via EmployeeId: {string.Join(", ", interviewIds)}");

                // Si aucun résultat, chercher comme participant (User)
                if (!interviewIds.Any())
                {
                    participants = await _participantRepository.FindAsync(p => p.UserId == participantId);
                    interviewIds = participants.Select(p => p.InterviewId).ToList();
                    Console.WriteLine($"Entretiens trouvés via UserId: {string.Join(", ", interviewIds)}");
                }

                if (!interviewIds.Any())
                {
                    Console.WriteLine("Aucun entretien trouvé pour ce participant");
                    return null;
                }

                // Récupérer l'entretien le plus récent
                var allInterviews = await _interviewRepository.GetAllAsync();
                var interview = allInterviews
                    .Where(i => interviewIds.Contains(i.InterviewId))
                    .OrderByDescending(i => i.InterviewDate)
                    .FirstOrDefault();

                if (interview != null)
                {
                    Console.WriteLine($"Entretien trouvé - ID: {interview.InterviewId}, EvaluationId: {interview.EvaluationId}");
                }
                
                return interview;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception dans GetInterviewByParticipantIdAsync: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                return null;
            }
        }

        public string GetValidationStatus(int interviewId)
        {
            var interview = _interviewRepository.GetByIdAsync(interviewId).GetAwaiter().GetResult();

            if (interview == null)
            {
                return "Entretien introuvable.";
            }

            string validationStatus = "Statut de validation :";

            // Vérifier la validation du Manager
            if (interview.managerApproval == null)
            {
                validationStatus += " Manager n'a pas encore validé.";
            }
            else if (interview.managerApproval == true)
            {
                validationStatus += " Manager a validé.";
            }
            else
            {
                validationStatus += " Manager a refusé.";
            }

            // Vérifier la validation du Directeur
            if (interview.directorApproval == null)
            {
                validationStatus += " Directeur n'a pas encore validé.";
            }
            else if (interview.directorApproval == true)
            {
                validationStatus += " Directeur a validé.";
            }
            else
            {
                validationStatus += " Directeur a refusé.";
            }

            return validationStatus;
        }

		/// <summary>
		/// Récupère tous les objectifs extraits des entretiens d'évaluation avec informations employé
		/// </summary>
		public async Task<(List<ObjectiveSummaryDto> Objectives, ObjectivesStatisticsDto Statistics)> GetObjectivesSummaryAsync(
			int? departmentId = null,
			int? employeeId = null,
			string? statusFilter = null,
			string? searchQuery = null,
			int pageNumber = 1,
			int pageSize = 20)
		{
			var objectives = new List<ObjectiveSummaryDto>();

			// Récupérer tous les entretiens qui ont des notes
			var interviews = (await _interviewRepository.GetAllAsync())
				.Where(i => !string.IsNullOrEmpty(i.notes))
				.ToList();

			// Récupérer la vue des employés avec évaluations terminées pour les infos employé
			var employeesView = _dataService.GetEmployeesFinishedEvalQuery().ToList();

			foreach (var interview in interviews)
			{
				try
				{
					// Parser le JSON des notes
					var parsedNotes = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(interview.notes);

					// Vérifier si le JSON contient un tableau "objectives"
					if (parsedNotes.TryGetProperty("objectives", out var objectivesArray) && objectivesArray.ValueKind == System.Text.Json.JsonValueKind.Array)
					{
						// Trouver les infos employé via la vue
						var employeeInfo = employeesView.FirstOrDefault(e => e.evaluationId == interview.EvaluationId);

						int objIndex = 0;
						foreach (var obj in objectivesArray.EnumerateArray())
						{
							var description = obj.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "";
							var dueDate = obj.TryGetProperty("dueDate", out var dd) ? dd.GetString() : null;
							var indicator = obj.TryGetProperty("indicator", out var ind) ? ind.GetString() : null;
							var status = obj.TryGetProperty("status", out var st) ? st.GetString() ?? "Non commencé" : "Non commencé";
							var completionRate = obj.TryGetProperty("completionRate", out var cr) && cr.TryGetInt32(out var rate) ? rate : 0;
							var lastModified = obj.TryGetProperty("lastModified", out var lm) ? lm.GetString() : null;

							// Extraire l'historique de progression
							var progressHistory = new List<ProgressHistoryEntryDto>();
							int progressHistoryCount = 0;
							if (obj.TryGetProperty("progressHistory", out var phArray) && phArray.ValueKind == System.Text.Json.JsonValueKind.Array)
							{
								foreach (var entry in phArray.EnumerateArray())
								{
									progressHistory.Add(new ProgressHistoryEntryDto
									{
										Date = entry.TryGetProperty("date", out var d) ? d.GetString() ?? "" : "",
										OldStatus = entry.TryGetProperty("oldStatus", out var os) ? os.GetString() ?? "" : "",
										NewStatus = entry.TryGetProperty("newStatus", out var ns) ? ns.GetString() ?? "" : "",
										OldCompletionRate = entry.TryGetProperty("oldCompletionRate", out var ocr) && ocr.TryGetInt32(out var orv) ? orv : 0,
										NewCompletionRate = entry.TryGetProperty("newCompletionRate", out var ncr) && ncr.TryGetInt32(out var nrv) ? nrv : 0,
									});
								}
								progressHistoryCount = progressHistory.Count;
							}

							// Ne pas inclure les objectifs sans description
							if (string.IsNullOrWhiteSpace(description))
							{
								objIndex++;
								continue;
							}

							objectives.Add(new ObjectiveSummaryDto
							{
								InterviewId = interview.InterviewId,
								EvaluationId = interview.EvaluationId,
								EmployeeId = employeeInfo?.EmployeeId ?? 0,
								EmployeeName = employeeInfo != null
									? $"{employeeInfo.FirstName} {employeeInfo.LastName}"
									: "Employé inconnu",
								Department = employeeInfo?.Department ?? "N/A",
								Position = employeeInfo?.Position ?? "N/A",
								Description = description,
								DueDate = dueDate,
								Indicator = indicator,
								Status = status,
								CompletionRate = completionRate,
								ObjectiveIndex = objIndex,
								LastModified = lastModified,
								ProgressHistoryCount = progressHistoryCount,
								ProgressHistory = progressHistory
							});
							objIndex++;
						}
					}
				}
				catch (Exception ex)
				{
					Console.WriteLine($"Erreur lors du parsing des notes pour l'interview {interview.InterviewId}: {ex.Message}");
				}
			}

			// Appliquer les filtres
			var filteredObjectives = objectives.AsEnumerable();

			if (departmentId.HasValue)
			{
				filteredObjectives = filteredObjectives.Where(o =>
					employeesView.Any(e => e.EmployeeId == o.EmployeeId && e.DepartmentId == departmentId.Value));
			}

			if (employeeId.HasValue)
			{
				filteredObjectives = filteredObjectives.Where(o => o.EmployeeId == employeeId.Value);
			}

			if (!string.IsNullOrEmpty(statusFilter))
			{
				filteredObjectives = filteredObjectives.Where(o => o.Status == statusFilter);
			}

			if (!string.IsNullOrEmpty(searchQuery))
			{
				var search = searchQuery.ToLower();
				filteredObjectives = filteredObjectives.Where(o =>
					o.Description.ToLower().Contains(search) ||
					o.EmployeeName.ToLower().Contains(search) ||
					(o.Indicator ?? "").ToLower().Contains(search) ||
					o.Department.ToLower().Contains(search));
			}

			var filteredList = filteredObjectives.ToList();

			// Calculer les statistiques
			var statistics = new ObjectivesStatisticsDto
			{
				TotalObjectives = filteredList.Count,
				AchievedObjectives = filteredList.Count(o => o.Status == "Atteint"),
				InProgressObjectives = filteredList.Count(o => o.Status == "En cours"),
				NotStartedObjectives = filteredList.Count(o => o.Status == "Non commencé"),
				NotAchievedObjectives = filteredList.Count(o => o.Status == "Non atteint"),
				AverageCompletionRate = filteredList.Any()
					? Math.Round(filteredList.Average(o => o.CompletionRate), 1)
					: 0,
				GlobalAchievementRate = filteredList.Any()
					? Math.Round((double)filteredList.Count(o => o.Status == "Atteint") / filteredList.Count * 100, 1)
					: 0
			};

			// Paginer
			var totalItems = filteredList.Count;
			var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
			var pagedObjectives = filteredList
				.Skip((pageNumber - 1) * pageSize)
				.Take(pageSize)
				.ToList();

			return (pagedObjectives, statistics);
		}

		/// <summary>
		/// Met à jour le statut et le taux de complétion d'un objectif dans les notes d'un entretien.
		/// Inclut l'auto-synchronisation statut ↔ taux et l'historique de progression.
		/// Utilise System.Text.Json.Nodes pour manipuler le JSON sans corruption.
		/// </summary>
		public async Task<bool> UpdateObjectiveStatusAsync(int interviewId, int objectiveIndex, string? status, int? completionRate)
		{
			var interview = await _interviewRepository.GetByIdAsync(interviewId);
			if (interview == null || string.IsNullOrEmpty(interview.notes))
				return false;

			try
			{
				// Parser le JSON avec JsonNode (DOM mutable)
				var rootNode = System.Text.Json.Nodes.JsonNode.Parse(interview.notes);
				if (rootNode == null) return false;

				var objectivesArray = rootNode["objectives"]?.AsArray();
				if (objectivesArray == null || objectiveIndex < 0 || objectiveIndex >= objectivesArray.Count)
					return false;

				var targetObjective = objectivesArray[objectiveIndex];
				if (targetObjective == null) return false;

				// Déterminer le taux de complétion auto-calculé selon le statut
				string newStatus = status ?? "Non commencé";
				int newCompletionRate = completionRate ?? 0;

				// Auto-synchronisation : si seul le statut change, dériver le taux
				if (!string.IsNullOrEmpty(status) && (completionRate == null || completionRate == 0))
				{
					newCompletionRate = newStatus switch
					{
						"Atteint" => 100,
						"Non commencé" => 0,
						"Non atteint" => 0,
						_ => completionRate ?? 0
					};
				}

				// Si le taux est mis à 100 manuellement, suggérer le statut "Atteint"
				if (completionRate >= 100 && newStatus != "Atteint" && newStatus != "Non atteint")
				{
					newStatus = "Atteint";
					newCompletionRate = 100;
				}

				var nowString = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss");

				// Lire les anciennes valeurs pour l'historique
				var oldStatus = targetObjective["status"]?.GetValue<string>() ?? "Non commencé";
				var oldRate = targetObjective["completionRate"]?.GetValue<int>() ?? 0;
				bool hasChanged = oldStatus != newStatus || oldRate != newCompletionRate;

				// Appliquer les nouvelles valeurs
				targetObjective["status"] = newStatus;
				targetObjective["completionRate"] = newCompletionRate;
				targetObjective["lastModified"] = nowString;

				// Gérer l'historique de progression
				var progressHistoryArray = targetObjective["progressHistory"]?.AsArray();
				if (progressHistoryArray == null)
				{
					progressHistoryArray = new System.Text.Json.Nodes.JsonArray();
					targetObjective["progressHistory"] = progressHistoryArray;
				}

				// Ajouter la nouvelle entrée d'historique si changement
				if (hasChanged)
				{
					progressHistoryArray.Add(new System.Text.Json.Nodes.JsonObject
					{
						["date"] = nowString,
						["oldStatus"] = oldStatus,
						["newStatus"] = newStatus,
						["oldCompletionRate"] = oldRate,
						["newCompletionRate"] = newCompletionRate
					});
				}

				// Sérialiser le JSON modifié
				interview.notes = rootNode.ToJsonString();
				await _interviewRepository.UpdateAsync(interview);
				return true;
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Erreur lors de la mise à jour des objectifs: {ex.Message}");
				return false;
			}
		}



    }
}
