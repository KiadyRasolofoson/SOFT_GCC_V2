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
	public class LanguageController : ControllerBase
	{
			private readonly ILanguageService _languageService;

			public LanguageController(ILanguageService service)
			{
				_languageService = service;
			}

			[HttpGet]
			public async Task<IActionResult> GetAll()
			{
				var languageService = await _languageService.GetAll();
				return Ok(languageService);
			}

			[HttpGet("{id}")]
			public async Task<IActionResult> Get(int id)
			{
				var language = await _languageService.GetById(id);
				if (language == null) return NotFound();
				return Ok(language);
			}

			[HttpPost]
			public async Task<IActionResult> Create(Language language)
			{
				await _languageService.Add(language);
				return CreatedAtAction(nameof(Get), new { id = language.LanguageId }, language);
			}

			[HttpPut("{id}")]
			public async Task<IActionResult> Update(int id, Language language)
			{
				if (id != language.LanguageId) return BadRequest();
				await _languageService.Update(language);
				return NoContent();
			}

			[HttpDelete("{id}")]
			public async Task<IActionResult> Delete(int id)
			{
				await _languageService.Delete(id);
				return NoContent();
			}
		}
}
