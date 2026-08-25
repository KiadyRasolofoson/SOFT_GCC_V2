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
	public class IndicationController : ControllerBase
	{
		private readonly IIndicationService _indicationService;

		public IndicationController(IIndicationService service)
		{
			_indicationService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll([FromQuery] int? legalClassId)
		{
			var indications = await _indicationService.GetByLegalClass(legalClassId);
			return Ok(indications);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var indication = await _indicationService.GetById(id);
			if (indication == null) return NotFound();
			return Ok(indication);
		}

		[HttpPost]
		public async Task<IActionResult> Create(Indication indication)
		{
			await _indicationService.Add(indication);
			return CreatedAtAction(nameof(Get), new { id = indication.IndicationId }, indication);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, Indication indication)
		{
			if (id != indication.IndicationId) return BadRequest();
			await _indicationService.Update(indication);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _indicationService.Delete(id);
			return NoContent();
		}
	}
}
