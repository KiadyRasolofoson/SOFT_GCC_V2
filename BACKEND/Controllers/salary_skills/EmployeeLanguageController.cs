using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Application.Services.history;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Entities.history;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class EmployeeLanguageController : ControllerBase
	{
		private readonly EmployeeLanguageService _employeeLanguageService;
		private readonly HistoryService _historyService;
		private readonly UserService _userService;

		public EmployeeLanguageController(EmployeeLanguageService service, HistoryService historyService, UserService userService)
		{
			_employeeLanguageService = service;
			_historyService = historyService;
			_userService = userService;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var employeeLanguageServices = await _employeeLanguageService.GetAll();
			return Ok(employeeLanguageServices);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var employeeLanguage = await _employeeLanguageService.GetById(id);
			if (employeeLanguage == null) return NotFound();
			return Ok(employeeLanguage);
		}

		[HttpPost]
		public async Task<IActionResult> Create(EmployeeLanguage employeeLanguage)
		{
			await _employeeLanguageService.Add(employeeLanguage);

			VEmployeeLanguage vEmployeeLanguage = await _employeeLanguageService.GetEmployeeLanguageById(employeeLanguage.EmployeeLanguageId);

			var userIdClaim = User.FindFirst("userId")?.Value;
			if (string.IsNullOrEmpty(userIdClaim))
			{
				return Unauthorized("Utilisateur non authentifié.");
			}

			var user = await _userService.GetUserByIdAsync(int.Parse(userIdClaim));
			if (user == null) return NotFound("Utilisateur introuvable.");

			var activityLog = new ActivityLog
			{
				UserId = user.Id,
				Module = 1,
				Action = "Création",
				Description = $"L'utilisateur {user.Username} a créé une nouvelle language ID {vEmployeeLanguage.EmployeeLanguageId} " +
						  $"({vEmployeeLanguage.LanguageName}) " +
						  $"pour l'employé matricule {vEmployeeLanguage.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};

			await _historyService.Add(activityLog);
			return CreatedAtAction(nameof(Get), new { id = employeeLanguage.EmployeeLanguageId }, employeeLanguage);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, EmployeeLanguage employeeLanguage)
		{
			if (id != employeeLanguage.EmployeeLanguageId) return BadRequest();
			VEmployeeLanguage vEmployeeLanguage = await _employeeLanguageService.GetEmployeeLanguageById(employeeLanguage.EmployeeLanguageId);

			var userIdClaim = User.FindFirst("userId")?.Value;
			if (string.IsNullOrEmpty(userIdClaim))
			{
				return Unauthorized("Utilisateur non authentifié.");
			}

			var user = await _userService.GetUserByIdAsync(int.Parse(userIdClaim));
			if (user == null) return NotFound("Utilisateur introuvable.");

			var activityLog = new ActivityLog
			{
				UserId = user.Id,
				Module = 1,
				Action = "Modification",
				Description = $"L'utilisateur {user.Username} a modifié une language existante ID {vEmployeeLanguage.EmployeeLanguageId} " +
						  $"({vEmployeeLanguage.LanguageName}) " +
						  $"de l'employé matricule {vEmployeeLanguage.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};

			await _employeeLanguageService.Update(employeeLanguage);
			await _historyService.Add(activityLog);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			var employeeLanguage = await _employeeLanguageService.GetById(id);

			VEmployeeLanguage vEmployeeLanguage = await _employeeLanguageService.GetEmployeeLanguageById(employeeLanguage.EmployeeLanguageId);

			var userIdClaim = User.FindFirst("userId")?.Value;
			if (string.IsNullOrEmpty(userIdClaim))
			{
				return Unauthorized("Utilisateur non authentifié.");
			}

			var user = await _userService.GetUserByIdAsync(int.Parse(userIdClaim));
			if (user == null) return NotFound("Utilisateur introuvable.");

			var activityLog = new ActivityLog
			{
				UserId = user.Id,
				Module = 1,
				Action = "Suppression",
				Description = $"L'utilisateur {user.Username} a supprimé une language existante ID {vEmployeeLanguage.EmployeeLanguageId} " +
						  $"({vEmployeeLanguage.LanguageName}) " +
						  $"de l'employé matricule {vEmployeeLanguage.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};
			await _employeeLanguageService.Delete(id);
			await _historyService.Add(activityLog);
			return NoContent();
		}

		[HttpGet]
		[Route("employee/{id}")]
		public async Task<IActionResult> GetEmployeeLanguages(int id)
		{
			var employeeLanguages = await _employeeLanguageService.GetEmployeeLanguages(id);
			if (employeeLanguages == null) return NotFound();
			return Ok(employeeLanguages);
		}
	}
}
