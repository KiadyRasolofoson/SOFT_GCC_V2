using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Services.crud_career;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Application.Common.Interfaces;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_CAREER_SETTINGS","MANAGE_CAREER_SETTINGS")]
	public class AssignmentTypeController : ControllerBase
	{
		private readonly IAssignmentTypeService _assignmentTypeService;

		public AssignmentTypeController(IAssignmentTypeService service)
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
