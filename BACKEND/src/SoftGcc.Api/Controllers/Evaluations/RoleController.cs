using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Domain.Entities.Evaluations;
using Microsoft.AspNetCore.Authorization;

namespace SoftGcc.Api.Controllers.Evaluations
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly RoleService _roleService;

        public RoleController(RoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet]
        [RequirePermission("VIEW_ROLES", "MANAGE_ROLES", "CREATE_ROLES", "EDIT_ROLES", "MANAGE_PERMISSIONS")]
        public async Task<ActionResult<IEnumerable<Role>>> GetAll()
        {
            var roles = await _roleService.GetAllAsync();
            return Ok(roles);
        }

        [HttpGet("{id}")]
        [RequirePermission("VIEW_ROLES", "MANAGE_ROLES", "MANAGE_PERMISSIONS")]
        public async Task<ActionResult<Role>> GetById(int id)
        {
            var role = await _roleService.GetByIdAsync(id);
            if (role == null)
                return NotFound();
            return Ok(role);
        }

        [HttpPost]
        [RequirePermission("CREATE_ROLES", "MANAGE_ROLES")]
        public async Task<ActionResult<Role>> Create(Role role)
        {
            try
            {
                var createdRole = await _roleService.CreateAsync(role);
                return CreatedAtAction(nameof(GetById), new { id = createdRole.Roleid }, createdRole);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        [RequirePermission("EDIT_ROLES", "MANAGE_ROLES")]
        public async Task<IActionResult> Update(int id, Role role)
        {
            if (id != role.Roleid)
                return BadRequest();

            try
            {
                await _roleService.UpdateAsync(role);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [RequirePermission("DELETE_ROLES", "MANAGE_ROLES")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _roleService.DeleteAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
