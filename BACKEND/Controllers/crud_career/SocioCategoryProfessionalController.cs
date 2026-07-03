using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	public class SocioCategoryProfessionalController : ControllerBase
	{
		private readonly SocioCategoryProfessionalService _socioCategoryProfessionalService;

		public SocioCategoryProfessionalController(SocioCategoryProfessionalService service)
		{
			_socioCategoryProfessionalService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var socioCategoryProfessional = await _socioCategoryProfessionalService.GetAll();
			return Ok(socioCategoryProfessional);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var socioCategoryProfessional = await _socioCategoryProfessionalService.GetById(id);
			if (socioCategoryProfessional == null) return NotFound();
			return Ok(socioCategoryProfessional);
		}

		[HttpPost]
		public async Task<IActionResult> Create(SocioCategoryProfessional socioCategoryProfessional)
		{
			await _socioCategoryProfessionalService.Add(socioCategoryProfessional);
			return CreatedAtAction(nameof(Get), new { id = socioCategoryProfessional.SocioCategoryProfessionalId }, socioCategoryProfessional);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, SocioCategoryProfessional socioCategoryProfessional)
		{
			if (id != socioCategoryProfessional.SocioCategoryProfessionalId) return BadRequest();
			await _socioCategoryProfessionalService.Update(socioCategoryProfessional);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _socioCategoryProfessionalService.Delete(id);
			return NoContent();
		}
	}
}
