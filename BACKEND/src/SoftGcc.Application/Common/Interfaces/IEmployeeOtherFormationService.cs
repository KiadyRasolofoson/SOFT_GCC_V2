using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface IEmployeeOtherFormationService : ICrudService<EmployeeOtherFormation>
    {
        Task<VEmployeeOtherSkill?> GetEmployeeOtherFormationById(int id);
        Task<List<VEmployeeOtherSkill>> GetEmployeeOtherSkills(int idEmployee);
    }
}
