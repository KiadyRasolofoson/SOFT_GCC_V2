using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	public class StudyPathController : ControllerBase
	{
		private readonly StudyPathService _studyPathService;

		public StudyPathController(StudyPathService service)
		{
			_studyPathService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var studyPaths = await _studyPathService.GetAll();
			return Ok(studyPaths);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var studyPath = await _studyPathService.GetById(id);
			if (studyPath == null) return NotFound();
			return Ok(studyPath);
		}

		[HttpPost]
		public async Task<IActionResult> Create(StudyPath studyPath)
		{
			await _studyPathService.Add(studyPath);
			return CreatedAtAction(nameof(Get), new { id = studyPath.StudyPathId }, studyPath);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, StudyPath studyPath)
		{
			if (id != studyPath.StudyPathId) return BadRequest();
			await _studyPathService.Update(studyPath);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _studyPathService.Delete(id);
			return NoContent();
		}
	}
}
