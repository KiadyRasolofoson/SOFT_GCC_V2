using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	public class PositionController : ControllerBase
	{
		private readonly PositionService _positionService;

		public PositionController(PositionService service)
		{
			_positionService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var positions = await _positionService.GetAll();
			return Ok(positions);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var position = await _positionService.GetById(id);
			if (position == null) return NotFound();
			return Ok(position);
		}

		[HttpPost]
		public async Task<IActionResult> Create(Position position)
		{
			await _positionService.Add(position);
			return CreatedAtAction(nameof(Get), new { id = position.PositionId }, position);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, Position position)
		{
			if (id != position.PositionId) return BadRequest();
			await _positionService.Update(position);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _positionService.Delete(id);
			return NoContent();
		}
	}
}
