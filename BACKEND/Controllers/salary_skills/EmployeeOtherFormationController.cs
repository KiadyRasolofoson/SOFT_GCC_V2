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
	public class EmployeeOtherFormationController : ControllerBase
	{
		private readonly EmployeeOtherFormationService _employeeOtherFormationService;
		private readonly HistoryService _historyService;
		private readonly UserService _userService;

		public EmployeeOtherFormationController(EmployeeOtherFormationService service, HistoryService historyService, UserService userService)
		{
			_employeeOtherFormationService = service;
			_historyService = historyService;
			_userService = userService;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var employeeOtherFormation = await _employeeOtherFormationService.GetAll();
			return Ok(employeeOtherFormation);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var employeeOtherFormation = await _employeeOtherFormationService.GetById(id);
			if (employeeOtherFormation == null) return NotFound();
			return Ok(employeeOtherFormation);
		}

		[HttpPost]
		public async Task<IActionResult> Create(EmployeeOtherFormation employeeOtherFormation)
		{
			await _employeeOtherFormationService.Add(employeeOtherFormation);
			VEmployeeOtherSkill vEmployeeOtherFormation = await _employeeOtherFormationService.GetEmployeeOtherFormationById(employeeOtherFormation.EmployeeOtherFormationId);
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
				Description = $"L'utilisateur {user.Username} a créé une nouvelle autre formation  ID {employeeOtherFormation.EmployeeOtherFormationId} " +
						  $"({employeeOtherFormation.Description}) " +
						  $"pour l'employé matricule {vEmployeeOtherFormation.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};

			await _historyService.Add(activityLog);
			return CreatedAtAction(nameof(Get), new { id = employeeOtherFormation.EmployeeOtherFormationId }, employeeOtherFormation);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, EmployeeOtherFormation employeeOtherFormation)
		{
			if (id != employeeOtherFormation.EmployeeOtherFormationId) return BadRequest();

			VEmployeeOtherSkill vEmployeeOtherFormation = await _employeeOtherFormationService.GetEmployeeOtherFormationById(employeeOtherFormation.EmployeeOtherFormationId);
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
				Description = $"L'utilisateur {user.Username} a modifié une autre formation existante ID {employeeOtherFormation.EmployeeOtherFormationId} " +
						  $"({employeeOtherFormation.Description}) " +
						  $"de l'employé matricule {vEmployeeOtherFormation.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};

			await _employeeOtherFormationService.Update(employeeOtherFormation);
			await _historyService.Add(activityLog);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			VEmployeeOtherSkill vEmployeeOtherFormation = await _employeeOtherFormationService.GetEmployeeOtherFormationById(id);
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
				Description = $"L'utilisateur {user.Username} a supprimé une autre formation existante ID {vEmployeeOtherFormation.EmployeeOtherFormationId} " +
						  $"({vEmployeeOtherFormation.Description}) " +
						  $"de l'employé matricule {vEmployeeOtherFormation.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};
			await _employeeOtherFormationService.Delete(id);
			await _historyService.Add(activityLog);
			return NoContent();
		}

		[HttpGet]
		[Route("employee/{id}")]
		public async Task<IActionResult> GetEmployeeOtherSkills(int id)
		{
			var employeeOtherSkills = await _employeeOtherFormationService.GetEmployeeOtherSkills(id);
			if (employeeOtherSkills == null) return NotFound();
			return Ok(employeeOtherSkills);
		}
	}
}
