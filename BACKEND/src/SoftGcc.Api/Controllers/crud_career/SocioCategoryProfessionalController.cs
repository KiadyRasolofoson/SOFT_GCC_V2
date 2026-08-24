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
	public class SocioCategoryProfessionalController : ControllerBase
	{
		private readonly ISocioCategoryProfessionalService _socioCategoryProfessionalService;

		public SocioCategoryProfessionalController(ISocioCategoryProfessionalService service)
		{
			_socioCategoryProfessionalService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var socioCategoryProfessional = await _socioCategoryProfessionalService.GetAll();
			return Ok(socioCategoryProfessional);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var socioCategoryProfessional = await _socioCategoryProfessionalService.GetById(id);
			if (socioCategoryProfessional == null) return NotFound();
			return Ok(socioCategoryProfessional);
		}

		[HttpPost]
		public async Task<IActionResult> Create(SocioCategoryProfessional socioCategoryProfessional)
		{
			await _socioCategoryProfessionalService.Add(socioCategoryProfessional);
			return CreatedAtAction(nameof(Get), new { id = socioCategoryProfessional.SocioCategoryProfessionalId }, socioCategoryProfessional);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, SocioCategoryProfessional socioCategoryProfessional)
		{
			if (id != socioCategoryProfessional.SocioCategoryProfessionalId) return BadRequest();
			await _socioCategoryProfessionalService.Update(socioCategoryProfessional);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _socioCategoryProfessionalService.Delete(id);
			return NoContent();
		}
	}
}
