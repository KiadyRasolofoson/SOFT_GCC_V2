using SoftGcc.Domain.Entities.career_plan;
using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface ICareerPlanService
    {
        Task<CareerPlan> GetById(int id);
        Task Update(CareerPlan careerPlan);
        Task Add(CareerPlan careerPlan);
        Task<List<VAssignmentAppointment>> GetAssignmentAppointment(string registrationNumber);
        Task<List<VAssignmentAdvancement>> GetAssignmentAdvancement(string registrationNumber);
        Task<List<VAssignmentAvailability>> GetAssignmentAvailability(string registrationNumber);
        Task<CareerPlan?> GetLastCareerPlanByEmployee(string registrationNumber);
        Task<List<History>> GetHistory(string registrationNumber);
        Task<VEmployeeCareer?> GetCareerByEmployee(string registrationNumber);
        Task<object> GetAllCareers(int pageNumber = 1, int pageSize = 10);
        Task<object> GetAllCareersFilter(string keyWord, int pageNumber = 1, int pageSize = 10);
        Task<(List<VEmployeeCareer> Data, int TotalCount)> GetAllCareersFilter(
            string? keyWord = null,
            string? departmentId = null,
            string? positionId = null,
            string? dateAssignmentMin = null,
            string? dateAssignmentMax = null,
            int page = 1,
            int pageSize = 10);
        Task<bool> DeleteCareerPlan(int careerPlanId);
        Task<bool> RestoreCareerPlan(int careerPlanId);
        Task<bool> DeleteDefinitivelyCareerPlan(int careerPlanId);
        Task<bool> DeleteHistory(int historyId);
        Task<CareerPlan?> GetByEmployeeAndContractType(string? registrationNumber);
    }
}
