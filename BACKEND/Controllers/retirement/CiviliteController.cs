using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Application.Services.retirement;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.retirement;

namespace soft_carriere_competence.Controllers.retirement
{
	[Route("api/[controller]")]
	[ApiController]
	public class CiviliteController : ControllerBase
	{
		private readonly CiviliteService _civiliteService;

		public CiviliteController(CiviliteService service)
		{
			_civiliteService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var civilites = await _civiliteService.GetAll();
			return Ok(civilites);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var civilite = await _civiliteService.GetById(id);
			if (civilite == null) return NotFound();
			return Ok(civilite);
		}

		[HttpPost]
		public async Task<IActionResult> Create(Civilite civilite)
		{
			await _civiliteService.Add(civilite);
			return CreatedAtAction(nameof(Get), new { id = civilite.CiviliteId }, civilite);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, Civilite civilite)
		{
			if (id != civilite.CiviliteId) return BadRequest();
			await _civiliteService.Update(civilite);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _civiliteService.Delete(id);
			return NoContent();
		}
	}
}
