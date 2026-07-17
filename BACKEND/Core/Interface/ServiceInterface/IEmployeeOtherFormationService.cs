using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    public interface IEmployeeOtherFormationService : ICrudService<EmployeeOtherFormation>
    {
        Task<VEmployeeOtherSkill?> GetEmployeeOtherFormationById(int id);
        Task<List<VEmployeeOtherSkill>> GetEmployeeOtherSkills(int idEmployee);
    }
}
