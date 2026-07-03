using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	public class LegalClassController : ControllerBase
	{
		private readonly LegalClassService _legalClassService;

		public LegalClassController(LegalClassService service)
		{
			_legalClassService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var legalsClass = await _legalClassService.GetAll();
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
