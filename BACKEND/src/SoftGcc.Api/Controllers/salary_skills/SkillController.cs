using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Services.salary_skills;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Application.Common.Interfaces;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_SKILL_SETTINGS","MANAGE_SKILL_SETTINGS")]
	public class SkillController : ControllerBase
	{
		private readonly ISkillService _skillService;

		public SkillController(ISkillService service)
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
