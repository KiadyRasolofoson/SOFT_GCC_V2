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

        public ProfileController(ApplicationDbContext context, IManagerHierarchyService hierarchyService)
        {
            _context = context;
            _hierarchyService = hierarchyService;
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

            // Construire la liste des modules visibles à partir des permissions
            var visibleModules = DetermineVisibleModules(permissions, user.RoleId);

            var profile = new UserProfileDto
            {
                UserId = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                RoleId = user.RoleId,
                RoleTitle = user.Role?.Title ?? "Inconnu",
                EmployeeId = employeeId,
                RegistrationNumber = registrationNumber,
                DepartmentName = departmentName,
                VisibleModules = visibleModules,
                Permissions = permissions
            };

            return Ok(profile);
        }

        /// <summary>
        /// Détermine les modules visibles dans la navbar à partir des permissions RBAC.
        /// Logique centralisée côté serveur (vs hardcoding frontend actuel).
        /// </summary>
        private static List<string> DetermineVisibleModules(List<string> permissions, int roleId)
        {
            var modules = new List<string>();

            // Module Dashboard (visible pour tous les utilisateurs authentifiés)
            modules.Add("dashboard");

            // Module Compétences
            if (permissions.Any(p => p.Contains("SKILL") || p.Contains("COMPETENCE")))
                modules.Add("competences");

            // Module Carrières
            if (permissions.Any(p => p.Contains("CAREER") || p.Contains("CARRIERE")))
                modules.Add("carrieres");

            // Module Retraite
            if (permissions.Any(p => p.Contains("RETIREMENT") || p.Contains("RETRAITE")))
                modules.Add("retraite");

            // Module Souhaits d'évolution
            if (permissions.Any(p => p.Contains("WISH") || p.Contains("SOUHAIT") || p.Contains("EVOLUTION")))
                modules.Add("souhaits");

            // Module Organigramme
            if (permissions.Any(p => p.Contains("DEPARTMENT") || p.Contains("ORG")))
                modules.Add("organigramme");

            // Module Évaluations
            if (permissions.Any(p => p.Contains("EVALUATION")))
                modules.Add("evaluations");

            // Module Historique
            if (permissions.Any(p => p.Contains("HISTORY") || p.Contains("REPORT")))
                modules.Add("historique");

            // Module Paramétrage (admin : rôles 1, 3, 4)
            if (roleId == 1 || roleId == 3 || roleId == 4)
                modules.Add("parametrage");

            // Module Attestations
            if (permissions.Any(p => p.Contains("CERTIFICATE") || p.Contains("ATTESTATION")))
                modules.Add("attestations");

            return modules.Distinct().ToList();
        }
    }
}
