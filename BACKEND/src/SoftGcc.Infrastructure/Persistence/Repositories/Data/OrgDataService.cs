using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Entities.career_plan;
using SoftGcc.Domain.Entities.entrepriseOrg;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Infrastructure.Persistence.Repositories.Data
{
    public class OrgDataService : IOrgDataService
    {
        private readonly ApplicationDbContext _context;

        public OrgDataService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<VDepartmentEffective>> GetNEmployeeByDepartment()
        {
            return await _context.VDepartmentEffective
                .FromSqlRaw("SELECT * FROM v_department_effective")
                .ToListAsync();
        }

        public async Task<List<EmployeeNode>> GetOrgChart()
        {
            var employees = await _context.VEmployeePosition.ToListAsync();
            return BuildOrgChart(employees, null);
        }

        private List<EmployeeNode> BuildOrgChart(List<VEmployeePosition> employees, int? managerId)
        {
            return employees
                .Where(e => e.ManagerId == managerId)
                .Select(e => new EmployeeNode
                {
                    EmployeeId = e.EmployeeId,
                    DepartmentId = e.DepartmentId,
                    Name = e.Name ?? string.Empty,
                    FirstName = e.FirstName ?? string.Empty,
                    Department = e.DepartmentName ?? "Non assigné",
                    Civilite = e.CiviliteName ?? string.Empty,
                    Position = e.PositionName ?? "Poste non défini",
                    HasPhoto = e.Photo != null && e.Photo.Length > 0,
                    Children = BuildOrgChart(employees, e.EmployeeId)
                })
                .ToList();
        }

        public async Task<List<VEmployeePosition>> GetEmployeeByDepartment(int idDepartment)
        {
            return await _context.VEmployeePosition
                .FromSqlRaw("SELECT * FROM v_employee_position WHERE department_id = {0}", idDepartment)
                .ToListAsync();
        }

        public async Task<List<string>> SaveEmployeeImported(List<Employee> csvData)
        {
            var errors = new List<string>();

            foreach (var employee in csvData)
            {
                try
                {
                    var sql = "INSERT INTO Employee (Registration_number, Name, FirstName, Birthday, Hiring_date, Department_id, Civilite_id, Manager_id) VALUES (@RegistrationNumber, @Name, @FirstName, @Birthday, @HiringDate, @DepartmentId, @CiviliteId, @ManagerId);";

                    var parameters = new[]
                    {
                        new SqlParameter("@RegistrationNumber", employee.RegistrationNumber),
                        new SqlParameter("@Name", employee.Name),
                        new SqlParameter("@FirstName", employee.FirstName),
                        new SqlParameter("@Birthday", employee.Birthday),
                        new SqlParameter("@HiringDate", employee.Hiring_date),
                        new SqlParameter("@DepartmentId", employee.Department_id),
                        new SqlParameter("@CiviliteId", employee.CiviliteId),
                        new SqlParameter("@ManagerId", (object?)employee.ManagerId ?? DBNull.Value),
                    };

                    await _context.Database.ExecuteSqlRawAsync(sql, parameters);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Exception " + ex.Message);
                    errors.Add($"Erreur pour l'employé {employee.RegistrationNumber}: son insertion a été ignoré");
                }
            }

            if (errors.Count > 0)
            {
                foreach (var error in errors)
                {
                    Console.WriteLine(error);
                }
            }

            return errors;
        }
    }
}
