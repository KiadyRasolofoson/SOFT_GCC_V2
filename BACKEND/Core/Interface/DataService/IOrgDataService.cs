using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.entrepriseOrg;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Interface.DataService
{
    public interface IOrgDataService
    {
        Task<List<VDepartmentEffective>> GetNEmployeeByDepartment();
        Task<List<EmployeeNode>> GetOrgChart();
        Task<List<VEmployeePosition>> GetEmployeeByDepartment(int idDepartment);
        Task<List<string>> SaveEmployeeImported(List<Employee> csvData);
    }
}
