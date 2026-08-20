using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Dtos.Profile;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Controllers.Authentification
{
    /// <summary>
    /// Endpoint de profil utilisateur pour le frontend React.
    /// ATTENTION : ce endpoint sert UNIQUEMENT à construire la navbar et l'interface.
    /// L'autorisation réelle est gérée par les policies ABAC côté serveur.
    /// </summary>
    [Route("api/me")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IManagerHierarchyService _hierarchyService;
        private readonly IModuleService _moduleService;

        public ProfileController(
            ApplicationDbContext context,
            IManagerHierarchyService hierarchyService,
            IModuleService moduleService)
        {
            _context = context;
            _hierarchyService = hierarchyService;
            _moduleService = moduleService;
        }

        /// <summary>
        /// GET /api/me/profile
        /// Retourne le profil complet de l'utilisateur connecté :
        /// infos personnelles, rôle, permissions, modules visibles pour la navbar.
        /// </summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Utilisateur non authentifié.");

            var userId = int.Parse(userIdClaim);

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("Utilisateur introuvable.");

            // Résoudre le lien Employee
            var employeeId = await _hierarchyService.GetEmployeeIdForUserAsync(userId);
            string? registrationNumber = null;
            string? departmentName = null;

            if (employeeId != null)
            {
                var employee = await _context.Employee
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeId.Value);

                registrationNumber = employee?.RegistrationNumber;

                if (employee?.Department_id != null)
                {
                    var dept = await _context.Department
                        .FirstOrDefaultAsync(d => d.DepartmentId == employee.Department_id.Value);
                    departmentName = dept?.Name;
                }
            }

            // Récupérer les permissions RBAC
            var permissions = await _context.rolePermissions
                .Where(rp => rp.RoleId == user.RoleId)
                .Join(_context.Permissions,
                    rp => rp.PermissionId,
                    p => p.PermissionId,
                    (rp, p) => p.Name)
                .ToListAsync();

            // Construire la liste des modules visibles depuis la DB (Role_Modules)
            // Fallback : si les tables n'existent pas encore, utiliser l'ancienne logique hardcodée
            List<string> moduleNames;
            try
            {
                var visibleModules = await _moduleService.GetMyModulesAsync(user.Id);
                moduleNames = visibleModules.Select(m => m.Name).Distinct().ToList();
            }
            catch (Exception)
            {
                // Fallback : les tables Modules/Role_Modules n'existent pas encore
                moduleNames = DetermineVisibleModulesFallback(permissions, user.RoleId);
            }

            var profile = new UserProfileDto
            {
                UserId = user.Id,
                UserName = user.Username ?? $"{user.FirstName} {user.LastName}",
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                RoleId = user.RoleId,
                RoleTitle = user.Role?.Title ?? "Inconnu",
                EmployeeId = employeeId,
                RegistrationNumber = registrationNumber,
                DepartmentName = departmentName,
                VisibleModules = moduleNames,
                Permissions = permissions
            };

            return Ok(profile);
        }

        /// <summary>
        /// Fallback : détermine les modules visibles à partir des permissions RBAC et du rôle.
        /// Utilisé uniquement quand les tables Modules/Role_Modules n'existent pas encore.
        /// </summary>
        private static List<string> DetermineVisibleModulesFallback(List<string> permissions, int roleId)
        {
            var modules = new List<string>
            {
                "dashboard", "competences", "carrieres", "retraite",
                "souhaits", "organigramme", "historique"
            };

            if (permissions.Any(p => p.Contains("EVALUATION")) || roleId == 2)
                modules.Add("evaluations");

            if (roleId == 1 || roleId == 3 || roleId == 4)
                modules.Add("parametrage");

            if (permissions.Any(p => p.Contains("CERTIFICATE") || p.Contains("ATTESTATION")))
                modules.Add("attestations");

            return modules.Distinct().ToList();
        }
    }
}
