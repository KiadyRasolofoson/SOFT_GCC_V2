using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Api.Controllers.salary_skills
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    // [RequirePermission("RESET_EMPLOYEES", "MANAGE_EMPLOYEES", "MANAGE_PERMISSIONS")]
    public class EmployeeResetController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeeResetController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpPost]
        public async Task<IActionResult> Reset()
        {
            try
            {
                var result = await _employeeService.ResetEmployeesAsync();
                return Ok(new
                {
                    message = "Réinitialisation des employés terminée.",
                    employeesDeleted = result.EmployeesDeleted,
                    evaluationsDeleted = result.EvaluationsDeleted,
                    competenceResultsDeleted = result.CompetenceResultsDeleted,
                    temporaryAccountsDeleted = result.TemporaryAccountsDeleted,
                    skillsDeleted = result.SkillsDeleted,
                    educationsDeleted = result.EducationsDeleted,
                    languagesDeleted = result.LanguagesDeleted,
                    otherFormationsDeleted = result.OtherFormationsDeleted,
                    wishEvolutionDeleted = result.WishEvolutionDeleted,
                    usersDetached = result.UsersDetached
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Erreur lors de la réinitialisation des employés. Aucune modification n'a été appliquée (transaction annulée).",
                    error = ex.Message
                });
            }
        }
    }
}
