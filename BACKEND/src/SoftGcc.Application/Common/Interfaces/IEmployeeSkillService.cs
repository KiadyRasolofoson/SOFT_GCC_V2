using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface IEmployeeSkillService
    {
        Task<IEnumerable<EmployeeSkill>> GetAll();
        Task<EmployeeSkill> GetById(int id);
        Task Add(EmployeeSkill employeeSkill);
        Task Update(EmployeeSkill employeeSkill);
        Task Delete(int id);
        Task<List<VEmployeeSkill>> GetEmployeeSkills(int idEmployee);
        Task<VEmployeeSkill?> GetEmployeeSkillById(int id);
        Task<List<VEmployeeSkill>> GetSkillLevel(int idEmployee, int state);
        Task<List<VStateNumber>> GetStateNumber(int idEmployee);
        Task<object> GetAllSkills(int pageNumber = 1, int pageSize = 10);
        Task<object> GetAllSkillsFilter(string keyWord, int pageNumber = 1, int pageSize = 10);
        Task<List<VSkills>> GetEmployeeDescription(int idEmployee);
    }
}
