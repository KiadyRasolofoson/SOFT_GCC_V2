using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Services.crud_career;
using SoftGcc.Application.Services.retirement;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.retirement;
using SoftGcc.Application.Common.Interfaces;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.retirement
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_CAREER_SETTINGS","MANAGE_CAREER_SETTINGS")]
	public class CiviliteController : ControllerBase
	{
		private readonly ICiviliteService _civiliteService;

		public CiviliteController(ICiviliteService service)
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
