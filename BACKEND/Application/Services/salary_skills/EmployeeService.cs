using Microsoft.Data.SqlClient;
using System.Text;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.retirement;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class EmployeeService
	{
		private readonly ICrudRepository<Employee> _repository;
		private readonly ApplicationDbContext _context;

		public EmployeeService(ICrudRepository<Employee> repository, ApplicationDbContext context)
		{
			_repository = repository;
			_context = context;
		}

		public async Task<IEnumerable<VEmployee>> GetAll()
		{
			return await _context.VEmployee.ToListAsync();
		}

		// Filtrer les employe
		public async Task<(List<VEmployee> Data, int TotalCount)> GetEmployeeFilter(
		string? keyWord = null,
		string? departmentId = null,
		string? hiringDate1 = null,
		string? hiringDate2 = null,
		int page = 1,
		int pageSize = 10)
		{
			var sql = new StringBuilder("SELECT * FROM v_employee WHERE 1=1");
			var countSql = new StringBuilder("SELECT COUNT(*) AS count FROM v_employee WHERE 1=1");
			var parameters = new List<SqlParameter>();

			// Ajouter les conditions de filtrage
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

			// Utilisation de la requête SQL avec des paramètres pour éviter les injections SQL
			var filteredQuery = _context.VEmployee
				.FromSqlRaw(sql.ToString(), parameters.ToArray());

			// Compter le nombre total de résultats correspondant au filtre
			var totalRecords = await filteredQuery.CountAsync();


			// Appliquer la pagination aux résultats filtrés
			var employee = await filteredQuery
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync();


			return (employee, totalRecords);
		}
		public async Task<Employee> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Employee employee, byte[]? photo)
		{
			if (photo != null)
			{
				employee.Photo = photo;
			}
			await _repository.Add(employee);
		}

		public async Task Update(Employee employee)
		{
			await _repository.Update(employee);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		public async Task SaveImage(ImageEntity imageEntity)
		{
			await _context.ImageEntity.AddAsync(imageEntity); // ✅ Utilisation de AddAsync() pour une meilleure gestion async
			await _context.SaveChangesAsync(); // ✅ Sauvegarde les changements
		}
	}
}
