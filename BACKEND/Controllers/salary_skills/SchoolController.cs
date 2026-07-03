using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	public class SchoolController : ControllerBase
	{
		private readonly SchoolService _schoolService;

		public SchoolController(SchoolService service)
		{
			_schoolService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var schools = await _schoolService.GetAll();
			return Ok(schools);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var school = await _schoolService.GetById(id);
			if (school == null) return NotFound();
			return Ok(school);
		}

		[HttpPost]
		public async Task<IActionResult> Create(School school)
		{
			await _schoolService.Add(school);
			return CreatedAtAction(nameof(Get), new { id = school.SchoolId }, school);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, School school)
		{
			if (id != school.SchoolId) return BadRequest();
			await _schoolService.Update(school);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _schoolService.Delete(id);
			return NoContent();
		}
	}
}
