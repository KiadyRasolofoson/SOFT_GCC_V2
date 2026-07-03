using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Core.Interface.DataService
{
    public interface ISalarySkillDataService
    {
        // Employee
        Task<List<VEmployee>> GetAllEmployees();
        Task<(List<VEmployee> Data, int TotalCount)> GetEmployeeFilter(
            string? keyWord = null,
            string? departmentId = null,
            string? hiringDate1 = null,
            string? hiringDate2 = null,
            int page = 1,
            int pageSize = 10);
        Task SaveImage(ImageEntity imageEntity);

        // Employee Education
        Task<List<VEmployeeEducation>> GetEmployeeEducations(int idEmployee);
        Task<VEmployeeEducation?> GetEmployeeEducationById(int id);

        // Employee Language
        Task<List<VEmployeeLanguage>> GetEmployeeLanguages(int idEmployee);
        Task<VEmployeeLanguage?> GetEmployeeLanguageById(int id);

        // Employee Other Formation
        Task<List<VEmployeeOtherSkill>> GetEmployeeOtherSkills(int idEmployee);
        Task<VEmployeeOtherSkill?> GetEmployeeOtherFormationById(int id);

        // Employee Skill
        Task<List<VEmployeeSkill>> GetEmployeeSkills(int idEmployee);
        Task<VEmployeeSkill?> GetEmployeeSkillById(int id);
        Task<object> GetAllSkills(int pageNumber = 1, int pageSize = 10);
        Task<object> GetAllSkillsFilter(string keyWord, int pageNumber = 1, int pageSize = 10);
        Task<List<VSkills>> GetEmployeeDescription(int idEmployee);
        Task<List<VEmployeeSkill>> GetSkillLevel(int idEmployee, int state);
        Task<List<VStateNumber>> GetStateNumber(int idEmployee);
        Task<string> IsSkillEmployeeExist(int idEmployee, int domainSkillId, int skillId);
    }
}
