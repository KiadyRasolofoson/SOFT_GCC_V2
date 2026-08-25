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
	public class LegalClassController : ControllerBase
	{
		private readonly ILegalClassService _legalClassService;

		public LegalClassController(ILegalClassService service)
		{
			_legalClassService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll([FromQuery] int? professionalCategoryId)
		{
			var legalsClass = await _legalClassService.GetByProfessionalCategory(professionalCategoryId);
			return Ok(legalsClass);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var legalClass = await _legalClassService.GetById(id);
			if (legalClass == null) return NotFound();
			return Ok(legalClass);
		}

		[HttpPost]
		public async Task<IActionResult> Create(LegalClass legalClass)
		{
			await _legalClassService.Add(legalClass);
			return CreatedAtAction(nameof(Get), new { id = legalClass.LegalClassId }, legalClass);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, LegalClass legalClass)
		{
			if (id != legalClass.LegalClassId) return BadRequest();
			await _legalClassService.Update(legalClass);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _legalClassService.Delete(id);
			return NoContent();
		}
	}
}
