using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.SkillReferential;
using SoftGcc.Application.SkillReferential.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace SoftGcc.Api.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class SkillController : ControllerBase
	{
		private readonly ISkillReferentialService _referential;

		public SkillController(ISkillReferentialService referential)
		{
			_referential = referential;
		}

		[HttpGet]
		[RequirePermission("VIEW_SKILL_SETTINGS", "MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL", "VIEW_SKILLS_PROFILES", "EDIT_SKILLS_PROFILES", "MANAGE_SKILLS_PROFILES")]
		public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
		{
			var skills = await _referential.GetActiveLookupsAsync(cancellationToken);
			return Ok(skills);
		}

		[HttpGet("{id}")]
		[RequirePermission("VIEW_SKILL_SETTINGS", "MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL", "VIEW_SKILLS_PROFILES", "EDIT_SKILLS_PROFILES", "MANAGE_SKILLS_PROFILES")]
		public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
		{
			var skill = await _referential.GetSkillAsync(id, cancellationToken);
			return Ok(new SkillLookupDto
			{
				SkillId = skill.SkillId,
				Name = skill.Name,
				Code = skill.Code,
				FamilyId = skill.FamilyId
			});
		}

		[HttpPost]
		[RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
		public IActionResult Create()
		{
			return StatusCode(StatusCodes.Status410Gone, new
			{
				message = "Utilisez POST /api/skill-referential/skills pour créer une compétence du référentiel."
			});
		}

		[HttpPut("{id}")]
		[RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
		public IActionResult Update(int id)
		{
			return StatusCode(StatusCodes.Status410Gone, new
			{
				message = "Utilisez PUT /api/skill-referential/skills/{id} pour modifier une compétence."
			});
		}

		[HttpDelete("{id}")]
		[RequirePermission("PUBLISH_SKILL_REFERENTIAL")]
		public IActionResult Delete(int id)
		{
			return StatusCode(StatusCodes.Status410Gone, new
			{
				message = "La suppression physique est interdite. Utilisez POST /api/skill-referential/skills/{id}/archive."
			});
		}
	}
}
