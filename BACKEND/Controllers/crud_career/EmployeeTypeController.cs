using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Interface.ServiceInterface;

using soft_carriere_competence.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_CAREER_SETTINGS","MANAGE_CAREER_SETTINGS")]
	public class EmployeeTypeController : ControllerBase
	{
		private readonly IEmployeeTypeService _employeeTypeService;

		public EmployeeTypeController(IEmployeeTypeService service)
		{
			_employeeTypeService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var employeeTypes = await _employeeTypeService.GetAll();
			return Ok(employeeTypes);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var employeeType = await _employeeTypeService.GetById(id);
			if (employeeType == null) return NotFound();
			return Ok(employeeType);
		}

		[HttpPost]
		public async Task<IActionResult> Create(EmployeeType employeeType)
		{
			await _employeeTypeService.Add(employeeType);
			return CreatedAtAction(nameof(Get), new { id = employeeType.EmployeeTypeId }, employeeType);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, EmployeeType employeeType)
		{
			if (id != employeeType.EmployeeTypeId) return BadRequest();
			await _employeeTypeService.Update(employeeType);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _employeeTypeService.Delete(id);
			return NoContent();
		}
	}
}
