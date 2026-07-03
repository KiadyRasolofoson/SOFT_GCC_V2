using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	public class DomainSkillController : ControllerBase
	{
		private readonly DomainSkillService _domainSkillService;

		public DomainSkillController(DomainSkillService service)
		{
			_domainSkillService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var domainSkills = await _domainSkillService.GetAll();
			return Ok(domainSkills);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var domainSkill = await _domainSkillService.GetById(id);
			if (domainSkill == null) return NotFound();
			return Ok(domainSkill);
		}

		[HttpPost]
		public async Task<IActionResult> Create(DomainSkill domainSkill)
		{
			await _domainSkillService.Add(domainSkill);
			return CreatedAtAction(nameof(Get), new { id = domainSkill.DomainSkillId }, domainSkill);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, DomainSkill domainSkill)
		{
			if (id != domainSkill.DomainSkillId) return BadRequest();
			await _domainSkillService.Update(domainSkill);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _domainSkillService.Delete(id);
			return NoContent();
		}
	}
}
