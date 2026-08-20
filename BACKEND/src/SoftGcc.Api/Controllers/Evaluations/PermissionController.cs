using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Domain.Entities.Evaluations;
using System.Text.Json.Serialization;

namespace SoftGcc.Api.Controllers.Evaluations
{
    public class PermissionUpdateModel
    {
        [JsonPropertyName("permissionIds")]
        public List<int> PermissionIds { get; set; } = new List<int>();
    }

    public class PermissionDto
    {
        public int PermissionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int State { get; set; }
        public int? ModuleId { get; set; }
        public string ModuleName { get; set; } = string.Empty;
        public string ModuleDisplayName { get; set; } = string.Empty;
    }

    [Route("api/[controller]")]
    [ApiController]
    [RequirePermission("MANAGE_PERMISSIONS")]
    public class PermissionController : ControllerBase
    {
        private readonly PermissionService _permissionService;

        public PermissionController(PermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetAll()
        {
            try
            {
                var permissions = await _permissionService.GetActiveWithModulesAsync();

                var moduleIds = permissions
                    .Where(p => p.ModuleId.HasValue)
                    .Select(p => p.ModuleId!.Value)
                    .Distinct()
                    .ToList();

                var modules = await _permissionService.GetModulesByIdsAsync(moduleIds);

                var result = permissions.Select(p =>
                {
                    modules.TryGetValue(p.ModuleId ?? -1, out var mod);
                    var moduleName = mod?.Name;
                    var moduleDisplay = mod?.DisplayName;

                    if (string.IsNullOrWhiteSpace(moduleName))
                    {
                        moduleName = DetermineModuleFallback(p.Name);
                        moduleDisplay = FormatGroupLabel(moduleName);
                    }
                    else if (string.IsNullOrWhiteSpace(moduleDisplay))
                    {
                        moduleDisplay = FormatGroupLabel(moduleName);
                    }

                    return new PermissionDto
                    {
                        PermissionId = p.PermissionId,
                        Name = p.Name,
                        Description = p.Description,
                        State = p.State,
                        ModuleId = p.ModuleId,
                        ModuleName = moduleName!,
                        ModuleDisplayName = moduleDisplay!
                    };
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Permission.GetAll] {ex}");
                return Ok(Array.Empty<PermissionDto>());
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PermissionDto>> GetById(int id)
        {
            try
            {
                var permission = await _permissionService.GetByIdWithModuleAsync(id);
                if (permission == null) return NotFound();
                return Ok(MapToDto(permission));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Permission non disponible.", error = ex.Message });
            }
        }

        [HttpGet("by-module/{moduleId}")]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetByModule(int moduleId)
        {
            try
            {
                var permissions = await _permissionService.GetByModuleWithModuleAsync(moduleId);
                return Ok(permissions.Select(p => MapToDto(p)).ToList());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Permission.GetByModule] {ex.Message}");
                return Ok(Array.Empty<PermissionDto>());
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
                if (!permissions.Any())
                    return Ok(Array.Empty<PermissionDto>());

                Dictionary<int, (string Name, string DisplayName)>? modules = null;
                try { modules = await LoadModuleDictionaryAsync(permissions); }
                catch { /* fallback DetermineModuleFallback */ }

                return Ok(permissions.Select(p => MapToDto(p, modules)).ToList());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Permission.GetByRole] {ex.Message}");
                return Ok(Array.Empty<PermissionDto>());
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetUserPermissions(int userId)
        {
            try
            {
                var permissions = await _permissionService.GetUserPermissionsAsync(userId);
                Dictionary<int, (string Name, string DisplayName)>? modules = null;
                try { modules = await LoadModuleDictionaryAsync(permissions); }
                catch { /* fallback */ }

                return Ok(permissions.Select(p => MapToDto(p, modules)).ToList());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Permission.GetByUser] {ex.Message}");
                return Ok(Array.Empty<PermissionDto>());
            }
        }

        private async Task<Dictionary<int, (string Name, string DisplayName)>> LoadModuleDictionaryAsync(IEnumerable<Permission> permissions)
        {
            return await _permissionService.GetModuleLookupAsync(permissions);
        }

        [HttpPut("role/{roleId}")]
        public async Task<IActionResult> UpdateRolePermissions(int roleId, [FromBody] PermissionUpdateModel request)
        {
            try
            {
                if (request?.PermissionIds == null)
                    return BadRequest(new { message = "Le corps de la requête est invalide (permissionIds manquant)." });

                var invalidPermissions = new List<int>();
                foreach (var pid in request.PermissionIds)
                {
                    var p = await _permissionService.GetByIdAsync(pid);
                    if (p == null || p.State != 1) invalidPermissions.Add(pid);
                }
                if (invalidPermissions.Any())
                    return BadRequest(new { message = "Permissions invalides.", invalidPermissions });

                // Une seule passe (UpdateRolePermissionsAsync efface puis recrée)
                await _permissionService.UpdateRolePermissionsAsync(roleId, request.PermissionIds);
                return Ok(new
                {
                    message = "Permissions mises à jour avec succès.",
                    count = request.PermissionIds.Count
                });
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

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

        private static PermissionDto MapToDto(
            Permission p,
            Dictionary<int, (string Name, string DisplayName)>? moduleDict = null)
        {
            string moduleName;
            string moduleDisplay;

            if (p.ModuleId != null && moduleDict != null && moduleDict.TryGetValue(p.ModuleId.Value, out var modInfo))
            {
                moduleName = modInfo.Name;
                moduleDisplay = modInfo.DisplayName;
            }
            else if (p.Module != null)
            {
                moduleName = p.Module.Name;
                moduleDisplay = p.Module.DisplayName;
            }
            else
            {
                moduleName = DetermineModuleFallback(p.Name);
                moduleDisplay = FormatGroupLabel(moduleName);
            }

            if (string.IsNullOrWhiteSpace(moduleDisplay))
                moduleDisplay = FormatGroupLabel(moduleName);

            return new PermissionDto
            {
                PermissionId = p.PermissionId,
                Name = p.Name,
                Description = p.Description,
                State = p.State,
                ModuleId = p.ModuleId,
                ModuleName = moduleName,
                ModuleDisplayName = moduleDisplay
            };
        }

        private static string FormatGroupLabel(string moduleNameOrKey)
        {
            if (string.IsNullOrWhiteSpace(moduleNameOrKey) || moduleNameOrKey == "Autre")
                return "Autres permissions";

            return moduleNameOrKey
                .Replace("param_", "Param. ")
                .Replace('_', ' ');
        }

        private static string DetermineModuleFallback(string name)
        {
            if (string.IsNullOrEmpty(name)) return "Autre";
            if (name.Contains("_USERS") || name.Contains("_ROLES") || name.Contains("_PERMISSIONS") || name == "MANAGE_ROLES")
                return "param_utilisateurs";
            if (name.Contains("_EVALUATIONS") || name.Contains("EVALUATION_") || name.Contains("VALIDATE_"))
                return "evaluations";
            if (name.Contains("SKILL_SETTINGS"))
                return "param_competences";
            if (name.Contains("CAREER_SETTINGS"))
                return "param_carrieres";
            if (name.Contains("_SKILLS") || name.Contains("COMPETENCE"))
                return "competences";
            if (name.Contains("_CAREER") || name.Contains("CAREER"))
                return "carrieres";
            if (name.Contains("ORGANIZATION") || name.Contains("_DEPARTMENTS"))
                return "organigramme";
            if (name.Contains("ACTIVITY_HISTORY") || name.Contains("_HISTORY"))
                return "historique";
            if (name.Contains("_EMPLOYEES") || name.Contains("EMPLOYEE_SYNC") || name.Contains("_POSITIONS"))
                return "param_employes";
            if (name.Contains("CERTIFICATE") || name.Contains("ATTESTATION"))
                return "attestations";
            if (name.Contains("WISH"))
                return "souhaits";
            if (name.Contains("RETIREMENT"))
                return "retraite";
            if (name.Contains("DASHBOARD") || name.Contains("_REPORTS"))
                return "dashboard";
            if (name.Contains("NOTIFICATION"))
                return "notifications";
            return "Autre";
        }
    }
}
