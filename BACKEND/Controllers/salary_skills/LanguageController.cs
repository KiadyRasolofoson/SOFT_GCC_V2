using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
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
