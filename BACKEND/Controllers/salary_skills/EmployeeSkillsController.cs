using System;
using DocumentFormat.OpenXml.Office2010.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Application.Services.history;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Entities.history;
using soft_carriere_competence.Core.Entities.salary_skills;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace soft_carriere_competence.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class EmployeeSkillsController : ControllerBase
	{
		private readonly EmployeeSkillService _employeeSkillService;
		private readonly HistoryService _historyService;
		private readonly SkillService _skillService;
		private readonly UserService _userService;

		public EmployeeSkillsController(EmployeeSkillService service, HistoryService historyService, SkillService skillService, UserService userService)
		{
			_employeeSkillService = service;
			_historyService = historyService;
			_skillService = skillService;
			_userService = userService;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var employeeSkills = await _employeeSkillService.GetAll();
			return Ok(employeeSkills);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var employeeSkill = await _employeeSkillService.GetById(id);
			if (employeeSkill == null) return NotFound();
			return Ok(employeeSkill);
		}

		[HttpPost]
		public async Task<IActionResult> Create(EmployeeSkill employeeSkill)
		{
			await _employeeSkillService.Add(employeeSkill);
			VEmployeeSkill vEmployeeSkill = await _employeeSkillService.GetEmployeeSkillById(employeeSkill.EmployeeSkillId);
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
				Description = "L'user "+ user.Username +" a crée une nouvelle compétence "+vEmployeeSkill.SkillName+ " pour l'employé matricule "+vEmployeeSkill.RegistrationNumber,
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};

			await _historyService.Add(activityLog);
			return CreatedAtAction(nameof(Get), new { id = employeeSkill.EmployeeSkillId }, employeeSkill);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, EmployeeSkill employeeSkill)
		{
			if (id != employeeSkill.EmployeeSkillId) return BadRequest();
			VEmployeeSkill vEmployeeSkill = await _employeeSkillService.GetEmployeeSkillById(id);
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
				Description = "L'user "+user.Username+" a modifié la compétence " + vEmployeeSkill.SkillName + " de l'employé matricule " + vEmployeeSkill.RegistrationNumber,
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};
			await _employeeSkillService.Update(employeeSkill);
			await _historyService.Add(activityLog);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			VEmployeeSkill vEmployeeSkill = await _employeeSkillService.GetEmployeeSkillById(id);
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
				Description = "L'user "+user.Username+" a supprimé la compétence " + vEmployeeSkill.SkillName + " de l'employé matricule " + vEmployeeSkill.RegistrationNumber,
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress.ToString()
			};

			await _employeeSkillService.Delete(id);
			await _historyService.Add(activityLog);
			return NoContent();
		}

		[HttpGet]
		[Route("employee/{id}")]
		public async Task<IActionResult> GetEmployeeSkills(int id)
		{
			var employeeSkills = await _employeeSkillService.GetEmployeeSkills(id);
			if (employeeSkills == null) return NotFound();
			return Ok(employeeSkills);
		}

		[HttpGet]
		[Route("list")]
		public async Task<IActionResult> GetListSkills(int pageNumber = 1, int pageSize = 2)
		{
			var skills = await _employeeSkillService.GetAllSkills(pageNumber, pageSize);
			if (skills == null) return NotFound();
			return Ok(skills);
		}

		[HttpGet]
		[Route("filter")]
		public async Task<IActionResult> GetListSkillsFilter(string keyWord, int pageNumber = 1, int pageSize = 2)
		{
			var skills = await _employeeSkillService.GetAllSkillsFilter(keyWord,pageNumber, pageSize);
			if (skills == null) return NotFound();
			return Ok(skills);
		}

		[HttpGet]
		[Route("description/{employeeId}")]
		public async Task<IActionResult> GetEmployeeDescription(int employeeId)
		{
			var employeeDescription = await _employeeSkillService.GetEmployeeDescription(employeeId);
			if (employeeDescription == null) return NotFound();
			return Ok(employeeDescription);
		}

		[HttpGet]
		[Route("skillLevel")]
		public async Task<IActionResult> GetSkillLevel(int employeeId, int state)
		{
			var employeeDescription = await _employeeSkillService.GetSkillLevel(employeeId, state);
			if (employeeDescription == null) return NotFound();
			if (state == 0) {
				var stateNumber = await _employeeSkillService.GetStateNumber(employeeId);
				if (stateNumber == null) return NotFound();
				return Ok(stateNumber);
			}
			return Ok(employeeDescription);
		}
	}
}
