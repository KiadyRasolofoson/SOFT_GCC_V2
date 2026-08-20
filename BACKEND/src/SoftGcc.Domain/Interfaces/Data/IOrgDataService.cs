using SoftGcc.Domain.Entities.career_plan;
using SoftGcc.Domain.Entities.entrepriseOrg;
using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Domain.Interfaces.Data
{
    public interface IOrgDataService
    {
        Task<List<VDepartmentEffective>> GetNEmployeeByDepartment();
        Task<List<EmployeeNode>> GetOrgChart();
        Task<List<VEmployeePosition>> GetEmployeeByDepartment(int idDepartment);
        Task<List<string>> SaveEmployeeImported(List<Employee> csvData);
    }
}
