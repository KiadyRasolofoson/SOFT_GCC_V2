using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Application.Services.wish_evolution;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.wish_evolution;
using soft_carriere_competence.Core.Interface.ServiceInterface;

using soft_carriere_competence.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace soft_carriere_competence.Controllers.wish_evolution
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("MANAGE_WISH_TYPES","MANAGE_WISH_EVOLUTION","MANAGE_CAREER_SETTINGS")]
	public class WishTypeController : ControllerBase
	{
		private readonly IWishTypeService _wishTypeService;

		public WishTypeController(IWishTypeService service)
		{
			_wishTypeService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var wishesType = await _wishTypeService.GetAll();
			return Ok(wishesType);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var wishType = await _wishTypeService.GetById(id);
			if (wishType == null) return NotFound();
			return Ok(wishType);
		}

		[HttpPost]
		public async Task<IActionResult> Create(WishType wishType)
		{
			await _wishTypeService.Add(wishType);
			return CreatedAtAction(nameof(Get), new { id = wishType.WishTypeId }, wishType);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, WishType wishType)
		{
			if (id != wishType.WishTypeId) return BadRequest();
			await _wishTypeService.Update(wishType);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _wishTypeService.Delete(id);
			return NoContent();
		}
	}
}
