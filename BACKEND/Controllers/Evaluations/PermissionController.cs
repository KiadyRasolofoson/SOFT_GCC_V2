using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Controllers.Evaluations
{
    // Classe pour la désérialisation
    public class PermissionUpdateModel
    {
        public List<int> permissionIds { get; set; }
    }

    // Nouvelle classe DTO pour retourner les permissions avec leur module
    public class PermissionDto
    {
        public int PermissionId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int State { get; set; }
        public string Module { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
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
            var permissions = await _permissionService.GetAllAsync();
            var permissionDtos = permissions.Select(p => new PermissionDto
            {
                PermissionId = p.PermissionId,
                Name = p.Name,
                Description = p.Description,
                State = p.State,
                Module = DetermineModule(p.Name)
            }).ToList();
            
            return Ok(permissionDtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PermissionDto>> GetById(int id)
        {
            var permission = await _permissionService.GetByIdAsync(id);
            if (permission == null)
                return NotFound();
                
            var permissionDto = new PermissionDto
            {
                PermissionId = permission.PermissionId,
                Name = permission.Name,
                Description = permission.Description,
                State = permission.State,
                Module = DetermineModule(permission.Name)
            };
            
            return Ok(permissionDto);
        }

        [HttpPost]
        public async Task<ActionResult<PermissionDto>> Create(Permission permission)
        {
            try
            {
                permission.State = 1; // Définir l'état par défaut
                var createdPermission = await _permissionService.CreateAsync(permission);
                
                var permissionDto = new PermissionDto
                {
                    PermissionId = createdPermission.PermissionId,
                    Name = createdPermission.Name,
                    Description = createdPermission.Description,
                    State = createdPermission.State,
                    Module = DetermineModule(createdPermission.Name)
                };
                
                return CreatedAtAction(nameof(GetById), new { id = permissionDto.PermissionId }, permissionDto);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, PermissionUpdateDto dto)
        {
            if (id != dto.PermissionId)
                return BadRequest("ID mismatch");

            try
            {
                var existingPermission = await _permissionService.GetByIdAsync(id);
                if (existingPermission == null)
                    return NotFound();

                // Fusionne les données
                existingPermission.Name = dto.Name;
                existingPermission.Description = dto.Description;
                await _permissionService.UpdateAsync(existingPermission);

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _permissionService.DeleteAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("role/{roleId}")]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetPermissionsByRoleId(int roleId)
        {
            try
            {
                Console.WriteLine($"Récupération des permissions pour le rôle {roleId}");
                var permissions = await _permissionService.GetPermissionsByRoleIdAsync(roleId);
                Console.WriteLine($"Nombre de permissions trouvées: {permissions.Count()}");
                
                if (!permissions.Any())
                {
                    Console.WriteLine("Aucune permission trouvée pour ce rôle");
                    return NotFound(new { message = "Aucune permission trouvée pour ce rôle." });
                }
                
                var permissionDtos = permissions.Select(p => new PermissionDto
                {
                    PermissionId = p.PermissionId,
                    Name = p.Name,
                    Description = p.Description,
                    State = p.State,
                    Module = DetermineModule(p.Name)
                }).ToList();
                
                Console.WriteLine($"Nombre de DTOs créés: {permissionDtos.Count}");
                return Ok(permissionDtos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération des permissions: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetUserPermissions(int userId)
        {
            var permissions = await _permissionService.GetUserPermissionsAsync(userId);
            
            var permissionDtos = permissions.Select(p => new PermissionDto
            {
                PermissionId = p.PermissionId,
                Name = p.Name,
                Description = p.Description,
                State = p.State,
                Module = DetermineModule(p.Name)
            }).ToList();
            
            return Ok(permissionDtos);
        }

        [HttpPut("role/{roleId}")]
        public async Task<IActionResult> UpdateRolePermissions(int roleId, [FromBody] PermissionUpdateModel request)
        {
            try
            {
                Console.WriteLine($"=== Mise à jour des permissions pour le rôle {roleId} ===");
                Console.WriteLine($"Nombre de permissions reçues: {request?.permissionIds?.Count ?? 0}");
                
                if (request == null || request.permissionIds == null || !request.permissionIds.Any())
                {
                    Console.WriteLine("Erreur: Liste de permissions vide");
                    return BadRequest(new { message = "La liste des permissions ne peut pas être vide." });
                }

                // Vérifier si toutes les permissions existent et sont actives
                var invalidPermissions = new List<int>();
                foreach (var permissionId in request.permissionIds)
                {
                    var permission = await _permissionService.GetByIdAsync(permissionId);
                    if (permission == null || permission.State != 1)
                    {
                        Console.WriteLine($"Permission invalide trouvée: {permissionId}");
                        invalidPermissions.Add(permissionId);
                    }
                }

                if (invalidPermissions.Any())
                {
                    Console.WriteLine($"Erreur: Permissions invalides trouvées: {string.Join(", ", invalidPermissions)}");
                    return BadRequest(new { 
                        message = "Certaines permissions n'existent pas ou ne sont pas actives.",
                        invalidPermissions = invalidPermissions
                    });
                }

                // Supprimer les anciennes permissions
                Console.WriteLine("Suppression des anciennes permissions...");
                await _permissionService.DeleteRolePermissionsAsync(roleId);

                // Ajouter les nouvelles permissions
                Console.WriteLine("Ajout des nouvelles permissions...");
                await _permissionService.UpdateRolePermissionsAsync(roleId, request.permissionIds);

                Console.WriteLine("Mise à jour terminée avec succès");
                return Ok(new { message = "Permissions mises à jour avec succès." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la mise à jour des permissions: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return BadRequest(new { message = ex.Message });
            }
        }

        public class PermissionUpdateDto
        {
            public int PermissionId { get; set; }
            public string Name { get; set; }
            public string Description { get; set; }
            // Exclure 'State' si nécessaire
        }
        
        // Méthode pour déterminer le module d'une permission en fonction de son nom
        private string DetermineModule(string permissionName)
        {
            if (string.IsNullOrEmpty(permissionName))
                return "Autre";
                
            if (permissionName.Contains("_USERS"))
                return "Utilisateurs";
                
            if (permissionName.Contains("_ROLES"))
                return "Rôles";
                
            if (permissionName.Contains("_PERMISSIONS"))
                return "Permissions";
                
            if (permissionName.Contains("_EVALUATIONS"))
                return "Évaluations";
                
            if (permissionName.Contains("_DEPARTMENTS") || permissionName.Contains("_POSITIONS") || 
                permissionName.Contains("_CAREER") || permissionName.Contains("_RETIREMENT"))
                return "Paramétrage";
                
            if (permissionName.Contains("_REPORTS"))
                return "Statistique";
                
            return "Autre";
        }
    }
} 