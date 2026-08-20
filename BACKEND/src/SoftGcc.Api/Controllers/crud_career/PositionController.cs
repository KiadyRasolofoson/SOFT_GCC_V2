using Microsoft.AspNetCore.Mvc;
using MediatR;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Positions.Commands.CreatePosition;
using SoftGcc.Application.Positions.Commands.DeletePosition;
using SoftGcc.Application.Positions.Commands.UpdatePosition;
using SoftGcc.Application.Positions.Queries.GetPositionById;
using SoftGcc.Application.Positions.Queries.GetPositions;
using SoftGcc.Domain.Entities.crud_career;
using Microsoft.AspNetCore.Authorization;

namespace SoftGcc.Api.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_POSITIONS","MANAGE_POSITIONS","VIEW_CAREER_SETTINGS","MANAGE_CAREER_SETTINGS")]
	public class PositionController : ControllerBase
	{
		private readonly IMediator _mediator;

		public PositionController(IMediator mediator)
		{
			_mediator = mediator;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var positions = await _mediator.Send(new GetPositionsQuery());
			return Ok(positions);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var position = await _mediator.Send(new GetPositionByIdQuery(id));
			if (position == null) return NotFound();
			return Ok(position);
		}

		[HttpPost]
		public async Task<IActionResult> Create(Position position)
		{
			await _mediator.Send(new CreatePositionCommand(position));
			return CreatedAtAction(nameof(Get), new { id = position.PositionId }, position);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, Position position)
		{
			if (id != position.PositionId) return BadRequest();
			await _mediator.Send(new UpdatePositionCommand(id, position));
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _mediator.Send(new DeletePositionCommand(id));
			return NoContent();
		}
	}
}
