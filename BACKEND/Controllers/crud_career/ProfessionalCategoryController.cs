using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	public class ProfessionalCategoryController : ControllerBase
	{
		private readonly ProfessionalCategoryService _professionalCategoryService;

		public ProfessionalCategoryController(ProfessionalCategoryService service)
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
