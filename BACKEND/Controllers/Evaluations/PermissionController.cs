using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;

namespace soft_carriere_competence.Controllers.Evaluations
{
    public class PermissionUpdateModel
    {
        public List<int> permissionIds { get; set; } = new List<int>();
    }

    public class PermissionDto
    {
        public int PermissionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int State { get; set; }
        public int? ModuleId { get; set; }
        public string ModuleName { get; set; } = string.Empty;
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "RequireAdminRole")]
    public class PermissionController : ControllerBase
    {
        private readonly PermissionService _permissionService;
        private readonly ApplicationDbContext _context;

        public PermissionController(PermissionService permissionService, ApplicationDbContext context)
        {
            _permissionService = permissionService;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetAll()
        {
            try
            {
                var permissions = await _context.Permissions
                    .Where(p => p.State == 1)
                    .Include(p => p.Module)
                    .ToListAsync();
                return Ok(permissions.Select(p => MapToDto(p)).ToList());
            }
            catch (Exception ex)
            {
                // Tables/colonnes manquantes (migration non appliquée)
                return Ok(new { message = "Permissions chargées en mode dégradé.", error = ex.Message, data = Array.Empty<object>() });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PermissionDto>> GetById(int id)
        {
            try
            {
                var permission = await _context.Permissions
                    .Include(p => p.Module)
                    .FirstOrDefaultAsync(p => p.PermissionId == id);
                if (permission == null) return NotFound();
                return Ok(MapToDto(permission));
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Permission non disponible.", error = ex.Message });
            }
        }

        [HttpGet("by-module/{moduleId}")]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetByModule(int moduleId)
        {
            try
            {
                var permissions = await _context.Permissions
                    .Where(p => p.State == 1 && p.ModuleId == moduleId)
                    .Include(p => p.Module)
                    .ToListAsync();
                return Ok(permissions.Select(p => MapToDto(p)).ToList());
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Permissions par module non disponibles.", error = ex.Message, data = Array.Empty<object>() });
            }
        }

        [HttpPost]
        public async Task<ActionResult<PermissionDto>> Create([FromBody] PermissionCreateRequest request)
        {
            try
            {
                var permission = new Permission
                {
                    Name = request.Name,
                    Description = request.Description,
                    State = 1,
                    ModuleId = request.ModuleId
                };
                var created = await _permissionService.CreateAsync(permission);
                return CreatedAtAction(nameof(GetById), new { id = created.PermissionId }, MapToDto(created));
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PermissionUpdateDto dto)
        {
            if (id != dto.PermissionId) return BadRequest(new { message = "ID mismatch" });
            try
            {
                var existing = await _permissionService.GetByIdAsync(id);
                if (existing == null) return NotFound(new { message = "Permission non trouvée." });
                existing.Name = dto.Name;
                existing.Description = dto.Description;
                existing.ModuleId = dto.ModuleId;
                await _permissionService.UpdateAsync(existing);
                return NoContent();
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try { await _permissionService.DeleteAsync(id); return NoContent(); }
            catch (Exception ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpGet("role/{roleId}")]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetPermissionsByRoleId(int roleId)
        {
            try
            {
                var permissions = await _permissionService.GetPermissionsByRoleIdAsync(roleId);
                // Retourner une liste vide plutôt que 404 quand le rôle n'a aucune permission
                if (!permissions.Any())
                    return Ok(Array.Empty<PermissionDto>());

                Dictionary<int, string>? modules = null;
                try { modules = await LoadModuleDictionaryAsync(permissions); }
                catch { /* modules null → fallback DetermineModuleFallback */ }

                return Ok(permissions.Select(p => MapToDto(p, modules)).ToList());
            }
            catch (Exception ex) { return Ok(new { message = "Permissions du rôle non disponibles.", error = ex.Message, data = Array.Empty<object>() }); }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetUserPermissions(int userId)
        {
            try
            {
                var permissions = await _permissionService.GetUserPermissionsAsync(userId);
                Dictionary<int, string>? modules = null;
                try { modules = await LoadModuleDictionaryAsync(permissions); }
                catch { /* fallback */ }

                return Ok(permissions.Select(p => MapToDto(p, modules)).ToList());
            }
            catch (Exception ex) { return Ok(new { message = "Permissions utilisateur non disponibles.", error = ex.Message, data = Array.Empty<object>() }); }
        }

        private async Task<Dictionary<int, string>> LoadModuleDictionaryAsync(IEnumerable<Permission> permissions)
        {
            var moduleIds = permissions.Select(p => p.ModuleId).Where(id => id.HasValue).Distinct().ToList();
            return await _context.Modules
                .Where(m => moduleIds.Contains(m.ModuleId))
                .ToDictionaryAsync(m => m.ModuleId, m => m.Name);
        }

        [HttpPut("role/{roleId}")]
        public async Task<IActionResult> UpdateRolePermissions(int roleId, [FromBody] PermissionUpdateModel request)
        {
            try
            {
                // Autoriser une liste vide : un rôle peut n'avoir aucune permission
                if (request?.permissionIds == null)
                    return BadRequest(new { message = "Le corps de la requête est invalide." });

                var invalidPermissions = new List<int>();
                foreach (var pid in request.permissionIds)
                {
                    var p = await _permissionService.GetByIdAsync(pid);
                    if (p == null || p.State != 1) invalidPermissions.Add(pid);
                }
                if (invalidPermissions.Any())
                    return BadRequest(new { message = "Permissions invalides.", invalidPermissions });

                await _permissionService.DeleteRolePermissionsAsync(roleId);
                await _permissionService.UpdateRolePermissionsAsync(roleId, request.permissionIds);
                return Ok(new { message = "Permissions mises à jour avec succès." });
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        // DTOs
        public class PermissionCreateRequest
        {
            public string Name { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public int? ModuleId { get; set; }
        }

        public class PermissionUpdateDto
        {
            public int PermissionId { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public int? ModuleId { get; set; }
        }

        // Helpers
        private static PermissionDto MapToDto(Permission p, Dictionary<int, string>? moduleDict = null)
        {
            string moduleName;
            if (p.ModuleId != null && moduleDict != null && moduleDict.ContainsKey(p.ModuleId.Value))
                moduleName = moduleDict[p.ModuleId.Value];
            else if (p.Module != null)
                moduleName = p.Module.Name;
            else
                moduleName = DetermineModuleFallback(p.Name);

            return new PermissionDto
            {
                PermissionId = p.PermissionId,
                Name = p.Name,
                Description = p.Description,
                State = p.State,
                ModuleId = p.ModuleId,
                ModuleName = moduleName
            };
        }

        private static string DetermineModuleFallback(string name)
        {
            if (string.IsNullOrEmpty(name)) return "Autre";
            if (name.Contains("_USERS") || name.Contains("_ROLES") || name.Contains("_PERMISSIONS"))
                return "param_utilisateurs";
            if (name.Contains("_EVALUATIONS") || name.Contains("EVALUATION_") || name.Contains("VALIDATE_"))
                return "evaluations";
            if (name.Contains("_DEPARTMENTS") || name.Contains("_POSITIONS"))
                return "param_employes";
            if (name.Contains("_CAREER")) return "carrieres";
            if (name.Contains("_RETIREMENT")) return "retraite";
            if (name.Contains("_REPORTS")) return "dashboard";
            return "Autre";
        }
    }
}
