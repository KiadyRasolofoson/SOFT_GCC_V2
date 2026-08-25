using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Services.crud_career;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Application.Common.Interfaces;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_CAREER_SETTINGS","MANAGE_CAREER_SETTINGS")]
	public class NewsLetterTemplateController : ControllerBase
	{
		private readonly INewsLetterTemplateService _newsLetterTemplateService;

		public NewsLetterTemplateController(INewsLetterTemplateService service)
		{
			_newsLetterTemplateService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll([FromQuery] int? employeeTypeId)
		{
			var newsLetterTemplate = await _newsLetterTemplateService.GetByEmployeeType(employeeTypeId);
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
