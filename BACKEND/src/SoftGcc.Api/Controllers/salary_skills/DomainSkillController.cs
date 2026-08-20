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
	public class DomainSkillController : ControllerBase
	{
		private readonly IDomainSkillService _domainSkillService;

		public DomainSkillController(IDomainSkillService service)
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
