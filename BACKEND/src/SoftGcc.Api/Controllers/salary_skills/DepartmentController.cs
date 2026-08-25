using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Services.salary_skills;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Application.Common.Interfaces;
using System.IO;
using System.Threading.Tasks;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_DEPARTMENTS","MANAGE_DEPARTMENTS","VIEW_ORGANIZATION")]
	public class DepartmentController : ControllerBase
	{
		private readonly IDepartmentService _departmentService;

		public DepartmentController(IDepartmentService service)
		{
			_departmentService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll([FromQuery] int? establishmentId)
		{
			var departments = await _departmentService.GetByEstablishment(establishmentId);
			return Ok(departments);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var department = await _departmentService.GetById(id);
			if (department == null) return NotFound();
			return Ok(department);
		}

		[HttpPost]
		public async Task<IActionResult> Create([FromForm] string name, [FromForm] int? establishmentId, [FromForm] IFormFile? photo)
		{
			byte[]? photoBytes = null;
			if (photo != null)
			{
				using (var memoryStream = new MemoryStream())
				{
					await photo.CopyToAsync(memoryStream);
					photoBytes = memoryStream.ToArray();
				}
			}

			var department = new Department { Name = name, EstablishmentId = establishmentId };
			await _departmentService.Add(department, photoBytes);

			return CreatedAtAction(nameof(Get), new { id = department.DepartmentId }, department);
		}

		[HttpGet("photo/{id}")]
		public async Task<IActionResult> GetPhoto(int id)
		{
			var department = await _departmentService.GetById(id);
			if (department == null || department.Photo == null) return NotFound();

			return File(department.Photo, "image/jpeg"); // Assurez-vous que c'est bien un JPEG ou PNG
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _departmentService.Delete(id);
			return NoContent();
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, [FromForm] string name, [FromForm] int? establishmentId, [FromForm] IFormFile? photo)
		{
			var existingDepartment = await _departmentService.GetById(id);
			if (existingDepartment == null)
			{
				return NotFound();
			}

			byte[]? photoBytes = existingDepartment.Photo; // Garder l'ancienne photo si aucune nouvelle n'est envoyée
			if (photo != null)
			{
				using (var memoryStream = new MemoryStream())
				{
					await photo.CopyToAsync(memoryStream);
					photoBytes = memoryStream.ToArray();
				}
			}

			existingDepartment.Name = name;
			existingDepartment.EstablishmentId = establishmentId;
			existingDepartment.Photo = photoBytes;

			await _departmentService.Update(existingDepartment, photoBytes);

			// Forcer le cache à être ignoré en retournant l'URL avec un timestamp
			return Ok(new { photoUrl = $"/api/Department/photo/{id}?t=" + DateTime.UtcNow.Ticks });
		}
	}
}
