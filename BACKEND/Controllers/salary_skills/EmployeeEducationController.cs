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
	public class EmployeeEducationController : ControllerBase
	{
		private readonly EmployeeEducationService _employeeEducationService;
		private readonly HistoryService _historyService;
		private readonly UserService _userService;

		public EmployeeEducationController(EmployeeEducationService service, HistoryService historyService, UserService userService)
		{
			_employeeEducationService = service;
			_historyService = historyService;
			_userService = userService;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var employeeEducations = await _employeeEducationService.GetAll();
			return Ok(employeeEducations);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var employeeEducations = await _employeeEducationService.GetById(id);
			if (employeeEducations == null) return NotFound();
			return Ok(employeeEducations);
		}

		[HttpPost]
		public async Task<IActionResult> Create(EmployeeEducation employeeEducation)
		{
			await _employeeEducationService.Add(employeeEducation);
			VEmployeeEducation vEmployeeEducation = await _employeeEducationService.GetEmployeeEducationById(employeeEducation.EmployeeEducationId);

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
				Description = $"L'utilisateur {user.Username} a créé une nouvelle éducation ID {employeeEducation.EmployeeEducationId} " +
						  $"({vEmployeeEducation.StudyPathName} - {vEmployeeEducation.DegreeName} - {vEmployeeEducation.SchoolName}) " +
						  $"pour l'employé matricule {vEmployeeEducation.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};

			await _historyService.Add(activityLog);
			return CreatedAtAction(nameof(Get), new { id = employeeEducation.EmployeeEducationId }, employeeEducation);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, EmployeeEducation employeeEducation)
		{
			if (id != employeeEducation.EmployeeEducationId) return BadRequest();
			await _employeeEducationService.Update(employeeEducation);
			VEmployeeEducation vEmployeeEducation = await _employeeEducationService.GetEmployeeEducationById(employeeEducation.EmployeeEducationId);
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
				Description = $"L'utilisateur {user.Username} a modifié une éducation existente ID {employeeEducation.EmployeeEducationId} " +
						  $"({vEmployeeEducation.StudyPathName} - {vEmployeeEducation.DegreeName} - {vEmployeeEducation.SchoolName}) " +
						  $"de l'employé matricule {vEmployeeEducation.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};

			await _historyService.Add(activityLog);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			VEmployeeEducation vEmployeeEducation = await _employeeEducationService.GetEmployeeEducationById(id);
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
				Description = $"L'utilisateur {user.Username} a supprimé une éducation existente ID {vEmployeeEducation.EmployeeEducationId} " +
						  $"({vEmployeeEducation.StudyPathName} - {vEmployeeEducation.DegreeName} - {vEmployeeEducation.SchoolName}) " +
						  $"de l'employé matricule {vEmployeeEducation.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};

			await _employeeEducationService.Delete(id);
			await _historyService.Add(activityLog);
			return NoContent();
		}

		[HttpGet]
		[Route("employee/{id}")]
		public async Task<IActionResult> GetEmployeeEducations(int id)
		{
			var employeeEducations = await _employeeEducationService.GetEmployeeEducations(id);
			if (employeeEducations == null) return NotFound();
			return Ok(employeeEducations);
		}
	}
}
