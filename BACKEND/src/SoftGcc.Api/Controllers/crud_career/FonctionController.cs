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
	public class FonctionController : ControllerBase
	{
		private readonly IFonctionService _fonctionService;

		public FonctionController(IFonctionService service)
		{
			_fonctionService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var fonctions = await _fonctionService.GetAll();
			return Ok(fonctions);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var fonction = await _fonctionService.GetById(id);
			if (fonction == null) return NotFound();
			return Ok(fonction);
		}

		[HttpPost]
		public async Task<IActionResult> Create(Fonction fonction)
		{
			await _fonctionService.Add(fonction);
			return CreatedAtAction(nameof(Get), new { id = fonction.FonctionId }, fonction);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, Fonction fonction)
		{
			if (id != fonction.FonctionId) return BadRequest();
			await _fonctionService.Update(fonction);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _fonctionService.Delete(id);
			return NoContent();
		}
	}
}
