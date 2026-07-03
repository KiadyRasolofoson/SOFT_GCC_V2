using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	public class DegreeController : ControllerBase
	{
		private readonly DegreeService _degreeService;

		public DegreeController(DegreeService service)
		{
			_degreeService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var degrees = await _degreeService.GetAll();
			return Ok(degrees);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var degree = await _degreeService.GetById(id);
			if (degree == null) return NotFound();
			return Ok(degree);
		}

		[HttpPost]
		public async Task<IActionResult> Create(Degree degree)
		{
			await _degreeService.Add(degree);
			return CreatedAtAction(nameof(Get), new { id = degree.DegreeId }, degree);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, Degree degree)
		{
			if (id != degree.DegreeId) return BadRequest();
			await _degreeService.Update(degree);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _degreeService.Delete(id);
			return NoContent();
		}
	}
}
