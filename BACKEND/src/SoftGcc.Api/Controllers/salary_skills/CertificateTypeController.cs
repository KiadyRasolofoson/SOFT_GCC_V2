using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Services.crud_career;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Application.Common.Interfaces;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_CAREER_SETTINGS","MANAGE_CAREER_SETTINGS","VIEW_CERTIFICATES")]
	public class CertificateTypeController : ControllerBase
	{
		private readonly ICertificateTypeService _certificateTypeService;

		public CertificateTypeController(ICertificateTypeService service)
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
