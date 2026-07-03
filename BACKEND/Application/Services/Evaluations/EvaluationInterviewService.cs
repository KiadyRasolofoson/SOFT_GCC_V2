using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;
using soft_carriere_competence.Core.Interface.AuthInterface;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class EvaluationInterviewService
    {
        private readonly ApplicationDbContext _context;
        private readonly IGenericRepository<Position> _posteRepository;
        private readonly IGenericRepository<Department> _departementRepository;
        private readonly IGenericRepository<User> _userRepository;
        private readonly IEmailService _emailService;

        public EvaluationInterviewService(ApplicationDbContext context, IGenericRepository<Position> posteRepository, IGenericRepository<Department> departementRepository, IGenericRepository<User> userRepository, IEmailService emailService)
        {
            _context = context;
            _posteRepository = posteRepository;
            _departementRepository = departementRepository;
            _userRepository = userRepository;
            _emailService = emailService;
        }

        public async Task<IEnumerable<VEmployeesFinishedEvaluation>> GetEmployeesWithFinishedEvalAsync(
                int? position = null,
                int? department = null,
                string? search = null)
        {
            var query = _context.vEmployeesFinishedEvaluations.AsQueryable();

            if (position.HasValue)
                query = query.Where(e => e.positionId == position);

            if (department.HasValue)
                query = query.Where(e => e.DepartmentId == department);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(e =>
                    (e.FirstName + " " + e.LastName).Contains(search) ||
                    e.FirstName.Contains(search) ||
                    e.LastName.Contains(search));

            return await query.ToListAsync();
        }

        //pagination
        public async Task<(IEnumerable<VEmployeesFinishedEvaluation> Employees, int TotalPages)> GetEmployeesWithFinishedEvalPaginatedAsync(
    int pageNumber = 1,
    int pageSize = 10,
    int? position = null,
    int? department = null,
    string? search = null,
    string? sortBy = null,
    string? sortDirection = null)
        {
            var query = _context.vEmployeesFinishedEvaluations.AsQueryable();

            // Appliquer les filtres
            if (position.HasValue)
                query = query.Where(e => e.positionId == position);

            if (department.HasValue)
                query = query.Where(e => e.DepartmentId == department);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(e =>
                    (e.FirstName + " " + e.LastName).Contains(search) ||
                    e.FirstName.Contains(search) ||
                    e.LastName.Contains(search));

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
            var totalItems = await query.CountAsync();

            // Calculer le nombre total de pages
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            // Paginer les résultats
            var employees = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (employees, totalPages);
        }

        public async Task<VEmployeesFinishedEvaluation?> GetEmployeeAsync(int employeeId)
        {
            return await _context.vEmployeesFinishedEvaluations
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<Position> GetPosteByIdAsync(int posteId)
        {
            return await _posteRepository.GetByIdAsync(posteId);
        }

        public async Task<Department> GetDepartmentByIdAsync(int departmentId)
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
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                Console.WriteLine($"Planification d'un entretien pour l'évaluation ID: {evaluationId}, employé ID: {employeeId}");
                
                // Vérifier si l'évaluation existe
                var evaluationExists = await _context.Evaluations.AnyAsync(e => e.EvaluationId == evaluationId);
                if (!evaluationExists)
                {
                    return (false, "Évaluation non trouvée.", null);
                }

                // Vérifier si un entretien existe déjà pour cette évaluation
                var existingInterview = await _context.evaluationInterviews
                    .FirstOrDefaultAsync(e => e.EvaluationId == evaluationId);

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
                        return (false, "Impossible de reprogrammer un entretien déjà terminé.", null);
                    }
                    
                    existingInterview.InterviewDate = scheduledDate;
                    existingInterview.status = InterviewStatus.Planned;
                    
                    _context.evaluationInterviews.Update(existingInterview);
                    await _context.SaveChangesAsync();
                    
                    // Supprimer les participants existants avant d'en ajouter de nouveaux
                    var existingParticipants = await _context.interviewParticipants
                        .Where(p => p.InterviewId == existingInterview.InterviewId)
                        .ToListAsync();
                    
                    if (existingParticipants.Any())
                    {
                        Console.WriteLine($"Suppression de {existingParticipants.Count} participants existants");
                        _context.interviewParticipants.RemoveRange(existingParticipants);
                        await _context.SaveChangesAsync();
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

                    _context.evaluationInterviews.Add(interview);
                    await _context.SaveChangesAsync();
                    
                    Console.WriteLine($"Nouvel entretien créé avec ID: {interview.InterviewId}");
                }

                // Liste pour collecter les participants (pour l'envoi d'emails)
                var participantsInfo = new List<(int ParticipantId, bool IsEvaluatedEmployee)>();

                // Ajouter l'employé concerné par l'évaluation (si fourni)
                if (employeeId.HasValue && employeeId.Value > 0)
                {
                    Console.WriteLine($"Ajout de l'employé {employeeId.Value} comme personne évaluée");
                    
                    _context.interviewParticipants.Add(new InterviewParticipants
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
                        
                        _context.interviewParticipants.Add(new InterviewParticipants
                        {
                            InterviewId = interview.InterviewId,
                            UserId = participantId
                        });
                        
                        // Ajouter à la liste pour l'envoi d'emails
                        participantsInfo.Add((participantId, false));
                    }
                }

                await _context.SaveChangesAsync();
                
                // Envoi des notifications par email si demandé
                if (sendEmails)
                {
                    await SendInterviewNotificationsAsync(interview, participantsInfo);
                }

                await transaction.CommitAsync();
                
                return (true, isUpdate ? "Entretien mis à jour avec succès." : "Entretien planifié avec succès.", interview.InterviewId);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
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
                var evaluation = await _context.Evaluations
                    .Include(e => e.EvaluationType)
                    .FirstOrDefaultAsync(e => e.EvaluationId == interview.EvaluationId);
                
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
                    User userInfo = null;
                    string firstName = "", lastName = "", email = "";
                    
                    if (isEvaluatedEmployee)
                    {
                        // Cas de l'employé évalué
                        var employee = await _context.Employee
                            .FirstOrDefaultAsync(e => e.EmployeeId == participantId);
                        
                        if (employee != null)
                        {
                            firstName = employee.FirstName;
                            lastName = employee.Name;
                            email = employee.Email;
                            
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
                            email = userInfo.Email;
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
                                   $"<a href='http://localhost:5189/api/homeInterview' class='button'>Accéder au système</a><br><br>" +
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
                var interview = await _context.evaluationInterviews
                    .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

                if (interview == null)
                {
                    Console.WriteLine($"Aucun entretien trouvé avec l'ID: {interviewId}");
                    return false;
                }

                Console.WriteLine($"Entretien trouvé, statut actuel: {interview.status}");

                // Mettre à jour directement avec EF Core au lieu d'une requête SQL
                interview.status = InterviewStatus.InProgress;
                _context.evaluationInterviews.Update(interview);
                var rowsAffected = await _context.SaveChangesAsync();

                Console.WriteLine($"Mise à jour effectuée, {rowsAffected} lignes affectées");

                // Vérifier que la mise à jour a bien fonctionné
                var updatedInterview = await _context.evaluationInterviews
                    .AsNoTracking()
                    .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

                if (updatedInterview != null)
                {
                    Console.WriteLine($"Vérification après mise à jour: statut actuel = {updatedInterview.status}");
                }

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception dans StartInterviewAsync: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                throw; // Relancer l'exception pour que l'appelant puisse la gérer
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

            var interview = await _context.evaluationInterviews
                .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

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
                        var evaluation = await _context.Evaluations.FindAsync(interview.EvaluationId);
                        if (evaluation != null)
                        {
                            evaluation.state = 30; // État archivé
                            _context.Evaluations.Update(evaluation);
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
                _context.evaluationInterviews.Update(interview);
                await _context.SaveChangesAsync();
                Console.WriteLine("Interview mis à jour avec succès dans la base de données");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception lors de la sauvegarde des changements: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                throw; // Relancer l'exception pour que l'appelant puisse la gérer
            }
        }




        // Récupérer les détails d'un entretien
        // Récupérer les détails d'un entretien
        public async Task<EvaluationInterviews?> GetInterviewDetailsAsync(int interviewId)
        {
            // Récupère les détails de l'entretien sans les participants d'abord
            var interview = await _context.evaluationInterviews
                .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

            if (interview != null)
            {
                try
                {
                    // Récupère les participants associés à cet entretien avec gestion des nulls
                    var participants = await _context.interviewParticipants
                        .Where(p => p.InterviewId == interviewId)
                        .Select(p => new
                        {
                            ParticipantId = p.ParticipantId,
                            UserId = p.UserId,  // Peut être null
                            EmployeeId = p.EmployeeId,  // Peut être null
                                                        // Ne pas inclure .User directement si UserId peut être null
                        })
                        .ToListAsync();

                    // Log pour debug
                    Console.WriteLine($"Récupération des participants pour l'entretien {interviewId}: {participants.Count} trouvés");

                    // Si nécessaire, charger les détails des utilisateurs séparément
                    if (participants.Any())
                    {
                        Console.WriteLine("Participants trouvés, mais non chargés avec les détails utilisateur pour éviter les erreurs NULL");
                    }
                }
                catch (Exception ex)
                {
                    // Capturer l'exception mais continuer - nous retournons quand même l'entretien
                    Console.WriteLine($"Erreur lors de la récupération des participants: {ex.Message}");
                    Console.WriteLine($"StackTrace: {ex.StackTrace}");
                }
            }

            return interview;
        }


        public async Task<bool> UpdateInterviewAsync(int interviewId, DateTime? newDate, List<int> newParticipantIds, int? newStatus)
        {
            var interview = await _context.evaluationInterviews
                .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

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
                // Supprimer les anciens participants
                // _context.interviewParticipants.RemoveRange(interview.Participants);

                // Ajouter les nouveaux participants
                foreach (var participantId in newParticipantIds)
                {
                    _context.interviewParticipants.Add(new InterviewParticipants
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
                // Si le statut est valide, mettre à jour
                if (Enum.IsDefined(typeof(InterviewStatus), status))
                {
                    interview.status = status;
                }
                else
                {
                    return false; // Si le statut n'est pas valide, la mise à jour échoue
                }
            }

            _context.evaluationInterviews.Update(interview);
            await _context.SaveChangesAsync();


            return true;
        }

        public async Task<EvaluationInterviews?> GetInterviewByParticipantIdAsync(int participantId)
        {
            try
            {
                Console.WriteLine($"Recherche d'entretien pour le participant/employé ID: {participantId}");

                // Rechercher d'abord si c'est un employé évalué
                var interviewIds = await _context.interviewParticipants
                    .Where(p => p.EmployeeId == participantId)
                    .Select(p => p.InterviewId)
                    .ToListAsync();

                Console.WriteLine($"Entretiens trouvés via EmployeeId: {string.Join(", ", interviewIds)}");

                // Si aucun résultat, chercher comme participant (User)
                if (!interviewIds.Any())
                {
                    interviewIds = await _context.interviewParticipants
                        .Where(p => p.UserId == participantId)
                        .Select(p => p.InterviewId)
                        .ToListAsync();

                    Console.WriteLine($"Entretiens trouvés via UserId: {string.Join(", ", interviewIds)}");
                }

                if (!interviewIds.Any())
                {
                    Console.WriteLine("Aucun entretien trouvé pour ce participant");
                    return null;
                }

                // Récupérer l'entretien le plus récent
                var interview = await _context.evaluationInterviews
                    .Where(i => interviewIds.Contains(i.InterviewId))
                    .OrderByDescending(i => i.InterviewDate)
                    .FirstOrDefaultAsync();

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
                return null; // Retourner null au lieu de relancer l'exception
            }
        }

        public string GetValidationStatus(int interviewId)
        {
            var interview = _context.evaluationInterviews
                .FirstOrDefault(i => i.InterviewId == interviewId);

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





    }
}
