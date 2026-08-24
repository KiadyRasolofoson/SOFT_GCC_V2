using SoftGcc.Application.Dtos.Dashboard;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Entities.dashboard;

namespace SoftGcc.Application.Services.dashboard
{
	public class DashboardService : IDashboardService
	{
		private readonly IDashboardDataService _dataService;

		public DashboardService(IDashboardDataService dataService)
		{
			_dataService = dataService;
		}

		public async Task<int> GetEmployeeCount()
			=> await _dataService.GetEmployeeCount();

		public async Task<int> GetWishEvolutionTotal()
			=> await _dataService.GetWishEvolutionTotal();

		public async Task<double> GetAverageSkillPerEmployee()
			=> await _dataService.GetAverageSkillPerEmployee();

		public async Task<int> GetNumberAllAttestation()
			=> await _dataService.GetNumberAllAttestation();

		public async Task<double> GetCoverageRatios()
			=> await _dataService.GetCoverageRatios();

		public async Task<int> GetSkillRepertory()
			=> await _dataService.GetSkillRepertory();

		public async Task<List<SkillRepertoryDetailDto>> GetSkillRepertoryDetailsAsync()
			=> await _dataService.GetSkillRepertoryDetailsAsync();

		public async Task<List<CoverageRatiosDetailsDto>> GetCoverageRatiosDetails()
			=> await _dataService.GetCoverageRatiosDetails();

		public async Task<List<EmployeeNumberSexAndActivityDto>> GetSexAndActivityNumber()
			=> await _dataService.GetSexAndActivityNumber();

		public async Task<List<StateWishEvolutionDto>> GetStateValue()
			=> await _dataService.GetStateValue();

		public async Task<List<EmployeeNumberSexAndActivityDto>> GetCertificationByState()
			=> await _dataService.GetCertificationByState();

		public async Task<List<CertificateHistoryDto>> GetDetailsCertificateGenerate()
			=> await _dataService.GetDetailsCertificateGenerate();

		public async Task<List<DetailsWishEvolutionDto>> GetDetailsWishEvolution()
			=> await _dataService.GetDetailsWishEvolution();

		public async Task<List<EmployeeDetailsDto>> GetEmployeeDetails()
			=> await _dataService.GetEmployeeDetails();

		public async Task<List<PositionActiveDto>> GetActivePositionDetails()
			=> await _dataService.GetActivePositionDetails();

		public async Task<List<DetailsEmployeeAgeDistributionDto>> GetDetailsDistributionAge(string? ageDistribution)
			=> await _dataService.GetDetailsDistributionAge(ageDistribution);

		public async Task<List<DetailsEmployeeExperienceDistributionDto>> GetDetailsExperienceRange(string? experienceDistribution)
			=> await _dataService.GetDetailsExperienceRange(experienceDistribution);

		public async Task<int> GetActivePosition()
			=> await _dataService.GetActivePosition();

		public async Task<List<VNEmployeeSkillByDepartment>> GetEmployeeSkillByDepartment(int idDepartment, int state)
			=> await _dataService.GetEmployeeSkillByDepartment(idDepartment, state);

		public async Task<List<VNEmployeeCareerByDepartment>> GetEmployeeCareerByDepartment(int idDepartment)
			=> await _dataService.GetEmployeeCareerByDepartment(idDepartment);

		public async Task<List<VEmployeeAgeDistribution>> GetEmployeeAgeDistribution()
			=> await _dataService.GetEmployeeAgeDistribution();

		public async Task<List<VEmployeeExperienceDistribution>> GetEmployeeExperienceDistribution()
			=> await _dataService.GetEmployeeExperienceDistribution();
	}
}
