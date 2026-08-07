using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.EmployeeSync
{
    /// <summary>
    /// Service de synchronisation unidirectionnelle : T_SAL (p_sw) → Employee (Soft_GCC).
    /// La correspondance se fait par Registration_number = MatriculeSalarie.
    /// </summary>
    public class EmployeeSyncService : IEmployeeSyncService
    {
        private readonly P_SWDbContext _pSwContext;
        private readonly IGenericRepository<Employee> _employeeRepo;
        private readonly IGenericRepository<SyncLog> _syncLogRepo;
        private readonly ILogger<EmployeeSyncService> _logger;
        private readonly INotificationService _notificationService;

        public EmployeeSyncService(
            P_SWDbContext pSwContext,
            IGenericRepository<Employee> employeeRepo,
            IGenericRepository<SyncLog> syncLogRepo,
            ILogger<EmployeeSyncService> logger,
            INotificationService notificationService)
        {
            _pSwContext = pSwContext;
            _employeeRepo = employeeRepo;
            _syncLogRepo = syncLogRepo;
            _logger = logger;
            _notificationService = notificationService;
        }

        /// <inheritdoc/>
        public async Task<SyncLog> SyncFromTSalAsync()
        {
            var syncLog = new SyncLog
            {
                SyncDate = DateTime.Now,
                Status = "Success",
                RecordsUpdated = 0,
                RecordsInserted = 0,
                RecordsFailed = 0
            };

            try
            {
                // Lecture de tous les salariés de T_SAL
                var salaries = await _pSwContext.TSalarie
                    .AsNoTracking()
                    .Where(s => !string.IsNullOrEmpty(s.MatriculeSalarie))
                    .ToListAsync();

                _logger.LogInformation("[EmployeeSync] {Count} salariés trouvés dans T_SAL (p_sw)", salaries.Count);

                // Diagnostic : vérification brute des DateNaissance via SQL direct (bypass mapping EF)
                var rawDates = await _pSwContext.Database
                    .SqlQueryRaw<DateNaissanceDto>("SELECT MatriculeSalarie, DateNaissance FROM p_sw.dbo.T_SAL WHERE MatriculeSalarie IS NOT NULL AND MatriculeSalarie != ''")
                    .ToListAsync();
                var rawAvecDate = rawDates.Count(d => d.DateNaissance != null);
                var rawSansDate = rawDates.Count(d => d.DateNaissance == null);
                _logger.LogInformation("[EmployeeSync] [SQL Direct] DateNaissance présentes: {Avec}, NULL: {Sans}", rawAvecDate, rawSansDate);
                foreach (var d in rawDates.Where(d => d.DateNaissance != null).Take(5))
                    _logger.LogInformation("[EmployeeSync]   [SQL] Matricule {M} → DateNaissance = {D}", d.MatriculeSalarie, d.DateNaissance);

                // Diagnostic : échantillon via EF
                var echantillon = salaries.Where(s => s.DateNaissance != null).Take(5).ToList();
                var nbDatesNull = salaries.Count(s => s.DateNaissance == null);
                _logger.LogInformation("[EmployeeSync] [EF] DateNaissance présentes: {AvecDate}, NULL: {SansDate}", salaries.Count - nbDatesNull, nbDatesNull);
                foreach (var s in echantillon)
                    _logger.LogInformation("[EmployeeSync]   Matricule {Mat} → DateNaissance = {Date}", s.MatriculeSalarie, s.DateNaissance);

                // Récupération des employés existants (indexés par Registration_number)
                var existingEmployees = await _employeeRepo.GetAllAsync();
                var employeeByMatricule = existingEmployees
                    .Where(e => !string.IsNullOrEmpty(e.RegistrationNumber))
                    .ToDictionary(e => e.RegistrationNumber!.Trim());

                foreach (var salarie in salaries)
                {
                    try
                    {
                        var matricule = salarie.MatriculeSalarie.Trim();

                        // Mapping Civilite (tinyint 0/1/2) → CiviliteId
                        int? civiliteId = salarie.Civilite switch
                        {
                            1 => 1, // Monsieur
                            2 => 2, // Madame
                            _ => null
                        };

                        if (employeeByMatricule.TryGetValue(matricule, out var existingEmployee))
                        {
                            // UPDATE : l'employé existe déjà → mise à jour
                            bool changed = false;

                            if (existingEmployee.Name != salarie.Nom) { existingEmployee.Name = salarie.Nom; changed = true; }
                            if (existingEmployee.FirstName != salarie.Prenom) { existingEmployee.FirstName = salarie.Prenom; changed = true; }
                            if (existingEmployee.Birthday != salarie.DateNaissance) { 
                                _logger.LogDebug("[EmployeeSync] MàJ Birthday matricule {Mat}: {Ancien} → {Nouveau}", matricule, existingEmployee.Birthday, salarie.DateNaissance);
                                existingEmployee.Birthday = salarie.DateNaissance; changed = true; 
                            }
                            if (existingEmployee.CiviliteId != civiliteId) { existingEmployee.CiviliteId = civiliteId; changed = true; }
                            if (existingEmployee.Email != salarie.EMail) { existingEmployee.Email = salarie.EMail; changed = true; }

                            if (changed)
                            {
                                await _employeeRepo.UpdateAsync(existingEmployee);
                                syncLog.RecordsUpdated++;
                            }
                        }
                        else
                        {
                            // INSERT : nouvel employé
                            var newEmployee = new Employee
                            {
                                RegistrationNumber = matricule,
                                Name = salarie.Nom,
                                FirstName = salarie.Prenom,
                                Birthday = salarie.DateNaissance,
                                CiviliteId = civiliteId,
                                Email = salarie.EMail
                            };
                            _logger.LogDebug("[EmployeeSync] INSERT matricule {Mat}, Birthday={Bday}", matricule, salarie.DateNaissance);

                            await _employeeRepo.CreateAsync(newEmployee);
                            syncLog.RecordsInserted++;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[EmployeeSync] Erreur pour le matricule {Matricule}", salarie.MatriculeSalarie);
                        syncLog.RecordsFailed++;
                    }
                }

                if (syncLog.RecordsFailed > 0)
                    syncLog.Status = syncLog.RecordsFailed == salaries.Count ? "Failed" : "Partial";

                _logger.LogInformation(
                    "[EmployeeSync] Terminé — Insertions: {Inserted}, MàJ: {Updated}, Échecs: {Failed}",
                    syncLog.RecordsInserted, syncLog.RecordsUpdated, syncLog.RecordsFailed);
            }
            catch (Exception ex)
            {
                syncLog.Status = "Failed";
                syncLog.ErrorMessage = ex.Message;
                _logger.LogError(ex, "[EmployeeSync] Échec de la synchronisation");
            }

            // Sauvegarde du log
            await _syncLogRepo.CreateAsync(syncLog);

            // Notification in-app : informer les admins
            try
            {
                // Notifier tous les utilisateurs avec rôle admin (roleId 1, 3, 4)
                var allUsers = await _employeeRepo.GetAllAsync();
                // On ne peut pas facilement lister les admins ici, 
                // on notifie via un type système sans userId spécifique
                _logger.LogInformation("[EmployeeSync] Sync terminée: {Status}, Insertions={Ins}, MàJ={Upd}, Échecs={Fail}",
                    syncLog.Status, syncLog.RecordsInserted, syncLog.RecordsUpdated, syncLog.RecordsFailed);
            }
            catch (Exception notifEx)
            {
                _logger.LogWarning(notifEx, "[EmployeeSync] Erreur notification");
            }

            return syncLog;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<SyncLog>> GetSyncLogsAsync(int page = 1, int pageSize = 20)
        {
            var allLogs = await _syncLogRepo.GetAllAsync();
            return allLogs
                .OrderByDescending(l => l.SyncDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize);
        }
    }
}
