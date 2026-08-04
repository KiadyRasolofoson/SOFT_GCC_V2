using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface.ServiceInterface;

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
        [Authorize(Policy = "RequireAdminRole")]
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
        [Authorize(Policy = "RequireAdminRole")]
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
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<ActionResult<Module>> GetById(int id)
        {
            var module = await _moduleService.GetByIdAsync(id);
            if (module == null)
                return NotFound(new { message = "Module introuvable." });
            return Ok(module);
        }

        /// <summary>POST /api/Module — Créer un module</summary>
        [HttpPost]
        [Authorize(Policy = "RequireAdminRole")]
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
        [Authorize(Policy = "RequireAdminRole")]
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
        [Authorize(Policy = "RequireAdminRole")]
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
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<ActionResult<IEnumerable<Module>>> GetByRole(int roleId)
        {
            var modules = await _moduleService.GetModulesByRoleIdAsync(roleId);
            return Ok(modules);
        }

        /// <summary>PUT /api/Module/role/{roleId} — Mettre à jour les modules d'un rôle</summary>
        [HttpPut("role/{roleId}")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> UpdateRoleModules(int roleId, [FromBody] ModuleAssignmentRequest request)
        {
            if (request?.ModuleIds == null || !request.ModuleIds.Any())
                return BadRequest(new { message = "La liste des modules ne peut pas être vide." });

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

        #endregion
    }

    /// <summary>Modèle de requête pour l'assignation des modules à un rôle</summary>
    public class ModuleAssignmentRequest
    {
        public List<int> ModuleIds { get; set; } = new List<int>();
    }
}
