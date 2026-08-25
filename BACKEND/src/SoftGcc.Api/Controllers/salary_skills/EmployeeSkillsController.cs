using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Application.SkillReferential;
using SoftGcc.Domain.Entities.history;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.SkillReferential;

namespace SoftGcc.Api.Controllers.salary_skills
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	[RequirePermission("VIEW_SKILLS_PROFILES","EDIT_SKILLS_PROFILES","MANAGE_SKILLS_PROFILES")]
	public class EmployeeSkillsController : ControllerBase
	{
		private readonly IEmployeeSkillService _employeeSkillService;
		private readonly IHistoryService _historyService;
		private readonly ISkillReferentialService _referential;
		private readonly UserService _userService;

		public EmployeeSkillsController(
			IEmployeeSkillService service,
			IHistoryService historyService,
			ISkillReferentialService referential,
			UserService userService)
		{
			_employeeSkillService = service;
			_historyService = historyService;
			_referential = referential;
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
			await Normalize(employeeSkill);
			await _employeeSkillService.Add(employeeSkill);
			await WriteLog("Création", employeeSkill.EmployeeSkillId);
			return CreatedAtAction(nameof(Get), new { id = employeeSkill.EmployeeSkillId }, employeeSkill);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, EmployeeSkill employeeSkill)
		{
			if (id != employeeSkill.EmployeeSkillId) return BadRequest();
			await Normalize(employeeSkill);
			await WriteLog("Modification", id);
			await _employeeSkillService.Update(employeeSkill);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await WriteLog("Suppression", id);
			await _employeeSkillService.Delete(id);
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

		private async Task Normalize(EmployeeSkill employeeSkill)
		{
			var request = new EmployeeSkillWriteRequest
			{
				SkillId = employeeSkill.SkillId,
				AcquiredLevel = employeeSkill.AcquiredLevel,
				LegacyPercent = employeeSkill.Level,
				Source = EmployeeSkillSource.Manual
			};
			await _referential.NormalizeEmployeeSkillAsync(request);
			employeeSkill.DomainSkillId = request.ResolvedDomainSkillId;
			employeeSkill.AcquiredLevel = request.ResolvedAcquiredLevel;
			employeeSkill.SkillVersionId = request.ResolvedSkillVersionId;
			employeeSkill.Source = request.ResolvedSource;
		}

		private async Task WriteLog(string action, int employeeSkillId)
		{
			VEmployeeSkill? vEmployeeSkill = await _employeeSkillService.GetEmployeeSkillById(employeeSkillId);
			var userIdClaim = User.FindFirst("userId")?.Value;
			if (string.IsNullOrEmpty(userIdClaim)) return;
			var user = await _userService.GetUserByIdAsync(int.Parse(userIdClaim));
			if (user == null) return;
			await _historyService.Add(new ActivityLog
			{
				UserId = user.Id,
				Module = 1,
				Action = action,
				Description = "L'user " + user.Username + " a traité la compétence " + (vEmployeeSkill?.SkillName ?? "") + " de l'employé matricule " + (vEmployeeSkill?.RegistrationNumber ?? ""),
				Timestamp = DateTime.UtcNow,
				Metadata = HttpContext.Connection.RemoteIpAddress?.ToString() ?? ""
			});
		}
	}
}
