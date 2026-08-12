using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Core.Interface.ServiceInterface;

using soft_carriere_competence.Application.Authorization;
namespace soft_carriere_competence.Controllers.Evaluations
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [RequirePermission("VIEW_COMPETENCE_BULLETIN","VIEW_SKILLS_PROFILES","MANAGE_SKILLS_PROFILES")]
public class BulletinCompetenceController : ControllerBase
    {
        private readonly IEmployeeSkillService _employeeSkillService;

        public BulletinCompetenceController(IEmployeeSkillService employeeSkillService)
        {
            _employeeSkillService = employeeSkillService;
        }

        /// <summary>
        /// Récupère les données structurées pour le bulletin de compétences d'un employé.
        /// Retourne les compétences groupées par domaine avec classification (maîtrisée, en cours, non acquise).
        /// </summary>
        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetBulletinData(int employeeId)
        {
            try
            {
                // 1. Récupérer toutes les compétences de l'employé
                var employeeSkills = await _employeeSkillService.GetEmployeeSkills(employeeId);

                if (employeeSkills == null || employeeSkills.Count == 0)
                {
                    return Ok(new BulletinResponse
                    {
                        EmployeeId = employeeId,
                        EmployeeName = "",
                        EmployeeFirstName = "",
                        RegistrationNumber = "",
                        DepartmentName = "",
                        TotalSkills = 0,
                        MasteredCount = 0,
                        InProgressCount = 0,
                        NotAcquiredCount = 0,
                        Domains = new List<DomainBulletinDto>()
                    });
                }

                // 2. Extraire les infos de l'employé
                var first = employeeSkills.First();
                var employeeName = first.Name ?? "";
                var employeeFirstName = first.FirstName ?? "";
                var registrationNumber = first.RegistrationNumber ?? "";
                var departmentName = first.DepartmentName ?? "";

                // 3. Classifier et grouper par domaine
                var domainGroups = employeeSkills
                    .GroupBy(s => new { s.DomainSkillId, s.DomainSkillName })
                    .Select(g =>
                    {
                        var skills = g.Select(s => new SkillBulletinDto
                        {
                            SkillId = s.SkillId,
                            SkillName = s.SkillName ?? "Inconnu",
                            Level = s.Level,
                            State = s.State ?? 1,
                            LastUpdated = s.UpdatedDate.Year > 1 ? s.UpdatedDate : (DateTime?)null,
                            Classification = s.Level >= 70 ? "maitrisee" :
                                             s.Level >= 40 ? "en_cours" : "non_acquise",
                            ClassificationLabel = s.Level >= 70 ? "Maîtrisée" :
                                                  s.Level >= 40 ? "En cours d'acquisition" : "Non acquise"
                        }).OrderByDescending(s => s.Level).ToList();

                        return new DomainBulletinDto
                        {
                            DomainId = g.Key.DomainSkillId,
                            DomainName = g.Key.DomainSkillName ?? "Non spécifié",
                            Skills = skills,
                            MasteredCount = skills.Count(s => s.Classification == "maitrisee"),
                            InProgressCount = skills.Count(s => s.Classification == "en_cours"),
                            NotAcquiredCount = skills.Count(s => s.Classification == "non_acquise")
                        };
                    })
                    .OrderBy(d => d.DomainName)
                    .ToList();

                // 4. Calculer les totaux
                int totalSkills = employeeSkills.Count;
                int masteredCount = employeeSkills.Count(s => s.Level >= 70);
                int inProgressCount = employeeSkills.Count(s => s.Level >= 40 && s.Level < 70);
                int notAcquiredCount = employeeSkills.Count(s => s.Level < 40);

                var response = new BulletinResponse
                {
                    EmployeeId = employeeId,
                    EmployeeName = employeeName,
                    EmployeeFirstName = employeeFirstName,
                    RegistrationNumber = registrationNumber,
                    DepartmentName = departmentName,
                    TotalSkills = totalSkills,
                    MasteredCount = masteredCount,
                    InProgressCount = inProgressCount,
                    NotAcquiredCount = notAcquiredCount,
                    Domains = domainGroups
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur dans GetBulletinData: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // --- DTOs ---

    public class BulletinResponse
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeFirstName { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public int TotalSkills { get; set; }
        public int MasteredCount { get; set; }
        public int InProgressCount { get; set; }
        public int NotAcquiredCount { get; set; }
        public List<DomainBulletinDto> Domains { get; set; } = new();
    }

    public class DomainBulletinDto
    {
        public int DomainId { get; set; }
        public string DomainName { get; set; } = string.Empty;
        public List<SkillBulletinDto> Skills { get; set; } = new();
        public int MasteredCount { get; set; }
        public int InProgressCount { get; set; }
        public int NotAcquiredCount { get; set; }
    }

    public class SkillBulletinDto
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public double Level { get; set; }
        public int State { get; set; }
        public string Classification { get; set; } = string.Empty;
        public string ClassificationLabel { get; set; } = string.Empty;
        public DateTime? LastUpdated { get; set; }
    }
}
