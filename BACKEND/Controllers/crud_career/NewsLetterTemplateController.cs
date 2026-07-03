using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	public class NewsLetterTemplateController : ControllerBase
	{
		private readonly NewsLetterTemplateService _newsLetterTemplateService;

		public NewsLetterTemplateController(NewsLetterTemplateService service)
		{
			_newsLetterTemplateService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var newsLetterTemplate = await _newsLetterTemplateService.GetAll();
			return Ok(newsLetterTemplate);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var newsLetterTemplate = await _newsLetterTemplateService.GetById(id);
			if (newsLetterTemplate == null) return NotFound();
			return Ok(newsLetterTemplate);
		}

		[HttpPost]
		public async Task<IActionResult> Create(NewsLetterTemplate newsLetterTemplate)
		{
			await _newsLetterTemplateService.Add(newsLetterTemplate);
			return CreatedAtAction(nameof(Get), new { id = newsLetterTemplate.NewsletterTemplateId }, newsLetterTemplate);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, NewsLetterTemplate newsLetterTemplate)
		{
			if (id != newsLetterTemplate.NewsletterTemplateId) return BadRequest();
			await _newsLetterTemplateService.Update(newsLetterTemplate);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _newsLetterTemplateService.Delete(id);
			return NoContent();
		}
	}
}
