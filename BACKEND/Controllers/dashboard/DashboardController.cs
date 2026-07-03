using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.dashboard;
using soft_carriere_competence.Application.Services.wish_evolution;

namespace soft_carriere_competence.Controllers.dashboard
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class DashboardController : ControllerBase
	{
		private readonly DashboardService _dashboardService;

		public DashboardController(DashboardService service)
		{
			_dashboardService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetGlobalDashboard()
		{
			int employeeTotal = await _dashboardService.GetEmployeeCount();
			int wishEvolutionTotal = await _dashboardService.GetWishEvolutionTotal();
			double averageSkill = await _dashboardService.GetAverageSkillPerEmployee();
			int skillRepertory = await _dashboardService.GetSkillRepertory();
			int activePosition = await _dashboardService.GetActivePosition();
			double coverageRatios = await _dashboardService.GetCoverageRatios();
			double allAttestationNumber = await _dashboardService.GetNumberAllAttestation();

			return Ok(new 
			{
				EmployeeTotal = employeeTotal,
				WishEvolutionTotal = wishEvolutionTotal,
				AverageSkill = averageSkill,
				SkillRepertory = skillRepertory,
				ActivePosition = activePosition,
				CoverageRatios = coverageRatios,
				AllAttestationNumber = allAttestationNumber
			});
		}

		[HttpGet]
		[Route("employeeSkillByDepartment")]
		public async Task<IActionResult> GetEmployeeSkillByDepartment(int departmentId, int state)
		{
			var employeeSkills = await _dashboardService.GetEmployeeSkillByDepartment(departmentId, state);
			if (employeeSkills == null) return NotFound();
			return Ok(employeeSkills);
		}

		[HttpGet]
		[Route("employeeCareerByDepartment")]
		public async Task<IActionResult> GetEmployeeCareerByDepartment(int departmentId)
		{
			var employeeCareers = await _dashboardService.GetEmployeeCareerByDepartment(departmentId);
			if (employeeCareers == null) return NotFound();
			return Ok(employeeCareers);
		}

		[HttpGet]
		[Route("employeeAgeDistribution")]
		public async Task<IActionResult> GetEmployeeAgeDistribution()
		{
			var employeeAgeDistribution = await _dashboardService.GetEmployeeAgeDistribution();
			if (employeeAgeDistribution == null) return NotFound();
			return Ok(employeeAgeDistribution);
		}

		[HttpGet]
		[Route("employeeExperienceDistribution")]
		public async Task<IActionResult> GetEmployeeExperienceDistribution()
		{
			var employeeExperienceDistribution = await _dashboardService.GetEmployeeExperienceDistribution();
			if (employeeExperienceDistribution == null) return NotFound();
			return Ok(employeeExperienceDistribution);
		}

		[HttpGet]
		[Route("details/skillsRepertory")]
		public async Task<IActionResult> GetSkillRepertoryDetails()
		{
			var result = await _dashboardService.GetSkillRepertoryDetailsAsync();

			return Ok(result);
		}

		[HttpGet]
		[Route("details/employeeNumberSexAndActivity")]
		public async Task<IActionResult> GetEmployeeNumberSexAndActivity()
		{
			var result = await _dashboardService.GetSexAndActivityNumber();

			return Ok(result);
		}

		[HttpGet]
		[Route("details/employeeDetails")]
		public async Task<IActionResult> GetEmployeeDetails()
		{
			var result = await _dashboardService.GetEmployeeDetails();

			return Ok(result);
		}

		[HttpGet]
		[Route("details/positionActiveDetails")]
		public async Task<IActionResult> GetPositionActiveDetails()
		{
			var result = await _dashboardService.GetActivePositionDetails();

			return Ok(result);
		}

		[HttpGet]
		[Route("details/stateValue")]
		public async Task<IActionResult> GetStateValue()
		{
			var result = await _dashboardService.GetStateValue();

			return Ok(result);
		}


		[HttpGet]
		[Route("details/wishEvolution")]
		public async Task<IActionResult> GetDetailsWishEvolution()
		{
			var result = await _dashboardService.GetDetailsWishEvolution();

			return Ok(result);
		}

		[HttpGet]
		[Route("details/certificateByState")]
		public async Task<IActionResult> GetWishCertificationNumberByState()
		{
			var result = await _dashboardService.GetCertificationByState();

			return Ok(result);
		}

		[HttpGet]
		[Route("details/certificateDetails")]
		public async Task<IActionResult> GetCertificateDetails()
		{
			var result = await _dashboardService.GetDetailsCertificateGenerate();

			return Ok(result);
		}

		[HttpGet]
		[Route("details/coverageRatiosDetails")]
		public async Task<IActionResult> GetCoverageRatiosDetails()
		{
			var result = await _dashboardService.GetCoverageRatiosDetails();

			return Ok(result);
		}

		[HttpGet]
		[Route("details/employeeAgeDistribution/{ageDistribution}")]
		public async Task<IActionResult> GetEmployeeAgeDistributionDetails(string ageDistribution)
		{
			var result = await _dashboardService.GetDetailsDistributionAge(ageDistribution);
			return Ok(result);
		}


		[HttpGet]
		[Route("details/employeeExperienceRangeDetails/{experienceRange}")]
		public async Task<IActionResult> GetEmployeeExperienceRangeDetails(string experienceRange)
		{
			var result = await _dashboardService.GetDetailsExperienceRange(experienceRange);
			return Ok(result);
		}
	}
}
