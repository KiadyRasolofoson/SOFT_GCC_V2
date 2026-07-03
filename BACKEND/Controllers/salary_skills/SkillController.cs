using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	public class SkillController : ControllerBase
	{
		private readonly SkillService _skillService;

		public SkillController(SkillService service)
		{
			_skillService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var skills = await _skillService.GetAll();
			return Ok(skills);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var skill = await _skillService.GetById(id);
			if (skill == null) return NotFound();
			return Ok(skill);
		}

		[HttpPost]
		public async Task<IActionResult> Create(Skill skill)
		{
			await _skillService.Add(skill);
			return CreatedAtAction(nameof(Get), new { id = skill.SkillId }, skill);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, Skill skill)
		{
			if (id != skill.SkillId) return BadRequest();
			await _skillService.Update(skill);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _skillService.Delete(id);
			return NoContent();
		}
	}
}
