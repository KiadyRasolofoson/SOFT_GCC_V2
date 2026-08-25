using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.SkillReferential;

namespace SoftGcc.Api.Controllers.Evaluations
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [RequirePermission("VIEW_COMPETENCE_BULLETIN","VIEW_SKILLS_PROFILES","MANAGE_SKILLS_PROFILES")]
    public class BulletinCompetenceController : ControllerBase
    {
        private readonly IEmployeeSkillService _employeeSkillService;
        private readonly ISkillReferentialService _referential;

        public BulletinCompetenceController(
            IEmployeeSkillService employeeSkillService,
            ISkillReferentialService referential)
        {
            _employeeSkillService = employeeSkillService;
            _referential = referential;
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetBulletinData(int employeeId, CancellationToken cancellationToken)
        {
            var employeeSkills = await _employeeSkillService.GetEmployeeSkills(employeeId);
            var gaps = await _referential.GetEmployeeGapsAsync(employeeId, null, cancellationToken);

            var employeeName = employeeSkills.FirstOrDefault()?.Name ?? "";
            var employeeFirstName = employeeSkills.FirstOrDefault()?.FirstName ?? "";
            var registrationNumber = employeeSkills.FirstOrDefault()?.RegistrationNumber ?? "";
            var departmentName = employeeSkills.FirstOrDefault()?.DepartmentName ?? "";

            // Date de dernière mise à jour du niveau acquis, pour la colonne « Dernière MAJ ».
            var lastUpdatedBySkill = employeeSkills
                .GroupBy(skill => skill.SkillId)
                .ToDictionary(group => group.Key, group => group.Max(skill => skill.UpdatedDate));

            var skills = gaps.Items.Select(item =>
            {
                var classification = SkillGapCalculator.BulletinClassification(item.ExpectedRank, item.AcquiredRank);
                return new
                {
                    item.DomainId,
                    DomainName = string.IsNullOrWhiteSpace(item.DomainName) ? "Non spécifié" : item.DomainName,
                    Dto = new SkillBulletinDto
                    {
                        SkillId = item.SkillId,
                        SkillName = item.SkillName,
                        Level = item.AcquiredRank ?? 0,
                        ExpectedLevel = item.ExpectedRank,
                        State = 1,
                        LastUpdated = lastUpdatedBySkill.TryGetValue(item.SkillId, out var lastUpdated)
                            ? lastUpdated
                            : null,
                        Classification = classification,
                        ClassificationLabel = SkillGapCalculator.BulletinLabel(classification)
                    }
                };
            }).ToList();

            var domainGroups = skills
                .GroupBy(s => new { s.DomainId, s.DomainName })
                .Select(g =>
                {
                    var list = g.Select(x => x.Dto).OrderByDescending(s => s.Level).ToList();
                    return new DomainBulletinDto
                    {
                        DomainId = g.Key.DomainId,
                        DomainName = g.Key.DomainName,
                        Skills = list,
                        MasteredCount = list.Count(s => s.Classification == "maitrisee"),
                        InProgressCount = list.Count(s => s.Classification == "en_cours"),
                        NotAcquiredCount = list.Count(s => s.Classification == "non_acquise")
                    };
                })
                .OrderBy(d => d.DomainName)
                .ToList();

            return Ok(new BulletinResponse
            {
                EmployeeId = employeeId,
                EmployeeName = employeeName,
                EmployeeFirstName = employeeFirstName,
                RegistrationNumber = registrationNumber,
                DepartmentName = departmentName,
                TotalSkills = skills.Count,
                MasteredCount = skills.Count(s => s.Dto.Classification == "maitrisee"),
                InProgressCount = skills.Count(s => s.Dto.Classification == "en_cours"),
                NotAcquiredCount = skills.Count(s => s.Dto.Classification == "non_acquise"),
                Domains = domainGroups
            });
        }
    }

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
        public int ExpectedLevel { get; set; }
        public int State { get; set; }
        public string Classification { get; set; } = string.Empty;
        public string ClassificationLabel { get; set; } = string.Empty;
        public DateTime? LastUpdated { get; set; }
    }
}
