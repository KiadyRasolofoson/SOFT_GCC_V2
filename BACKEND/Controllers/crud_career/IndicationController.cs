using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	public class IndicationController : ControllerBase
	{
		private readonly IndicationService _indicationService;

		public IndicationController(IndicationService service)
		{
			_indicationService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var indications = await _indicationService.GetAll();
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
