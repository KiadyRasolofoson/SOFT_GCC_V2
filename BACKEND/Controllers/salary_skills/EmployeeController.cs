using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Services.retirement;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class EmployeeController : ControllerBase
	{
		private readonly EmployeeService _employeeService;

		public EmployeeController(EmployeeService service)
		{
			_employeeService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var employees = await _employeeService.GetAll();
			return Ok(employees);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var employee = await _employeeService.GetById(id);
			if (employee == null) return NotFound();
			return Ok(employee);
		}


		[HttpPost]
		public async Task<IActionResult> Create(
			[FromForm] string registrationNumber,
			[FromForm] string name,
			[FromForm] string firstName,
			[FromForm] DateTime birthday,
			[FromForm] int department_id,
			[FromForm] DateTime hiring_date,
			[FromForm] int civiliteId,
			[FromForm] int? managerId,
			[FromForm] string? email,
			[FromForm] IFormFile? photo)
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

			var employee = new Employee { 
				RegistrationNumber = registrationNumber,
				Name = name,
				FirstName = firstName,
				Birthday = birthday,
				Department_id = department_id,
				Hiring_date = hiring_date,
				CiviliteId = civiliteId,
				ManagerId = managerId,
				Email = email
			};
			await _employeeService.Add(employee, photoBytes);

			return CreatedAtAction(nameof(Get), new { id = employee.EmployeeId }, employee);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, Employee employee)
		{
			if (id != employee.EmployeeId) return BadRequest();
			await _employeeService.Update(employee);
			return NoContent();
		}


		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _employeeService.Delete(id);
			return NoContent();
		}

		[HttpPost]
		[Route("Upload")]
		public async Task<IActionResult> UploadImage(IFormFile file)
		{
			if (file == null || file.Length == 0)
				return BadRequest("Aucun fichier reçu.");

			if (file.Length > 10 * 1024 * 1024) // Vérification taille max 10Mo
				return BadRequest("Le fichier dépasse la taille autorisée.");

			using var memoryStream = new MemoryStream();
			await file.CopyToAsync(memoryStream);

			var imageEntity = new ImageEntity
			{
				FileName = file.FileName,
				ContentType = file.ContentType,
				Size = file.Length,
				ImageData = memoryStream.ToArray() // Stockage en base
			};

			await _employeeService.SaveImage(imageEntity);

			return Ok(new { message = "Image uploadée avec succès !" });
		}

		[HttpGet("photo/{id}")]
		[AllowAnonymous]
		public async Task<IActionResult> GetPhoto(int id)
		{
			var employee = await _employeeService.GetById(id);
			if (employee == null || employee.Photo == null) return NotFound();

			return File(employee.Photo, "image/jpeg"); // Assurez-vous que c'est bien un JPEG ou PNG
		}

		[HttpGet]
		[Route("filter")]
		public async Task<IActionResult> GetEmployeeFilter(
		string? keyWord = null,
		string? departmentId = null,
		string? hiringDate1 = null,
		string? hiringDate2 = null,
		int page = 1,
		int pageSize = 10)
		{
			try
			{
				// Appel au service pour récupérer les données et le total
				var (data, totalCount) = await _employeeService.GetEmployeeFilter(
					keyWord, departmentId, hiringDate1, hiringDate2, page, pageSize);

				// Structure de réponse standard
				var response = new
				{
					Success = data != null && data.Any(),
					Message = data != null && data.Any()
						? "Données récupérées avec succès."
						: "Aucun résultat trouvé avec les critères donnés.",
					Data = data ?? Enumerable.Empty<object>(),
					TotalCount = totalCount,
					TotalPages = data != null && data.Any()
						? (int)
						Math.Ceiling((double)totalCount / pageSize)
						: 0,
					CurrentPage = page,
					PageSize = pageSize
				};

				return Ok(response);
			}
			catch (ArgumentException ex)
			{
				// Exception de validation des paramètres (message personnalisé)
				return Ok(new
				{
					Success = false,
					Message = ex.Message,
					Data = Enumerable.Empty<object>(),
					TotalCount = 0,
					TotalPages = 0,
					CurrentPage = page,
					PageSize = pageSize
				});
			}
			catch (Exception ex)
			{
				// Exception générique (message standard)
				return Ok(new
				{
					Success = false,
					Message = "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
					Details = ex.Message,
					Data = Enumerable.Empty<object>(),
					TotalCount = 0,
					TotalPages = 0,
					CurrentPage = page,
					PageSize = pageSize
				});
			}
		}
	}
}
