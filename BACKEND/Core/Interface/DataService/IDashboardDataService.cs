using soft_carriere_competence.Core.Entities.Dtos.Dashboard;
using soft_carriere_competence.Core.Entities.dashboard;

namespace soft_carriere_competence.Core.Interface.DataService
{
    public interface IDashboardDataService
    {
        Task<int> GetEmployeeCount();
        Task<int> GetWishEvolutionTotal();
        Task<double> GetAverageSkillPerEmployee();
        Task<int> GetNumberAllAttestation();
        Task<double> GetCoverageRatios();
        Task<int> GetSkillRepertory();
        Task<List<SkillRepertoryDetailDto>> GetSkillRepertoryDetailsAsync();
        Task<List<CoverageRatiosDetailsDto>> GetCoverageRatiosDetails();
        Task<List<EmployeeNumberSexAndActivityDto>> GetSexAndActivityNumber();
        Task<List<StateWishEvolutionDto>> GetStateValue();
        Task<List<EmployeeNumberSexAndActivityDto>> GetCertificationByState();
        Task<List<CertificateHistoryDto>> GetDetailsCertificateGenerate();
        Task<List<DetailsWishEvolutionDto>> GetDetailsWishEvolution();
        Task<List<EmployeeDetailsDto>> GetEmployeeDetails();
        Task<List<PositionActiveDto>> GetActivePositionDetails();
        Task<List<DetailsEmployeeAgeDistributionDto>> GetDetailsDistributionAge(string? ageDistribution);
        Task<List<DetailsEmployeeExperienceDistributionDto>> GetDetailsExperienceRange(string? experienceDistribution);
        Task<int> GetActivePosition();
        Task<List<VNEmployeeSkillByDepartment>> GetEmployeeSkillByDepartment(int idDepartment, int state);
        Task<List<VNEmployeeCareerByDepartment>> GetEmployeeCareerByDepartment(int idDepartment);
        Task<List<VEmployeeAgeDistribution>> GetEmployeeAgeDistribution();
        Task<List<VEmployeeExperienceDistribution>> GetEmployeeExperienceDistribution();
    }
}
