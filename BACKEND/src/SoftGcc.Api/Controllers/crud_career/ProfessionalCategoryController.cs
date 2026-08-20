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
	public class ProfessionalCategoryController : ControllerBase
	{
		private readonly IProfessionalCategoryService _professionalCategoryService;

		public ProfessionalCategoryController(IProfessionalCategoryService service)
		{
			_professionalCategoryService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var professionalCategory = await _professionalCategoryService.GetAll();
			return Ok(professionalCategory);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var professionalCategory = await _professionalCategoryService.GetById(id);
			if (professionalCategory == null) return NotFound();
			return Ok(professionalCategory);
		}

		[HttpPost]
		public async Task<IActionResult> Create(ProfessionalCategory professionalCategory)
		{
			await _professionalCategoryService.Add(professionalCategory);
			return CreatedAtAction(nameof(Get), new { id = professionalCategory.ProfessionalCategoryId }, professionalCategory);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, ProfessionalCategory professionalCategory)
		{
			if (id != professionalCategory.ProfessionalCategoryId) return BadRequest();
			await _professionalCategoryService.Update(professionalCategory);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _professionalCategoryService.Delete(id);
			return NoContent();
		}
	}
}
