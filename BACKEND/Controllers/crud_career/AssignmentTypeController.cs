using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	public class AssignmentTypeController : ControllerBase
	{
		private readonly AssignmentTypeService _assignmentTypeService;

		public AssignmentTypeController(AssignmentTypeService service)
		{
			_assignmentTypeService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var assignments = await _assignmentTypeService.GetAll();
			return Ok(assignments);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var asssignmentType = await _assignmentTypeService.GetById(id);
			if (asssignmentType == null) return NotFound();
			return Ok(asssignmentType);
		}

		[HttpPost]
		public async Task<IActionResult> Create(AssignmentType assignmentType)
		{
			await _assignmentTypeService.Add(assignmentType);
			return CreatedAtAction(nameof(Get), new { id = assignmentType.AssignmentTypeId }, assignmentType);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, AssignmentType assignmentType)
		{
			if (id != assignmentType.AssignmentTypeId) return BadRequest();
			await _assignmentTypeService.Update(assignmentType);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _assignmentTypeService.Delete(id);
			return NoContent();
		}
	}
}
