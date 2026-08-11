using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Authorization;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using System.Text.Json.Serialization;

namespace soft_carriere_competence.Controllers.Evaluations
{
    /// <summary>
    /// Controller de gestion des modules/pages de l'application.
    /// Endpoints admin pour le CRUD modules, et endpoint publique pour le menu dynamique.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ModuleController : ControllerBase
    {
        private readonly IModuleService _moduleService;

        public ModuleController(IModuleService moduleService)
        {
            _moduleService = moduleService;
        }

        #region Endpoints Admin (RequireAdminRole)

        /// <summary>GET /api/Module — Liste tous les modules (arbre)</summary>
        [HttpGet]
        [RequirePermission("MANAGE_PERMISSIONS")]
        public async Task<ActionResult<IEnumerable<Module>>> GetAll()
        {
            try
            {
                var modules = await _moduleService.GetAllWithChildrenAsync();
                return Ok(modules);
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Modules non disponibles (table non créée).", error = ex.Message });
            }
        }

        /// <summary>GET /api/Module/with-permissions — Modules avec leurs permissions (pour UI admin)</summary>
        [HttpGet("with-permissions")]
        [RequirePermission("MANAGE_PERMISSIONS")]
        public async Task<ActionResult<IEnumerable<Module>>> GetWithPermissions()
        {
            try
            {
                var modules = await _moduleService.GetModulesWithPermissionsAsync();
                return Ok(modules);
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Modules non disponibles (table non créée).", error = ex.Message });
            }
        }

        /// <summary>GET /api/Module/{id} — Détail d'un module</summary>
        [HttpGet("{id}")]
        [RequirePermission("MANAGE_PERMISSIONS")]
        public async Task<ActionResult<Module>> GetById(int id)
        {
            var module = await _moduleService.GetByIdAsync(id);
            if (module == null)
                return NotFound(new { message = "Module introuvable." });
            return Ok(module);
        }

        /// <summary>POST /api/Module — Créer un module</summary>
        [HttpPost]
        [RequirePermission("MANAGE_PERMISSIONS")]
        public async Task<ActionResult<Module>> Create([FromBody] Module module)
        {
            try
            {
                var created = await _moduleService.CreateAsync(module);
                return CreatedAtAction(nameof(GetById), new { id = created.ModuleId }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>PUT /api/Module/{id} — Mettre à jour un module</summary>
        [HttpPut("{id}")]
        [RequirePermission("MANAGE_PERMISSIONS")]
        public async Task<IActionResult> Update(int id, [FromBody] Module module)
        {
            if (id != module.ModuleId)
                return BadRequest(new { message = "ID mismatch." });

            try
            {
                await _moduleService.UpdateAsync(module);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>DELETE /api/Module/{id} — Supprimer un module (soft delete)</summary>
        [HttpDelete("{id}")]
        [RequirePermission("MANAGE_PERMISSIONS")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _moduleService.DeleteAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>GET /api/Module/role/{roleId} — Modules assignés à un rôle</summary>
        [HttpGet("role/{roleId}")]
        [RequirePermission("MANAGE_PERMISSIONS")]
        public async Task<ActionResult<IEnumerable<Module>>> GetByRole(int roleId)
        {
            try
            {
                var modules = await _moduleService.GetModulesByRoleIdAsync(roleId);
                return Ok(modules);
            }
            catch (Exception)
            {
                return Ok(Array.Empty<Module>());
            }
        }

        /// <summary>PUT /api/Module/role/{roleId} — Mettre à jour les modules d'un rôle</summary>
        [HttpPut("role/{roleId}")]
        [RequirePermission("MANAGE_PERMISSIONS")]
        public async Task<IActionResult> UpdateRoleModules(int roleId, [FromBody] ModuleAssignmentRequest request)
        {
            // Autoriser une liste vide : un rôle peut n'avoir aucun module visible
            if (request?.ModuleIds == null)
                return BadRequest(new { message = "Le corps de la requête est invalide." });

            try
            {
                await _moduleService.UpdateRoleModulesAsync(roleId, request.ModuleIds);
                return Ok(new { message = "Modules mis à jour avec succès." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>PUT /api/Module/reorder — Réordonner les modules (batch sortOrder)</summary>
        [HttpPut("reorder")]
        [RequirePermission("MANAGE_PERMISSIONS")]
        public async Task<IActionResult> Reorder([FromBody] ModuleReorderRequest request)
        {
            if (request?.Items == null || request.Items.Count == 0)
                return BadRequest(new { message = "La liste des éléments à réordonner est requise." });

            try
            {
                await _moduleService.ReorderModulesAsync(request.Items);
                return Ok(new { message = "Ordre des modules mis à jour." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        #endregion

        #region Endpoint Menu Dynamique (tout utilisateur authentifié)

        /// <summary>
        /// GET /api/Module/my-modules — Modules visibles pour l'utilisateur connecté.
        /// Utilisé par le MenuBar.jsx pour construire le menu dynamiquement.
        /// </summary>
        [HttpGet("my-modules")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<Module>>> GetMyModules()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            var userId = int.Parse(userIdClaim);

            try
            {
                var modules = await _moduleService.GetMyModulesAsync(userId);
                return Ok(modules);
            }
            catch (Exception)
            {
                // Tables Modules/Role_Modules pas encore créées — retourne une liste vide
                // Le frontend utilisera le fallback visibleModules
                return Ok(Array.Empty<Module>());
            }
        }

        /// <summary>
        /// GET /api/Module/access-map — Routes autorisées + catalogue pour le garde de navigation.
        /// </summary>
        [HttpGet("access-map")]
        [Authorize]
        public async Task<IActionResult> GetAccessMap()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            var userId = int.Parse(userIdClaim);

            try
            {
                var (allowedRoutes, catalogRoutes) = await _moduleService.GetAccessMapAsync(userId);
                return Ok(new { allowedRoutes, catalogRoutes });
            }
            catch (Exception)
            {
                return Ok(new { allowedRoutes = Array.Empty<string>(), catalogRoutes = Array.Empty<string>() });
            }
        }

        #endregion
    }

    /// <summary>Modèle de requête pour l'assignation des modules à un rôle</summary>
    public class ModuleAssignmentRequest
    {
        [JsonPropertyName("moduleIds")]
        public List<int> ModuleIds { get; set; } = new List<int>();
    }

    /// <summary>Modèle de requête pour le réordonnancement batch des modules</summary>
    public class ModuleReorderRequest
    {
        [JsonPropertyName("items")]
        public List<ModuleReorderItem> Items { get; set; } = new List<ModuleReorderItem>();
    }
}
