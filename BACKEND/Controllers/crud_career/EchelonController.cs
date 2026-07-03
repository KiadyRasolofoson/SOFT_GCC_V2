using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	public class EchelonController : ControllerBase
	{
		private readonly EchelonService _echelonService;

		public EchelonController(EchelonService service)
		{
			_echelonService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var echelons = await _echelonService.GetAll();
			return Ok(echelons);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var echelon = await _echelonService.GetById(id);
			if (echelon == null) return NotFound();
			return Ok(echelon);
		}

		[HttpPost]
		public async Task<IActionResult> Create(Echelon echelon)
		{
			await _echelonService.Add(echelon);
			return CreatedAtAction(nameof(Get), new { id = echelon.EchelonId }, echelon);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, Echelon echelon)
		{
			if (id != echelon.EchelonId) return BadRequest();
			await _echelonService.Update(echelon);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _echelonService.Delete(id);
			return NoContent();
		}
	}
}
