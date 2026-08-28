using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Domain.Common;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Infrastructure.Persistence.Repositories.Data
{
    public class SalarySkillDataService : ISalarySkillDataService
    {
        private readonly ApplicationDbContext _context;

        public SalarySkillDataService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<VEmployee>> GetAllEmployees()
        {
            return await _context.VEmployee.ToListAsync();
        }

        public async Task<(List<VEmployee> Data, int TotalCount)> GetEmployeeFilter(
            string? keyWord = null,
            string? departmentId = null,
            string? hiringDate1 = null,
            string? hiringDate2 = null,
            int page = 1,
            int pageSize = 10)
        {
            var sql = new StringBuilder("SELECT * FROM v_employee WHERE 1=1");
            var countSql = new StringBuilder("SELECT COUNT(*) AS Value FROM v_employee WHERE 1=1");
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrWhiteSpace(keyWord))
            {
                sql.Append(" AND (registration_number LIKE @KeyWord OR name LIKE @KeyWord OR firstname LIKE @KeyWord) OR Manager_name LIKE @KeyWord OR Manager_firstName LIKE @KeyWord");
                countSql.Append(" AND (registration_number LIKE @KeyWord OR name LIKE @KeyWord OR firstname LIKE @KeyWord OR Manager_name LIKE @KeyWord OR Manager_firstName LIKE @KeyWord)");
                parameters.Add(new SqlParameter("@KeyWord", $"%{keyWord}%"));
            }

            if (!string.IsNullOrWhiteSpace(departmentId))
            {
                sql.Append(" AND department_id = @DepartmentId");
                countSql.Append(" AND department_id = @DepartmentId");
                parameters.Add(new SqlParameter("@DepartmentId", departmentId));
            }

            if (!string.IsNullOrWhiteSpace(hiringDate1) && !string.IsNullOrWhiteSpace(hiringDate2))
            {
                sql.Append(" AND hiring_date BETWEEN @Date1 AND @Date2");
                countSql.Append(" AND hiring_date BETWEEN @Date1 AND @Date2");
                parameters.Add(new SqlParameter("@Date1", hiringDate1));
                parameters.Add(new SqlParameter("@Date2", hiringDate2));
            }

            var filteredQuery = _context.VEmployee
                .FromSqlRaw(sql.ToString(), parameters.ToArray())
                .OrderBy(e => e.RegistrationNumber);

            // Total : compté sur une sous-requête SANS ORDER BY (interdit dans une table dérivée)
            var totalRecords = await _context.Database
                .SqlQueryRaw<int>(countSql.ToString(), parameters.ToArray())
                .FirstOrDefaultAsync();

            var employee = await filteredQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (employee, totalRecords);
        }

        public async Task SaveImage(ImageEntity imageEntity)
        {
            await _context.ImageEntity.AddAsync(imageEntity);
            await _context.SaveChangesAsync();
        }

        public async Task<List<VEmployeeEducation>> GetEmployeeEducations(int idEmployee)
        {
            return await _context.VEmployeeEducation
                .FromSqlRaw("SELECT * FROM v_employee_education WHERE Employee_id = {0}", idEmployee)
                .ToListAsync();
        }

        public async Task<VEmployeeEducation?> GetEmployeeEducationById(int id)
        {
            return await _context.VEmployeeEducation
                .FromSqlRaw("SELECT * FROM v_employee_education WHERE Employee_education_id = {0}", id)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }

        public async Task<List<VEmployeeLanguage>> GetEmployeeLanguages(int idEmployee)
        {
            return await _context.VEmployeeLanguage
                .FromSqlRaw("SELECT * FROM v_employee_language WHERE Employee_id = {0}", idEmployee)
                .ToListAsync();
        }

        public async Task<VEmployeeLanguage?> GetEmployeeLanguageById(int id)
        {
            return await _context.VEmployeeLanguage
                .FromSqlRaw("SELECT * FROM v_employee_language WHERE Employee_language_id = {0}", id)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }

        public async Task<List<VEmployeeOtherSkill>> GetEmployeeOtherSkills(int idEmployee)
        {
            return await _context.VEmployeeOtherSkill
                .FromSqlRaw("SELECT * FROM v_employee_other_formation WHERE Employee_id = {0}", idEmployee)
                .ToListAsync();
        }

        public async Task<VEmployeeOtherSkill?> GetEmployeeOtherFormationById(int id)
        {
            return await _context.VEmployeeOtherSkill
                .FromSqlRaw("SELECT * FROM v_employee_other_formation WHERE Employee_other_formation_id = {0}", id)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }

        public async Task<List<VEmployeeSkill>> GetEmployeeSkills(int idEmployee)
        {
            return await _context.VEmployeeSkill
                .FromSqlRaw("SELECT * FROM v_employee_skill WHERE Employee_id = {0}", idEmployee)
                .ToListAsync();
        }

        public async Task<VEmployeeSkill?> GetEmployeeSkillById(int id)
        {
            return await _context.VEmployeeSkill
                .FromSqlRaw("SELECT * FROM v_employee_skill WHERE Employee_skill_id = {0}", id)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }

        public async Task<object> GetAllSkills(int pageNumber = 1, int pageSize = 10)
        {
            var totalRecords = await _context.VSkills.CountAsync();

            var skills = await _context.VSkills
                .OrderByDescending(s => s.UpdatedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalRecords / pageSize);

            return new
            {
                Data = skills,
                TotalRecords = totalRecords,
                PageSize = pageSize,
                CurrentPage = pageNumber,
                TotalPages = totalPages
            };
        }

        public async Task<object> GetAllSkillsFilter(string keyWord, int pageNumber = 1, int pageSize = 10)
        {
            const string countSql =
                "SELECT COUNT(*) AS Value FROM v_skills WHERE Registration_number LIKE @p0 OR name LIKE @p0 OR firstname LIKE @p0";

            var filteredQuery = _context.VSkills
                .FromSqlRaw("SELECT * FROM v_skills WHERE Registration_number LIKE @p0 OR name LIKE @p0 OR firstname LIKE @p0", $"%{keyWord}%")
                .OrderBy(s => s.RegistrationNumber);

            // Total : compté sur une sous-requête SANS ORDER BY (interdit dans une table dérivée)
            var totalRecords = await _context.Database
                .SqlQueryRaw<int>(countSql, $"%{keyWord}%")
                .FirstOrDefaultAsync();

            var skills = await filteredQuery
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalRecords / pageSize);

            return new
            {
                Data = skills,
                TotalRecords = totalRecords,
                PageSize = pageSize,
                CurrentPage = pageNumber,
                TotalPages = totalPages
            };
        }

        public async Task<List<VSkills>> GetEmployeeDescription(int idEmployee)
        {
            return await _context.VSkills
                .FromSqlRaw("SELECT * FROM v_skills WHERE Employee_id = {0}", idEmployee)
                .ToListAsync();
        }

        public async Task<List<VEmployeeSkill>> GetSkillLevel(int idEmployee, int state)
        {
            return await _context.VEmployeeSkill
                .FromSqlRaw("SELECT * FROM v_employee_skill WHERE Employee_id = {0} AND State = {1}", idEmployee, state)
                .ToListAsync();
        }

        public async Task<List<VStateNumber>> GetStateNumber(int idEmployee)
        {
            return await _context.VStateNumber
                .FromSqlRaw("SELECT * FROM v_state_number WHERE Employee_id = {0}", idEmployee)
                .ToListAsync();
        }

        public async Task<string> IsSkillEmployeeExist(int idEmployee, int domainSkillId, int skillId)
        {
            try
            {
                var skills = await _context.VSkills
                    .FromSqlRaw("SELECT * FROM v_skills WHERE Employee_id = {0} AND DomainSkill_id = {1} AND Skill_id = {2}",
                                idEmployee, domainSkillId, skillId)
                    .ToListAsync();

                if (skills.Any())
                {
                    throw new Exception("La compétence pour cet employé existe déjà.");
                }

                return "OK";
            }
            catch (SqlException ex)
            {
                Console.Error.WriteLine($"Erreur SQL : {ex.Message}");
                return "Erreur lors de la récupération des compétences (erreur SQL).";
            }
            catch (DbUpdateException ex)
            {
                Console.Error.WriteLine($"Erreur de mise à jour : {ex.Message}");
                return "Erreur lors de la récupération des compétences (erreur de mise à jour).";
            }
            catch (InvalidOperationException ex)
            {
                Console.Error.WriteLine($"Erreur d'opération : {ex.Message}");
                return "Erreur lors de la récupération des compétences (opération invalide).";
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Erreur : {ex.Message}");
                return ex.Message;
            }
        }

        public async Task<EmployeeResetResult> ResetEmployeesAsync()
        {
            var result = new EmployeeResetResult(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

            await using var transaction = await _context.Database.BeginTransactionAsync();

            // 1) Détacher les comptes utilisateurs liés aux employés (FK optionnelle → NULL)
            result = result with { UsersDetached = await _context.Database.ExecuteSqlRawAsync(
                "UPDATE Users SET employee_id = NULL WHERE employee_id IN (SELECT Employee_id FROM Employee)") };

            // --- Sous-arbre des évaluations (FK NO ACTION → suppression explicite des enfants avant les parents) ---

            // Participants aux entretiens (enfants des entretiens)
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM InterviewParticipants");

            // Données directes des évaluations (enfants de Evaluations)
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM EvaluationSupervisors");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM EvaluationStatusLogs");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Evaluation_Responses");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Evaluation_Selected_Questions");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM EvaluationDelegations");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Evaluation_progress");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Evaluation_questionnaire");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Evaluation_interviews");

            // Résultats de compétences et comptes temporaires (référencent aussi les employés)
            result = result with { CompetenceResultsDeleted = await _context.Database.ExecuteSqlRawAsync(
                "DELETE FROM Evaluation_Competence_Results") };
            result = result with { TemporaryAccountsDeleted = await _context.Database.ExecuteSqlRawAsync(
                "DELETE FROM TemporaryAccounts") };

            // --- Évaluations elles-mêmes ---
            result = result with { EvaluationsDeleted = await _context.Database.ExecuteSqlRawAsync(
                "DELETE FROM Evaluations") };

            // --- Données directes des employés (pas de relation EF → suppression explicite) ---
            result = result with { SkillsDeleted = await _context.Database.ExecuteSqlRawAsync(
                "DELETE FROM Employee_skill") };
            result = result with { EducationsDeleted = await _context.Database.ExecuteSqlRawAsync(
                "DELETE FROM Employee_education") };
            result = result with { LanguagesDeleted = await _context.Database.ExecuteSqlRawAsync(
                "DELETE FROM Employee_language") };
            result = result with { OtherFormationsDeleted = await _context.Database.ExecuteSqlRawAsync(
                "DELETE FROM Employee_other_formation") };
            result = result with { WishEvolutionDeleted = await _context.Database.ExecuteSqlRawAsync(
                "DELETE FROM Wish_evolution_career") };

            // --- Enfin les employés eux-mêmes ---
            result = result with { EmployeesDeleted = await _context.Database.ExecuteSqlRawAsync("DELETE FROM Employee") };

            await transaction.CommitAsync();
            return result;
        }
    }
}
