using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.entrepriseOrg;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.wish_evolution;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using Microsoft.Data.SqlClient;

namespace soft_carriere_competence.Application.Services.entrepriseOrg
{
	public class OrgService
	{
		private readonly ApplicationDbContext _context;

		public OrgService(ApplicationDbContext context)
		{
			_context = context;
		}

		// Nombre d'employes par departement 
		public async Task<List<VDepartmentEffective>> GetNEmployeeByDepartment()
		{
			return await _context.VDepartmentEffective
				.FromSqlRaw("SELECT * FROM v_department_effective")
				.ToListAsync();
		}

		// Avoir l'organigramme
		public async Task<List<EmployeeNode>> GetOrgChart()
		{
			var employees = await _context.VEmployeePosition.ToListAsync();
			var orgChart = BuildOrgChart(employees, null); 
			return orgChart;
		}

		// Creer l'organigramme
		private List<EmployeeNode> BuildOrgChart(List<VEmployeePosition> employees, int? managerId)
		{
			return employees
				.Where(e => e.ManagerId == managerId)
				.Select(e => new EmployeeNode
				{
					Name = e.Name,
					FirstName = e.FirstName,
					Department = e.DepartmentName,
					Civilite = e.CiviliteName,
					Position = e.PositionName,
					Children = BuildOrgChart(employees, e.EmployeeId)
				})
				.ToList();
		}

		// Liste d'employe par departement
		public async Task<List<VEmployeePosition>> GetEmployeeByDepartment(int idDepartment)
		{
			return await _context.VEmployeePosition
				.FromSqlRaw("SELECT * FROM v_employee_position WHERE department_id = {0}", idDepartment)
				.ToListAsync();
		}

		// Enregistrement des donnees importes via csv dans la base de donnee
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
					Console.WriteLine("Exeption "+ex.Message);
					// Capture l'erreur et continue avec les autres enregistrements
					errors.Add($"Erreur pour l'employé {employee.RegistrationNumber}: son insertion a été ignoré");
				}
			}

			if (errors.Count > 0)
			{
				// Gérer ou consigner les erreurs selon le besoin
				foreach (var error in errors)
				{
					Console.WriteLine(error); // Ou consignez les erreurs dans un fichier ou un journal.
				}
			}

			return errors;
		}
	}
}
