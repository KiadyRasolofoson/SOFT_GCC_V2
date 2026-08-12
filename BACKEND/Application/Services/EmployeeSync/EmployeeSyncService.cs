using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.salary_skills.p_sw;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.EmployeeSync
{
    /// <summary>
    /// Synchronisation unidirectionnelle p_sw → Soft_GCC :
    /// T_SAL (identité) + T_HST_* InfoEnCours=1 (organisation) + référentiels.
    /// Correspondance : Registration_number = MatriculeSalarie.
    /// </summary>
    public class EmployeeSyncService : IEmployeeSyncService
    {
        private static readonly DateTime PlaceholderBirthday = new(2000, 1, 1);

        /// <summary>
        /// Alias Soft_GCC (noms legacy) → code département p_sw (T_DEPARTEMENT.Code).
        /// Sert à fusionner les doublons vers les intitulés officiels p_sw.
        /// </summary>
        private static readonly Dictionary<string, string> LegacyDepartmentAliases =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["Informatique"] = "DI",
                ["Administratif et Financier"] = "DA",
                ["Administratif"] = "DA",
                ["Commerciale & Marketing"] = "DC",
                ["Commercial"] = "DC",
                ["Direction"] = "DG",
                ["Technique"] = "DT",
                ["Marketing"] = "DM",
                ["Logistique"] = "DT",
            };

        private readonly P_SWDbContext _pSwContext;
        private readonly ApplicationDbContext _appContext;
        private readonly IGenericRepository<Employee> _employeeRepo;
        private readonly IGenericRepository<SyncLog> _syncLogRepo;
        private readonly IGenericRepository<Department> _departmentRepo;
        private readonly IGenericRepository<Position> _positionRepo;
        private readonly IGenericRepository<Establishment> _establishmentRepo;
        private readonly IGenericRepository<CareerPlan> _careerPlanRepo;
        private readonly ILogger<EmployeeSyncService> _logger;

        public EmployeeSyncService(
            P_SWDbContext pSwContext,
            ApplicationDbContext appContext,
            IGenericRepository<Employee> employeeRepo,
            IGenericRepository<SyncLog> syncLogRepo,
            IGenericRepository<Department> departmentRepo,
            IGenericRepository<Position> positionRepo,
            IGenericRepository<Establishment> establishmentRepo,
            IGenericRepository<CareerPlan> careerPlanRepo,
            ILogger<EmployeeSyncService> logger)
        {
            _pSwContext = pSwContext;
            _appContext = appContext;
            _employeeRepo = employeeRepo;
            _syncLogRepo = syncLogRepo;
            _departmentRepo = departmentRepo;
            _positionRepo = positionRepo;
            _establishmentRepo = establishmentRepo;
            _careerPlanRepo = careerPlanRepo;
            _logger = logger;
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
                // 1) Soft_GCC.Department = uniquement T_DEPARTEMENT (p_sw), fusion des doublons
                var deptCodeToId = await SyncDepartmentsFromPswAsync();

                // 2) Identité T_SAL
                var salaries = await _pSwContext.TSalarie
                    .AsNoTracking()
                    .Where(s => !string.IsNullOrEmpty(s.MatriculeSalarie))
                    .ToListAsync();

                _logger.LogInformation("[EmployeeSync] {Count} salariés trouvés dans T_SAL (p_sw)", salaries.Count);

                var birthdayStats = salaries
                    .Select(s => NormalizeBirthday(s.DateNaissance))
                    .ToList();
                _logger.LogInformation(
                    "[EmployeeSync] DateNaissance exploitables: {Avec}, ignorées (NULL/placeholder): {Sans}",
                    birthdayStats.Count(d => d != null),
                    birthdayStats.Count(d => d == null));

                var existingEmployees = (await _employeeRepo.GetAllAsync()).ToList();
                var employeeByMatricule = new Dictionary<string, Employee>(StringComparer.OrdinalIgnoreCase);

                foreach (var existingEmployee in existingEmployees)
                {
                    var existingMatricule = existingEmployee.RegistrationNumber?.Trim();
                    if (!string.IsNullOrEmpty(existingMatricule) && !employeeByMatricule.ContainsKey(existingMatricule))
                    {
                        employeeByMatricule[existingMatricule] = existingEmployee;
                    }
                }

                // Index Soft_GCC Position / Establishment pour upserts
                var positionByName = (await _positionRepo.GetAllAsync())
                    .Where(p => !string.IsNullOrWhiteSpace(p.PositionName))
                    .GroupBy(p => p.PositionName!.Trim(), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

                var establishmentByName = (await _establishmentRepo.GetAllAsync())
                    .Where(e => !string.IsNullOrWhiteSpace(e.EstablishmentName))
                    .GroupBy(e => e.EstablishmentName!.Trim(), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

                // 3) HST courants (InfoEnCours = 1)
                var affectations = await _pSwContext.THstAffectation
                    .AsNoTracking()
                    .Where(a => a.InfoEnCours == 1)
                    .ToListAsync();
                var postes = await _pSwContext.THstPoste
                    .AsNoTracking()
                    .Where(p => p.InfoEnCours == 1)
                    .ToListAsync();
                var etabs = await _pSwContext.THstEtablissement
                    .AsNoTracking()
                    .Where(e => e.InfoEnCours == 1)
                    .ToListAsync();
                var contrats = await _pSwContext.THstContrat
                    .AsNoTracking()
                    .Where(c => c.InfoEnCours == 1)
                    .ToListAsync();

                var affectationByNum = affectations
                    .GroupBy(a => a.NumSalarie)
                    .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.IdHstAffectation).First());
                var posteByNum = postes
                    .GroupBy(p => p.NumSalarie)
                    .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.IdHstPoste).First());
                var etabByNum = etabs
                    .GroupBy(e => e.NumSalarie)
                    .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.IdHstEtab).First());
                var contratByNum = contrats
                    .GroupBy(c => c.NumSalarie)
                    .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.IdHstContrat).First());

                _logger.LogInformation(
                    "[EmployeeSync] HST en cours — Affectation:{A}, Poste:{P}, Etab:{E}, Contrat:{C}",
                    affectationByNum.Count, posteByNum.Count, etabByNum.Count, contratByNum.Count);

                var withoutAffectation = 0;

                // 4) Sync identité + organisation (sauf manager — 2e passe)
                foreach (var salarie in salaries)
                {
                    try
                    {
                        var matricule = salarie.MatriculeSalarie.Trim();
                        int? civiliteId = salarie.Civilite switch
                        {
                            1 => 1,
                            2 => 2,
                            _ => null
                        };
                        var birthday = NormalizeBirthday(salarie.DateNaissance);

                        affectationByNum.TryGetValue(salarie.SaCompteurNumero, out var affectation);
                        posteByNum.TryGetValue(salarie.SaCompteurNumero, out var poste);
                        etabByNum.TryGetValue(salarie.SaCompteurNumero, out var etab);
                        contratByNum.TryGetValue(salarie.SaCompteurNumero, out var contrat);

                        if (affectation == null)
                            withoutAffectation++;

                        int? departmentId = ResolveDepartmentId(affectation?.Departement, deptCodeToId);
                        int? positionId = await ResolveOrCreatePositionAsync(affectation?.EmploiOccupe, positionByName);
                        int? establishmentId = await ResolveOrCreateEstablishmentAsync(etab, establishmentByName);
                        DateTime? hiringDate = etab?.DateEntree ?? contrat?.DateDebutContrat
                            ?? affectation?.DateEntreePoste ?? affectation?.DateDebut;

                        if (employeeByMatricule.TryGetValue(matricule, out var existingEmployee))
                        {
                            bool changed = false;

                            if (existingEmployee.Name != salarie.Nom) { existingEmployee.Name = salarie.Nom; changed = true; }
                            if (existingEmployee.FirstName != salarie.Prenom) { existingEmployee.FirstName = salarie.Prenom; changed = true; }
                            if (existingEmployee.CiviliteId != civiliteId) { existingEmployee.CiviliteId = civiliteId; changed = true; }
                            if (existingEmployee.Email != salarie.EMail) { existingEmployee.Email = salarie.EMail; changed = true; }

                            if (ShouldApplyBirthday(birthday, existingEmployee.Birthday))
                            {
                                existingEmployee.Birthday = birthday;
                                changed = true;
                            }

                            if (departmentId.HasValue && existingEmployee.Department_id != departmentId)
                            {
                                existingEmployee.Department_id = departmentId;
                                changed = true;
                            }

                            if (hiringDate.HasValue && existingEmployee.Hiring_date != hiringDate)
                            {
                                existingEmployee.Hiring_date = hiringDate;
                                changed = true;
                            }

                            await UpsertCareerPlanAsync(matricule, departmentId, positionId, establishmentId, hiringDate, affectation);

                            if (changed)
                            {
                                await _employeeRepo.UpdateAsync(existingEmployee);
                                syncLog.RecordsUpdated++;
                            }
                        }
                        else
                        {
                            var newEmployee = new Employee
                            {
                                RegistrationNumber = matricule,
                                Name = salarie.Nom,
                                FirstName = salarie.Prenom,
                                Birthday = birthday,
                                CiviliteId = civiliteId,
                                Email = salarie.EMail,
                                Department_id = departmentId,
                                Hiring_date = hiringDate
                            };

                            await _employeeRepo.CreateAsync(newEmployee);
                            employeeByMatricule[matricule] = newEmployee;
                            syncLog.RecordsInserted++;

                            await UpsertCareerPlanAsync(matricule, departmentId, positionId, establishmentId, hiringDate, affectation);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[EmployeeSync] Erreur pour le matricule {Matricule}", salarie.MatriculeSalarie);
                        syncLog.RecordsFailed++;
                    }
                }

                // 5) 2e passe : managers (MatriculeSuperieurHie → ManagerId)
                var managerUpdates = 0;
                foreach (var salarie in salaries)
                {
                    try
                    {
                        var matricule = salarie.MatriculeSalarie.Trim();
                        if (!employeeByMatricule.TryGetValue(matricule, out var employee))
                            continue;

                        if (!posteByNum.TryGetValue(salarie.SaCompteurNumero, out var poste))
                            continue;

                        var managerMatricule = poste.MatriculeSuperieurHie?.Trim();
                        if (string.IsNullOrEmpty(managerMatricule))
                            continue;

                        if (!employeeByMatricule.TryGetValue(managerMatricule, out var manager))
                            continue;

                        if (employee.ManagerId != manager.EmployeeId)
                        {
                            employee.ManagerId = manager.EmployeeId;
                            await _employeeRepo.UpdateAsync(employee);
                            managerUpdates++;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[EmployeeSync] Erreur manager pour {Matricule}", salarie.MatriculeSalarie);
                    }
                }

                if (managerUpdates > 0)
                    _logger.LogInformation("[EmployeeSync] Managers mis à jour: {Count}", managerUpdates);

                if (withoutAffectation > 0)
                    _logger.LogInformation("[EmployeeSync] Salariés sans affectation en cours: {Count}", withoutAffectation);

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

            await _syncLogRepo.CreateAsync(syncLog);
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

        /// <summary>
        /// Aligne Soft_GCC.Department sur p_sw.T_DEPARTEMENT uniquement :
        /// crée les manquants, fusionne les alias legacy, réassigne Employee/Career_plan,
        /// supprime les départements Soft_GCC hors référentiel p_sw.
        /// Retourne Code p_sw → DepartmentId Soft_GCC.
        /// </summary>
        private async Task<Dictionary<string, int>> SyncDepartmentsFromPswAsync()
        {
            var pswDepts = await _pSwContext.TDepartement
                .AsNoTracking()
                .Where(d => !string.IsNullOrEmpty(d.Code))
                .ToListAsync();

            var softDepts = await _appContext.Department.ToListAsync();
            var byName = softDepts
                .Where(d => !string.IsNullOrWhiteSpace(d.Name))
                .GroupBy(d => d.Name!.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var codeToId = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var codeToIntitule = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            // 1) Garantir un Soft_GCC.Department par intitulé p_sw
            foreach (var pswDept in pswDepts)
            {
                var code = pswDept.Code.Trim();
                var intitule = string.IsNullOrWhiteSpace(pswDept.Intitule) ? code : pswDept.Intitule.Trim();
                codeToIntitule[code] = intitule;

                if (byName.TryGetValue(intitule, out var existing))
                {
                    codeToId[code] = existing.DepartmentId;
                    continue;
                }

                var created = new Department { Name = intitule };
                await _departmentRepo.CreateAsync(created);
                byName[intitule] = created;
                softDepts.Add(created);
                codeToId[code] = created.DepartmentId;
                _logger.LogInformation("[EmployeeSync] Département p_sw créé: {Name} (code {Code})", intitule, code);
            }

            var canonicalIds = new HashSet<int>(codeToId.Values);

            // 2) Carte de fusion : ancien DepartmentId Soft_GCC → id canonique p_sw
            var remapOldToNew = new Dictionary<int, int>();
            foreach (var softDept in softDepts)
            {
                if (canonicalIds.Contains(softDept.DepartmentId))
                    continue;

                var name = softDept.Name?.Trim();
                if (string.IsNullOrEmpty(name))
                    continue;

                string? code = null;
                if (LegacyDepartmentAliases.TryGetValue(name, out var aliasCode))
                    code = aliasCode;
                else
                {
                    // Match direct sur intitulé p_sw déjà traité, ou code exact (DA, DI…)
                    var byIntitule = codeToIntitule.FirstOrDefault(kv =>
                        string.Equals(kv.Value, name, StringComparison.OrdinalIgnoreCase));
                    if (!string.IsNullOrEmpty(byIntitule.Key))
                        code = byIntitule.Key;
                    else if (codeToId.ContainsKey(name))
                        code = name.Trim();
                }

                if (code != null && codeToId.TryGetValue(code, out var canonicalId)
                    && softDept.DepartmentId != canonicalId)
                {
                    remapOldToNew[softDept.DepartmentId] = canonicalId;
                }
            }

            // 3) Réassigner Employee + Career_plan vers les départements p_sw
            var employees = await _appContext.Employee.ToListAsync();
            var remappedEmployees = 0;
            foreach (var employee in employees)
            {
                if (!employee.Department_id.HasValue)
                    continue;

                if (remapOldToNew.TryGetValue(employee.Department_id.Value, out var newId))
                {
                    employee.Department_id = newId;
                    remappedEmployees++;
                }
                else if (!canonicalIds.Contains(employee.Department_id.Value))
                {
                    // Hors référentiel p_sw et sans alias → sera repris par HST si sync
                    employee.Department_id = null;
                    remappedEmployees++;
                }
            }

            var careerPlans = await _appContext.CareerPlan.ToListAsync();
            var remappedPlans = 0;
            foreach (var plan in careerPlans)
            {
                if (!plan.DepartmentId.HasValue)
                    continue;

                if (remapOldToNew.TryGetValue(plan.DepartmentId.Value, out var newId))
                {
                    plan.DepartmentId = newId;
                    remappedPlans++;
                }
                else if (!canonicalIds.Contains(plan.DepartmentId.Value))
                {
                    plan.DepartmentId = null;
                    remappedPlans++;
                }
            }

            if (remappedEmployees > 0 || remappedPlans > 0)
                await _appContext.SaveChangesAsync();

            _logger.LogInformation(
                "[EmployeeSync] Départements réassignés — Employee:{E}, Career_plan:{C}",
                remappedEmployees, remappedPlans);

            // 4) Supprimer les Soft_GCC.Department hors T_DEPARTEMENT
            var obsolete = softDepts.Where(d => !canonicalIds.Contains(d.DepartmentId)).ToList();
            if (obsolete.Count > 0)
            {
                _appContext.Department.RemoveRange(obsolete);
                await _appContext.SaveChangesAsync();
                _logger.LogInformation(
                    "[EmployeeSync] {Count} départements Soft_GCC hors p_sw supprimés",
                    obsolete.Count);
            }

            _logger.LogInformation(
                "[EmployeeSync] Référentiel départements Soft_GCC = {Count} entrées p_sw",
                codeToId.Count);
            return codeToId;
        }

        private static int? ResolveDepartmentId(string? deptCode, Dictionary<string, int> deptCodeToId)
        {
            if (string.IsNullOrWhiteSpace(deptCode))
                return null;

            return deptCodeToId.TryGetValue(deptCode.Trim(), out var id) ? id : null;
        }

        private async Task<int?> ResolveOrCreatePositionAsync(
            string? emploiOccupe,
            Dictionary<string, Position> positionByName)
        {
            if (string.IsNullOrWhiteSpace(emploiOccupe))
                return null;

            var name = emploiOccupe.Trim();
            if (positionByName.TryGetValue(name, out var existing))
                return existing.PositionId;

            var created = new Position { PositionName = name };
            await _positionRepo.CreateAsync(created);
            positionByName[name] = created;
            _logger.LogDebug("[EmployeeSync] Poste créé: {Name}", name);
            return created.PositionId;
        }

        private async Task<int?> ResolveOrCreateEstablishmentAsync(
            THstEtablissement? etab,
            Dictionary<string, Establishment> establishmentByName)
        {
            if (etab == null)
                return null;

            var name = !string.IsNullOrWhiteSpace(etab.EnseigneDuLieuDeTravail)
                ? etab.EnseigneDuLieuDeTravail.Trim()
                : etab.CodeEtab?.Trim();

            if (string.IsNullOrWhiteSpace(name))
                return null;

            if (establishmentByName.TryGetValue(name, out var existing))
                return existing.EstablishmentId;

            // Fallback : tenter aussi le code établissement s'il diffère
            if (!string.IsNullOrWhiteSpace(etab.CodeEtab)
                && establishmentByName.TryGetValue(etab.CodeEtab.Trim(), out var byCode))
                return byCode.EstablishmentId;

            var created = new Establishment
            {
                EstablishmentName = name,
                CreationDate = DateTime.Now,
                UpdatedDate = DateTime.Now
            };
            await _establishmentRepo.CreateAsync(created);
            establishmentByName[name] = created;
            _logger.LogInformation("[EmployeeSync] Établissement créé: {Name}", name);
            return created.EstablishmentId;
        }

        private async Task UpsertCareerPlanAsync(
            string matricule,
            int? departmentId,
            int? positionId,
            int? establishmentId,
            DateTime? hiringDate,
            THstAffectation? affectation)
        {
            if (!departmentId.HasValue && !positionId.HasValue && !establishmentId.HasValue && !hiringDate.HasValue)
                return;

            var assignmentDate = affectation?.DateEntreePoste ?? affectation?.DateDebut ?? hiringDate;

            var existing = await _appContext.CareerPlan
                .Where(c => c.RegistrationNumber == matricule && c.State != null && c.State > 0)
                .OrderByDescending(c => c.CareerPlanId)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                bool changed = false;
                if (departmentId.HasValue && existing.DepartmentId != departmentId) { existing.DepartmentId = departmentId; changed = true; }
                if (positionId.HasValue && existing.PositionId != positionId) { existing.PositionId = positionId; changed = true; }
                if (establishmentId.HasValue && existing.EstablishmentId != establishmentId) { existing.EstablishmentId = establishmentId; changed = true; }
                if (assignmentDate.HasValue && existing.AssignmentDate != assignmentDate) { existing.AssignmentDate = assignmentDate; changed = true; }
                if (hiringDate.HasValue && existing.StartDate != hiringDate) { existing.StartDate = hiringDate; changed = true; }

                if (changed)
                {
                    existing.UpdatedDate = DateTime.Now;
                    await _careerPlanRepo.UpdateAsync(existing);
                }
            }
            else
            {
                var plan = new CareerPlan
                {
                    RegistrationNumber = matricule,
                    AssignmentTypeId = 1, // Nomination
                    DepartmentId = departmentId,
                    PositionId = positionId,
                    EstablishmentId = establishmentId,
                    AssignmentDate = assignmentDate,
                    StartDate = hiringDate,
                    State = 1,
                    CreationDate = DateTime.Now,
                    UpdatedDate = DateTime.Now
                };
                await _careerPlanRepo.CreateAsync(plan);
            }
        }

        /// <summary>
        /// Ignore NULL et le placeholder paie 2000-01-01.
        /// </summary>
        private static DateTime? NormalizeBirthday(DateTime? dateNaissance)
        {
            if (!dateNaissance.HasValue)
                return null;

            if (dateNaissance.Value.Date == PlaceholderBirthday)
                return null;

            return dateNaissance;
        }

        /// <summary>
        /// N'applique une date p_sw que si elle est exploitable et améliore Soft_GCC
        /// (ne remplace jamais une date Soft_GCC par NULL / placeholder).
        /// </summary>
        private static bool ShouldApplyBirthday(DateTime? pswBirthday, DateTime? softBirthday)
        {
            if (!pswBirthday.HasValue)
                return false;

            if (!softBirthday.HasValue)
                return true;

            return softBirthday.Value.Date != pswBirthday.Value.Date;
        }
    }
}
