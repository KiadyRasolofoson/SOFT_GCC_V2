using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	public class CertificateTypeController : ControllerBase
	{
		private readonly CertificateTypeService _certificateTypeService;

		public CertificateTypeController(CertificateTypeService service)
		{
			_certificateTypeService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var certificateTypes = await _certificateTypeService.GetAll();
			return Ok(certificateTypes);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var certificateType = await _certificateTypeService.GetById(id);
			if (certificateType == null) return NotFound();
			return Ok(certificateType);
		}

		[HttpPost]
		public async Task<IActionResult> Create(CertificateType certificateType)
		{
			await _certificateTypeService.Add(certificateType);
			return CreatedAtAction(nameof(Get), new { id = certificateType.CertificateTypeId }, certificateType);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, CertificateType certificateType)
		{
			if (id != certificateType.CertificateTypeId) return BadRequest();
			await _certificateTypeService.Update(certificateType);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _certificateTypeService.Delete(id);
			return NoContent();
		}
	}
}
